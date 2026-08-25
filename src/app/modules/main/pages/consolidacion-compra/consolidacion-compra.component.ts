import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { environment } from '@/environments/environment';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { OrdenPdfService } from '@/app/modules/main/pages/consolidacion-compras/orden-pdf.service';
import { TipoCambioService } from '@/app/services/tipo-cambio.service';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

interface Proveedor {
  id: string;
  nombre: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  monedaPago?: string;
  tipoPago?: string;
  formaPago?: string;
  diasEntrega?: number;
}
interface LineaReq {
  id: number;
  req: string;
  area: string;
  solicitante: string;
  fecha: string;
  empresa: string;
  cod: string;
  desc: string;
  um: string;
  lineaCodigo: string;
  linea: string;
  familiaCodigo: string;
  familia: string;
  subfamiliaCodigo: string;
  subfamilia: string;
  cantidad: number;
  cantidadPendiente: number;
  ultimaOC: number;
  afectoIGV?: boolean;
  ruc: string;
  razonSocial: string;
  ceco: string;
  proyecto: string;
  almacen: string;
  idDetalle: number;
  idrequerimiento: number;
  IdConsolidacion?: number;
  codigoConsolidacion?: string;
  estadoConsolidacion?: string;
  estadoProceso?: string;
}
interface GrupoCorp { key: string; cod: string; desc: string; um: string; linea: string; familia: string; subfamilia: string; HP: number; BH: number; CAO: number; ultimaOC: number; ids: number[]; }
interface GrupoReq { req: string; empresa: string; area: string; solicitante: string; fecha: string; detalles: LineaReq[]; expandido: boolean; }
interface EmitirEmpresa {
  emp: string;
  items: (LineaReq & { precio: number })[];
  subtotal: number;
  igv: number;
  total: number;
  almacen: string;
  rucEmpresa: string;
  idempresa: string;
}

@Component({
  selector: 'app-consolidacion-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, PaginatorModule, CheckboxModule, AutoCompleteModule, SelectModule],
  templateUrl: './consolidacion-compra.component.html',
  styleUrls: ['./consolidacion-compra.component.scss']
})
export class ConsolidacionCompraComponent implements OnInit {
  private baseUrl = environment.baseUrl;
  private usuario: Usuario | null = null;

  // Signals de carga
  cargandoReqs = signal(false);
  cargandoReqsCompletos = signal(false);
  cargandoEmpresas = signal(false);
  cargandoProveedores = signal(false);
  cargandoItemsMaestra = signal(false);
  guardandoOC = signal(false);
  cargandoOCs = signal(false);

  // Datos reales
  empresas = signal<any[]>([]);
  ordenesCompra = signal<any[]>([]);
  currentOCTab: 'TODOS' | 'PENDIENTES' | 'APROBADAS' | 'CERRADAS' = 'TODOS';
  ocTabStates: Record<'TODOS' | 'PENDIENTES' | 'APROBADAS' | 'CERRADAS', string[]> = {
    TODOS: [],
    PENDIENTES: ['PENDIENTE', 'PENDIENTE_APROBACION'],
    APROBADAS: ['APROBADA'],
    CERRADAS: ['ENVIADA', 'ANULADA']
  };
  filtroEmpresaOC = '';
  filtroNumeroOC = '';
  filtroProveedorOC = '';
  proveedores = signal<Proveedor[]>([]);
  itemsMaestra = signal<any[]>([]);
  requerimientosCompletos = signal<any[]>([]);
  datos: LineaReq[] = [];

  empNombres: Record<string, string> = { HP: 'Hass Peru S.A.', BH: 'Berry Harvest S.A.', CAO: 'Corp Agricola Olmos S.A.' };
  // idempresa de 6 dígitos y RUC de 8 dígitos para SPRING
  idEmpresaPorCodigo: Record<string, string> = { HP: '000008', BH: '000006', CAO: '000010' };
  rucEmpresaPorCodigo: Record<string, string> = { HP: '00000800', BH: '00000600', CAO: '00001000' };
  codigoEmpresaPorIdempresa: Record<string, string> = { '000008': 'HP', '000006': 'BH', '000010': 'CAO', '8': 'HP', '6': 'BH', '10': 'CAO' };
  empCodigoPorRuc: Record<string, string> = {};

  seleccionados = new Set<number>();
  costosProveedor: Record<number, string> = {};
  proveedorPorItem: Record<number, string> = {};
  afectoIGVPorItem: Record<number, boolean> = {};
  seleccionadosCorp = new Set<string>();
  currentTab = 'TODOS';
  private aplicarFiltrosTimeout: any = null;
  proveedorGlobal: Proveedor | null = null;
  proveedorGlobalInput: string = '';
  proveedoresSugeridos: Proveedor[] = [];
  expandedRows: Record<string, boolean> = {};

  filtroItem = '';
  filtroLinea = '';
  filtroFamilia = '';
  filtroSubfamilia = '';
  filtroBuscar = '';

  itemsUnicos: string[] = [];
  lineasUnicas: string[] = [];
  familiasUnicas: string[] = [];
  subfamiliasUnicas: string[] = [];

  cntTODOS = 0;
  cntHP = 0;
  cntBH = 0;
  cntCAO = 0;
  cntCORP = 0;

  todosGrupos: GrupoReq[] = [];
  empresasRows: Record<string, LineaReq[]> = { HP: [], BH: [], CAO: [] };
  empresasTotal: Record<string, number> = { HP: 0, BH: 0, CAO: 0 };
  corpGrupos: GrupoCorp[] = [];
  totalCorp = 0;

  modalOCAbierto = false;
  modalDetalleOCAbierto = false;
  modalAdjuntosOCAbierto = false;
  editandoDetalleOC = false;
  ordenActual: any = null;
  adjuntosOC: any[] = [];
  archivoAdjuntoOC: File | null = null;
  descripcionAdjuntoOC = '';
  subiendoAdjuntoOC = false;
  ocFormEdicion: any = {};
  ocIdEdicion: number | null = null;
  busquedaProveedor = '';
  proveedoresSugeridosEdicion: any[] = [];
  cargandoProveedoresEdicion = false;
  mostrarSugerenciasProveedor = false;
  proveedorSeleccionadoEdicion: any = null;
  formasPago: any[] = [];
  tiposPago: any[] = [];
  almacenes: any[] = [];
  almacenesOC: any[] = [];
  almacenesPorEmpresa: Map<string, any[]> = new Map();
  ocProv = '';
  ocRuc = '';
  ocCondPago = 'Contado';
  ocFormaPago = 'Transferencia';
  ocPlazo = 7;
  ocMoneda = 'PEN';
  ocMonedaAnterior = 'PEN';
  ocLugar = 'Almacén central Grupo Hass';
  ocFechaEntrega = '';
  ocObs = '';
  tipoCambioOC = 1;
  emitirOCEmpresas: EmitirEmpresa[] = [];

  // Cotización OC multiempresa
  cotizacionActiva: any = null;
  cotizacionesPendientes: any[] = [];
  mostrarPanelCotizaciones = false;
  cargandoCotizaciones = false;
  cotizacionVer: any = null;

  toasts: { msg: string; type: string }[] = [];

  constructor(
    private http: HttpClient,
    private dexieService: DexieService,
    private maestrasService: MaestrasService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
    private pdfService: OrdenPdfService,
    private tipoCambioService: TipoCambioService
  ) { }

  async ngOnInit(): Promise<void> {
    console.log('[ConsolidacionCompra] ngOnInit');
    this.usuario = (await this.dexieService.obtenerPrimerUsuario()) ?? null;
    console.log('[ConsolidacionCompra] usuario:', this.usuario?.ruc, this.usuario?.idrol);
    // Carga crítica de las tablas primero para mostrar el módulo rápido
    await this.cargarRequerimientosCompletos();
    await this.cargarRequerimientos();
    this.cargarCotizacionesOC();
    // Catálogos en segundo plano (no bloquean la UI inicial)
    this.cargarEmpresas();
    this.cargarItemsMaestra();
    Promise.all([
      this.cargarFormasPago(),
      this.cargarTiposPago(),
      this.cargarAlmacenes()
    ]);
  }

  async cargarEmpresas(): Promise<void> {
    this.cargandoEmpresas.set(true);
    try {
      const resp: any = await this.maestrasService.getEmpresas([]);
      console.log('[ConsolidacionCompra] resp empresas:', resp);
      const lista = Array.isArray(resp) ? resp : [];
      this.empresas.set(lista);
      this.empCodigoPorRuc = {};
      for (const e of lista) {
        const ruc = String(e.ruc ?? '').trim();
        const razon = String(e.razonsocial ?? e.razonSocial ?? e.nombre ?? '').toLowerCase().trim();
        if (!ruc) continue;
        // Mapeo por RUC conocido primero, luego por razón social
        this.empCodigoPorRuc[ruc] = this.codigoEmpresaPorRucDirecto(ruc)
          || (razon.includes('hass') ? 'HP' : razon.includes('berry') ? 'BH' : razon.includes('olmos') ? 'CAO' : undefined)
          || this.empCodigoPorRuc[ruc];
      }
    } catch (err) {
      console.error('[ConsolidacionCompra] error cargarEmpresas:', err);
      this.empresas.set([]);
      this.empCodigoPorRuc = {};
    } finally {
      this.cargandoEmpresas.set(false);
    }
  }

  private codigoEmpresaPorRucDirecto(ruc: string): string | undefined {
    const key = String(ruc ?? '').trim();
    if (key === '20481121966' || key === '00000800' || key === '000008') return 'HP';        // Hass Peru S.A.
    if (key === '20610773274' || key === '00000600' || key === '000006') return 'BH';        // Berry Harvest S.A.
    if (key === '20563196387' || key === '00001000' || key === '000010') return 'CAO';       // Corp Agricola Olmos
    return undefined;
  }

  codigoEmpresaPorRuc(ruc: string, razonSocial?: string): string {
    const key = String(ruc ?? '').trim();
    const razon = String(razonSocial ?? '').trim();
    // Priorizar RUC sobre razón social: el RUC es más confiable
    // que el nombre, que puede estar truncado o repetido entre empresas.
    return this.empCodigoPorRuc[key]
      || this.codigoEmpresaPorRucDirecto(key)
      || this.empresaPorRazonSocial(razon)
      || 'HP';
  }

  buscarEmpresaPorCodigo(codigo: string): any {
    const cod = String(codigo ?? '').toUpperCase();
    return this.empresas().find(e => {
      const razon = String(e.razonSocial ?? e.nombre ?? '').toLowerCase();
      const ruc = String(e.ruc ?? '').trim();
      return (cod === 'HP' && (razon.includes('hass') || ruc === '20481121966' || ruc === '00000800')) ||
             (cod === 'BH' && (razon.includes('berry') || ruc === '20610773274' || ruc === '00000600')) ||
             (cod === 'CAO' && (razon.includes('olmos') || ruc === '20563196387' || ruc === '00001000'));
    });
  }

  nombreEmpresaPorRuc(ruc: string, razonSocial?: string): string {
    const key = String(ruc ?? '').trim();
    const razon = String(razonSocial ?? '').trim();
    const emp = this.empresas().find(e => String(e.ruc ?? '').trim() === key);
    if (emp?.razonSocial || emp?.nombre) {
      return String(emp.razonSocial ?? emp.nombre).trim();
    }
    return razon || this.empNombres[this.codigoEmpresaPorRuc(key, razon)] || key || '—';
  }

  detallePorRequerimiento(req: any): LineaReq[] {
    const numero = String(req?.numeroRequerimiento ?? '');
    const idreq = req?.idrequerimiento ?? 0;
    if (!numero && !idreq) return [];
    return this.datos.filter(d =>
      (numero && String(d.req ?? '') === numero) ||
      (idreq && d.idrequerimiento === idreq)
    );
  }

  toggleRowExpansion(req: any): void {
    const key = String(req?.numeroRequerimiento ?? '');
    if (!key) return;
    this.expandedRows[key] = !this.expandedRows[key];
  }

  async cargarItemsMaestra(): Promise<void> {
    this.cargandoItemsMaestra.set(true);
    try {
      const resp: any = await lastValueFrom(this.http.post(`${this.baseUrl}/api/logistica/listar-item`, {}));
      const raw = Array.isArray(resp) ? resp : (resp?.id ? JSON.parse(resp.id) : []);
      this.itemsMaestra.set(raw);
      console.log('[ConsolidacionCompra] items maestra cargados:', raw.length);
    } catch (err) {
      console.error('[ConsolidacionCompra] error cargarItemsMaestra:', err);
      this.itemsMaestra.set([]);
    } finally {
      this.cargandoItemsMaestra.set(false);
    }
  }

  public esAfectoIGV(cod: string): boolean {
    const items = this.itemsMaestra();
    if (!items.length) return true;
    const item = items.find((i: any) => String(i.item ?? i.codigo ?? '').trim() === String(cod).trim());
    return String(item?.afectoImpuestoVentasFlag ?? '').toUpperCase() === 'S';
  }

  public obtenerAfectoIGV(r: any): boolean {
    return r.afectoIGV ?? this.afectoIGVPorItem[r.id] ?? this.esAfectoIGV(r.cod);
  }

  async cargarProveedores(): Promise<void> {
    this.cargandoProveedores.set(true);
    try {
      const body = {
        ruc: this.usuario?.ruc,
        busqueda: '',
        estado: 'ACTIVO'
      };
      console.log('[ConsolidacionCompra] cargarProveedores body:', body);
      const resp: any = await lastValueFrom(
        this.maestrasService.getProveedores(body)
      );
      console.log('[ConsolidacionCompra] resp proveedores:', resp);
      const lista = Array.isArray(resp) ? resp : [];
      this.proveedores.set(lista.map((p: any) => {
        const ruc11 = [
          p.rucproveedor, p.RucProveedor, p.Ruc, p.RUC, p.NUMRUC, p.NumeroRuc, p.numeroRuc,
          p.NumeroDocumento, p.numeroDocumento, p.Documento, p.documento
        ].map(v => String(v ?? '').trim()).find(v => /^\d{11}$/.test(v));
        const ruc = ruc11 || String(p.ruc ?? p.Ruc ?? p.RUC ?? p.documento ?? '').trim();
        return {
          id: String(p.idproveedor ?? p.id ?? p.codigo ?? p.ruc ?? ''),
          nombre: String(p.proveedor ?? p.nombre ?? p.razonSocial ?? p.RazonSocial ?? p.nombreProveedor ?? ''),
          ruc,
          direccion: String(p.Direccion ?? p.direccion ?? p.direccionProveedor ?? ''),
          telefono: String(p.Telefono ?? p.telefono ?? ''),
          email: String(p.Email ?? p.email ?? p.correo ?? ''),
          monedaPago: String(p.MonedaPago ?? p.monedaPago ?? '').toUpperCase(),
          tipoPago: String(p.TipoPago ?? p.tipoPago ?? '').toUpperCase(),
          formaPago: String(p.FormadePago ?? p.formadePago ?? p.formaPago ?? ''),
          diasEntrega: parseInt(p.NumeroDiasEntrega ?? p.numeroDiasEntrega ?? p.DiasEntrega ?? p.diasEntrega ?? '7', 10) || 7
        };
      }));
    } catch (err) {
      console.error('[ConsolidacionCompra] error cargarProveedores:', err);
      this.proveedores.set([]);
    } finally {
      this.cargandoProveedores.set(false);
    }
  }

  async cargarRequerimientosCompletos(): Promise<void> {
    console.log('[ConsolidacionCompra] cargarRequerimientosCompletos inicio');
    this.cargandoReqsCompletos.set(true);
    try {
      const roles = (this.usuario?.idrol ?? this.usuario?.rol ?? '').toString();
      const esAdmin = ['TILOGIST', 'ADLOGIST', 'JLOLOGIST', 'JEMLOGIST', 'LOLOGIST'].some(r => roles.includes(r));
      const body = {
        ruc: esAdmin ? '' : (this.usuario?.ruc ?? ''),
        busqueda: '',
        soloSinOC: true
      };
      console.log('[ConsolidacionCompra] body completos:', body);
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-requerimientos-completos`, body)
      );
      console.log('[ConsolidacionCompra] resp completos:', resp);
      const items = Array.isArray(resp) ? resp : [];
      this.requerimientosCompletos.set(items);
      this.cntTODOS = items.length;
      this.cdr.markForCheck();
    } catch (err) {
      console.error('[ConsolidacionCompra] error cargarRequerimientosCompletos:', err);
      this.requerimientosCompletos.set([]);
      this.cntTODOS = 0;
    } finally {
      this.cargandoReqsCompletos.set(false);
    }
  }

  async cargarRequerimientos(): Promise<void> {
    console.log('[ConsolidacionCompra] cargarRequerimientos inicio');
    this.cargandoReqs.set(true);
    try {
      const roles = (this.usuario?.idrol ?? this.usuario?.rol ?? '').toString();
      const esAdmin = ['TILOGIST', 'ADLOGIST', 'JLOLOGIST', 'JEMLOGIST', 'LOLOGIST'].some(r => roles.includes(r));
      const body = {
        ruc: esAdmin ? '' : (this.usuario?.ruc ?? ''),
        busqueda: '',
        soloSinOC: true
      };
      console.log('[ConsolidacionCompra] body para-oc:', body);
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-requerimientos-para-oc`, body)
      );
      console.log('[ConsolidacionCompra] resp para-oc:', resp);
      const items = Array.isArray(resp) ? resp : [];
      this.datos = this.mapearRequerimientos(items);
      this.llenarFiltros();
      this.aplicarFiltros();
      this.alertService.showAlert('Requerimientos cargados', `Se cargaron ${this.datos.length} ítems aprobados.`, 'success');
      this.cdr.markForCheck();
    } catch (err) {
      console.error('[ConsolidacionCompra] error cargarRequerimientos:', err);
      this.datos = [];
      this.llenarFiltros();
      this.aplicarFiltros();
      this.alertService.showAlert('Error', 'No se pudieron cargar los requerimientos aprobados.', 'error');
      this.cdr.markForCheck();
    } finally {
      this.cargandoReqs.set(false);
    }
  }

  mapearRequerimientos(items: any[]): LineaReq[] {
    const mapped = items.map((item, idx) => {
      const ruc = String(item.ruc ?? '').trim();
      const razon = String(item.razonSocial ?? '').trim();
      // Priorizar RUC conocido, luego razonSocial del API y cache de empresas
      const empresa = this.codigoEmpresaPorRucDirecto(ruc)
        || this.empresaPorRazonSocial(razon)
        || this.empCodigoPorRuc[ruc]
        || 'HP';
      return {
        id: item.idDetalle ?? idx + 1,
        idDetalle: item.idDetalle ?? idx + 1,
        idrequerimiento: item.idrequerimiento ?? 0,
        req: item.numeroRequerimiento ?? item.idrequerimiento ?? '',
        area: item.area ?? item.idarea ?? '',
        solicitante: item.usuarioCreador ?? '',
        fecha: this.formatearFecha(item.fechaRequerimiento),
        empresa,
        ruc,
        razonSocial: razon,
        cod: item.codigo ?? '',
        desc: item.descripcion ?? '',
        um: item.unidadMedida ?? 'UND',
        lineaCodigo: item.lineaCodigo || '',
        linea: item.linea || '',
        familiaCodigo: item.familiaCodigo || '',
        familia: item.familia || '',
        subfamiliaCodigo: item.subfamiliaCodigo || '',
        subfamilia: item.subfamilia || '',
        cantidad: item.cantidad ?? 0,
        cantidadPendiente: item.cantidadPendiente ?? item.cantidad ?? 0,
        ultimaOC: item.ultimaOC ?? 0,
        ceco: item.ceco ?? '',
        proyecto: item.proyecto ?? '',
        almacen: item.almacen ?? '',
        IdConsolidacion: item.IdConsolidacion,
        codigoConsolidacion: item.codigoConsolidacion,
        estadoConsolidacion: item.estadoConsolidacion,
        estadoProceso: item.estadoProceso
      };
    });
    console.log('[ConsolidacionCompra] mapearRequerimientos:', mapped.length, 'items. Muestra:', mapped.slice(0, 3).map(m => ({ ruc: m.ruc, razonSocial: m.razonSocial, empresa: m.empresa })));
    return mapped;
  }

  empresaPorRazonSocial(razon: string): string | undefined {
    const razonLower = razon.toLowerCase();
    if (razonLower.includes('hass')) return 'HP';
    if (razonLower.includes('berry')) return 'BH';
    if (razonLower.includes('olmos')) return 'CAO';
    return undefined;
  }

  formatearFecha(fecha: string | Date | undefined): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return String(fecha).slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  // [generarDatos eliminado — ahora se usa datos reales del API]

  llenarFiltros(): void {
    this.itemsUnicos = [...new Set(this.datos.map(d => d.cod))].sort();
    this.lineasUnicas = [...new Set(this.datos.map(d => d.linea))].sort();
    this.familiasUnicas = [...new Set(this.datos.map(d => d.familia))].sort();
    this.subfamiliasUnicas = [...new Set(this.datos.map(d => d.subfamilia))].sort();
  }

  aplicarFiltros(): void {
    if (this.aplicarFiltrosTimeout) clearTimeout(this.aplicarFiltrosTimeout);
    this.aplicarFiltrosTimeout = setTimeout(() => {
      this.aplicarFiltrosInterno();
    }, 120);
  }

  private aplicarFiltrosInterno(): void {
    const fBuscar = this.filtroBuscar.toLowerCase();
    const filtrados = this.datos.filter(d => {
      return (!this.filtroItem || d.cod === this.filtroItem) &&
             (!this.filtroLinea || d.linea === this.filtroLinea) &&
             (!this.filtroFamilia || d.familia === this.filtroFamilia) &&
             (!this.filtroSubfamilia || d.subfamilia === this.filtroSubfamilia) &&
             (!fBuscar || d.cod.toLowerCase().includes(fBuscar) || d.desc.toLowerCase().includes(fBuscar));
    });

    this.renderEmpresa('HP', filtrados.filter(d => d.empresa === 'HP'));
    this.renderEmpresa('BH', filtrados.filter(d => d.empresa === 'BH'));
    this.renderEmpresa('CAO', filtrados.filter(d => d.empresa === 'CAO'));
    this.renderCorporativo(filtrados);
    console.log('[ConsolidacionCompra] aplicarFiltros - total:', filtrados.length, 'HP:', this.cntHP, 'BH:', this.cntBH, 'CAO:', this.cntCAO);
  }

  renderTodos(rows: LineaReq[]): void {
    if (!rows.length) {
      this.todosGrupos = [];
      return;
    }
    const mapa = new Map<string, GrupoReq>();
    rows.forEach(r => {
      const key = r.req + '|' + r.empresa;
      if (!mapa.has(key)) {
        mapa.set(key, { req: r.req, empresa: r.empresa, area: r.area, solicitante: r.solicitante, fecha: r.fecha, detalles: [], expandido: false });
      }
      mapa.get(key)!.detalles.push(r);
    });
    this.todosGrupos = Array.from(mapa.values()).sort((a, b) => a.req.localeCompare(b.req) || a.empresa.localeCompare(b.empresa));
  }

  renderEmpresa(emp: string, rows: LineaReq[]): void {
    this.cntHP = this.datos.filter(d => d.empresa === 'HP').length;
    this.cntBH = this.datos.filter(d => d.empresa === 'BH').length;
    this.cntCAO = this.datos.filter(d => d.empresa === 'CAO').length;
    this.empresasRows[emp] = rows;
    let total = 0;
    rows.forEach(r => {
      const costoProv = this.costosProveedor[r.id] || '';
      const subtotal = this.seleccionados.has(r.id) ? (costoProv ? r.cantidad * parseFloat(costoProv) : 0) : 0;
      total += subtotal;
    });
    this.empresasTotal[emp] = total;
  }

  private corpKey(r: LineaReq): string {
    return [r.cod, r.linea, r.familia, r.subfamilia].join('|');
  }

  renderCorporativo(rows: LineaReq[]): void {
    const map = new Map<string, GrupoCorp>();
    rows.forEach(r => {
      const key = this.corpKey(r);
      if (!map.has(key)) {
        map.set(key, { key, cod: r.cod, desc: r.desc, um: r.um, linea: r.linea, familia: r.familia, subfamilia: r.subfamilia, HP: 0, BH: 0, CAO: 0, ultimaOC: r.ultimaOC, ids: [] });
      }
      const g = map.get(key)!;
      (g as any)[r.empresa] += r.cantidad;
      g.ids.push(r.id);
    });
    this.corpGrupos = Array.from(map.values());
    this.cntCORP = this.corpGrupos.length;
    let total = 0;
    this.corpGrupos.forEach(g => {
      const totalCant = g.HP + g.BH + g.CAO;
      const precio = g.ids.map(id => this.costosProveedor[id]).find(v => v !== undefined && v !== null && v !== '') || '';
      total += (parseFloat(precio) || 0) * totalCant;
    });
    this.totalCorp = total;
  }

  proveedorTexto(ids: number[]): string {
    const provs = [...new Set(ids.map(id => this.proveedorPorItem[id]).filter(Boolean))];
    if (provs.length === 1) return provs[0] || '—';
    return provs.length > 1 ? 'Varios' : '—';
  }

  switchTab(emp: string): void {
    this.currentTab = emp;
    if (emp === 'OC') {
      this.cargarOrdenesCompra();
    }
  }

  async cargarOrdenesCompra(): Promise<void> {
    this.cargandoOCs.set(true);
    try {
      const body = {
        estado: '',
        usuario: this.usuario?.documentoidentidad || ''
      };
      console.log('[ConsolidacionCompra] cargarOrdenesCompra body:', body);
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-ocs-por-estado`, body)
      );
      const ocs = Array.isArray(resp) ? resp : [];
      console.log('[ConsolidacionCompra] resp OC:', ocs);
      this.ordenesCompra.set(ocs);
      this.cdr.markForCheck();
    } catch (err) {
      console.error('[ConsolidacionCompra] error cargarOrdenesCompra:', err);
      this.ordenesCompra.set([]);
      this.alertService.showAlert('Error', 'No se pudieron cargar las órdenes de compra.', 'error');
      this.cdr.markForCheck();
    } finally {
      this.cargandoOCs.set(false);
    }
  }

  empresaOC(oc: any): string {
    const idempresa = String(oc?.idempresa ?? '').trim();
    if (idempresa && this.codigoEmpresaPorIdempresa[idempresa]) {
      return this.codigoEmpresaPorIdempresa[idempresa];
    }
    const ruc = String(oc?.rucEmpresa ?? oc?.rucProveedor ?? '').trim();
    const razon = String(oc?.razonSocialEmpresa ?? oc?.razonSocialProveedor ?? '').trim();
    return this.codigoEmpresaPorRuc(ruc, razon);
  }

  ordenesCompraFiltradas(): any[] {
    return this.ordenesCompra().filter(oc => {
      const emp = this.empresaOC(oc);
      const matchEmp = !this.filtroEmpresaOC || this.filtroEmpresaOC === 'TODAS' || emp === this.filtroEmpresaOC;
      const num = String(oc?.numeroOrden ?? oc?.numeroOrdenSpring ?? '').toLowerCase();
      const matchNum = !this.filtroNumeroOC || num.includes(this.filtroNumeroOC.toLowerCase());
      const prov = String(oc?.nombreProveedor ?? '').toLowerCase();
      const matchProv = !this.filtroProveedorOC || prov.includes(this.filtroProveedorOC.toLowerCase());
      const estados = this.ocTabStates[this.currentOCTab];
      const matchEstado = !estados?.length || estados.includes(oc?.estado);
      return matchEmp && matchNum && matchProv && matchEstado;
    });
  }

  contarOCTab(tab: 'TODOS' | 'PENDIENTES' | 'APROBADAS' | 'CERRADAS'): number {
    const estados = this.ocTabStates[tab];
    if (!estados?.length) return this.ordenesCompra().length;
    return this.ordenesCompra().filter(oc => estados.includes(oc?.estado)).length;
  }

  cambiarOCTab(tab: 'TODOS' | 'PENDIENTES' | 'APROBADAS' | 'CERRADAS'): void {
    this.currentOCTab = tab;
    this.aplicarFiltrosOC();
  }

  aplicarFiltrosOC(): void {
    this.cdr.markForCheck();
  }

  async verDetalleOC(oc: any): Promise<void> {
    this.ordenActual = oc;
    this.editandoDetalleOC = false;
    this.ocFormEdicion = {};
    await this.cargarAdjuntosOC(oc.idOrden, 'OC');
    this.modalDetalleOCAbierto = true;
    this.cdr.markForCheck();
  }

  async iniciarEdicionDetalleOC(): Promise<void> {
    if (!this.ordenActual) return;
    this.editandoDetalleOC = true;
    this.ocIdEdicion = this.ordenActual.idOrden;
    try {
      await Promise.all([this.cargarFormasPago(), this.cargarTiposPago(), this.cargarAlmacenes()]);
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/obtener-detalle-oc`, { idOrden: this.ordenActual.idOrden })
      );
      if (!resp || resp.error) {
        this.alertService.showAlert('Error', resp?.error || 'No se pudo cargar la OC.', 'error');
        this.editandoDetalleOC = false;
        this.ocIdEdicion = null;
        return;
      }
      const items = Array.isArray(resp.itemsJson)
        ? resp.itemsJson
        : (resp.itemsJson ? JSON.parse(resp.itemsJson) : []);
      this.ocFormEdicion = {
        rucProveedor: resp.rucProveedor || this.ordenActual.rucProveedor || '',
        nombreProveedor: resp.nombreProveedor || this.ordenActual.nombreProveedor || '',
        emailProveedor: resp.emailProveedor || '',
        telefonoProveedor: resp.telefonoProveedor || '',
        direccionProveedor: resp.direccionProveedor || '',
        moneda: resp.moneda || this.ordenActual.moneda || 'PEN',
        tipoCambio: resp.tipoCambio || 1,
        fechaEntregaEstimada: resp.fechaEntregaEstimada ? resp.fechaEntregaEstimada.substring(0, 10) : '',
        diasEntrega: 0,
        condicionesPago: resp.condicionesPago || '',
        formaPago: resp.formaPago || '',
        almacen: resp.almacen || '',
        rucEmpresaOC: resp.rucEmpresa || this.ordenActual.rucEmpresa || '',
        lugarEntrega: resp.lugarEntrega || '',
        observaciones: resp.observaciones || '',
        clasificacion: resp.clasificacion || 'LOC',
        incoterm: resp.incoterm || '',
        items: items.map((i: any) => ({
          idDetalle: i.idDetalle,
          codigo: i.codigo,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          unidadMedida: i.unidadMedida,
          precioUnitario: i.precioUnitario,
          reduccion: i.reduccion || 0,
          descuento: i.descuento || 0,
          ceco: i.ceco,
          proyecto: i.proyecto,
          idConsolidacion: i.idConsolidacion
        })),
        subtotal: resp.subtotal || 0,
        igv: resp.igv || 0,
        totalOrden: resp.totalOrden || 0,
        totalDescuento: 0
      };
      if (this.ocFormEdicion.rucEmpresaOC) {
        await this.cargarAlmacenesPorRuc(this.ocFormEdicion.rucEmpresaOC);
      }
      this.proveedorSeleccionadoEdicion = {
        ruc: this.ocFormEdicion.rucProveedor,
        proveedor: this.ocFormEdicion.nombreProveedor
      };
      this.busquedaProveedor = this.ocFormEdicion.nombreProveedor;
      this.calcularTotalesOC();
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error al cargar detalle.', 'error');
      this.editandoDetalleOC = false;
      this.ocIdEdicion = null;
    }
    this.cdr.markForCheck();
  }

  async cargarFormasPago(): Promise<void> {
    try {
      const resp: any = await lastValueFrom(this.maestrasService.getFormasPago({ ruc: this.usuario?.ruc }));
      this.formasPago = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
    } catch { this.formasPago = []; }
  }

  async cargarTiposPago(): Promise<void> {
    try {
      const resp: any = await lastValueFrom(this.maestrasService.getTiposPago({ ruc: this.usuario?.ruc }));
      this.tiposPago = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
    } catch { this.tiposPago = []; }
  }

  async cargarAlmacenes(): Promise<void> {
    try {
      const resp: any = await lastValueFrom(
        this.maestrasService.getAlmacenes([{ ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' }])
      );
      this.almacenes = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
    } catch { this.almacenes = []; }
  }

  async cargarAlmacenesPorRuc(ruc: string): Promise<void> {
    const key = String(ruc ?? '').trim();
    if (!key || this.almacenesPorEmpresa.has(key)) return;
    try {
      const resp: any = await lastValueFrom(
        this.maestrasService.getAlmacenes([{ ruc: key, aplicacion: 'LOGISTICA' }])
      );
      const lista = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
      console.log('[cargarAlmacenesPorRuc] ruc:', key, 'resp:', resp, 'lista:', lista.length);
      this.almacenesPorEmpresa.set(key, lista);
      this.cdr.markForCheck();
    } catch (e: any) {
      console.error('[cargarAlmacenesPorRuc] error ruc:', key, e);
      this.almacenesPorEmpresa.set(key, []);
    }
  }

  simboloMoneda(moneda: string): string {
    return moneda === 'USD' ? '$' : 'S/';
  }

  subtotalItem(item: any): number {
    const cantidad = +item.cantidad || 0;
    const precio = +item.precioUnitario || 0;
    const reduccion = +item.reduccion || 0;
    const descuento = +item.descuento || 0;
    let base = cantidad * precio - reduccion;
    if (descuento > 0) base = base * (1 - descuento / 100);
    return base > 0 ? base : 0;
  }

  onReduccionChange(item: any): void {
    if (+item.reduccion > 0) item.descuento = 0;
    this.calcularTotalesOC();
  }

  onDescuentoChange(item: any): void {
    if (+item.descuento > 0) item.reduccion = 0;
    this.calcularTotalesOC();
  }

  calcularTotalesOC(): void {
    if (!this.ocFormEdicion.items) return;
    let subtotal = 0;
    let totalDescuento = 0;
    this.ocFormEdicion.items.forEach((item: any) => {
      const cantidad = +item.cantidad || 0;
      const precio = +item.precioUnitario || 0;
      const reduccion = +item.reduccion || 0;
      const descuento = +item.descuento || 0;
      const baseBruto = cantidad * precio;
      let baseItem = baseBruto - reduccion;
      if (descuento > 0) {
        const desc = baseItem * (descuento / 100);
        baseItem -= desc;
        totalDescuento += reduccion + desc;
      } else {
        totalDescuento += reduccion;
      }
      subtotal += baseItem > 0 ? baseItem : 0;
    });
    this.ocFormEdicion.subtotal = subtotal;
    this.ocFormEdicion.igv = subtotal * 0.18;
    this.ocFormEdicion.totalOrden = subtotal + this.ocFormEdicion.igv;
    this.ocFormEdicion.totalDescuento = totalDescuento;
    this.cdr.markForCheck();
  }

  calcularFechaEntrega(): void {
    const dias = +(this.ocFormEdicion.diasEntrega || 0);
    if (dias > 0) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + dias);
      this.ocFormEdicion.fechaEntregaEstimada = fecha.toISOString().substring(0, 10);
    }
  }

  buscarProveedoresEdicion(): void {
    const q = this.busquedaProveedor.trim();
    if (q.length < 3) {
      this.proveedoresSugeridosEdicion = [];
      return;
    }
    this.cargandoProveedoresEdicion = true;
    lastValueFrom(this.http.post(`${this.baseUrl}/api/logistica/buscar-proveedores`, { busqueda: q }))
      .then((resp: any) => {
        this.proveedoresSugeridosEdicion = Array.isArray(resp) ? resp : (resp.resultado || resp.data || []);
        this.mostrarSugerenciasProveedor = true;
        this.cargandoProveedoresEdicion = false;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.proveedoresSugeridosEdicion = [];
        this.cargandoProveedoresEdicion = false;
        this.cdr.markForCheck();
      });
  }

  cerrarSugerenciasProveedor(): void {
    setTimeout(() => {
      this.mostrarSugerenciasProveedor = false;
      this.cdr.markForCheck();
    }, 200);
  }

  seleccionarProveedorEdicion(prov: any): void {
    this.proveedorSeleccionadoEdicion = prov;
    this.ocFormEdicion.rucProveedor = prov.ruc || prov.documento || '';
    this.ocFormEdicion.nombreProveedor = prov.proveedor || prov.nombre || '';
    this.ocFormEdicion.emailProveedor = prov.email || '';
    this.ocFormEdicion.telefonoProveedor = prov.telefono || '';
    this.ocFormEdicion.direccionProveedor = prov.direccion || '';
    this.busquedaProveedor = prov.proveedor || prov.nombre || '';
    this.mostrarSugerenciasProveedor = false;
    this.cdr.markForCheck();
  }

  limpiarProveedorEdicion(): void {
    this.proveedorSeleccionadoEdicion = null;
    this.ocFormEdicion.rucProveedor = '';
    this.ocFormEdicion.nombreProveedor = '';
    this.ocFormEdicion.emailProveedor = '';
    this.ocFormEdicion.telefonoProveedor = '';
    this.ocFormEdicion.direccionProveedor = '';
    this.busquedaProveedor = '';
    this.cdr.markForCheck();
  }

  distribucionContableEdicion(): any[] {
    if (!this.ocFormEdicion.items) return [];
    const map = new Map<string, any>();
    const totalCantidad = this.ocFormEdicion.items.reduce((s: number, i: any) => s + (+i.cantidad || 0), 0) || 1;
    this.ocFormEdicion.items.forEach((it: any) => {
      const key = it.ceco || 'SIN CECO';
      if (!map.has(key)) {
        map.set(key, { area: it.ceco, ceco: it.ceco, proyecto: it.proyecto || '', cantidad: 0 });
      }
      map.get(key).cantidad += (+it.cantidad || 0);
    });
    return Array.from(map.values()).map(d => ({ ...d, porcentaje: (d.cantidad / totalCantidad) * 100 }));
  }

  async guardarEdicionDetalleOC(): Promise<void> {
    if (!this.ocFormEdicion.nombreProveedor || !this.ocFormEdicion.rucProveedor || !this.ocFormEdicion.emailProveedor) {
      this.alertService.showAlert('Atención', 'Complete los datos del proveedor (RUC, Nombre, Email).', 'warning');
      return;
    }
    if (!this.ocFormEdicion.lugarEntrega || !this.ocFormEdicion.fechaEntregaEstimada) {
      this.alertService.showAlert('Atención', 'Indique el lugar de entrega y la fecha estimada.', 'warning');
      return;
    }
    if (this.ocFormEdicion.items.some((i: any) => !i.precioUnitario || parseFloat(i.precioUnitario) <= 0)) {
      this.alertService.showAlert('Atención', 'Todos los ítems deben tener precio unitario mayor a 0.', 'warning');
      return;
    }
    this.guardandoOC.set(true);
    try {
      const payload = {
        ...this.ocFormEdicion,
        idOrden: this.ocIdEdicion,
        usuarioModifica: this.usuario?.documentoidentidad
      };
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/actualizar-oc-borrador`, payload)
      );
      if (resp?.success) {
        this.alertService.showAlert('OC Actualizada', 'La orden de compra fue actualizada correctamente.', 'success');
        this.editandoDetalleOC = false;
        this.ocFormEdicion = {};
        this.ocIdEdicion = null;
        this.proveedorSeleccionadoEdicion = null;
        this.busquedaProveedor = '';
        await this.cargarOrdenesCompra();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al actualizar.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error al actualizar.', 'error');
    } finally {
      this.guardandoOC.set(false);
      this.cdr.markForCheck();
    }
  }

  cancelarEdicionDetalleOC(): void {
    this.editandoDetalleOC = false;
    this.ocFormEdicion = {};
    this.ocIdEdicion = null;
    this.proveedorSeleccionadoEdicion = null;
    this.busquedaProveedor = '';
    this.cdr.markForCheck();
  }

  cerrarModalDetalleOC(): void {
    this.modalDetalleOCAbierto = false;
    this.ordenActual = null;
    this.adjuntosOC = [];
    this.editandoDetalleOC = false;
    this.ocFormEdicion = {};
    this.cdr.markForCheck();
  }

  private parseAdjuntosResponse(resp: any): any[] {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (resp.resultado && Array.isArray(resp.resultado)) return resp.resultado;
    if (resp.adjuntos && Array.isArray(resp.adjuntos)) return resp.adjuntos;
    if (typeof resp === 'object') {
      const keys = Object.keys(resp).filter(k => Array.isArray(resp[k]));
      if (keys.length) return resp[keys[0]];
    }
    return [];
  }

  async cargarAdjuntosOC(idOrden: number, tipo: string): Promise<void> {
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-adjuntos-oc`, { idOrden, tipoOrden: tipo })
      );
      this.adjuntosOC = this.parseAdjuntosResponse(resp);
    } catch {
      this.adjuntosOC = [];
    }
  }

  async enviarOCAprobacion(oc: any): Promise<void> {
    let skipAdjuntos = false;
    try {
      const idrol = this.usuario?.idrol || '';
      if (idrol) {
        const respPerm: any = await lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/verificar-permiso`, { idrol, clave: 'SKIP_ADJUNTOS_OC' })
        );
        skipAdjuntos = respPerm?.valor === '1';
      }
    } catch { skipAdjuntos = false; }

    if (!skipAdjuntos) {
      try {
        const respAdj: any = await lastValueFrom(
          this.http.post(`${this.baseUrl}/api/logistica/listar-adjuntos-oc`, { idOrden: oc.idOrden, tipoOrden: 'OC' })
        );
        const adjuntos = this.parseAdjuntosResponse(respAdj);
        const tienePdf = adjuntos.some((a: any) => {
          const tipo = (a.tipoArchivo || '').toLowerCase();
          const nombre = (a.nombreArchivo || '').toLowerCase();
          return tipo === 'pdf' || tipo === 'application/pdf' || nombre.endsWith('.pdf');
        });
        const tieneExcel = adjuntos.some((a: any) => {
          const tipo = (a.tipoArchivo || '').toLowerCase();
          const nombre = (a.nombreArchivo || '').toLowerCase();
          return tipo === 'excel' || tipo.includes('excel') || tipo.includes('spreadsheet') ||
                 nombre.endsWith('.xlsx') || nombre.endsWith('.xls');
        });
        if (!tienePdf || !tieneExcel) {
          const faltantes: string[] = [];
          if (!tienePdf) faltantes.push('PDF de la orden de compra');
          if (!tieneExcel) faltantes.push('Excel del cuadro comparativo');
          this.alertService.showAlert('Adjuntos requeridos', `Para enviar a aprobación debe adjuntar:\n\n${faltantes.join('\n')}\n\nAbra el detalle de la OC y suba los archivos.`, 'warning');
          return;
        }
      } catch {
        this.alertService.showAlert('Error', 'No se pudo verificar los adjuntos.', 'error');
        return;
      }
    }

    const ok = await this.alertService.showConfirm('Enviar a Aprobación',
      `¿Confirma enviar la OC ${oc.numeroOrden} a aprobación? Monto: ${oc.moneda} ${oc.totalOrden}`, 'question');
    if (!ok) return;
    try {
      this.alertService.mostrarModalCarga();
      const idConsolidacion = oc.idConsolidacion || oc.codigoConsolidacion || oc.consolidacionId ||
                                (oc.items && oc.items.length > 0 ? oc.items[0]?.idConsolidacion : null);
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/enviar-oc-aprobacion`, {
          idOrden: oc.idOrden,
          idConsolidacion: idConsolidacion,
          usuarioGenera: this.usuario?.documentoidentidad
        })
      );
      this.alertService.cerrarModalCarga();
      const esExito = resp?.success === 1 || resp?.success === true || resp?.errorgeneral === 0;
      if (esExito) {
        const mensajeSync = resp?.numeroOrdenSpring ? ` Sincronizada con SPRING: ${resp.numeroOrdenSpring}` : '';
        this.alertService.showAlert('Éxito', `OC enviada a aprobación.${mensajeSync}`, 'success');
        await this.cargarOrdenesCompra();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error.', 'error');
      }
    } catch (e: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    }
  }

  async abrirAdjuntosOC(oc: any): Promise<void> {
    this.ordenActual = oc;
    this.archivoAdjuntoOC = null;
    this.descripcionAdjuntoOC = '';
    await this.cargarAdjuntosOC(oc.idOrden, 'OC');
    this.modalAdjuntosOCAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarModalAdjuntosOC(): void {
    this.modalAdjuntosOCAbierto = false;
    this.ordenActual = null;
    this.adjuntosOC = [];
    this.archivoAdjuntoOC = null;
    this.descripcionAdjuntoOC = '';
    this.cdr.markForCheck();
  }

  onArchivoAdjuntoOCChange(event: any): void {
    const files = event?.target?.files;
    if (files && files.length > 0) {
      this.archivoAdjuntoOC = files[0];
    }
  }

  private obtenerTipoArchivo(nombre: string): string {
    const ext = (nombre.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'xlsx' || ext === 'xls') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (ext === 'doc' || ext === 'docx') return 'application/msword';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    return 'application/octet-stream';
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async subirAdjuntoOC(): Promise<void> {
    if (!this.archivoAdjuntoOC || !this.ordenActual) return;
    this.subiendoAdjuntoOC = true;
    try {
      const b64 = await this.fileToBase64(this.archivoAdjuntoOC);
      const tipoArchivo = this.obtenerTipoArchivo(this.archivoAdjuntoOC.name);
      const idOrden = this.ordenActual?.idOrden;
      const numeroOrdenSpring = this.ordenActual?.numeroOrdenSpring;
      const companiaSocio = this.ordenActual?.companiaSocioSpring;
      const rutaServidor = `\\\\172.16.20.24\\SpringGestionDoc\\TEMPORAL\\WH\\${this.archivoAdjuntoOC.name}`;
      const payload: any = {
        idOrden,
        tipoOrden: 'OC',
        nombreArchivo: this.archivoAdjuntoOC.name,
        tipoArchivo,
        tamano: this.archivoAdjuntoOC.size,
        descripcion: this.descripcionAdjuntoOC || this.archivoAdjuntoOC.name,
        contenidoB64: b64,
        urlArchivo: rutaServidor,
        usuarioSube: this.usuario?.documentoidentidad,
        idempresa: this.usuario?.idempresa,
        companiaSocio
      };
      if (numeroOrdenSpring) payload.numeroOrdenSpring = numeroOrdenSpring;
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/guardar-adjunto-oc`, payload)
      );
      if (resp?.success) {
        this.archivoAdjuntoOC = null;
        this.descripcionAdjuntoOC = '';
        await this.cargarAdjuntosOC(this.ordenActual?.idOrden, 'OC');
        await this.cargarOrdenesCompra();
        this.alertService.showAlert('Éxito', 'Archivo adjunto subido correctamente.', 'success');
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al subir adjunto.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error al subir adjunto.', 'error');
    } finally {
      this.subiendoAdjuntoOC = false;
      this.cdr.markForCheck();
    }
  }

  async eliminarAdjuntoOC(idAdjunto: number): Promise<void> {
    const ok = await this.alertService.showConfirm('Eliminar adjunto', '¿Confirma eliminar este adjunto?', 'question');
    if (!ok) return;
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/eliminar-adjunto-oc`, { idAdjunto })
      );
      if (resp?.success) {
        await this.cargarAdjuntosOC(this.ordenActual?.idOrden, 'OC');
        await this.cargarOrdenesCompra();
        this.alertService.showAlert('Éxito', 'Adjunto eliminado.', 'success');
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error al eliminar.', 'error');
      }
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error al eliminar.', 'error');
    }
  }

  async verPdfOC(oc: any): Promise<void> {
    try {
      const empresa: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/obtener-config-empresa`, { ruc: oc.rucEmpresa || '' })
      );
      const html = this.pdfService.buildOCHtml(oc, empresa);
      this.pdfService.imprimirOrdenHtml(html, oc.numeroOrden);
    } catch {
      this.alertService.showAlert('Aviso', 'No se pudo cargar la configuración de empresa para el PDF.', 'warning');
    }
  }

  async verPdfOCFormateado(oc: any): Promise<void> {
    try {
      const empresa: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/obtener-config-empresa`, { ruc: oc.rucEmpresa || '' })
      );
      if (empresa?.logoBase64) {
        const html = this.pdfService.buildOCHtml(oc, empresa);
        this.pdfService.imprimirOrdenHtml(html, oc.numeroOrden);
      } else {
        this.verPdfOC(oc);
      }
    } catch {
      this.verPdfOC(oc);
    }
  }

  async confirmarEnvioOC(oc: any): Promise<void> {
    const ok = await this.alertService.showConfirm('Confirmar Envío al Proveedor',
      `¿Confirma enviar la OC ${oc.numeroOrden}?`, 'question');
    if (!ok) return;
    try {
      this.alertService.mostrarModalCarga();
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/confirmar-envio-oc`, {
          idOrden: oc.idOrden,
          usuario: this.usuario?.documentoidentidad
        })
      );
      this.alertService.cerrarModalCarga();
      const esExito = resp?.success === 1 || resp?.success === true || resp?.errorgeneral === 0;
      if (esExito) {
        this.alertService.showAlert('Éxito', resp?.mensaje || 'OC confirmada como enviada.', 'success');
        await this.cargarOrdenesCompra();
      } else {
        this.alertService.showAlert('Error', resp?.mensaje || 'Error.', 'error');
      }
    } catch (e: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', e?.message || 'Error inesperado.', 'error');
    }
  }

  editarOC(oc: any): void {
    this.verDetalleOC(oc);
  }

  toggleAll(emp: string, checked: boolean): void {
    this.datos.filter(d => d.empresa === emp).forEach(r => {
      if (checked) this.seleccionados.add(r.id); else this.seleccionados.delete(r.id);
    });
    this.aplicarFiltros();
  }

  toggleFila(id: number, checked: boolean): void {
    if (checked) this.seleccionados.add(id); else this.seleccionados.delete(id);
    this.aplicarFiltros();
  }

  setProveedor(id: number, val: string): void {
    if (val) this.proveedorPorItem[id] = val; else delete this.proveedorPorItem[id];
  }

  setCostoProveedor(id: number, val: string): void {
    this.costosProveedor[id] = val;
    this.aplicarFiltros();
  }

  setCostoCorp(key: string, valor: string): void {
    this.corpGrupos.filter(g => g.key === key).forEach(g => {
      g.ids.forEach(id => this.costosProveedor[id] = valor);
    });
    this.aplicarFiltros();
  }

  toggleCorp(key: string, checked: boolean): void {
    if (checked) this.seleccionadosCorp.add(key); else this.seleccionadosCorp.delete(key);
    this.aplicarFiltros();
  }

  toggleAllCorp(checked: boolean): void {
    this.corpGrupos.forEach(g => {
      if (checked) this.seleccionadosCorp.add(g.key); else this.seleccionadosCorp.delete(g.key);
    });
    this.aplicarFiltros();
  }

  setProveedorGlobal(event: any): void {
    const val: Proveedor = event?.value ?? event;
    this.proveedorGlobal = val ?? null;
    this.proveedorGlobalInput = val?.nombre ?? '';
    console.log('[setProveedorGlobal] proveedorGlobal:', this.proveedorGlobal, 'puedeEmitirOC:', this.puedeEmitirOC());
    if (!val) {
      this.aplicarFiltros();
      return;
    }
    this.corpGrupos.filter(g => this.seleccionadosCorp.has(g.key)).forEach(g => {
      g.ids.forEach(id => this.proveedorPorItem[id] = val.nombre);
    });
    this.ocMoneda = val.monedaPago === 'EX' ? 'USD' : 'PEN';
    this.ocCondPago = val.formaPago || this.formasPago[0]?.idformapago || 'Contado';
    this.ocFormaPago = val.tipoPago || this.tiposPago[0]?.TipoPago || 'Transferencia';
    this.ocPlazo = val.diasEntrega ?? 7;
    this.calcularFechaEntregaOC();
    this.aplicarFiltros();
    this.toast('Proveedor asignado a ' + this.seleccionadosCorp.size + ' grupo(s) seleccionado(s)', 'ok');
  }

  calcularFechaEntregaOC(): void {
    const dias = parseInt(String(this.ocPlazo), 10) || 0;
    if (dias <= 0) {
      this.ocFechaEntrega = '';
      return;
    }
    const hoy = new Date();
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + dias + 1);
    this.ocFechaEntrega = fecha.toISOString().split('T')[0];
  }

  async filtrarProveedores(event: any): Promise<void> {
    const query = String(event.query ?? '').trim();
    if (!query || query.length < 3) {
      this.proveedoresSugeridos = this.proveedores();
      return;
    }
    try {
      const body = { ruc: this.usuario?.ruc, busqueda: query, estado: 'ACTIVO' };
      const resp: any = await lastValueFrom(this.maestrasService.getProveedores(body));
      let lista = Array.isArray(resp) ? resp : [];
      const queryLower = query.toLowerCase();
      lista = lista.filter((p: any) => {
        const nombre = String(p.proveedor ?? p.nombre ?? '').toLowerCase();
        const ruc = String(p.ruc ?? p.documento ?? '').toLowerCase();
        return nombre.includes(queryLower) || ruc.includes(queryLower);
      });
      this.proveedoresSugeridos = lista.map((p: any) => ({
        id: String(p.idproveedor ?? p.id ?? p.ruc ?? p.documento ?? ''),
        nombre: String(p.proveedor ?? p.nombre ?? p.razonSocial ?? ''),
        ruc: String(p.ruc ?? p.rucproveedor ?? p.documento ?? ''),
        monedaPago: String(p.MonedaPago ?? p.monedaPago ?? '').toUpperCase(),
        tipoPago: String(p.TipoPago ?? p.tipoPago ?? '').toUpperCase(),
        formaPago: String(p.FormadePago ?? p.formadePago ?? p.formaPago ?? ''),
        diasEntrega: parseInt(p.NumeroDiasEntrega ?? p.numeroDiasEntrega ?? p.DiasEntrega ?? p.diasEntrega ?? '7', 10) || 7
      }));
    } catch {
      this.proveedoresSugeridos = [];
    }
  }

  puedeExportarExcelCotizacion(): boolean {
    return this.seleccionadosCorp.size > 0;
  }

  puedeEmitirOC(): boolean {
    const estadoCab = String(this.cotizacionActiva?.cabecera?.estado ?? '').trim();
    const estadoDir = String(this.cotizacionActiva?.estado ?? '').trim();
    const ok = !!this.proveedorGlobal && (
      estadoCab === 'COTIZADA' ||
      estadoDir === 'COTIZADA' ||
      this.seleccionadosCorp.size > 0
    );
    console.log('[puedeEmitirOC] proveedorGlobal:', !!this.proveedorGlobal, 'estadoCab:', estadoCab, 'estadoDir:', estadoDir, 'seleccionadosCorp:', this.seleccionadosCorp.size, 'result:', ok);
    return ok;
  }

  async exportarExcel(): Promise<void> {
    console.log('[exportarExcel] click', { seleccionadosCorp: this.seleccionadosCorp.size });
    if (this.seleccionadosCorp.size === 0) {
      this.toast('Selecciona al menos un ítem corporativo', 'err');
      return;
    }

    const selectedIds: number[] = [];
    this.corpGrupos.filter(g => this.seleccionadosCorp.has(g.key)).forEach(g => selectedIds.push(...g.ids));
    if (selectedIds.length === 0) { this.toast('No hay ítems seleccionados', 'err'); return; }

    const itemsParaCotizar = selectedIds.map(id => {
      const r = this.datos.find(d => d.id === id)!;
      return {
        idDetalleOrigen: r.idDetalle ?? 0,
        tipoOrigen: 'ITEM',
        idRequerimiento: r.idrequerimiento ?? 0,
        empresa: r.empresa,
        codigo: r.cod,
        descripcion: r.desc,
        unidadMedida: r.um,
        linea: r.linea,
        familia: r.familia,
        subfamilia: r.subfamilia,
        ceco: r.ceco,
        proyecto: r.proyecto,
        almacen: r.almacen,
        observaciones: '',
        cantidad: r.cantidad,
        afectoIGV: this.obtenerAfectoIGV(r)
      };
    });

    try {
      const body = {
        usuario: this.usuario?.documentoidentidad || this.usuario?.nombre || '',
        rucProveedor: '',
        nombreProveedor: '',
        moneda: this.ocMoneda || 'PEN',
        observaciones: this.ocObs,
        items: itemsParaCotizar
      };
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/consolidacion/crear-cotizacion-oc`, body)
      );
      if (!resp?.success) {
        this.toast(resp?.mensaje || 'No se pudo crear la cotización', 'err');
        return;
      }

      const detalleExcel = this.corpGrupos
        .filter(g => this.seleccionadosCorp.has(g.key))
        .map(g => {
          const r = this.datos.find(d => d.id === g.ids[0]);
          return {
            codigo: g.cod,
            descripcion: g.desc,
            unidadMedida: g.um,
            linea: g.linea,
            familia: g.familia,
            subfamilia: g.subfamilia,
            cantHP: g.HP,
            cantBH: g.BH,
            cantCAO: g.CAO,
            precioHP: '',
            precioBH: '',
            precioCAO: '',
            afectoIGV: r ? this.obtenerAfectoIGV(r) : true
          };
        });

      const cotizacionDescarga = {
        cabecera: {
          codigo: resp.codigo || '',
          nombreProveedor: '',
          moneda: this.ocMoneda || 'PEN'
        },
        detalle: detalleExcel
      };

      this.generarExcelCotizacion(cotizacionDescarga);

      // Los items pasan a estar en cotización activa; limpiar selección y recargar lista.
      this.seleccionadosCorp.clear();
      this.aplicarFiltros();
      this.cargarRequerimientos();
    } catch (e: any) {
      console.error('[exportarExcel] error crear cotizacion:', e);
      this.toast('Error al crear cotización: ' + (e?.message || ''), 'err');
    }
  }

  generarExcelCotizacion(cot: any): void {
    if (typeof cot?.detalle === 'string') {
      try { cot.detalle = JSON.parse(cot.detalle); } catch { cot.detalle = []; }
    }
    if (!cot?.detalle?.length) { this.toast('La cotización no tiene detalle', 'warn'); return; }

    const headers = [
      'Código', 'Descripción', 'UM', 'Línea', 'Familia', 'Subfamilia',
      'Cant. HP', 'Cant. BH', 'Cant. CAO', 'Total', 'Afecto IGV',
      'P.U. HP (S/) sin IGV', 'P.U. BH (S/) sin IGV', 'P.U. CAO (S/) sin IGV',
      'Subtotal HP (S/)', 'Subtotal BH (S/)', 'Subtotal CAO (S/)'
    ];
    const wsData: any[] = [
      ['COTIZACION:', cot?.cabecera?.codigo || ''],
      ['PROVEEDOR:', cot?.cabecera?.nombreProveedor || ''],
      ['MONEDA:', cot?.cabecera?.moneda || 'PEN'],
      headers
    ];

    cot.detalle.forEach((g: any, idx: number) => {
      const rowNum = idx + 5;
      const afecto = g.afectoIGV ? 'SI' : 'NO';
      const precioHP = g.precioHP || '';
      const precioBH = g.precioBH || '';
      const precioCAO = g.precioCAO || '';
      wsData.push([
        g.codigo, g.descripcion, g.unidadMedida, g.linea, g.familia, g.subfamilia,
        g.cantHP || 0, g.cantBH || 0, g.cantCAO || 0, (g.cantHP || 0) + (g.cantBH || 0) + (g.cantCAO || 0), afecto,
        precioHP, precioBH, precioCAO,
        { f: `L${rowNum}*G${rowNum}` },
        { f: `M${rowNum}*H${rowNum}` },
        { f: `N${rowNum}*I${rowNum}` }
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!autofilter'] = { ref: `A4:Q${wsData.length}` };
    ws['!cols'] = headers.map(() => ({ wch: 16 }));
    (ws['!cols'] as any)[1] = { wch: 38 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cotización');
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `cotizacion_oc_${cot?.cabecera?.codigo || fecha}.xlsx`);
    this.toast('Cotización exportada en Excel con precios por empresa', 'ok');
  }

  importarCotizacion(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(data, { type: 'array' });
      } catch (err) {
        this.toast('No se pudo leer el archivo Excel', 'err');
        return;
      }
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
      if (!json.length) { this.toast('Archivo vacío', 'err'); return; }

      const codigoCotizacion = ((): string | null => {
        for (const row of json) {
          const celda0 = String(row[0] || '').trim().toUpperCase();
          if (celda0.includes('COTIZACION')) {
            const cod = String(row[1] || '').trim();
            if (cod.startsWith('COT-OC-')) return cod;
          }
        }
        for (const row of json) {
          for (const cell of row) {
            const s = String(cell).trim();
            if (s.startsWith('COT-OC-')) return s;
          }
        }
        return null;
      })();
      if (!codigoCotizacion) {
        this.toast('No se encontró el código de cotización en el Excel. Use el archivo descargado.', 'err');
        return;
      }

      const idxCabecera = json.findIndex(row => row.some(c => String(c).toLowerCase().includes('código')));
      if (idxCabecera < 0) { this.toast('Formato no válido. Debe tener columna Código', 'err'); return; }
      const cabecera = json[idxCabecera].map(h => String(h).trim().toLowerCase());
      const idxCod = cabecera.indexOf('código');
      const idxPrecioHP = cabecera.findIndex(h => h.includes('p.u.') && h.includes('hp'));
      const idxPrecioBH = cabecera.findIndex(h => h.includes('p.u.') && h.includes('bh'));
      const idxPrecioCAO = cabecera.findIndex(h => h.includes('p.u.') && h.includes('cao'));
      if (idxCod < 0) { this.toast('Formato no válido. Debe tener columna Código', 'err'); return; }
      if (idxPrecioHP < 0 && idxPrecioBH < 0 && idxPrecioCAO < 0) {
        this.toast('Formato no válido. Debe tener al menos una columna P.U. HP/BH/CAO', 'err');
        return;
      }

      const precios: { codigo: string; empresa: string; precio: number }[] = [];
      json.slice(idxCabecera + 1).forEach(row => {
        const cod = String(row[idxCod] || '').trim();
        if (!cod) return;
        const pushPrecio = (emp: string, idx: number) => {
          const val = parseFloat(row[idx]);
          if (val > 0) precios.push({ codigo: cod, empresa: emp, precio: val });
        };
        if (idxPrecioHP >= 0) pushPrecio('HP', idxPrecioHP);
        if (idxPrecioBH >= 0) pushPrecio('BH', idxPrecioBH);
        if (idxPrecioCAO >= 0) pushPrecio('CAO', idxPrecioCAO);
      });

      if (precios.length === 0) {
        this.toast('No se encontraron precios mayores a 0 en el archivo', 'warn');
        input.value = '';
        return;
      }

      try {
        const resp: any = await lastValueFrom(
          this.http.post(`${this.baseUrl}/api/consolidacion/guardar-precios-cotizacion-oc`, {
            codigo: codigoCotizacion,
            precios
          })
        );
        if (resp?.success) {
          await this.cargarCotizacionActiva({ codigo: codigoCotizacion });
          console.log('[importarCotizacion] cotizacionActiva cargada:', this.cotizacionActiva?.cabecera);
          this.cargarCotizacionesOC();
          this.toast(`Precios cargados: ${precios.length} precio(s)`, 'ok');
        } else {
          this.toast(resp?.mensaje || 'Error al cargar precios', 'err');
        }
      } catch (e: any) {
        console.error('[importarCotizacion] error:', e);
        this.toast('Error al guardar precios: ' + (e?.message || ''), 'err');
      }
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  async cargarCotizacionActiva(filtro: { idCotizacion?: number; codigo?: string }, cargarProveedores = true): Promise<void> {
    try {
      const body: any = {};
      if (filtro.idCotizacion) body.idCotizacion = filtro.idCotizacion;
      if (filtro.codigo) body.codigo = filtro.codigo;
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/consolidacion/obtener-cotizacion-oc`, body)
      );
      if (resp?.success) {
        this.cotizacionActiva = resp;
        // Si el backend devuelve subobjetos JSON como strings, parsearlos.
        if (this.cotizacionActiva) {
          if (typeof this.cotizacionActiva.cabecera === 'string') {
            try { this.cotizacionActiva.cabecera = JSON.parse(this.cotizacionActiva.cabecera); } catch { }
          }
          if (typeof this.cotizacionActiva.detalle === 'string') {
            try { this.cotizacionActiva.detalle = JSON.parse(this.cotizacionActiva.detalle); } catch { }
          }
          if (typeof this.cotizacionActiva.items === 'string') {
            try { this.cotizacionActiva.items = JSON.parse(this.cotizacionActiva.items); } catch { }
          }
        }
        if (cargarProveedores) {
          // Asegurar proveedor global con el id real del catálogo
          await this.cargarProveedores();
          const proveedorMatch = this.proveedores().find(p => p.ruc === resp.cabecera?.rucProveedor);
          this.proveedorGlobal = proveedorMatch
            || { id: resp.cabecera?.rucProveedor, nombre: resp.cabecera?.nombreProveedor, ruc: resp.cabecera?.rucProveedor } as any;
        }
      } else {
        this.cotizacionActiva = null;
      }
      this.cdr.markForCheck();
    } catch (e) {
      this.cotizacionActiva = null;
    }
  }

  async cargarCotizacionesOC(): Promise<void> {
    this.cargandoCotizaciones = true;
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/consolidacion/listar-cotizaciones-oc`, {
          estado: '', top: 200
        })
      );
      this.cotizacionesPendientes = Array.isArray(resp) ? resp : (resp?.resultado || []);
      this.cdr.markForCheck();
    } catch (err) {
      console.error('[cargarCotizacionesOC] error:', err);
      this.cotizacionesPendientes = [];
    } finally {
      this.cargandoCotizaciones = false;
      this.cdr.markForCheck();
    }
  }

  seleccionarCotizacion(cot: any): void {
    this.cargarCotizacionActiva({ idCotizacion: cot.idCotizacion });
    this.mostrarPanelCotizaciones = false;
  }

  async anularCotizacion(cot: any): Promise<void> {
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/consolidacion/anular-cotizacion-oc`, {
          idCotizacion: cot.idCotizacion, motivo: 'Anulado por usuario'
        })
      );
      if (resp?.success) {
        this.toast('Cotización anulada y líneas liberadas', 'ok');
        if (this.cotizacionActiva?.cabecera?.idCotizacion === cot.idCotizacion) this.cotizacionActiva = null;
        this.cargarCotizacionesOC();
        this.cargarRequerimientos();
      } else {
        this.toast(resp?.mensaje || 'Error al anular', 'err');
      }
    } catch (e: any) {
      this.toast('Error al anular cotización: ' + (e?.message || ''), 'err');
    }
  }

  async emitirOC(): Promise<void> {
    const prov = this.proveedorGlobal;
    if (!prov) { this.toast('Selecciona un proveedor global', 'err'); return; }

    this.ocProv = prov.nombre;
    this.ocRuc = prov.ruc;

    // Asegurar catálogo de empresas antes de armar las OC
    await this.cargarEmpresas();

    // Preferir flujo por cotización activa congelada
    if (this.cotizacionActiva?.cabecera?.estado === 'COTIZADA') {
      await this.cargarCotizacionActiva({ idCotizacion: this.cotizacionActiva.cabecera.idCotizacion });
      const rawItems = Array.isArray(this.cotizacionActiva.items) ? this.cotizacionActiva.items : [];
      if (!rawItems.length) { this.toast('La cotización activa no tiene ítems', 'err'); return; }

      // Precios por código+empresa desde el detalle agrupado
      const precioMap: Record<string, Record<string, number>> = {};
      (this.cotizacionActiva.detalle || []).forEach((g: any) => {
        precioMap[g.codigo] = {
          HP: g.precioHP || 0,
          BH: g.precioBH || 0,
          CAO: g.precioCAO || 0
        };
      });

      const porEmp: Record<string, (LineaReq & { precio: number })[]> = { HP: [], BH: [], CAO: [] };
      rawItems.forEach((it: any) => {
        const emp = String(it.empresa || '').toUpperCase();
        if (!porEmp[emp]) return;
        const precio = precioMap[it.codigo]?.[emp] || it.precioUnitario || 0;
        porEmp[emp].push({
          id: it.idDetalleOrigen,
          idDetalle: it.idDetalleOrigen,
          idrequerimiento: it.idRequerimiento,
          req: '',
          area: '',
          solicitante: '',
          fecha: '',
          empresa: emp,
          cod: it.codigo,
          desc: it.descripcion,
          um: it.unidadMedida || 'UND',
          lineaCodigo: '',
          linea: it.linea || '',
          familiaCodigo: '',
          familia: it.familia || '',
          subfamiliaCodigo: '',
          subfamilia: it.subfamilia || '',
          cantidad: it.cantidad,
          cantidadPendiente: it.cantidad,
          ultimaOC: 0,
          afectoIGV: !!it.afectoIGV,
          ruc: '',
          razonSocial: '',
          ceco: it.ceco || '',
          proyecto: it.proyecto || '',
          almacen: it.almacen || '',
          precio
        } as any);
      });

      this.emitirOCEmpresas = [];
      const rucsEmpresas = new Set<string>();
      ['HP', 'BH', 'CAO'].forEach(emp => {
        const items = porEmp[emp];
        if (!items.length) return;
        const empresa = this.buscarEmpresaPorCodigo(emp);
        const idempresa = empresa?.idempresa || this.idEmpresaPorCodigo[emp];
        const rucEmpresa = String(empresa?.ruc || '').trim() || this.rucEmpresaPorCodigo[emp];
        const almacenDefault = items[0]?.almacen || this.almacenesPorRuc(rucEmpresa)[0]?.idalmacen || '';
        this.emitirOCEmpresas.push({ emp, items, subtotal: 0, igv: 0, total: 0, almacen: almacenDefault, rucEmpresa, idempresa });
        rucsEmpresas.add(rucEmpresa);
      });

      if (this.emitirOCEmpresas.some(e => e.items.some(r => !r.precio || r.precio <= 0))) {
        this.toast('La cotización activa aún no tiene todos los precios por empresa', 'err');
        return;
      }

      await Promise.all(Array.from(rucsEmpresas).map(ruc => this.cargarAlmacenesPorRuc(ruc)));
      this.modalOCAbierto = true;
      this.ocMonedaAnterior = this.ocMoneda;
      this.cargarTipoCambioOC();
      this.recalcEmitirOC();
      return;
    }

    // Flujo legacy: selección directa de ítems
    if (this.seleccionadosCorp.size === 0) { this.toast('Selecciona al menos un ítem en el corporativo', 'err'); return; }

    const selectedIds: number[] = [];
    this.corpGrupos.filter(g => this.seleccionadosCorp.has(g.key)).forEach(g => selectedIds.push(...g.ids));

    const porEmp: Record<string, LineaReq[]> = { HP: [], BH: [], CAO: [] };
    selectedIds.forEach(id => {
      const r = this.datos.find(d => d.id === id);
      if (r) porEmp[r.empresa].push(r);
    });

    this.emitirOCEmpresas = [];
    const rucsEmpresas = new Set<string>();
    ['HP', 'BH', 'CAO'].forEach(emp => {
      const items = porEmp[emp];
      if (!items.length) return;
      const primerItem = items[0];
      const idempresa = this.idEmpresaPorCodigo[emp] || String(primerItem?.ruc ?? '').trim();
      const rucEmpresa = String(primerItem?.ruc ?? '').trim() || this.rucEmpresaPorCodigo[emp];
      const almacenDefault = primerItem?.almacen || this.almacenesPorRuc(rucEmpresa)[0]?.idalmacen || '';
      this.emitirOCEmpresas.push({
        emp,
        items: items.map(r => ({ ...r, precio: parseFloat(this.costosProveedor[r.id]) || r.ultimaOC })),
        subtotal: 0,
        igv: 0,
        total: 0,
        almacen: almacenDefault,
        rucEmpresa,
        idempresa
      });
      if (rucEmpresa) rucsEmpresas.add(rucEmpresa);
    });

    await Promise.all(Array.from(rucsEmpresas).map(ruc => this.cargarAlmacenesPorRuc(ruc)));

    this.modalOCAbierto = true;
    this.ocMonedaAnterior = this.ocMoneda;
    this.cargarTipoCambioOC();
    this.recalcEmitirOC();
  }

  almacenesPorRuc(ruc: string): any[] {
    const key = String(ruc ?? '').trim();
    if (!key) return this.almacenes;
    if (this.almacenesPorEmpresa.has(key)) {
      const lista = this.almacenesPorEmpresa.get(key)!;
      if (lista.length > 0) return lista;
      // Si la búsqueda por RUC devolvió vacío, ofrecer la lista general mientras se recarga
      return this.almacenes;
    }
    // Trigger carga asíncrona mientras tanto devuelve lo que tengamos filtrado
    this.cargarAlmacenesPorRuc(key);
    const filtrados = this.almacenes.filter(a => String(a.ruc ?? a.Ruc ?? '').trim() === key);
    return filtrados.length > 0 ? filtrados : this.almacenes;
  }

  async cargarTipoCambioOC(): Promise<void> {
    if (this.ocMoneda !== 'USD') {
      this.tipoCambioOC = 1;
      return;
    }
    try {
      const fecha = this.tipoCambioService.fechaHoyString();
      const resp: any = await this.tipoCambioService.obtenerTipoCambio(fecha);
      this.tipoCambioOC = resp?.tipoCambio ? parseFloat(resp.tipoCambio) : 1;
    } catch {
      this.tipoCambioOC = 1;
    }
  }

  async onMonedaChange(): Promise<void> {
    await this.cargarTipoCambioOC();
    const tc = this.tipoCambioOC || 1;
    const anterior = this.ocMonedaAnterior || 'PEN';
    const actual = this.ocMoneda || 'PEN';
    if (anterior !== actual && tc > 0) {
      this.emitirOCEmpresas.forEach(empBox => {
        empBox.items.forEach(r => {
          const precio = parseFloat(String(r.precio)) || 0;
          if (!precio) return;
          if (anterior === 'PEN' && actual === 'USD') {
            r.precio = +(precio / tc).toFixed(4);
          } else if (anterior === 'USD' && actual === 'PEN') {
            r.precio = +(precio * tc).toFixed(2);
          }
        });
      });
    }
    this.ocMonedaAnterior = actual;
    this.recalcEmitirOC();
  }

  mostrarUltimaOC(item: any): string {
    const tc = this.tipoCambioOC || 1;
    const valor = parseFloat(String(item?.ultimaOC ?? 0)) || 0;
    if (this.ocMoneda === 'USD' && tc > 0) {
      return (valor / tc).toFixed(2);
    }
    return valor.toFixed(2);
  }

  recalcEmitirOC(): void {
    this.emitirOCEmpresas.forEach(empBox => {
      let subtotal = 0;
      let igv = 0;
      empBox.items.forEach(r => {
        const lineSubtotal = r.cantidad * r.precio;
        const afecto = this.obtenerAfectoIGV(r);
        subtotal += lineSubtotal;
        if (afecto) {
          igv += lineSubtotal * 0.18;
        }
      });
      empBox.subtotal = subtotal;
      empBox.igv = igv;
      empBox.total = subtotal + igv;
    });
  }

  async confirmarOC(): Promise<void> {
    const prov = this.proveedorGlobal;
    if (!prov) return;

    this.recalcEmitirOC();

    if (this.emitirOCEmpresas.length === 0) {
      this.toast('No hay empresas con ítems seleccionados', 'err');
      return;
    }

    if (this.emitirOCEmpresas.some(e => e.items.some(r => !r.precio || r.precio <= 0))) {
      this.toast('Todos los ítems deben tener precio mayor a 0', 'err');
      return;
    }
    if (this.emitirOCEmpresas.some(e => !e.almacen)) {
      this.toast('Seleccione el almacén para cada empresa', 'err');
      return;
    }
    if (!this.ocLugar) {
      this.toast('Seleccione el lugar de entrega', 'err');
      return;
    }
    if (!this.ocFechaEntrega) {
      this.toast('Indique la fecha de entrega estimada', 'err');
      return;
    }

    this.guardandoOC.set(true);
    const creadas: string[] = [];
    const errores: string[] = [];

    try {
      for (const empBox of this.emitirOCEmpresas) {
        console.log('[confirmarOC] empBox:', empBox);
        const primerItem = empBox.items[0];
        const empresaMatch = this.empresas().find(e =>
          String(e.ruc ?? '').trim() === empBox.rucEmpresa
        );
        console.log('[confirmarOC] empresaMatch:', empresaMatch);
        const idempresa = empresaMatch?.idempresa || empBox.idempresa || this.idEmpresaPorCodigo[empBox.emp] || this.usuario?.idempresa || '';
        const rucEmpresa = String(empresaMatch?.ruc || empBox.rucEmpresa || '').trim();
        if (!rucEmpresa || !idempresa) {
          this.toast(`No se pudo identificar la empresa ${empBox.emp} para crear la OC`, 'err');
          continue;
        }
        const payload = {
          idConsolidacion: primerItem?.IdConsolidacion || null,
          idempresa,
          rucEmpresa,
          proveedor: prov.id,
          nombreProveedor: prov.nombre,
          rucProveedor: prov.ruc,
          emailProveedor: prov.email || '',
          telefonoProveedor: prov.telefono || '',
          direccionProveedor: prov.direccion || '',
          moneda: this.ocMoneda,
          tipoCambio: this.tipoCambioOC,
          almacen: empBox.almacen || primerItem?.almacen || '',
          lugarEntrega: this.ocLugar,
          fechaEntregaEstimada: this.ocFechaEntrega,
          condicionesPago: this.ocCondPago,
          formaPago: this.ocFormaPago,
          observaciones: this.ocObs,
          usuarioGenera: this.usuario?.documentoidentidad,
          nombreRegistra: this.usuario?.razonSocial || this.usuario?.nombre || '',
          clasificacion: 'LOC',
          incoterm: '',
          items: empBox.items.map(r => ({
            codigo: r.cod || '',
            descripcion: r.desc || '',
            cantidad: r.cantidad || 0,
            unidadMedida: r.um || 'UND',
            precioUnitario: r.precio || 0,
            descuento: 0,
            proyecto: r.proyecto || '',
            ceco: r.ceco || '',
            observaciones: '',
            idDetalle: r.idDetalle || null,
            afectoIGV: this.obtenerAfectoIGV(r)
          }))
        };

        console.log('[confirmarOC] payload:', payload);
        try {
          const resp: any = await lastValueFrom(
            this.http.post(`${this.baseUrl}/api/logistica/crear-oc-borrador`, payload)
          );
          if (resp?.success) {
            creadas.push(`${empBox.emp}: ${resp.numeroOC}`);
          } else {
            errores.push(`${empBox.emp}: ${resp?.mensaje || 'Error al crear OC'}`);
          }
        } catch (e: any) {
          errores.push(`${empBox.emp}: ${e?.message || 'Error de red'}`);
        }
      }

      if (creadas.length > 0) {
        this.alertService.showAlert('OC Creadas',
          `Se crearon ${creadas.length} OC(s) en borrador:\n${creadas.join('\n')}\n\nAdjunte los documentos y envíe a aprobación.`, 'success');
      }
      if (errores.length > 0) {
        this.alertService.showAlert('Errores', errores.join('\n'), 'warning');
      }

      // Cerrar cotización activa si se generaron OCs
      if (creadas.length > 0 && this.cotizacionActiva?.cabecera?.idCotizacion) {
        try {
          await lastValueFrom(
            this.http.post(`${this.baseUrl}/api/consolidacion/cerrar-cotizacion-oc`, {
              idCotizacion: this.cotizacionActiva.cabecera.idCotizacion
            })
          );
          this.cotizacionActiva = null;
          this.cargarCotizacionesOC();
        } catch (cerrarErr) {
          console.error('[confirmarOC] error cerrando cotizacion:', cerrarErr);
        }
      }

      this.modalOCAbierto = false;
      this.seleccionadosCorp.clear();
      this.proveedorGlobal = null;
      this.emitirOCEmpresas = [];
      await this.cargarRequerimientos();
      this.currentTab = 'OC';
      await this.cargarOrdenesCompra();
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'Error inesperado al crear OC.', 'error');
    } finally {
      this.guardandoOC.set(false);
      this.cdr.markForCheck();
    }
  }

  cerrarModal(): void {
    this.modalOCAbierto = false;
  }

  cerrarModalOverlay(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cerrarModal();
  }

  async reiniciar(): Promise<void> {
    this.seleccionados.clear();
    this.seleccionadosCorp.clear();
    this.costosProveedor = {};
    this.proveedorPorItem = {};
    this.proveedorGlobal = null;
    this.filtroItem = '';
    this.filtroLinea = '';
    this.filtroFamilia = '';
    this.filtroSubfamilia = '';
    this.filtroBuscar = '';
    await this.cargarRequerimientos();
  }

  toast(msg: string, type: string): void {
    this.toasts.push({ msg, type });
    setTimeout(() => this.toasts.shift(), 3000);
  }
}
