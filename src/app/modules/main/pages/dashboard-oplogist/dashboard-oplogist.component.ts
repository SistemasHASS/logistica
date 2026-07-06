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

  get resumenCompra() {
    const r = this.requerimientos.filter((x: any) => x.itemtipo === 'COMPRA');
    return {
      total: r.length,
      pendiente: r.filter((x: any) => ['PENDIENTE', 'ENVIADO'].includes(x.estados)).length,
      aprobado: r.filter((x: any) => x.estados === 'APROBADO').length,
      conOC: r.filter((x: any) => ['EN_OC', 'OC_APROBADA', 'OC_ENVIADA'].includes(x.estados)).length,
      atendido: r.filter((x: any) => ['DESPACHADO', 'DESPACHADO_PARCIAL', 'DESPACHADO_COMPLETO', 'COMPLETADO'].includes(x.estados)).length,
    };
  }

  obtenerEstadoVisualCompra(estadoBackend: string): string {
    return this.MAPA_ESTADOS_COMPRA_VISUAL[estadoBackend] ?? estadoBackend;
  }

  obtenerEstadoVisualFila(req: any): string {
    if (req?.itemtipo === 'COMPRA') {
      return this.obtenerEstadoVisualCompra(req.estados);
    }
    return req?.estados ?? '';
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

  // Estados visual simplificados para la tab COMPRA
  readonly ESTADOS_VISUALES_COMPRA = [
    { valor: 'PENDIENTE', label: 'Pendiente', severity: 'warn' },
    { valor: 'APROBADO', label: 'Aprobado', severity: 'success' },
    { valor: 'CON_OC', label: 'Con OC', severity: 'info' },
    { valor: 'ATENDIDO', label: 'Atendido', severity: 'success' },
  ];

  private readonly MAPA_ESTADOS_COMPRA_VISUAL: Record<string, string> = {
    PENDIENTE: 'PENDIENTE',
    ENVIADO: 'PENDIENTE',
    APROBADO: 'APROBADO',
    EN_OC: 'CON_OC',
    OC_APROBADA: 'CON_OC',
    OC_ENVIADA: 'CON_OC',
    DESPACHADO: 'ATENDIDO',
    DESPACHADO_PARCIAL: 'ATENDIDO',
    DESPACHADO_COMPLETO: 'ATENDIDO',
    COMPLETADO: 'ATENDIDO',
  };

  private readonly BACKEND_POR_ESTADO_VISUAL_COMPRA: Record<string, string[]> = {
    PENDIENTE: ['PENDIENTE', 'ENVIADO'],
    APROBADO: ['APROBADO'],
    CON_OC: ['EN_OC', 'OC_APROBADA', 'OC_ENVIADA'],
    ATENDIDO: ['DESPACHADO', 'DESPACHADO_PARCIAL', 'DESPACHADO_COMPLETO', 'COMPLETADO'],
  };

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
      if (this.tabTipo === 'COMPRA') {
        const backendEstados = this.BACKEND_POR_ESTADO_VISUAL_COMPRA[this.filtroSubEstado] ?? [this.filtroSubEstado];
        filtrados = filtrados.filter((r: any) => backendEstados.includes(r.estados));
      } else {
        filtrados = filtrados.filter((r: any) => r.estados === this.filtroSubEstado);
      }
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
    this.filtroEstado = '';
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
    this.filtroEstado = '';
    this.filtroSubEstado = this.filtroSubEstado === estado ? '' : estado;
    this.aplicarFiltro();
  }

  readonly pipelineOCPasos = [
    { estado: 'PENDIENTE', label: 'Pendiente', icon: 'bx-time-five',   color: 'color-pendiente' },
    { estado: 'APROBADO',  label: 'Aprobado',  icon: 'bx-check-circle', color: 'color-aprobado'  },
    { estado: 'CON_OC',    label: 'Con OC',    icon: 'bx-receipt',      color: 'color-en-oc'     },
    { estado: 'ATENDIDO',  label: 'Atendido',  icon: 'bx-check-double', color: 'color-atendida'  },
  ];

  obtenerPipelineCompra(): { estado: string; label: string; icon: string; color: string; count: number; stepClass: string; bubbleClass: string; labelClass: string; badgeClass: string; lineClass: string }[] {
    const compra = this.requerimientos.filter((r: any) => r.itemtipo === 'COMPRA');
    const conteos: Record<string, number> = {};
    for (const paso of this.pipelineOCPasos) {
      const backendEstados = this.BACKEND_POR_ESTADO_VISUAL_COMPRA[paso.estado] ?? [paso.estado];
      conteos[paso.estado] = compra.filter((r: any) => backendEstados.includes(r.estados)).length;
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

  obtenerSubEstados(): { valor: string; label: string; count: number; severity: string }[] {
    const porTipo = this.requerimientos.filter((r: any) => r.itemtipo === this.tabTipo);

    if (this.tabTipo === 'COMPRA') {
      return this.ESTADOS_VISUALES_COMPRA.map(ev => {
        const backendEstados = this.BACKEND_POR_ESTADO_VISUAL_COMPRA[ev.valor];
        const count = porTipo.filter((r: any) => backendEstados.includes(r.estados)).length;
        return { ...ev, count };
      });
    }

    const ordenConsumo = ['PENDIENTE', 'ENVIADO', 'APROBADO_AREA', 'APROBADO', 'CONSOLIDADO', 'DESPACHADO', 'DESPACHADO_PARCIAL', 'DESPACHADO_COMPLETO', 'RECHAZADO', 'ANULADO'];
    const severities: Record<string, string> = {
      PENDIENTE: 'warn', ENVIADO: 'info', APROBADO_AREA: 'info', APROBADO: 'success',
      CONSOLIDADO: 'info', DESPACHADO: 'contrast', DESPACHADO_PARCIAL: 'secondary',
      DESPACHADO_COMPLETO: 'success', RECHAZADO: 'danger', ANULADO: 'danger',
    };
    const resultado: { valor: string; label: string; count: number; severity: string }[] = [];
    for (const valor of ordenConsumo) {
      const count = porTipo.filter((r: any) => r.estados === valor).length;
      if (count > 0) {
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
      CON_OC: 'info',
      ATENDIDO: 'success',
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
      CON_OC: 'Con OC',
      ATENDIDO: 'Atendido',
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
