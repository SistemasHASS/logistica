import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DespachosService } from '@/app/modules/main/services/despachos.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import * as XLSX from 'xlsx-js-style';
import FileSaver from 'file-saver';

@Component({
  selector: 'app-reporte-despachos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    DatePickerModule,
    DialogModule,
  ],
  templateUrl: './reporte-despachos.component.html',
  styleUrls: ['./reporte-despachos.component.scss'],
})
export class ReporteDespachosComponent implements OnInit, OnDestroy {
  despachos: any[] = [];
  despachosFiltrados: any[] = [];
  requerimientosAprobadosAll: any[] = []; // Requerimientos desde Dexie para conteo de pendientes
  filtroNS: string = '';
  filtroRequisicion: string = '';
  fechaInicio?: Date;
  fechaFin?: Date;
  loading: boolean = false;
  activeTabDespachos: 'ITEMS' | 'COMMODITY' = 'ITEMS';
  private intervalId?: any;
  private despachosAPI: any[] = []; // Cache de despachos atendidos desde API
  private usuario: any = null; // Usuario logueado para filtro multiempresa

  /** KPI: requerimientos pendientes de atención (estado APROBADO). */
  get kpiPendientes(): number {
    return (this.requerimientosAprobadosAll || []).filter(
      (r: any) => r?.estados === 'APROBADO' || !r?.estados,
    ).length;
  }

  /** KPI: despachos atendidos (parcial o completo o despachado). */
  get kpiAtendidos(): number {
    return (this.despachos || []).filter((r: any) =>
      ['ATENCION_PARCIAL', 'ATENCION_COMPLETA', 'DESPACHADO_COMPLETO'].includes(
        r?.estado,
      ) || (r?.estado || '').toString().toUpperCase().includes('DESPACHADO'),
    ).length;
  }

  /** KPI: total de despachos (suma de pendientes y atendidos). */
  get kpiTotal(): number {
    return this.kpiPendientes + this.kpiAtendidos;
  }

  // Modal detalle
  displayDetalle: boolean = false;
  despachoSeleccionado: any = null;
  detalleDespacho: any[] = [];

  constructor(
    private despachosService: DespachosService,
    private dexieService: DexieService,
    private alertService: AlertService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarUsuario();
    this.cargarDespachosAPI(); // Cargar API solo una vez
    this.cargarRequerimientosDesdeDexie(); // Cargar requerimientos pendientes
    this.cargarDespachosDesdeDexie(); // Cargar Dexie inicial
    this.escucharCambiosDespachos(); // Intervalo solo para Dexie
  }

  private async cargarUsuario(): Promise<void> {
    try {
      this.usuario = await this.dexieService.getUsuarioLogueado();
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async cargarDespachosAPI() {
    try {
      // Filtro multiempresa: ALLOGIST solo ve su empresa
      const filtros = this.usuario?.idrol?.includes('ALLOGIST') && this.usuario?.ruc
        ? [{ ruc: this.usuario.ruc }]
        : [{}];
      // Cargar atendidos desde API solo una vez
      const despachosAPI = await new Promise<any[]>((resolve, reject) => {
        this.despachosService.listarDespachosRealizados(filtros).subscribe({
          next: (data: any) => {
            let result: any[] = [];
            if (Array.isArray(data)) {
              result = data;
            } else if (data?.id) {
              result = JSON.parse(data.id);
            }
            resolve(result);
          },
          error: (err) => reject(err),
        });
      });
      this.despachosAPI = despachosAPI;
    } catch (error) {
      console.error('Error al cargar despachos desde API:', error);
    }
  }

  async cargarRequerimientosDesdeDexie() {
    try {
      // Cargar requerimientos desde Dexie para conteo de pendientes
      const requerimientos = await this.dexieService.showRequerimiento();
      
      // Agrupar requerimientos únicos por idrequerimiento
      const requerimientosUnicos = new Map();
      for (const req of requerimientos) {
        if (req.idrequerimiento) {
          requerimientosUnicos.set(req.idrequerimiento, req);
        }
      }

      this.requerimientosAprobadosAll = Array.from(requerimientosUnicos.values());
      
      // Ordenar por fecha de aprobación (más reciente primero)
      this.requerimientosAprobadosAll.sort((a: any, b: any) => {
        const fechaA = new Date(a.fechaAprobacion || a.fecha || 0).getTime();
        const fechaB = new Date(b.fechaAprobacion || b.fecha || 0).getTime();
        return fechaB - fechaA;
      });
    } catch (error) {
      console.error('Error al cargar requerimientos desde Dexie:', error);
    }
  }

  async cargarDespachosDesdeDexie() {
    try {
      // Cargar pendientes desde Dexie
      const despachosDexie = await this.dexieService.showDespacho();
      
      // Combinar Dexie con cache de API
      this.despachos = [...despachosDexie, ...this.despachosAPI];
      
      this.aplicarFiltro();
    } catch (error) {
      console.error('Error al cargar despachos desde Dexie:', error);
    }
  }

  async cargarDespachosCombinado() {
    this.loading = true;
    await this.cargarDespachosDesdeDexie();
    await this.cargarRequerimientosDesdeDexie();
    this.loading = false;
  }

  escucharCambiosDespachos() {
    this.intervalId = setInterval(() => {
      this.cargarDespachosDesdeDexie(); // Recargar despachos Dexie en el intervalo
      this.cargarRequerimientosDesdeDexie(); // Recargar requerimientos Dexie en el intervalo
    }, 3000);
  }

  listarDespachos() {
    this.loading = true;
    this.despachosService.listarDespachosRealizados([{}]).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.despachos = data;
        } else if (data?.id) {
          this.despachos = JSON.parse(data.id);
        } else {
          this.despachos = [];
        }
        this.aplicarFiltro();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.alertService.showAlertError(
          'Error',
          'Error al cargar reporte de despachos',
        );
      },
    });
  }

  aplicarFiltro() {
    const esItem = this.activeTabDespachos === 'ITEMS';
    this.despachosFiltrados = this.despachos.filter((x) => {
      const tipo = (x?.tipo || '').toString().toUpperCase();
      const coincideTab = esItem ? tipo === 'ITEM' : tipo !== 'ITEM';
      if (!coincideTab) return false;

      const matchNS =
        !this.filtroNS ||
        (x.numeroNS || '').toLowerCase().includes(this.filtroNS.toLowerCase());
      const matchRequisicion =
        !this.filtroRequisicion ||
        (x.numeroRequisicion || '')
          .toLowerCase()
          .includes(this.filtroRequisicion.toLowerCase());

      let matchFecha = true;
      if (this.fechaInicio || this.fechaFin) {
        const fecha = new Date(x.fechaDespacho);
        if (this.fechaInicio && fecha < this.fechaInicio) matchFecha = false;
        if (this.fechaFin && fecha > this.fechaFin) matchFecha = false;
      }

      return matchNS && matchRequisicion && matchFecha;
    });
  }

  limpiarFiltros() {
    this.filtroNS = '';
    this.filtroRequisicion = '';
    this.fechaInicio = undefined;
    this.fechaFin = undefined;
    this.aplicarFiltro();
  }

  verDetalle(despacho: any) {
    this.despachoSeleccionado = despacho;
    this.detalleDespacho = despacho.detalle || [];
    this.displayDetalle = true;
  }

  cerrarDetalle() {
    this.displayDetalle = false;
    this.despachoSeleccionado = null;
    this.detalleDespacho = [];
  }

  getEstadoClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'DESPACHADO':
      case 'COMPLETO':
        return 'bg-success';
      case 'PARCIAL':
      case 'ATENCION_PARCIAL':
        return 'bg-warning text-dark';
      case 'PENDIENTE':
        return 'bg-secondary';
      case 'ANULADO':
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  }

  exportarExcel(): void {
    if (this.despachosFiltrados.length === 0) {
      this.alertService.showAlert('Información', 'No hay datos para exportar', 'info');
      return;
    }

    try {
      const dataExport = this.despachosFiltrados.map((d, i) => ({
        '#': i + 1,
        'N° NS': d.numeroNS || '',
        'N° Requisición': d.numeroRequisicion || '',
        'ID Requerimiento': d.idrequerimiento || '',
        'Fecha Despacho': d.fechaDespacho ? new Date(d.fechaDespacho).toLocaleString('es-PE') : '',
        'Almacén': d.almacen || '',
        'Usuario': d.usuario || '',
        'Estado': d.estado || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataExport);
      
      // Ajustar ancho de columnas
      worksheet['!cols'] = [
        { wch: 5 },   // #
        { wch: 15 },  // N° NS
        { wch: 15 },  // N° Requisición
        { wch: 20 },  // ID Requerimiento
        { wch: 20 },  // Fecha Despacho
        { wch: 15 },  // Almacén
        { wch: 20 },  // Usuario
        { wch: 15 },  // Estado
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Despachos');
      
      const fechaArchivo = new Date().toISOString().slice(0, 10);
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, `reporte_despachos_${fechaArchivo}.xlsx`);
      
      this.alertService.mostrarInfo('Archivo exportado correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      this.alertService.showAlert('Error', 'No se pudo exportar el archivo', 'error');
    }
  }
}
