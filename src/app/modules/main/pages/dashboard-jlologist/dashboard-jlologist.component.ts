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
export type TablaKpiTipo = 'reqs' | 'reqs-atendidos' | 'ocs' | 'reqs-pendientes' | 'items-todos' | 'items-por-atender' | 'items-atendidos' | 'items-anulados';

export interface TablaKpiConfig {
  tipo: TablaKpiTipo;
  titulo: string;
  color: string;
  icono: string;
}

interface EmpresaPermitida {
  nombre: string;
  alias: string[];
}

const EMPRESAS_PERMITIDAS: EmpresaPermitida[] = [
  { nombre: 'HASS PERU SA', alias: ['HASS PERU'] },
  { nombre: 'BERRY HARVEST SA', alias: ['BERRY HARVEST'] },
  { nombre: 'CORP AGRICOLA OLMOS', alias: ['CORP AGRICOLA OLMOS', 'CORPORACION AGRICOLA OLMOS', 'AGRÍCOLA OLMOS', 'AGRICOLA OLMOS'] }
];

const normalizarEmpresa = (nombre: string): string =>
  (nombre ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(S\.A\.C\.?|S\.A\.?|S\.R\.L\.?|S\.A\.C\.I\.?|E\.I\.R\.L\.?)\.?$/g, '')
    .trim();

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
    { titulo: 'TOTAL ÍTEMS',      subtitulo: 'REQS. COMPRA',      valor: 0, cambio: 0, labelCambio: 'Ítems de compra del período', cargando: true, icono: 'bx bx-package',        color: '#0ea5e9' },
    { titulo: 'ÍTEMS CON OC',     subtitulo: '',                  valor: 0, cambio: 0, labelCambio: 'Ítems asignados a orden de compra', cargando: true, icono: 'bx bx-check-square',   color: '#10b981' },
    { titulo: 'ÍTEMS PENDIENTES', subtitulo: 'DE ATENCIÓN',       valor: 0, cambio: 0, labelCambio: 'Ítems sin orden de compra',  cargando: true, icono: 'bx bx-loader-circle',  color: '#f97316' },
  ];

  private readonly tablaConfigs: TablaKpiConfig[] = [
    { tipo: 'items-todos',       titulo: 'Total Ítems del Período',           color: '#0ea5e9', icono: 'bx bx-package'        },
    { tipo: 'items-atendidos',   titulo: 'Ítems con Orden de Compra',         color: '#10b981', icono: 'bx bx-check-square'   },
    { tipo: 'items-por-atender', titulo: 'Ítems Pendientes de Atención',      color: '#f97316', icono: 'bx bx-loader-circle'  },
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
        this.empresas = lista
          .map(e => ({ e, nombre: normalizarEmpresa(e.razonSocial ?? '') }))
          .filter(({ e, nombre }) => {
            if (e.activo === false) return false;
            return EMPRESAS_PERMITIDAS.some(p =>
              p.alias.some(a => nombre.includes(normalizarEmpresa(a)))
            );
          })
          .sort((a, b) => {
            const idxA = EMPRESAS_PERMITIDAS.findIndex(p =>
              p.alias.some(alias => a.nombre.includes(normalizarEmpresa(alias)))
            );
            const idxB = EMPRESAS_PERMITIDAS.findIndex(p =>
              p.alias.some(alias => b.nombre.includes(normalizarEmpresa(alias)))
            );
            return idxA - idxB;
          })
          .map(({ e }) => e);
        this.rucActivo = null;
        this.empresaCargando = false;
        this.cargarKpis();
        this.cdr.markForCheck();
      },
      error: () => {
        this.rucActivo = null;
        this.empresaCargando = false;
        this.cargarKpis();
        this.cdr.markForCheck();
      }
    });
  }

  seleccionarEmpresa(ruc: string | null) {
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
          this.kpis[0]  = { ...this.kpis[0],  valor: data.totalItems            ?? 0, cambio: data.cambioTotalItems            ?? 0, cargando: false };
          this.kpis[1]  = { ...this.kpis[1],  valor: data.itemsConOC            ?? 0, cambio: data.cambioItemsConOC            ?? 0, cargando: false };
          this.kpis[2]  = { ...this.kpis[2],  valor: data.itemsPendientesAtencion ?? 0, cambio: data.cambioItemsPendientesAtencion ?? 0, cargando: false };
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
