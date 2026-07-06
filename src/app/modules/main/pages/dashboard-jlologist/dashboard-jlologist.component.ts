import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { DashboardJlologistService } from './dashboard-jlologist.service';
import { AdminEmpresasService, Empresa } from '../administracion/services/admin-empresas.service';

export interface KpiCard {
  titulo: string;
  subtitulo: string;
  valor: number | string;
  decimales?: number;
  sufijo?: string;
  prefijo?: string;
  cambio: number;
  labelCambio: string;
  cargando: boolean;
  icono: string;
  color: string;
}

// export type TablaKpiTipo = 'reqs' | 'reqs-atendidos' | 'ocs' | 'reqs-pendientes' | 'ocs-cumplimiento' | 'ocs-leadtime' | 'backlog' | 'items-todos' | 'items-por-atender' | 'items-atendidos' | 'items-anulados';
export type TablaKpiTipo = 'reqs' | 'reqs-atendidos' | 'ocs' | 'reqs-pendientes';

export interface TablaKpiConfig {
  tipo: TablaKpiTipo;
  titulo: string;
  color: string;
  icono: string;
}

@Component({
  selector: 'app-dashboard-jlologist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule, InputTextModule],
  templateUrl: './dashboard-jlologist.component.html',
  styleUrls: ['./dashboard-jlologist.component.scss']
})
export class DashboardJlologistComponent implements OnInit {
  usuario: any = null;
  cargandoKpis = true;

  empresas: Empresa[] = [];
  empresaCargando = true;
  rucActivo: string | null = null;

  kpiActivo: number = 0;
  tablaData:    any[]   = [];
  tablaCargando = false;
  filtroTexto = '';

  kpis: KpiCard[] = [
    { titulo: 'REQS. COMPRA',    subtitulo: 'TOTAL',             valor: 0, cambio: 0, labelCambio: 'Reqs de compra del período',  cargando: true, icono: 'bx bx-list-ul',        color: '#7c3aed' },
    { titulo: 'COMPRA ATENDIDA', subtitulo: '',                  valor: 0, cambio: 0, labelCambio: 'Con OC o completada',         cargando: true, icono: 'bx bx-check-double',   color: '#10b981' },
    { titulo: 'OC EMITIDAS',     subtitulo: '',                  valor: 0, cambio: 0, labelCambio: 'Órdenes de compra',           cargando: true, icono: 'bx bx-file',           color: '#f59e0b' },
    { titulo: 'PENDIENTES',      subtitulo: 'DE OC',             valor: 0, cambio: 0, labelCambio: 'Reqs de compra sin OC',       cargando: true, icono: 'bx bx-time-five',      color: '#ef4444' },
    // { titulo: '% CUMPLIMIENTO',  subtitulo: 'PLAZO ENTREGA',     valor: 0, sufijo: '%', decimales: 1, cambio: 0, labelCambio: 'Cumplimiento', cargando: true, icono: 'bx bx-check-circle', color: '#10b981' },
    // { titulo: 'LEAD TIME',       subtitulo: 'PROMEDIO',          valor: 0, decimales: 1, cambio: 0, labelCambio: 'Días promedio proveedor', cargando: true, icono: 'bx bx-trending-up', color: '#3b82f6' },
    // { titulo: 'BACKLOG',         subtitulo: 'ACTUAL',            valor: 0, cambio: 0, labelCambio: 'Reqs acumulados pendientes',  cargando: true, icono: 'bx bx-time',           color: '#8b5cf6' },
    // { titulo: 'TOTAL',           subtitulo: 'ÍTEMS',             valor: 0, cambio: 0, labelCambio: 'Ítems del período',           cargando: true, icono: 'bx bx-package',        color: '#0ea5e9' },
    // { titulo: 'ÍTEMS',           subtitulo: 'POR ATENDER',       valor: 0, cambio: 0, labelCambio: 'Sin consolidar',              cargando: true, icono: 'bx bx-loader-circle',  color: '#f97316' },
    // { titulo: 'ÍTEMS',           subtitulo: 'ATENDIDOS',         valor: 0, cambio: 0, labelCambio: 'Consolidados/despachados',    cargando: true, icono: 'bx bx-check-square',   color: '#10b981' },
    // { titulo: 'ÍTEMS',           subtitulo: 'ANULADOS',          valor: 0, cambio: 0, labelCambio: 'Eliminados del sistema',      cargando: true, icono: 'bx bx-x-circle',       color: '#6b7280' },
  ];

  private readonly tablaConfigs: TablaKpiConfig[] = [
    { tipo: 'reqs',              titulo: 'Requerimientos de Compra',          color: '#7c3aed', icono: 'bx bx-list-ul'        },
    { tipo: 'reqs-atendidos',    titulo: 'Compra Atendida (con OC)',          color: '#10b981', icono: 'bx bx-check-double'   },
    { tipo: 'ocs',               titulo: 'Órdenes de Compra Emitidas',        color: '#f59e0b', icono: 'bx bx-file'           },
    { tipo: 'reqs-pendientes',   titulo: 'Requerimientos de Compra Pendientes', color: '#ef4444', icono: 'bx bx-time-five'      },
    // { tipo: 'ocs-cumplimiento',  titulo: 'OC — Cumplimiento Plazo Entrega',   color: '#10b981', icono: 'bx bx-check-circle'   },
    // { tipo: 'ocs-leadtime',      titulo: 'OC — Lead Time Proveedor',          color: '#3b82f6', icono: 'bx bx-trending-up'    },
    // { tipo: 'backlog',           titulo: 'Backlog — Reqs Sin Atender',        color: '#8b5cf6', icono: 'bx bx-time'           },
    // { tipo: 'items-todos',       titulo: 'Total Ítems del Período',           color: '#0ea5e9', icono: 'bx bx-package'        },
    // { tipo: 'items-por-atender', titulo: 'Ítems Por Atender',                 color: '#f97316', icono: 'bx bx-loader-circle'  },
    // { tipo: 'items-atendidos',   titulo: 'Ítems Atendidos',                   color: '#10b981', icono: 'bx bx-check-square'   },
    // { tipo: 'items-anulados',    titulo: 'Ítems Anulados',                    color: '#6b7280', icono: 'bx bx-x-circle'       },
  ];

  get tablaActivaConfig(): TablaKpiConfig {
    return this.tablaConfigs[this.kpiActivo];
  }

  get esTablaItems(): boolean {
    const t = this.tablaActivaConfig?.tipo;
    return !!t && t.startsWith('items');
  }

  get esTablaOCs(): boolean {
    const t = this.tablaActivaConfig?.tipo;
    // return t === 'ocs' || t === 'ocs-cumplimiento' || t === 'ocs-leadtime';
    return t === 'ocs';
  }

  constructor(
    private dexieService: DexieService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dashboardSvc: DashboardJlologistService,
    private dashboardEmpresasSvc: AdminEmpresasService
  ) {}

  async ngOnInit() {
    this.usuario = await this.dexieService.obtenerPrimerUsuario();
    this.cargarEmpresas();
    this.cdr.markForCheck();
  }

  cargarEmpresas() {
    this.empresaCargando = true;
    this.dashboardEmpresasSvc.listarEmpresas().subscribe({
      next: (resp: any) => {
        let lista: Empresa[] = [];
        if (resp && resp.resultado) {
          try { lista = JSON.parse(resp.resultado); } catch { lista = resp.resultado || []; }
        } else if (Array.isArray(resp)) {
          lista = resp;
        }
        this.empresas = lista.filter(e => e.activo !== false);
        this.rucActivo = this.empresas.length > 0 ? (this.empresas[0].ruc ?? null) : (this.usuario?.ruc ?? null);
        this.empresaCargando = false;
        this.cargarKpis();
        this.cdr.markForCheck();
      },
      error: () => {
        this.rucActivo = this.usuario?.ruc ?? null;
        this.empresaCargando = false;
        this.cargarKpis();
        this.cdr.markForCheck();
      }
    });
  }

  seleccionarEmpresa(ruc: string) {
    if (this.rucActivo === ruc) return;
    this.rucActivo = ruc;
    this.filtroTexto = '';
    this.tablaData = [];
    this.kpis = this.kpis.map(k => ({ ...k, cargando: true }));
    this.cargandoKpis = true;
    this.cdr.markForCheck();
    this.cargarKpis();
  }

  get tablaDataFiltrada(): any[] {
    if (!this.filtroTexto.trim()) return this.tablaData;
    const q = this.filtroTexto.trim().toLowerCase();
    return this.tablaData.filter(r =>
      Object.values(r).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }

  seleccionarKpi(idx: number) {
    if (this.kpiActivo === idx) return;
    this.kpiActivo = idx;
    this.filtroTexto = '';
    this.cargarTablaKpi(idx);
  }

  cargarTablaKpi(idx: number) {
    const tipo = this.tablaConfigs[idx].tipo;
    const base = { ruc: this.rucActivo, top: 50 };
    this.tablaCargando = true;
    this.tablaData = [];
    this.cdr.markForCheck();

    if (tipo.startsWith('items')) {
      const filtroMap: Record<string, string | null> = {
        'items-todos':       'null',
        'items-por-atender': 'POR_ATENDER',
        'items-atendidos':   'ATENDIDO',
        'items-anulados':    'ANULADO',
      };
      const filtroEstado = filtroMap[tipo] === 'null' ? null : filtroMap[tipo];
      this.dashboardSvc.listarItemsDetalle({ ...base, filtroEstado }).subscribe({
        next: (d) => { this.tablaData = d ?? []; this.tablaCargando = false; this.cdr.markForCheck(); },
        error: ()  => { this.tablaData = [];      this.tablaCargando = false; this.cdr.markForCheck(); }
      });
    // } else if (tipo === 'ocs' || tipo === 'ocs-cumplimiento' || tipo === 'ocs-leadtime') {
    } else if (tipo === 'ocs') {
      this.dashboardSvc.listarOCsRecientes(base).subscribe({
        next: (d) => { this.tablaData = d ?? []; this.tablaCargando = false; this.cdr.markForCheck(); },
        error: ()  => { this.tablaData = [];      this.tablaCargando = false; this.cdr.markForCheck(); }
      });
    } else {
      const filtrosReqs: Record<string, string[] | null> = {
        'reqs':            null,
        'reqs-atendidos':  ['ATENDIDO','CERRADO'],
        'reqs-pendientes': ['PENDIENTE','APROBADO','EN_REVISION'],
        // 'backlog':         ['PENDIENTE','APROBADO','EN_REVISION'],
      };
      const estados = filtrosReqs[tipo] ?? null;
      this.dashboardSvc.listarReqsRecientes(base).subscribe({
        next: (d) => {
          const all = d ?? [];
          this.tablaData = estados ? all.filter((r: any) => estados.includes((r.estado ?? '').toUpperCase())) : all;
          this.tablaCargando = false;
          this.cdr.markForCheck();
        },
        error: () => { this.tablaData = []; this.tablaCargando = false; this.cdr.markForCheck(); }
      });
    }
  }

  cargarKpis() {
    const payload = { ruc: this.rucActivo };
    this.dashboardSvc.obtenerKPIs(payload).subscribe({
      next: (resp) => {
        const data = Array.isArray(resp) ? resp[0] : resp;
        if (data) {
          this.kpis[0]  = { ...this.kpis[0],  valor: data.totalRequerimientos ?? 0, cambio: data.cambioTotalReqs        ?? 0, cargando: false };
          this.kpis[1]  = { ...this.kpis[1],  valor: data.reqsAtendidos        ?? 0, cambio: data.cambioReqsAtendidos   ?? 0, cargando: false };
          this.kpis[2]  = { ...this.kpis[2],  valor: data.ocEmitidas           ?? 0, cambio: data.cambioOCEmitidas      ?? 0, cargando: false };
          this.kpis[3]  = { ...this.kpis[3],  valor: data.pendientesAtencion   ?? 0, cambio: data.cambioPendientes      ?? 0, cargando: false };
          // this.kpis[4]  = { ...this.kpis[4],  valor: data.pctCumplimiento      ?? 0, cambio: data.cambioPctCumplimiento ?? 0, cargando: false };
          // this.kpis[5]  = { ...this.kpis[5],  valor: data.leadTimePromedio     ?? 0, cambio: data.cambioLeadTime        ?? 0, cargando: false };
          // this.kpis[6]  = { ...this.kpis[6],  valor: data.backlogActual        ?? 0, cambio: data.cambioBacklog         ?? 0, cargando: false };
          // this.kpis[7]  = { ...this.kpis[7],  valor: data.totalItems           ?? 0, cambio: 0,                              cargando: false };
          // this.kpis[8]  = { ...this.kpis[8],  valor: data.itemsPorAtender      ?? 0, cambio: 0,                              cargando: false };
          // this.kpis[9]  = { ...this.kpis[9],  valor: data.itemsAtendidos       ?? 0, cambio: 0,                              cargando: false };
          // this.kpis[10] = { ...this.kpis[10], valor: data.itemsAnulados        ?? 0, cambio: 0,                              cargando: false };
          this.cargarTablaKpi(this.kpiActivo);
        } else {
          this.kpis = this.kpis.map(k => ({ ...k, cargando: false }));
        }
        this.cargandoKpis = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.kpis = this.kpis.map(k => ({ ...k, cargando: false }));
        this.cargandoKpis = false;
        this.cdr.markForCheck();
      }
    });
  }

  estadoBadgeClass(estado: string): string {
    const e = (estado ?? '').toUpperCase();
    if (['APROBADO','APROBADA','ENVIADA','COMPLETADO','DESPACHADO','ATENCION_PARCIAL','ATENDIDO','CERRADO'].includes(e)) return 'badge-ok';
    if (['PENDIENTE','PENDIENTE_APROBACION','BORRADOR','EN_REVISION'].includes(e)) return 'badge-pending';
    if (['RECHAZADO','ANULADA','ANULADO'].includes(e)) return 'badge-danger';
    return 'badge-info';
  }

  estadoItemBadge(estado: string): string {
    const e = (estado ?? '').toUpperCase();
    if (e === 'ATENDIDO')    return 'badge-ok';
    if (e === 'ANULADO')     return 'badge-danger';
    return 'badge-pending';
  }

  formatearValor(kpi: KpiCard): string {
    const n = typeof kpi.valor === 'number' ? kpi.valor : parseFloat(kpi.valor as string);
    const decimales = kpi.decimales ?? 0;
    const str = decimales > 0 ? n.toFixed(decimales) : Math.round(n).toLocaleString('es-PE');
    return `${kpi.prefijo ?? ''}${str}${kpi.sufijo ?? ''}`;
  }

  esPositivo(cambio: number): boolean { return cambio > 0; }
  esNegativo(cambio: number): boolean { return cambio < 0; }

  irA(ruta: string) {
    this.router.navigate(['main', ruta]);
  }
}
