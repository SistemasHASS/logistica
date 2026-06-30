import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { RequerimientosService } from '../../services/requerimientos.service';
import { DashboardLogisticaService } from '../dashboard-logistica/services/dashboard-logistica.service';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

interface ResumenRequerimiento {
  total: number;
  pendiente: number;
  enviado: number;
  aprobado: number;
  rechazado: number;
  despachado: number;
  completado: number;
  consolidado: number;
  enOC: number;
  ocAprobada: number;
  ocEnviada: number;
}

@Component({
  selector: 'app-dashboard-oplogist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CardModule, TableModule, TagModule, ButtonModule, TooltipModule, DialogModule, InputTextModule, DatePickerModule, NumeroRequerimientoPipe],
  templateUrl: './dashboard-oplogist.component.html',
  styleUrls: ['./dashboard-oplogist.component.scss']
})
export class DashboardOplogistComponent implements OnInit {
  usuario: any = null;
  loading = false;

  resumen: ResumenRequerimiento = {
    total: 0, pendiente: 0, enviado: 0, aprobado: 0,
    rechazado: 0, despachado: 0, completado: 0, consolidado: 0,
    enOC: 0, ocAprobada: 0, ocEnviada: 0
  };

  requerimientos: any[] = [];
  requerimientosFiltrados: any[] = [];
  filtroEstado = '';
  tabTipo: 'CONSUMO' | 'COMPRA' = 'CONSUMO';
  filtroSubEstado = '';

  // Filtros en vivo
  filtroNumeroReq = '';
  filtroFechaCreacion: Date | null = null;
  filtroFechaAprobacion: Date | null = null;

  // Propiedades computadas para contadores
  get contadorConsumo(): number {
    return this.requerimientos.filter((r: any) => r.itemtipo === 'CONSUMO').length;
  }

  get contadorCompra(): number {
    return this.requerimientos.filter((r: any) => r.itemtipo === 'COMPRA').length;
  }

  modalDetalleAbierto = false;
  requerimientoSeleccionado: any = null;

  readonly estados = [
    { valor: '', label: 'Todos', clase: 'secondary' },
    { valor: 'PENDIENTE', label: 'Pendiente', clase: 'warning' },
    { valor: 'ENVIADO', label: 'Enviado', clase: 'info' },
    { valor: 'APROBADO', label: 'Aprobado', clase: 'success' },
    { valor: 'RECHAZADO', label: 'Rechazado', clase: 'danger' },
    { valor: 'CONSOLIDADO', label: 'Consolidado', clase: 'primary' },
    { valor: 'DESPACHADO', label: 'Despachado', clase: 'dark' },
    { valor: 'DESPACHADO_COMPLETO', label: 'Completado', clase: 'success' },
  ];

  constructor(
    private dexieService: DexieService,
    private requerimientosService: RequerimientosService,
    private dashboardLogisticaService: DashboardLogisticaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.usuario = await this.dexieService.obtenerPrimerUsuario();
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.loading = true;
    try {
      // NUEVO: Usar endpoint dedicado para dashboard de usuario (todos los estados)
      const payloadDashboard = [{
        ruc: this.usuario?.ruc,
        nrodocumento: this.usuario?.documentoidentidad
      }];

      // Llamar al nuevo endpoint que trae TODOS los estados del usuario
      const resp = await firstValueFrom(this.requerimientosService.getRequerimientosUsuarioDashboard(payloadDashboard));
      let todos: any[] = resp || [];

      // Fallback a Dexie si el backend no devuelve nada
      if (!todos.length) {
        const dexieData = await this.dexieService.showRequerimiento();
        todos = dexieData.filter((r: any) => r.nrodocumento === this.usuario?.documentoidentidad);
      }

      this.requerimientos = todos.sort((a: any, b: any) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      // Calcular todos los KPIs desde el array local (consistente)
      this.calcularResumen();
      this.aplicarFiltro();
    } catch (e) {
      console.error('Error al cargar desde backend, usando Dexie:', e);
      try {
        const todos = await this.dexieService.showRequerimiento();
        this.requerimientos = todos
          .filter((r: any) => r.nrodocumento === this.usuario?.documentoidentidad)
          .sort((a: any, b: any) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
        this.calcularResumen();
        this.aplicarFiltro();
      } catch (e2) {
        console.error('Error al cargar desde Dexie:', e2);
      }
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  calcularResumen() {
    const r = this.requerimientos;
    this.resumen = {
      total: r.length,
      pendiente: r.filter((x: any) => x.estados === 'PENDIENTE').length,
      enviado: r.filter((x: any) => x.estados === 'ENVIADO' || x.estados === 'APROBADO_AREA').length,
      aprobado: r.filter((x: any) => x.estados === 'APROBADO').length,
      rechazado: r.filter((x: any) => x.estados === 'RECHAZADO' || x.estados === 'ANULADO').length,
      consolidado: r.filter((x: any) => x.estados === 'CONSOLIDADO').length,
      despachado: r.filter((x: any) => x.estados === 'DESPACHADO' || x.estados === 'DESPACHADO_PARCIAL').length,
      completado: r.filter((x: any) => x.estados === 'DESPACHADO_COMPLETO' || x.estados === 'COMPLETADO').length,
      enOC: r.filter((x: any) => x.estados === 'EN_OC').length,
      ocAprobada: r.filter((x: any) => x.estados === 'OC_APROBADA').length,
      ocEnviada: r.filter((x: any) => x.estados === 'OC_ENVIADA').length,
    };
  }

  aplicarFiltro() {
    let filtrados = this.requerimientos.filter((r: any) => r.itemtipo === this.tabTipo);

    if (this.filtroSubEstado) {
      filtrados = filtrados.filter((r: any) => r.estados === this.filtroSubEstado);
    } else if (this.filtroEstado) {
      filtrados = filtrados.filter((r: any) => r.estados === this.filtroEstado);
    }

    if (this.filtroNumeroReq?.trim()) {
      const termino = this.filtroNumeroReq.trim().toLowerCase();
      filtrados = filtrados.filter((r: any) => {
        const numero = String(r.idrequerimiento ?? '').toLowerCase();
        const requisicion = String(r.RequisicionNumero ?? '').toLowerCase();
        return numero.includes(termino) || requisicion.includes(termino);
      });
    }

    if (this.filtroFechaCreacion) {
      const fechaFiltro = this.sinHora(this.filtroFechaCreacion);
      filtrados = filtrados.filter((r: any) => {
        if (!r.fecha) return false;
        return this.sinHora(new Date(r.fecha)).getTime() === fechaFiltro.getTime();
      });
    }

    if (this.filtroFechaAprobacion) {
      const fechaFiltro = this.sinHora(this.filtroFechaAprobacion);
      filtrados = filtrados.filter((r: any) => {
        if (!r.fechaAprobacion) return false;
        return this.sinHora(new Date(r.fechaAprobacion)).getTime() === fechaFiltro.getTime();
      });
    }

    this.requerimientosFiltrados = filtrados;
    this.cdr.markForCheck();
  }

  private sinHora(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }

  limpiarFiltrosEnVivo() {
    this.filtroNumeroReq = '';
    this.filtroFechaCreacion = null;
    this.filtroFechaAprobacion = null;
    this.aplicarFiltro();
  }

  seleccionarTabTipo(tipo: 'CONSUMO' | 'COMPRA') {
    this.tabTipo = tipo;
    this.filtroSubEstado = '';
    this.aplicarFiltro();
  }

  seleccionarSubEstado(estado: string) {
    this.filtroSubEstado = this.filtroSubEstado === estado ? '' : estado;
    this.aplicarFiltro();
  }

  seleccionarFiltro(estado: string) {
    this.filtroEstado = this.filtroEstado === estado ? '' : estado;
    this.aplicarFiltro();
  }

  seleccionarFiltroOC(estado: string) {
    this.tabTipo = 'COMPRA';
    this.filtroSubEstado = '';
    this.filtroEstado = this.filtroEstado === estado ? '' : estado;
    this.aplicarFiltro();
  }

  readonly pipelineOCPasos = [
    { estado: 'APROBADO',          label: 'Aprobado',    icon: 'bx-check-circle',  color: 'color-aprobado' },
    { estado: 'EN_OC',             label: 'En OC',       icon: 'bx-file-blank',    color: 'color-en-oc'    },
    { estado: 'OC_APROBADA',       label: 'OC Aprobada', icon: 'bx-check-shield',  color: 'color-aprobada' },
    { estado: 'OC_ENVIADA',        label: 'OC Enviada',  icon: 'bx-send',          color: 'color-enviada'  },
    { estado: 'DESPACHADO_COMPLETO', label: 'Atendido',  icon: 'bx-trophy',        color: 'color-atendida' },
  ];

  obtenerPipelineCompra(): { estado: string; label: string; icon: string; color: string; count: number; stepClass: string; bubbleClass: string; labelClass: string; badgeClass: string; lineClass: string }[] {
    const compra = this.requerimientos.filter((r: any) => r.itemtipo === 'COMPRA');
    const conteos: Record<string, number> = {};
    for (const paso of this.pipelineOCPasos) {
      conteos[paso.estado] = compra.filter((r: any) =>
        paso.estado === 'DESPACHADO_COMPLETO'
          ? r.estados === 'DESPACHADO_COMPLETO' || r.estados === 'COMPLETADO' || r.estados === 'DESPACHADO'
          : r.estados === paso.estado
      ).length;
    }

    // Paso activo = el más avanzado con count > 0
    const orden = this.pipelineOCPasos.map(p => p.estado);
    let pasoActivoIdx = -1;
    for (let i = orden.length - 1; i >= 0; i--) {
      if (conteos[orden[i]] > 0) { pasoActivoIdx = i; break; }
    }

    return this.pipelineOCPasos.map((paso, i) => {
      const count = conteos[paso.estado];
      const isActive = i === pasoActivoIdx;
      const isDone   = i < pasoActivoIdx;
      const hasCnt   = count > 0;

      return {
        ...paso,
        count,
        stepClass:   hasCnt ? 'has-items' : '',
        bubbleClass: !hasCnt ? 'step-inactive' : isActive ? `${paso.color} step-active` : isDone ? `${paso.color} step-done` : paso.color,
        labelClass:  isActive ? 'label-active' : '',
        badgeClass:  isActive ? 'badge-active' : isDone ? 'badge-done' : hasCnt ? `badge-${paso.color.replace('color-', '')}` : '',
        lineClass:   isDone ? 'line-done' : isActive ? 'line-active' : 'line-pending',
      };
    });
  }

  // Estados del pipeline OC que siempre aparecen visibles en tab COMPRA
  private readonly estadosFijosCompra = new Set(['APROBADO', 'EN_OC', 'OC_APROBADA', 'OC_ENVIADA', 'DESPACHADO_COMPLETO']);

  obtenerSubEstados(): { valor: string; label: string; count: number; severity: string }[] {
    const porTipo = this.requerimientos.filter((r: any) => r.itemtipo === this.tabTipo);

    const ordenCompra  = ['PENDIENTE', 'ENVIADO', 'APROBADO', 'EN_OC', 'OC_APROBADA', 'OC_ENVIADA', 'DESPACHADO', 'DESPACHADO_PARCIAL', 'DESPACHADO_COMPLETO', 'RECHAZADO', 'ANULADO'];
    const ordenConsumo = ['PENDIENTE', 'ENVIADO', 'APROBADO_AREA', 'APROBADO', 'CONSOLIDADO', 'DESPACHADO', 'DESPACHADO_PARCIAL', 'DESPACHADO_COMPLETO', 'RECHAZADO', 'ANULADO'];
    const orden = this.tabTipo === 'COMPRA' ? ordenCompra : ordenConsumo;

    const severities: Record<string, string> = {
      PENDIENTE: 'warn', ENVIADO: 'info', APROBADO_AREA: 'info', APROBADO: 'success',
      EN_OC: 'info', OC_APROBADA: 'success', OC_ENVIADA: 'info',
      CONSOLIDADO: 'info', DESPACHADO: 'contrast', DESPACHADO_PARCIAL: 'secondary',
      DESPACHADO_COMPLETO: 'success', RECHAZADO: 'danger', ANULADO: 'danger',
    };
    const resultado: { valor: string; label: string; count: number; severity: string }[] = [];
    for (const valor of orden) {
      const count = porTipo.filter((r: any) => r.estados === valor).length;
      // En tab COMPRA: estados fijos siempre visibles; el resto solo si tienen datos
      const mostrar = this.tabTipo === 'COMPRA'
        ? (this.estadosFijosCompra.has(valor) || count > 0)
        : count > 0;
      if (mostrar) {
        resultado.push({ valor, label: this.obtenerTextoEstado(valor), count, severity: severities[valor] ?? 'secondary' });
      }
    }
    return resultado;
  }

  verDetalle(req: any) {
    this.requerimientoSeleccionado = req;
    this.modalDetalleAbierto = true;
  }

  cerrarDetalle() {
    this.modalDetalleAbierto = false;
    this.requerimientoSeleccionado = null;
  }

  irRequerimientos() {
    this.router.navigate(['main', 'requerimientos']);
  }

  obtenerClaseEstado(estado: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const clases: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      PENDIENTE: 'warn',
      ENVIADO: 'info',
      APROBADO_AREA: 'info',
      APROBADO: 'success',
      EN_OC: 'info',
      OC_APROBADA: 'success',
      OC_ENVIADA: 'info',
      RECHAZADO: 'danger',
      ANULADO: 'danger',
      CONSOLIDADO: 'info',
      DESPACHADO: 'contrast',
      DESPACHADO_PARCIAL: 'secondary',
      DESPACHADO_COMPLETO: 'success',
      COMPLETADO: 'success',
    };
    return clases[estado] ?? 'secondary';
  }

  obtenerTextoEstado(estado: string): string {
    const textos: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      ENVIADO: 'Enviado',
      APROBADO_AREA: 'Aprob. Área',
      APROBADO: 'Aprobado',
      ANULADO: 'Anulado',
      EN_OC: 'En OC',
      OC_APROBADA: 'OC Aprobada',
      OC_ENVIADA: 'OC Enviada',
      RECHAZADO: 'Rechazado',
      CONSOLIDADO: 'Consolidado',
      DESPACHADO: 'Despachado',
      DESPACHADO_PARCIAL: 'Desp. Parcial',
      DESPACHADO_COMPLETO: 'Completado',
      COMPLETADO: 'Completado',
    };
    return textos[estado] || estado;
  }

  obtenerNumeroMovil(req: any): string {
    const base = req?.RequisicionNumero && String(req.RequisicionNumero).trim()
      ? String(req.RequisicionNumero).trim()
      : String(req?.idrequerimiento ?? '').trim();
    return base.slice(-4) || '0';
  }

  obtenerNumeroMovilDetalle(): string {
    const req = this.requerimientoSeleccionado;
    if (!req) return '';
    const base = req.RequisicionNumero && String(req.RequisicionNumero).trim()
      ? String(req.RequisicionNumero).trim()
      : String(req.idrequerimiento ?? '').trim();
    return base.slice(-4) || '0';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
