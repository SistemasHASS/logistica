import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

interface ResumenAprobaciones {
  // Pendientes por tipo
  pendientesConsumo: number;
  pendientesCompra: number;
  totalPendientes: number;

  // Aprobados por tipo
  aprobadosConsumo: number;
  aprobadosCompra: number;
  totalAprobados: number;

  // Rechazados por tipo
  rechazadosConsumo: number;
  rechazadosCompra: number;
  totalRechazados: number;

  // Totales
  totalRequerimientos: number;
}

@Component({
  selector: 'app-dashboard-aprobaciones-area',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, TableModule, TagModule, ButtonModule, TooltipModule, DialogModule, ProgressBarModule, NumeroRequerimientoPipe],
  templateUrl: './dashboard-aprobaciones-area.component.html',
  styleUrls: ['./dashboard-aprobaciones-area.component.scss']
})
export class DashboardAprobacionesAreaComponent implements OnInit {
  usuario: any = null;
  loading = false;

  resumen: ResumenAprobaciones = {
    pendientesConsumo: 0,
    pendientesCompra: 0,
    totalPendientes: 0,
    aprobadosConsumo: 0,
    aprobadosCompra: 0,
    totalAprobados: 0,
    rechazadosConsumo: 0,
    rechazadosCompra: 0,
    totalRechazados: 0,
    totalRequerimientos: 0
  };

  requerimientosPendientes: any[] = [];
  misAprobaciones: any[] = [];
  filtroTipo: 'TODOS' | 'CONSUMO' | 'COMPRA' = 'TODOS';
  filtroEstado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'TODOS' = 'PENDIENTE';

  modalDetalleAbierto = false;
  requerimientoSeleccionado: any = null;

  // Estados para badges
  readonly estados = [
    { valor: 'PENDIENTE', label: 'Pendiente', clase: 'warning' },
    { valor: 'APROBADO', label: 'Aprobado', clase: 'success' },
    { valor: 'RECHAZADO', label: 'Rechazado', clase: 'danger' },
    { valor: 'ENVIADO', label: 'Enviado', clase: 'info' },
  ];

  constructor(
    private dexieService: DexieService,
    private aprobacionesAreaService: AprobacionesAreaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.usuario = await this.dexieService.showUsuario();
    console.log('📊 Dashboard - Usuario cargado:', this.usuario);
    console.log('📊 Dashboard - documentoidentidad:', this.usuario?.documentoidentidad);
    console.log('📊 Dashboard - dni:', this.usuario?.dni);
    console.log('📊 Dashboard - ruc:', this.usuario?.ruc);
    
    // Verificar si tiene los datos necesarios
    if (!this.usuario?.documentoidentidad && !this.usuario?.dni) {
      console.error('❌ Dashboard - ERROR: Usuario no tiene documentoidentidad ni dni');
    }
    if (!this.usuario?.ruc) {
      console.error('❌ Dashboard - ERROR: Usuario no tiene ruc');
    }
    
    await this.cargarDashboard();
  }

  async cargarDashboard(): Promise<void> {
    this.loading = true;
    try {
      // Cargar requerimientos pendientes
      await this.cargarRequerimientosPendientes();

      // Cargar mis aprobaciones (reporte)
      await this.cargarMisAprobaciones();

      // Calcular resumen
      this.calcularResumen();

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async cargarRequerimientosPendientes(): Promise<void> {
    try {
      const params = {
        documentoidentidad: this.usuario?.documentoidentidad || this.usuario?.dni || '',
        ruc: this.usuario?.ruc
      };
      console.log('📊 Dashboard - Params pendientes:', params);

      const response = await firstValueFrom(
        this.aprobacionesAreaService.obtenerRequerimientosPendientesArea(params)
      );
      console.log('📊 Dashboard - Respuesta pendientes RAW:', response);
      console.log('📊 Dashboard - ¿Es array?', Array.isArray(response));
      console.log('📊 Dashboard - Keys de respuesta:', response ? Object.keys(response) : 'null');

      // Manejar respuesta directa como array o envuelta en objeto
      this.requerimientosPendientes = Array.isArray(response) 
        ? response 
        : (response?.resultado || response?.data || []);
      console.log('📊 Dashboard - Requerimientos pendientes procesados:', this.requerimientosPendientes.length, this.requerimientosPendientes);
    } catch (error) {
      console.error('❌ Error cargando pendientes:', error);
      this.requerimientosPendientes = [];
    }
  }

  async cargarMisAprobaciones(): Promise<void> {
    try {
      const params = {
        documentoidentidad: this.usuario?.documentoidentidad || this.usuario?.dni || '',
        ruc: this.usuario?.ruc
      };
      console.log('📊 Dashboard - Params aprobaciones:', params);

      const response = await firstValueFrom(
        this.aprobacionesAreaService.obtenerReporteAprobacionesArea(params)
      );
      console.log('📊 Dashboard - Respuesta aprobaciones RAW:', response);
      console.log('📊 Dashboard - ¿Es array?', Array.isArray(response));
      console.log('📊 Dashboard - Keys de respuesta:', response ? Object.keys(response) : 'null');

      // Manejar respuesta directa como array o envuelta en objeto
      this.misAprobaciones = Array.isArray(response) 
        ? response 
        : (response?.resultado || response?.data || []);
      console.log('📊 Dashboard - Aprobaciones procesadas:', this.misAprobaciones.length, this.misAprobaciones);
    } catch (error) {
      console.error('❌ Error cargando aprobaciones:', error);
      this.misAprobaciones = [];
    }
  }

  calcularResumen(): void {
    // Calcular pendientes por tipo (usando itemtipo)
    const pendientesConsumo = this.requerimientosPendientes.filter(
      (r: any) => (r.itemtipo === 'CONSUMO' || !r.itemtipo)
    ).length;
    const pendientesCompra = this.requerimientosPendientes.filter(
      (r: any) => r.itemtipo === 'COMPRA'
    ).length;

    // Calcular aprobados/rechazados por tipo del reporte (usando itemtipo)
    const aprobadosConsumo = this.misAprobaciones.filter(
      (a: any) => (a.accion === 'APROBADO' || a.estado === 'APROBADO') && (a.itemtipo === 'CONSUMO' || !a.itemtipo)
    ).length;
    const aprobadosCompra = this.misAprobaciones.filter(
      (a: any) => (a.accion === 'APROBADO' || a.estado === 'APROBADO') && a.itemtipo === 'COMPRA'
    ).length;

    const rechazadosConsumo = this.misAprobaciones.filter(
      (a: any) => (a.accion === 'RECHAZADO' || a.estado === 'RECHAZADO') && (a.itemtipo === 'CONSUMO' || !a.itemtipo)
    ).length;
    const rechazadosCompra = this.misAprobaciones.filter(
      (a: any) => (a.accion === 'RECHAZADO' || a.estado === 'RECHAZADO') && a.itemtipo === 'COMPRA'
    ).length;

    this.resumen = {
      pendientesConsumo,
      pendientesCompra,
      totalPendientes: pendientesConsumo + pendientesCompra,
      aprobadosConsumo,
      aprobadosCompra,
      totalAprobados: aprobadosConsumo + aprobadosCompra,
      rechazadosConsumo,
      rechazadosCompra,
      totalRechazados: rechazadosConsumo + rechazadosCompra,
      totalRequerimientos: this.requerimientosPendientes.length + this.misAprobaciones.length
    };
    console.log('📊 Dashboard - Resumen calculado:', this.resumen);
  }

  // Filtros computados
  get requerimientosFiltrados(): any[] {
    let filtrados = this.requerimientosPendientes;

    if (this.filtroTipo !== 'TODOS') {
      filtrados = filtrados.filter(r => r.itemtipo === this.filtroTipo);
    }

    return filtrados;
  }

  get aprobacionesFiltradas(): any[] {
    let filtrados = this.misAprobaciones.filter((a: any) => a.accion === 'APROBADO' || a.estado === 'APROBADO' || a.estadoAprobacion === 'APROBADO');

    if (this.filtroTipo !== 'TODOS') {
      filtrados = filtrados.filter(r => r.itemtipo === this.filtroTipo);
    }

    return filtrados;
  }

  get rechazosFiltrados(): any[] {
    let filtrados = this.misAprobaciones.filter((a: any) => a.accion === 'RECHAZADO' || a.estado === 'RECHAZADO' || a.estadoAprobacion === 'RECHAZADO');

    if (this.filtroTipo !== 'TODOS') {
      filtrados = filtrados.filter(r => r.itemtipo === this.filtroTipo);
    }

    return filtrados;
  }

  // Calcular porcentajes para barras de progreso
  get porcentajePendientesConsumo(): number {
    return this.resumen.totalPendientes > 0
      ? Math.round((this.resumen.pendientesConsumo / this.resumen.totalPendientes) * 100)
      : 0;
  }

  get porcentajePendientesCompra(): number {
    return this.resumen.totalPendientes > 0
      ? Math.round((this.resumen.pendientesCompra / this.resumen.totalPendientes) * 100)
      : 0;
  }

  get porcentajeAprobadosConsumo(): number {
    return this.resumen.totalAprobados > 0
      ? Math.round((this.resumen.aprobadosConsumo / this.resumen.totalAprobados) * 100)
      : 0;
  }

  get porcentajeAprobadosCompra(): number {
    return this.resumen.totalAprobados > 0
      ? Math.round((this.resumen.aprobadosCompra / this.resumen.totalAprobados) * 100)
      : 0;
  }

  // Navegación
  irAAprobaciones(): void {
    this.router.navigate(['/main/aprobaciones-area']);
  }

  verDetalle(req: any): void {
    this.requerimientoSeleccionado = req;
    this.modalDetalleAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    this.modalDetalleAbierto = false;
    this.requerimientoSeleccionado = null;
    this.cdr.markForCheck();
  }

  setFiltroTipo(tipo: 'TODOS' | 'CONSUMO' | 'COMPRA'): void {
    this.filtroTipo = tipo;
    this.cdr.markForCheck();
  }

  setFiltroEstado(estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'TODOS'): void {
    this.filtroEstado = estado;
    this.cdr.markForCheck();
  }

  refresh(): void {
    this.cargarDashboard();
  }
}
