import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { environment } from '@/environments/environment';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

interface Proveedor { id: string; nombre: string; ruc: string; }
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
interface EmitirEmpresa { emp: string; items: (LineaReq & { precio: number })[]; subtotal: number; igv: number; total: number; }

@Component({
  selector: 'app-consolidacion-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, CheckboxModule, AutoCompleteModule],
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

  // Datos reales
  empresas = signal<any[]>([]);
  proveedores = signal<Proveedor[]>([]);
  itemsMaestra = signal<any[]>([]);
  requerimientosCompletos = signal<any[]>([]);
  datos: LineaReq[] = [];

  empNombres: Record<string, string> = { HP: 'Hass Peru S.A.', BH: 'Berry Harvest S.A.', CAO: 'Corp Agricola Olmos S.A.' };
  empCodigoPorRuc: Record<string, string> = {};

  seleccionados = new Set<number>();
  costosProveedor: Record<number, string> = {};
  proveedorPorItem: Record<number, string> = {};
  seleccionadosCorp = new Set<string>();
  currentTab = 'TODOS';
  proveedorGlobal: Proveedor | null = null;
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
  ocProv = '';
  ocRuc = '';
  ocCondPago = 'Contado';
  ocPlazo = 7;
  ocMoneda = 'PEN';
  ocLugar = 'Almacén central Grupo Hass';
  ocObs = '';
  emitirOCEmpresas: EmitirEmpresa[] = [];

  toasts: { msg: string; type: string }[] = [];

  constructor(
    private http: HttpClient,
    private dexieService: DexieService,
    private maestrasService: MaestrasService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit(): Promise<void> {
    console.log('[ConsolidacionCompra] ngOnInit');
    this.usuario = (await this.dexieService.obtenerPrimerUsuario()) ?? null;
    console.log('[ConsolidacionCompra] usuario:', this.usuario?.ruc, this.usuario?.idrol);
    await this.cargarEmpresas();
    await this.cargarProveedores();
    await this.cargarRequerimientosCompletos();
    await this.cargarRequerimientos();
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
        const razon = String(e.razonSocial ?? '').toLowerCase().trim();
        if (!ruc) continue;
        if (razon.includes('hass')) this.empCodigoPorRuc[ruc] = 'HP';
        else if (razon.includes('berry')) this.empCodigoPorRuc[ruc] = 'BH';
        else if (razon.includes('olmos')) this.empCodigoPorRuc[ruc] = 'CAO';
        else this.empCodigoPorRuc[ruc] = this.empCodigoPorRuc[ruc] || 'HP';
      }
    } catch (err) {
      console.error('[ConsolidacionCompra] error cargarEmpresas:', err);
      this.empresas.set([]);
      this.empCodigoPorRuc = {};
    } finally {
      this.cargandoEmpresas.set(false);
    }
  }

  codigoEmpresaPorRuc(ruc: string): string {
    return this.empCodigoPorRuc[String(ruc ?? '').trim()] || 'HP';
  }

  nombreEmpresaPorRuc(ruc: string): string {
    const key = String(ruc ?? '').trim();
    const emp = this.empresas().find(e => String(e.ruc ?? '').trim() === key);
    return String(emp?.razonSocial ?? emp?.nombre ?? this.empNombres[this.codigoEmpresaPorRuc(key)] ?? (key || '—')).trim();
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
      this.proveedores.set(lista.map((p: any) => ({
        id: String(p.idproveedor ?? p.id ?? p.ruc ?? p.documento ?? ''),
        nombre: String(p.proveedor ?? p.nombre ?? p.razonSocial ?? p.nombreProveedor ?? ''),
        ruc: String(p.ruc ?? p.rucproveedor ?? p.documento ?? '')
      })));
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
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-requerimientos-completos`, {
          ruc: this.usuario?.ruc ?? '',
          busqueda: '',
          soloSinOC: true
        })
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
      const esAdmin = ['TILOGIST', 'ADLOGIST', 'JLOLOGIST'].some(r => roles.includes(r));
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
    return items.map((item, idx) => {
      const ruc = String(item.ruc ?? '').trim();
      const razon = String(item.razonSocial ?? '').trim();
      const empresa = this.empCodigoPorRuc[ruc] || this.empresaPorRazonSocial(razon) || 'HP';
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
    if (provs.length === 1) return this.proveedores().find((p: Proveedor) => p.id === provs[0])?.nombre || '—';
    return provs.length > 1 ? 'Varios' : '—';
  }

  switchTab(emp: string): void {
    this.currentTab = emp;
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

  setProveedorGlobal(): void {
    const val = this.proveedorGlobal;
    if (!val) {
      this.aplicarFiltros();
      return;
    }
    this.corpGrupos.filter(g => this.seleccionadosCorp.has(g.key)).forEach(g => {
      g.ids.forEach(id => this.proveedorPorItem[id] = val.id);
    });
    this.aplicarFiltros();
    this.toast('Proveedor asignado a ' + this.seleccionadosCorp.size + ' grupo(s) seleccionado(s)', 'ok');
  }

  filtrarProveedores(event: any): void {
    const query = String(event.query ?? '').toLowerCase().trim();
    const todos = this.proveedores();
    if (!query) {
      this.proveedoresSugeridos = todos;
      return;
    }
    this.proveedoresSugeridos = todos.filter(p =>
      p.nombre.toLowerCase().includes(query) ||
      p.ruc.toLowerCase().includes(query)
    );
  }

  exportarExcel(): void {
    const map = new Map<string, GrupoCorp>();
    this.datos.forEach(r => {
      const key = this.corpKey(r);
      if (!map.has(key)) {
        map.set(key, { key, cod: r.cod, desc: r.desc, um: r.um, linea: r.linea, familia: r.familia, subfamilia: r.subfamilia, HP: 0, BH: 0, CAO: 0, ultimaOC: r.ultimaOC, ids: [] });
      }
      const g = map.get(key)!;
      (g as any)[r.empresa] += r.cantidad;
      g.ids.push(r.id);
    });
    const grupos = Array.from(map.values());
    const headers = ['Código', 'Descripción', 'UM', 'Cant. HP', 'Cant. BH', 'Cant. CAO', 'Total', 'Última OC (S/)', 'P.U. (S/) sin IGV', 'Subtotal (S/)'];
    const wsData: any[] = [headers];
    grupos.forEach((g, idx) => {
      const rowNum = idx + 2;
      const total = g.HP + g.BH + g.CAO;
      const precio = g.ids.map(id => this.costosProveedor[id]).find(v => v !== undefined && v !== null && v !== '') || '';
      wsData.push([
        g.cod,
        g.desc,
        g.um,
        g.HP || 0,
        g.BH || 0,
        g.CAO || 0,
        total,
        g.ultimaOC.toFixed(2),
        (parseFloat(precio) || 0) || '',
        { f: `I${rowNum}*G${rowNum}` }
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map(() => ({ wch: 16 }));
    (ws['!cols'] as any)[1] = { wch: 38 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cotización');
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `cotizacion_corporativa_${fecha}.xlsx`);
    this.toast('Cotización exportada en Excel (.xlsx) con fórmulas de subtotal', 'ok');
  }

  importarCotizacion(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
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
      const idxCabecera = json.findIndex(row => row.some(c => String(c).toLowerCase().includes('código')));
      if (idxCabecera < 0) { this.toast('Formato no válido. Debe tener columna Código', 'err'); return; }
      const cabecera = json[idxCabecera].map(h => String(h).trim().toLowerCase());
      const idxCod = cabecera.indexOf('código');
      const idxPrecio = cabecera.indexOf('p.u. (s/) sin igv');
      if (idxCod < 0 || idxPrecio < 0) { this.toast('Formato no válido. Debe tener columnas Código y P.U. (S/) sin IGV', 'err'); return; }
      let count = 0;
      json.slice(idxCabecera + 1).forEach(row => {
        const cod = String(row[idxCod] || '').trim();
        const precio = parseFloat(row[idxPrecio]) || 0;
        if (cod && precio > 0) {
          const ids = this.datos.filter(d => d.cod === cod).map(d => d.id);
          if (ids.length) {
            ids.forEach(id => this.costosProveedor[id] = String(precio));
            count += ids.length;
          }
        }
      });
      input.value = '';
      this.aplicarFiltros();
      if (count) this.toast('Cotización cargada: ' + count + ' línea(s) con precio asignado', 'ok');
      else this.toast('No se encontraron códigos coincidentes en el archivo', 'warn');
    };
    reader.readAsArrayBuffer(file);
  }

  emitirOC(): void {
    if (this.seleccionadosCorp.size === 0) { this.toast('Selecciona al menos un ítem en el corporativo', 'err'); return; }
    if (!this.proveedorGlobal) { this.toast('Selecciona un proveedor global', 'err'); return; }

    const prov = this.proveedorGlobal;
    this.ocProv = prov.nombre;
    this.ocRuc = prov.ruc;

    const selectedIds: number[] = [];
    this.corpGrupos.filter(g => this.seleccionadosCorp.has(g.key)).forEach(g => {
      selectedIds.push(...g.ids);
    });

    const porEmp: Record<string, LineaReq[]> = { HP: [], BH: [], CAO: [] };
    selectedIds.forEach(id => {
      const r = this.datos.find(d => d.id === id);
      if (r) porEmp[r.empresa].push(r);
    });

    this.emitirOCEmpresas = [];
    ['HP', 'BH', 'CAO'].forEach(emp => {
      const items = porEmp[emp];
      if (!items.length) return;
      this.emitirOCEmpresas.push({
        emp,
        items: items.map(r => ({ ...r, precio: parseFloat(this.costosProveedor[r.id]) || r.ultimaOC })),
        subtotal: 0,
        igv: 0,
        total: 0
      });
    });

    this.modalOCAbierto = true;
    this.recalcEmitirOC();
  }

  recalcEmitirOC(): void {
    this.emitirOCEmpresas.forEach(empBox => {
      let subtotal = 0;
      empBox.items.forEach(r => {
        subtotal += r.cantidad * r.precio;
        this.costosProveedor[r.id] = String(r.precio);
      });
      empBox.subtotal = subtotal;
      empBox.igv = subtotal * 0.18;
      empBox.total = subtotal + empBox.igv;
    });
  }

  confirmarOC(): void {
    const prov = this.proveedorGlobal;
    if (!prov) return;

    this.recalcEmitirOC();
    const resumen = this.emitirOCEmpresas.map(e => ({ emp: e.emp, total: e.total }));

    this.modalOCAbierto = false;
    let msg = `OC creadas para ${resumen.length} empresa(s) con proveedor ${prov.nombre}. `;
    msg += resumen.map(r => `${r.emp}: S/ ${r.total.toFixed(2)}`).join(' · ');
    this.toast(msg, 'ok');

    this.seleccionadosCorp.clear();
    this.proveedorGlobal = null;
    this.aplicarFiltros();
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
