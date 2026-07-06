import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { NotificationService } from '@/app/shared/services/notification.service';
import { NotificacionApiService } from '@/app/shared/services/notificacion-api.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import { CommodityService } from '@/app/modules/main/services/commoditys.service';
import { DespachosService } from '@/app/modules/main/services/despachos.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SaldoRequerimientoService } from '@/app/modules/main/services/saldo-requerimiento.service';
import { ConsolidacionService } from '@/app/services/consolidacion.service';
import { Usuario, Stock, OrdenCompra, DetalleDespacho, Despacho } from '@/app/shared/interfaces/Tables';
import { ItemPendienteConsolidacion } from '@/app/models/consolidacion.model';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

declare var bootstrap: any;

export enum EstadoRequerimiento {
  APROBADO = 'APROBADO',
  ATENCION_PARCIAL = 'ATENCION_PARCIAL',
  ATENCION_COMPLETA = 'ATENCION_COMPLETA',
  DESPACHADO_COMPLETO = 'DESPACHADO_COMPLETO',
}
@Component({
  selector: 'app-despachos',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DatePickerModule, NumeroRequerimientoPipe, DialogModule],
  templateUrl: './despacho.component.html',
  styleUrls: ['despacho.component.scss'],
})
export class DespachoComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  // Make Math available in template
  public Math = Math;

  // Services
  private saldoService = inject(SaldoRequerimientoService);
  private consolidacionService = inject(ConsolidacionService);

  // Listas principales
  requerimientosAprobadosAll: any[] = [];
  requerimientos: any[] = [];
  requerimientosAprobados: any[] = [];
  stockDisponible: Stock[] = [];
  saldosStock: any[] = [];
  ordenesCompraGeneradas: OrdenCompra[] = [];
  items: any[] = []; // detalle del requerimiento seleccionado
  turnos: any[] = [];
  labores: any[] = [];
  cecos: any[] = [];
  almacenes: any[] = [];
  clasificaciones: any[] = [];
  tipoGastos: any[] = [];
  servicios: any[] = [];
  servicioAF: any[] = [];
  servicioAFM: any[] = [];
  fundos: any[] = [];
  cultivos: any[] = [];
  areas: any[] = [];
  proyectos: any[] = [];
  detalle: any[] = []; // items a despachar (detalle atención)
  subcommodity: any[] = [];

  // Notificaciones
  notificaciones: any[] = [];
  notificacionesNoLeidas: number = 0;
  mostrarNotificaciones: boolean = false;

  filtroServicios: any[] = [];
  filtroServiciosAF: any[] = [];
  filtroServiciosAFM: any[] = [];

  filterItem: any[] = [];
  filterCommodity: any[] = [];

  filtro: string = '';
  totalRegistros: number = 0;
  pagina: number = 1;
  ordenColumna: string = '';
  ordenDireccion: 'asc' | 'desc' = 'asc';

  fechaInicio?: Date;
  fechaFin?: Date;

  // Nuevo diseño: tabs y filtros específicos
  activeTabDespachos: 'ITEMS' | 'COMMODITY' = 'ITEMS';
  filtroRequisicion: string = '';

  // Modal KPI detalle
  modalKpiVisible = false;
  modalKpiTitulo = '';
  modalKpiItems: any[] = [];

  abrirModalKpi(estado: string, titulo: string) {
    this.modalKpiItems = (this.requerimientosAprobadosAll || []).filter((r: any) => {
      if (estado === 'APROBADO') return r?.estados === 'APROBADO' || !r?.estados;
      if (estado === 'DESPACHADO') return (r?.estados || '').toString().toUpperCase().includes('DESPACHADO');
      if (estado === 'TOTAL') return true;
      return r?.estados === estado;
    });
    this.modalKpiTitulo = titulo;
    this.modalKpiVisible = true;
  }

  cerrarModalKpi() {
    this.modalKpiVisible = false;
    this.modalKpiItems = [];
  }

  abrirDesdeKpi(req: any) {
    this.cerrarModalKpi();
    setTimeout(() => this.verDetalle(req), 150);
  }

  /** KPI: requerimientos pendientes de atención (estado APROBADO). */
  get kpiPendientes(): number {
    return (this.requerimientosAprobadosAll || []).filter((r: any) => {
      const clas = (r?.idclasificacion || '').toString().toUpperCase();
      const esItem = !['SER', 'ACT', 'ACM'].includes(clas);
      return esItem && (r?.estados === 'APROBADO' || !r?.estados);
    }).length;
  }

  /** KPI: requerimientos con atención parcial pendientes de completar. */
  get kpiParciales(): number {
    return (this.requerimientosAprobadosAll || []).filter((r: any) => {
      const clas = (r?.idclasificacion || '').toString().toUpperCase();
      return !['SER', 'ACT', 'ACM'].includes(clas) && r?.estados === 'ATENCION_PARCIAL';
    }).length;
  }

  /** KPI: requerimientos sin stock, pendientes de atención cuando haya stock. */
  get kpiSinStock(): number {
    return (this.requerimientosAprobadosAll || []).filter((r: any) => {
      const clas = (r?.idclasificacion || '').toString().toUpperCase();
      return !['SER', 'ACT', 'ACM'].includes(clas) && r?.estados === 'SIN_STOCK';
    }).length;
  }

  /** Calcula el total de unidades pendientes de despacho en un requerimiento. */
  calcularPendienteTotal(r: any): number {
    if (!r?.detalle?.length) return 0;
    return r.detalle.reduce((acc: number, d: any) => {
      const solicitado = Number(d.cantidad) || 0;
      const atendido = Number(d.atendida) || 0;
      return acc + Math.max(0, solicitado - atendido);
    }, 0);
  }

  /** Toggle check de una línea del detalle en el modal. */
  toggleLineaDespacho(d: any): void {
    if (d.estadoAtencion === 'SIN STOCK') {
      d.seleccionado = false; // no se puede marcar si no hay stock
      return;
    }
    d.seleccionado = !d.seleccionado;
  }

  /** KPI: requerimientos atendidos (despachado completo). */
  get kpiAtendidos(): number {
    return (this.requerimientosAprobadosAll || []).filter((r: any) => {
      const clas = (r?.idclasificacion || '').toString().toUpperCase();
      const esItem = !['SER', 'ACT', 'ACM'].includes(clas);
      return esItem && (
        ['ATENCION_COMPLETA', 'DESPACHADO_COMPLETO'].includes(r?.estados) ||
        (r?.estados || '').toString().toUpperCase().includes('DESPACHADO')
      );
    }).length;
  }

  /** KPI: total de requerimientos cargados. */
  get kpiTotal(): number {
    return (this.requerimientosAprobadosAll || []).filter((r: any) => {
      const clas = (r?.idclasificacion || '').toString().toUpperCase();
      return !['SER', 'ACT', 'ACM'].includes(clas);
    }).length;
  }

  /** Datos visibles en la tabla según tab activo y filtros rápidos Requisición. */
  get despachosVisibles(): any[] {
    const base = this.requerimientosAprobados || [];
    const esItem = this.activeTabDespachos === 'ITEMS';
    return base.filter((r: any) => {
      // idclasificacion a nivel requerimiento: 'SER'=Servicio, 'ACT'=Activo Fijo, 'ACM'=Activo Menor → COMMODITY
      // Cualquier otro valor (o vacío) → ITEMS
      const clas = (r?.idclasificacion || '').toString().toUpperCase();
      const esCommodity = ['SER', 'ACT', 'ACM'].includes(clas);
      const coincideTab = esItem ? !esCommodity : esCommodity;
      if (!coincideTab) return false;
      if (this.filtroRequisicion?.trim()) {
        const req = (r?.RequisicionNumero || '').toString().toLowerCase();
        if (!req.includes(this.filtroRequisicion.trim().toLowerCase())) return false;
      }
      return true;
    });
  }

  /** Limpia todos los filtros del nuevo dashboard. */
  limpiarFiltrosDespacho() {
    this.filtroRequisicion = '';
    this.fechaInicio = undefined;
    this.fechaFin = undefined;
    this.filtro = '';
    this.buscar();
  }

  /**
   * Resuelve el nombre del área del **solicitante** del requerimiento.
   * Prioridades:
   *  1) `r.nombreArea` si viene del backend.
   *  2) cache por DNI+RUC (pre-poblado por `precargarAreasSolicitantes`).
   *  3) maestro `areas` filtrando por ruc e idarea.
   *  4) fallback: `r.idarea` como texto.
   */
  obtenerNombreArea(r: any): string {
    if (!r) return '-';
    if (r.nombreArea) return r.nombreArea;

    const dni = r.nrodocumento || r.dniregistra || r.usuarioregistra || '';
    const ruc = r.ruc || '';
    const cacheKey = `${ruc}|${dni}`;
    const cached = this.datosPorDni.get(cacheKey);
    if (cached?.area) return cached.area;

    const a = (this.areas || []).find(
      (x: any) => (!ruc || x.ruc == ruc) && x.idarea == r.idarea,
    );
    if (a) return a.descripcion ?? a.nombre ?? String(r.idarea);

    return r.idarea != null && r.idarea !== '' ? String(r.idarea) : '-';
  }

  /**
   * Resuelve el nombre del **solicitante** del requerimiento.
   * Prioridades:
   *  1) `r.nombreSolicitante` si viene del backend.
   *  2) cache por DNI+RUC (pre-poblado por `precargarAreasSolicitantes`).
   *  3) fallback: DNI.
   */
  obtenerNombreUsuario(r: any): string {
    if (!r) return '-';
    if (r.nombreSolicitante) return r.nombreSolicitante;

    const dni = r.nrodocumento || r.dniregistra || r.usuarioregistra || '';
    const ruc = r.ruc || '';
    const cacheKey = `${ruc}|${dni}`;
    const cached = this.datosPorDni.get(cacheKey);
    if (cached?.nombre) return cached.nombre;

    return dni || '-';
  }

  /**
   * Llama a `obtener-area-usuario` por cada combinación única de DNI+RUC
   * presente en `requerimientosAprobadosAll` y puebla la cache con área y nombre.
   * Se ejecuta después de cargar los aprobados.
   */
  private precargarAreasSolicitantes(): void {
    const filas = this.requerimientosAprobadosAll || [];
    const pendientes = new Map<string, { dni: string; ruc: string }>();

    for (const r of filas) {
      if (r?.nombreArea && r?.nombreSolicitante) continue; // ya viene del backend
      const dni = r?.nrodocumento || r?.dniregistra || r?.usuarioregistra || '';
      const ruc = r?.ruc || '';
      if (!dni) continue;
      const key = `${ruc}|${dni}`;
      if (this.datosPorDni.has(key) || pendientes.has(key)) continue;
      pendientes.set(key, { dni, ruc });
    }

    if (pendientes.size === 0) {
      this.hidratarDatosSolicitantes();
      return;
    }

    const calls = Array.from(pendientes.entries()).map(([key, { dni, ruc }]) =>
      this.aprobacionesAreaService
        .obtenerAreaUsuario({ documentoidentidad: dni, ruc })
        .pipe(catchError(() => of(null))),
    );
    const keys = Array.from(pendientes.keys());

    forkJoin(calls).subscribe((resultados: any[]) => {
      resultados.forEach((resp: any, idx: number) => {
        const item = Array.isArray(resp) ? resp[0] : resp;
        const area = item?.nombreArea || item?.descripcion || item?.nombreArea || '';
        const nombre = item?.nombre || item?.nombreCompleto || item?.nombres || item?.nombreUsuario || '';
        if (area || nombre) {
          this.datosPorDni.set(keys[idx], { area, nombre });
        }
      });
      this.hidratarDatosSolicitantes();
    });
  }

  /** Aplica la cache sobre cada fila seteando `r.nombreArea` y `r.nombreSolicitante` si los encontró. */
  private hidratarDatosSolicitantes(): void {
    for (const r of this.requerimientosAprobadosAll || []) {
      if (r.nombreArea && r.nombreSolicitante) continue;
      const dni = r.nrodocumento || r.dniregistra || r.usuarioregistra || '';
      const ruc = r.ruc || '';
      const cached = this.datosPorDni.get(`${ruc}|${dni}`);
      if (cached) {
        if (!r.nombreArea && cached.area) r.nombreArea = cached.area;
        if (!r.nombreSolicitante && cached.nombre) r.nombreSolicitante = cached.nombre;
      }
    }
  }

  /** Devuelve una familia/descripción representativa para la fila (commodity o item). */
  obtenerFamilia(r: any): string {
    const det = (r?.detalle || [])[0];
    if (!det) return '-';
    if ((r?.tipo || '').toString().toUpperCase() === 'ITEM') {
      return this.getDescripcionProducto(det?.codigo) || det?.descripcion || '-';
    }
    return this.getDescripcionSubCommodity(det?.codigo) || det?.descripcion || '-';
  }

  // Modal detalle despacho
  requerimientoSeleccionado: any = null;
  detalleDespacho: any[] = [];
  loading = false;
  selected: any = null;
  modalAtencionVisible = false;
  displayDetalle = false;
  detalleTodosSinStock = false;
  detalleAlgunoSinStock = false;
  kpiDespachados = 0;

  // ── Selección masiva ──────────────────────────────────────────────────────
  selectedRows: any[] = [];

  bloqueProgreso = false;
  bloqueProgresoActual = 0;
  bloqueProgresoTotal = 0;
  bloqueProgresoReqActual = '';
  bloqueProgresoLog: string[] = [];

  modalResumenVisible = false;
  resumenBloque: {
    exitosos:  { req: string; ns: string }[];
    parciales: { req: string; motivo: string }[];
    fallidos:  { req: string; error: string }[];
    omitidos:  { req: string }[];
  } = { exitosos: [], parciales: [], fallidos: [], omitidos: [] };
  // ─────────────────────────────────────────────────────────────────────────

  // Usuario
  usuario: Usuario = {
    id: '',
    sociedad: 0,
    idempresa: '',
    ruc: '',
    razonSocial: '',
    idProyecto: '',
    proyecto: '',
    documentoidentidad: '',
    usuario: '',
    clave: '',
    nombre: '',
    idrol: '',
    rol: '',
  };

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private notificationService: NotificationService,
    private notificacionApi: NotificacionApiService,
    private requerimientosService: RequerimientosService,
    private maestrasService: MaestrasService,
    private commodityService: CommodityService,
    private despachosService: DespachosService,
    private aprobacionesAreaService: AprobacionesAreaService,
  ) { }

  /** Cache: key = `${ruc}|${dni}` -> { area, nombre } del solicitante. */
  private datosPorDni: Map<string, { area: string; nombre: string }> = new Map();

  async ngOnInit() {
    await this.cargarUsuario();
    await this.sincronizarTablasMaestras();
    await this.sincronizaAprobados();
    // await this.cargarRequerimientosAprobados();
    await this.cargarStockDisponible();
    await this.cargarNotificaciones();
  }

  async cargarRequerimientos() {
    this.requerimientos = await this.dexieService.requerimientos
      .where('estados')
      .anyOf('APROBADO', 'ATENCION_PARCIAL', 'ATENCION_COMPLETA')
      .toArray();
  }

  async sincronizarTablasMaestras() {
    try {
      this.alertService.mostrarModalCarga();

      const fundos = this.maestrasService.getFundos([
        { idempresa: this.usuario.idempresa },
      ]);
      fundos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveFundos(resp);
          await this.ListarFundos();
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Exito!',
            'Sincronizado con exito',
            'success'
          );
        }
      });

      const cultivos = this.maestrasService.getCultivos([
        { idempresa: this.usuario?.idempresa },
      ]);
      cultivos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveCultivos(resp);
          await this.ListarCultivos();
        }
      });

      const areas = this.maestrasService.getAreas([
        { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' },
      ]);
      areas.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAreas(resp);
          await this.ListarAreas();
        }
      });

      const almacenes = this.maestrasService.getAlmacenes([
        { ruc: this.usuario?.ruc },
      ]);
      almacenes.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveAlmacenes(resp);
          await this.ListarAlmacenes();
        }
      });

      const proyectos = this.maestrasService.getProyectos([
        { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      proyectos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveProyectos(resp);
          await this.ListarProyectos();
        }
      });

      const items = this.maestrasService.getItems([{ ruc: this.usuario?.ruc }]);
      items.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveItemComoditys(resp);
          await this.ListarItems();
        }
      });

      const clasificaciones = this.maestrasService.getClasificaciones([{}]);
      clasificaciones.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveClasificaciones(resp);
          await this.ListarClasificaciones();
        }
      });

      const cecos = await this.maestrasService.getCecos([
        { aplicacion: 'LOGISTICA', esadmin: 0 },
      ]);
      cecos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveCecos(resp);
          await this.ListarCecos();
        }
      });

      const subcommodity = await this.commodityService.getSubCommodity([]);
      subcommodity.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveMaestroSubCommodities(resp);
          await this.ListarSubcommodity();
        }
      });

      const tipoGastos = this.maestrasService.getTipoGastos([{}]);
      tipoGastos.subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveTipoGastos(resp);
          await this.ListarTipoGastos();
        }
      });
    } catch (error: any) {
      console.error(error);
      this.alertService.showAlert(
        'Error!',
        '<p>Ocurrio un error</p><p>',
        'error'
      );
    }
  }

  async ListarFundos() {
    this.fundos = await this.dexieService.showFundos();
  }

  async ListarCultivos() {
    this.cultivos = await this.dexieService.showCultivos();
  }

  async ListarAreas() {
    this.areas = await this.dexieService.showAreas();
  }

  async ListarAlmacenes() {
    this.almacenes = await this.dexieService.showAlmacenes();
  }

  async ListarProyectos() {
    this.proyectos = await this.dexieService.showProyectos();
  }

  async ListarItems() {
    this.items = await this.dexieService.showItemComoditys();
    this.filterItem = this.items.filter((item) => item.tipoclasificacion === 'I');
  }

  async ListarClasificaciones() {
    this.clasificaciones = await this.dexieService.showClasificaciones();
  }

  async ListarTurnos() {
    this.turnos = await this.dexieService.showTurnos();
  }

  async ListarLabores() {
    this.labores = await this.dexieService.showLabores();
  }

  async ListarCecos() {
    this.cecos = await this.dexieService.showCecos();
  }

  async ListarSubcommodity() {
    this.subcommodity = await this.dexieService.showMaestroSubCommodity();
  }

  async ListarTipoGastos() {
    this.tipoGastos = await this.dexieService.showTipoGastos();
  }

  async ListarServicios() {
    this.servicios = await this.dexieService.showMaestroCommodity();
    this.filtroServicios = this.servicios.filter(
      (serv) => serv.clasificacion === 'SER'
    );
  }

  async ListarServiciosAF() {
    this.servicioAF = await this.dexieService.showMaestroCommodity();
    this.filtroServiciosAF = this.servicioAF.filter(
      (servaf) => servaf.clasificacion === 'ACT'
    );
  }

  async ListarServiciosAFM() {
    this.servicioAFM = await this.dexieService.showMaestroCommodity();
    this.filtroServiciosAFM = this.servicioAFM.filter(
      (servaf) => servaf.clasificacion === 'ATM'
    );
  }

  getDescripcionProducto(codigo: any) {
    const p = this.filterItem.find((x) => x.codigo === codigo);
    return p ? p.descripcion : codigo;
  }

  getDescripcionSubCommodity(codigo: any) {
    const p = this.subcommodity.find((x) => x.commodity === codigo);
    return p ? p.descripcionLocal : codigo;
  }

  obtenerProyectosUnicos(detalle: any[]): string[] {
    if (!detalle || !detalle.length) return [];

    return [...new Set(detalle.map(d => d.proyecto))];
  }

  verDetalle(r: any) {
    this.selected = r;
    this.detalle  = r.detalle || [];
    this.modalAtencionVisible = true;
    this.displayDetalle = true;

    // Calcular stock con datos en memoria (sincrónico)
    this.detalle.forEach((d: any) => {
      const solicitada = Number(d.cantidad) || 0;
      const atendida   = Number(d.atendida) || 0;
      const pendiente  = Math.max(0, solicitada - atendida);
      const stock      = this.obtenerStock(d.codigo, r.idalmacen);
      const atender    = Math.min(pendiente, stock);
      d.stock          = stock;
      d.pendiente      = pendiente;
      d.atender        = atender;
      d.compra         = Math.max(0, pendiente - stock);
      d.estadoAtencion = stock === 0 ? 'SIN STOCK' : stock < pendiente ? 'PARCIAL' : 'CON STOCK';
      d.seleccionado   = atender > 0;
    });

    // Calcular flags para template (no usar arrow functions en template)
    this.detalleTodosSinStock = this.detalle.length > 0 && this.detalle.every((d: any) => d.stock === 0);
    this.detalleAlgunoSinStock = this.detalle.some((d: any) => d.estadoAtencion !== 'CON STOCK');

    // Notificación toast en esquina superior derecha
    const numReq = r.RequisicionNumero || r.idrequerimiento || 'N/A';
    if (this.detalleTodosSinStock) {
      this.notificationService.warning(
        'Sin Stock Disponible',
        `El requerimiento ${numReq} no tiene stock para ningún ítem.`,
        7000
      );
    } else if (this.detalleAlgunoSinStock) {
      this.notificationService.warning(
        'Stock Insuficiente',
        `Algunos ítems del requerimiento ${numReq} no tienen stock suficiente.`,
        5000
      );
    }
  }

  cerrarModalAtencion() {
    this.modalAtencionVisible = false;
  }

  /**
   * Registra el requerimiento como SIN_STOCK:
   * 1. Cierra el modal
   * 2. Muestra alerta informativa
   * 3. Actualiza Dexie y BD
   * 4. Recarga la lista y los KPIs en tiempo real
   */
  async registrarComoSinStock(itemsDetalle?: any[]) {
    if (!this.selected) return;

    const yaEraSinStock = this.selected.estados === 'SIN_STOCK';
    const items = itemsDetalle || this.detalle || [];
    const numReq = this.selected?.RequisicionNumero || this.selected?.idrequerimiento || 'N/A';

    if (yaEraSinStock) {
      // Requerimiento ya en SIN_STOCK: NO cerrar modal, solo toast informativo
      // El almacenero puede ver los ítems con stock=0 en la tabla del modal
      this.notificationService.info(
        'Sin Stock registrado',
        `Requerimiento ${numReq} ya está en estado SIN STOCK. Los ítems se muestran sin stock disponible.`,
        6000
      );
      return;
    }

    // 1️⃣ Cerrar modal (solo cuando es la primera vez que se registra como SIN_STOCK)
    this.cerrarModalAtencion();

    // 2️⃣ Actualizar Dexie inmediatamente → KPI reactivo
    const reqDexie = await this.dexieService.requerimientos
      .where('idrequerimiento').equals(this.selected.idrequerimiento).first();
    if (reqDexie) {
      reqDexie.estados = 'SIN_STOCK';
      await this.dexieService.requerimientos.put(reqDexie);
    }

    // 3️⃣ Recargar lista → KPI SIN_STOCK +1 en tiempo real, tabla actualiza badge
    await this.cargarRequerimientosAprobados();

    // 4️⃣ Alerta informativa (modal ya cerrado)
    const mensajeItems = items.length
      ? items.map((item: any) =>
          `• ${item.codigo || item.producto}: Solicitado ${item.cantidadSolicitada ?? item.cantidad ?? '-'}, Disponible ${item.stockDisponible ?? item.stock ?? 0}`
        ).join('\n')
      : 'Sin detalles disponibles';

    this.alertService.showAlert(
      'Sin Stock — Requerimiento Registrado',
      `El requerimiento ${numReq} quedó registrado como SIN STOCK.\n\n${mensajeItems}\n\nSe notificó al solicitante y al almacenero.`,
      'warning'
    );

    // 5️⃣ Guardar estado en BD
    this.despachosService.actualizarEstadoRequerimiento([{
      idrequerimiento: this.selected.idrequerimiento,
      estados: 'SIN_STOCK',
      usuario: this.usuario.documentoidentidad
    }]).subscribe({
      next: () => console.log('✅ SIN_STOCK guardado en BD'),
      error: err => console.error('Error guardando SIN_STOCK en BD:', err)
    });

    // 6️⃣ Notificar al solicitante (una vez por item)
    for (const item of items) {
      await this.notificacionApi.insertarNotificacionStock({
        iditem: item.codigo || item.producto,
        itemDescripcion: item.producto || item.codigo,
        mensaje: `Tu requerimiento ${numReq} no pudo ser atendido por falta de stock. Ítem: ${item.codigo} - Solicitado: ${item.cantidadSolicitada ?? item.cantidad ?? '-'}, Disponible: ${item.stockDisponible ?? item.stock ?? 0}. Será atendido cuando haya stock.`,
        idrequerimiento: this.selected?.idrequerimiento || 0,
        tipo_notificacion: 'SIN_STOCK'
      }).catch(() => {});
    }

    // 7️⃣ Notificar al operador de almacén
    for (const item of items) {
      await this.notificacionApi.registrarNotificacionAlmacen({
        iditem: item.codigo || item.producto,
        id_dreq: String(this.selected?.idrequerimiento || ''),
        itemDescripcion: item.producto || item.codigo,
        mensaje: `⚠️ SIN STOCK - Requerimiento ${numReq} pendiente. Ítem: ${item.codigo} - Solicitado: ${item.cantidadSolicitada ?? item.cantidad ?? '-'}, Disponible: ${item.stockDisponible ?? item.stock ?? 0}.`,
        tipo_notificacion: 'SIN_STOCK'
      }).catch(() => {});
    }
  }

  buscar() {
    this.pagina = 1;
    this.aplicarFiltros();
    if (this.table) {
      this.table.first = 0; // 👈 vuelve a la página 1
    }
  }

  aplicarFiltros() {
    // La tabla solo muestra pendientes; los despachados van al KPI modal
    let data = (this.requerimientosAprobadosAll || []).filter((r: any) => {
      const est = (r?.estados || '').toString().toUpperCase();
      return !est.includes('DESPACHADO') && r?.estados !== 'ATENCION_COMPLETA';
    });

    if (this.filtro.trim().length > 0) {
      const f = this.filtro.toLowerCase();

      data = data.filter(
        (x) =>
          x.glosa?.toLowerCase().includes(f) ||
          x.tipo?.toLowerCase().includes(f) ||
          x.idrequerimiento?.toString().includes(f) ||
          x.RequisicionNumero?.toLowerCase().includes(f) ||
          x.estados?.toLowerCase().includes(f) ||
          this.formatearFecha(x.fechaAprobacion).includes(f) ||
          x.detalle?.some((d: any) =>
            d.proyecto?.toLowerCase().includes(f))
      );
    }

    // Separar: primero ATENCION_PARCIAL, luego SIN_STOCK, luego APROBADO
    data.sort((a: any, b: any) => {
      const orden: Record<string, number> = { 'ATENCION_PARCIAL': 0, 'SIN_STOCK': 1, 'APROBADO': 2 };
      const oa = orden[a.estados] ?? 3;
      const ob = orden[b.estados] ?? 3;
      if (oa !== ob) return oa - ob;
      // Secundario: fecha descendente
      return new Date(b.fechaAprobacion || 0).getTime() - new Date(a.fechaAprobacion || 0).getTime();
    });

    /* 📅 FILTRO POR RANGO DE FECHAS */
    if (this.fechaInicio || this.fechaFin) {
      data = data.filter(x => {
        const fecha = new Date(x.fechaAprobacion);

        if (this.fechaInicio && fecha < this.fechaInicio) return false;
        if (this.fechaFin && fecha > this.fechaFin) return false;

        return true;
      });
    }

    // Ordenamiento si deseas mantenerlo
    if (this.ordenColumna) {
      data.sort((a: any, b: any) => {
        const valorA = a[this.ordenColumna] ?? '';
        const valorB = b[this.ordenColumna] ?? '';

        return this.ordenDireccion === 'asc'
          ? valorA > valorB
            ? 1
            : -1
          : valorA < valorB
            ? 1
            : -1;
      });
    }

    this.requerimientosAprobados = data;
    this.totalRegistros = data.length;
  }

  limpiarFecha() {
    // si ambas fechas están vacías → vuelve a todo
    if (!this.fechaInicio && !this.fechaFin) {
      this.buscar();
    }
  }

  calcularAtencion(d: any): number {
    const solicitada = Number(d.cantidad) || 0;
    const atendida = Number(d.atendida) || 0;
    const pendiente = Math.max(0, solicitada - atendida);

    const almacen = this.selected?.idalmacen || '';
    const stockDisponible = this.obtenerStock(d.codigo, almacen);

    return Math.max(0, Math.min(pendiente, stockDisponible));
  }

  /**
   * Valida y fuerza los límites de la cantidad a atender.
   * - No puede atender más del pendiente (cantidad - atendida)
   * - No puede atender más del stock disponible
   * - No puede ser negativo
   */
  validarCantidadAtender(d: any): void {
    const solicitada = Number(d.cantidad) || 0;
    const atendida = Number(d.atendida) || 0;
    const pendiente = Math.max(0, solicitada - atendida);
    const stock = Number(d.stock) || 0;
    let atender = Number(d.atender) || 0;

    // Forzar mínimo 0
    if (atender < 0) {
      atender = 0;
    }

    // No puede atender más del pendiente
    if (atender > pendiente) {
      atender = pendiente;
      this.notificationService.warning(
        'Cantidad ajustada',
        `Solo puede despachar ${pendiente} unidades pendientes.`,
        3000
      );
    }

    // No puede atender más del stock disponible
    if (atender > stock) {
      atender = stock;
      this.notificationService.warning(
        'Stock insuficiente',
        `Solo hay ${stock} unidades disponibles en almacén.`,
        3000
      );
    }

    d.atender = atender;

    // Recalcular pendiente de atención (compra)
    const nuevoPendiente = Math.max(0, pendiente - atender);
    d.compra = Math.max(0, nuevoPendiente - stock);
  }

  // async registrarAtencion() {
  //   if (!this.detalle.length) {
  //     this.alertService.showAlert(
  //       'Aviso',
  //       'No hay items para despachar',
  //       'warning'
  //     );
  //     return;
  //   }

  //   try {
  //     this.alertService.mostrarModalCarga();

  //     // Preparar el body para el SP LOGISTICA_generarSalidaNSWH_JSON
  //     // Formatear fecha con hora: "2026-01-27 10:40:05"
  //     const ahora = new Date();
  //     const fechaFormateada = ahora.toISOString().slice(0, 10) + ' ' + ahora.toTimeString().slice(0, 8);

  //     // CompaniaSocio debe ser 8 caracteres (ej: "00000800")
  //     const companiaSocio = (this.usuario.idempresa || '').padStart(6, '0') + '00';

  //     // RequisicionNumero debe ser 10 caracteres (ej: "0000006070")
  //     const requisicionNumero = (this.selected.RequisicionNumero || '').padStart(10, '0');

  //     const body = [
  //       {
  //         CompaniaSocio: companiaSocio,
  //         RequisicionNumero: requisicionNumero,
  //         AlmacenCodigo: this.selected.idalmacen || 'H001',
  //         Periodo: new Date().toISOString().slice(0, 7).replace('-', ''), // YYYYMM
  //         UltimoUsuario: this.usuario.usuario || 'MISESF',
  //         TipoCambio: 3.356,
  //         FechaDocumento: fechaFormateada,
  //         Proyecto: this.selected.proyecto || this.selected.Proyecto || 'REQ',
  //         detalle: this.detalle
  //           .filter((d: any) => (d.atender || 0) > 0)
  //           .map((d: any, index: number) => ({
  //             Secuencia: index + 1,
  //             Item: d.codigo,
  //             Condicion: d.condicion || '0',
  //             UnidadCodigo: d.unidadMedida || d.unidad || 'UND',
  //             Cantidad: d.atender || d.cantidad,
  //             Lote: d.lote || '00',
  //             CentroCosto: d.centroCosto || this.selected.centroCosto || '11020',
  //             Actividad: d.actividad || '0502'
  //           }))
  //       }
  //     ];

  //     console.log('📦 JSON enviado al SP:', JSON.stringify(body, null, 2));

  //     // Llamar al service para generar la salida NS
  //     this.despachosService.generarSalidaNS(body).subscribe({
  //       next: async (response: any) => {
  //         this.alertService.cerrarModalCarga();

  //         const resultado = response?.resultado || response;
  //         const errorGeneral = resultado?.errorgeneral || 0;

  //         if (errorGeneral === 0) {
  //           // Éxito: actualizar detalles en Dexie
  //           for (const d of this.detalle) {
  //             const registro = await this.dexieService.detalles
  //               .where('idrequerimiento')
  //               .equals(this.selected.idrequerimiento)
  //               .and((x) => x.codigo === d.codigo)
  //               .first();

  //             if (registro) {
  //               registro.atendida = (registro.atendida || 0) + (d.atender || d.cantidad);
  //               await this.dexieService.detalles.put(registro);
  //             }
  //           }

  //           // Actualizar estado del requerimiento a 'DESPACHADO' en Dexie
  //           const requerimiento = await this.dexieService.requerimientos
  //             .where('idrequerimiento')
  //             .equals(this.selected.idrequerimiento)
  //             .first();

  //           if (requerimiento) {
  //             requerimiento.estados = 'DESPACHADO';
  //             await this.dexieService.requerimientos.put(requerimiento);
  //           }

  //           // Actualizar estado en la base de datos LOGISTICA
  //           const bodyEstado = [{
  //             idrequerimiento: this.selected.idrequerimiento,
  //             estados: 'DESPACHADO',
  //             usuario: this.usuario.documentoidentidad
  //           }];

  //           this.despachosService.actualizarEstadoRequerimiento(bodyEstado).subscribe({
  //             next: (respEstado: any) => {
  //               console.log('Estado actualizado en BD LOGISTICA:', respEstado);
  //             },
  //             error: (errEstado: any) => {
  //               console.error('Error al actualizar estado en BD LOGISTICA:', errEstado);
  //             }
  //           });

  //           this.alertService.showAlert(
  //             'Éxito',
  //             `Salida NS generada: ${resultado.NumeroDocumento || 'N/A'}`,
  //             'success'
  //           );

  //           // Cerrar modal
  //           this.modalAtencionVisible = false;

  //           this.detalle = [];
  //           this.selected = null;

  //           // Recargar lista (excluirá los DESPACHADOS porque solo muestra APROBADOS)
  //           await this.cargarRequerimientosAprobados();
  //         } else {
  //           // Error en el SP
  //           const errores = resultado?.detalle || [];
  //           const mensajeError = errores.map((e: any) => `${e.id}: ${e.error}`).join('\n');
  //           this.alertService.showAlert(
  //             'Error',
  //             `No se pudo generar la salida NS:\n${mensajeError}`,
  //             'error'
  //           );
  //         }
  //       },
  //       error: (error: any) => {
  //         console.error('Error al generar salida NS:', error);
  //         this.alertService.cerrarModalCarga();
  //         this.alertService.showAlert(
  //           'Error',
  //           'Error al generar salida NS en SPRING',
  //           'error'
  //         );
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error en registrarAtencion:', error);
  //     this.alertService.cerrarModalCarga();
  //     this.alertService.showAlert(
  //       'Error',
  //       'Error al procesar la atención',
  //       'error'
  //     );
  //   }
  // }

  async registrarAtencion() {
    if (!this.detalle || !this.detalle.length) {
      this.alertService.showAlert(
        'Aviso',
        'No hay items para despachar',
        'warning'
      );
      return;
    }

    // 🔹 Filtrar SOLO las líneas marcadas con check Y con cantidad > 0
    const detalleAtendido = this.detalle.filter(
      (d: any) => d.seleccionado && (d.atender || 0) > 0
    );

    // 🔹 Validar que no se atienda más del pendiente (seguridad adicional)
    const itemsExcedidos = detalleAtendido.filter((d: any) => {
      const solicitada = Number(d.cantidad) || 0;
      const atendida = Number(d.atendida) || 0;
      const pendiente = Math.max(0, solicitada - atendida);
      const atender = Number(d.atender) || 0;
      return atender > pendiente;
    });

    if (itemsExcedidos.length > 0) {
      const mensaje = itemsExcedidos.map((d: any) =>
        `• ${d.codigo}: Intenta atender ${d.atender} pero solo hay ${Math.max(0, (Number(d.cantidad) || 0) - (Number(d.atendida) || 0))} pendientes`
      ).join('\n');

      this.alertService.showAlert(
        'Cantidad excedida',
        `Los siguientes ítems exceden la cantidad pendiente:\n${mensaje}`,
        'warning'
      );
      return;
    }

    // Si no hay ítems con stock (atender > 0), registrar como SIN_STOCK directamente
    const todosItemsSinStock = this.detalle.every((d: any) => (d.atender || 0) === 0);
    if (!detalleAtendido.length && todosItemsSinStock) {
      await this.registrarComoSinStock(this.detalle);
      return;
    }

    if (!detalleAtendido.length) {
      this.alertService.showAlert(
        'Aviso',
        'No hay ítems seleccionados para despachar. Marque al menos una línea con stock disponible.',
        'warning'
      );
      return;
    }

    // 🔹 Validar stock usando LOGISTICA_ValidarStockItems antes de enviar al SP
    const idalmacen = this.selected?.idalmacen || 'H001';
    const itemsParaValidar = detalleAtendido.map((d: any) => ({
      codigo: d.codigo.substring(0, 6), // Normalizar a primeros 6 caracteres (000078)
      producto: d.descripcion || d.producto || d.codigo,
      cantidad: d.atender
    }));

    console.log('📦 Validando stock antes de registrar atención:', { idalmacen, items: itemsParaValidar });

    try {
      const resultadoValidacion = await this.despachosService.validarStockItems(idalmacen, itemsParaValidar).toPromise();
      console.log('📦 Resultado validación stock (completo):', JSON.stringify(resultadoValidacion, null, 2));
      console.log('📦 Items sin stock filtrados:', (resultadoValidacion || []).filter(
        (item: any) => item.estadoStock === 'SIN_STOCK' || item.estadoStock === 'PARCIAL'
      ));

      const itemsSinStock = (resultadoValidacion || []).filter(
        (item: any) => item.estadoStock === 'SIN_STOCK' || item.estadoStock === 'PARCIAL'
      );

      if (itemsSinStock.length > 0) {
        await this.registrarComoSinStock(itemsSinStock);
        return;
      }
    } catch (error) {
      console.error('Error al validar stock:', error);
      this.alertService.showAlert(
        'Error',
        'Error al validar stock antes de registrar atención',
        'error'
      );
      return;
    }

    // 🔹 Obtener AFE del proyecto (buscar por nombre del proyecto en maestras)
    const primerDetalle = detalleAtendido[0];
    const proyectoNombre = primerDetalle?.proyecto || this.selected?.proyecto;
    const proyectoAfeDefault = this.proyectos?.find(p => p.proyectoio === proyectoNombre)?.afe 
      || 'FUNDO HP';
    
    console.log('📌 Nombre del proyecto:', proyectoNombre);
    console.log('📌 AFE a enviar:', proyectoAfeDefault);

    if (!detalleAtendido.length) {
      this.alertService.showAlert(
        'Aviso',
        'No hay cantidades válidas para despachar',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      /* ---------------------------------------------------------
       * FORMATEOS
       * --------------------------------------------------------- */

      // Fecha: yyyy-MM-dd HH:mm:ss
      const ahora = new Date();
      const fechaFormateada =
        ahora.toISOString().slice(0, 10) +
        ' ' +
        ahora.toTimeString().slice(0, 8);

      // CompaniaSocio (8)
      const companiaSocio =
        ((this.usuario?.idempresa || '').padStart(6, '0')) + '00';

      // RequisicionNumero (10)
      const requisicionNumero =
        (this.selected?.RequisicionNumero || '').padStart(10, '0');

      /* ---------------------------------------------------------
       * JSON PARA EL SP
       * --------------------------------------------------------- */
      const body = [
        {
          CompaniaSocio: companiaSocio,
          RequisicionNumero: requisicionNumero,
          AlmacenCodigo: this.selected?.idalmacen || 'H001',
          Periodo: new Date().toISOString().slice(0, 7).replace('-', ''),
          UltimoUsuario: this.usuario?.usuario || 'SYSTEM' || -1,
          TipoCambio: 3.356,
          FechaDocumento: fechaFormateada,
          Proyecto: proyectoAfeDefault,

          detalle: detalleAtendido.map((d: any, index: number) => ({
            Secuencia: index + 1,
            Item: d.codigo.substring(0, 6), // Normalizar a primeros 6 caracteres para SPRING
            Condicion: d.condicion || '0',
            UnidadCodigo: d.unidadMedida || d.unidad || 'UND',
            Cantidad: d.atender,
            Lote: d.lote || '00',
            CentroCosto:
              d.centroCosto || this.selected?.centroCosto || '11020',
            Actividad: d.actividad || '0502'
          }))
        }
      ];

      console.log('📦 JSON enviado al SP:', JSON.stringify(body, null, 2));

      /* ---------------------------------------------------------
       * LLAMADA AL SP
       * --------------------------------------------------------- */
      this.despachosService.generarSalidaNS(body).subscribe({
        next: async (response: any) => {
          this.alertService.cerrarModalCarga();

          // Manejar respuesta como array o como objeto con propiedad resultado
          let resultado = response?.resultado || response;
          if (Array.isArray(resultado)) {
            resultado = resultado[0];
          }

          if (!resultado) {
            this.alertService.showAlert(
              'Error',
              'Respuesta inválida del servidor',
              'error'
            );
            return;
          }

          /* -----------------------------------------------------
           * ERROR GENERAL
           * ----------------------------------------------------- */
          if (resultado.errorgeneral !== 0) {
            const errores = resultado.detalle || [];
            
            // Construir mensaje de error detallado
            let mensajeError = resultado.mensajeError || 'Error desconocido';
            if (errores.length > 0) {
              const detalleErrores = errores
                .map((e: any) => `• ${e.id}: ${e.error}`)
                .join('\n');
              mensajeError = `${mensajeError}\n\n${detalleErrores}`;
            }

            // Determinar si es error de stock
            const esErrorStock = mensajeError.toLowerCase().includes('stock');
            
            if (esErrorStock) {
              // Identificar items sin stock
              const itemsSinStock = this.detalle.filter((d: any) => {
                const stock = this.obtenerStock(d.codigo, this.selected?.idalmacen || '');
                const cantidadTotal = Number(d.cantidad) || 0;
                const cantidadAtendida = Number(d.atendida || 0);
                const cantidadPorAtender = d.atender || 0;
                const saldoPendiente = cantidadTotal - cantidadAtendida - cantidadPorAtender;
                return saldoPendiente > 0 && stock <= 0;
              });

              if (itemsSinStock.length > 0) {
                // Manejar saldo pendiente con opciones
                await this.manejarSaldoPendienteSinStock(
                  itemsSinStock,
                  this.selected
                );
                return;
              }
            }

            // Si no es error de stock o no hay items sin stock, mostrar error normal
            this.alertService.showAlert('Error', mensajeError, 'error');
            return;
          }

          /* -----------------------------------------------------
           * ÉXITO → ACTUALIZAR DEXIE (SOLO LO ATENDIDO)
           * ----------------------------------------------------- */
          for (const d of detalleAtendido) {
            const registro = await this.dexieService.detalles
              .where('idrequerimiento')
              .equals(this.selected.idrequerimiento)
              .and(x => x.codigo === d.codigo)
              .first();

            if (registro) {
              registro.atendida = (registro.atendida || 0) + d.atender;
              await this.dexieService.detalles.put(registro);
            }
          }

          /* -----------------------------------------------------
           * ACTUALIZAR ESTADO REQUERIMIENTO
           * ----------------------------------------------------- */
          const requerimiento = await this.dexieService.requerimientos
            .where('idrequerimiento')
            .equals(this.selected.idrequerimiento)
            .first();

          if (requerimiento) {
            // Calcular estado real: DESPACHADO solo si TODOS los items están atendidos en su totalidad
            const todosAtendidos = this.detalle.every((d: any) => {
              const totalAtendidoNuevo = (Number(d.atendida) || 0) +
                (detalleAtendido.find((x: any) => x.codigo === d.codigo)?.atender || 0);
              return totalAtendidoNuevo >= (Number(d.cantidad) || 0);
            });
            requerimiento.estados = todosAtendidos ? 'DESPACHADO' : 'ATENCION_PARCIAL';
            await this.dexieService.requerimientos.put(requerimiento);
          }

          /* -----------------------------------------------------
           * CALCULAR ESTADO FINAL (para Dexie, BD y SP)
           * ----------------------------------------------------- */
          const todosAtendidos = this.detalle.every((d: any) => {
            const totalAtendidoNuevo = (Number(d.atendida) || 0) +
              (detalleAtendido.find((x: any) => x.codigo === d.codigo)?.atender || 0);
            return totalAtendidoNuevo >= (Number(d.cantidad) || 0);
          });
          const estadoFinal = todosAtendidos ? 'DESPACHADO' : 'ATENCION_PARCIAL';

          /* -----------------------------------------------------
           * BD LOGISTICA - Registrar Despacho
           * ----------------------------------------------------- */
          const bodyDespacho = {
            idrequerimiento: this.selected.idrequerimiento,
            usuario: this.usuario.documentoidentidad,
            observacion: `Despacho generado - NS: ${resultado.NumeroDocumento}`,
            numeroNS: resultado.NumeroDocumento,
            estado: estadoFinal,
            detalle: detalleAtendido.map(d => ({
              codigo: d.codigo,
              solicitado: d.cantidad,
              despachado: d.atender,
              pendiente: Math.max(0, (Number(d.cantidad) || 0) - (Number(d.atendida) || 0) - (d.atender || 0))
            }))
          };

          this.despachosService.registrarDespacho(bodyDespacho).subscribe({
            next: () => console.log('✅ Despacho registrado en BD local con estado:', estadoFinal),
            error: err => console.error('Error registrando despacho:', err)
          });

          /* -----------------------------------------------------
           * VERIFICAR Y NOTIFICAR STOCK PARCIAL
           * ----------------------------------------------------- */
          
          // Identificar items con despacho parcial (sin async en filter)
          const itemsParciales: any[] = [];
          for (const d of detalleAtendido) {
            const solicitada = Number(d.cantidad) || 0;
            const atendida = Number(d.atendida) || 0;
            const totalAtendido = await this.getTotalAtendido(d.codigo);
            const pendiente = solicitada - totalAtendido - atendida;
            
            if (pendiente > 0 && atendida > 0) {
              // Tiene algo atendido pero le falta más
              itemsParciales.push({
                ...d,
                totalAtendido,
                pendiente,
                despachadoAhora: atendida
              });
            }
          }

          // Notificar al solicitante sobre despacho parcial y guardar saldo en BD
          if (itemsParciales.length > 0) {
            console.log('📝 Detectando stock parcial, notificando al solicitante...');
            
            for (const item of itemsParciales) {
              await this.notificacionApi.insertarNotificacionStock({
                iditem: item.codigo,
                itemDescripcion: item.descripcion || item.producto,
                mensaje: `Se ha despachado parcialmente tu requerimiento ${this.selected?.numero || this.selected?.idrequerimiento || 'N/A'}. Item: ${item.codigo} - ${item.descripcion || item.producto}. Despachado: ${item.despachadoAhora}, Pendiente: ${item.pendiente} de ${item.cantidad} unidades.`,
                idrequerimiento: this.selected?.idrequerimiento || 0,
                tipo_notificacion: 'DESPACHO_PARCIAL'
              });
            }

            // Guardar saldo pendiente en BD para que aparezca cuando haya stock
            try {
              const itemsFaltantesParaSaldo = itemsParciales.map(item => ({
                codigo: item.codigo,
                descripcion: item.descripcion || item.producto,
                cantidad: item.cantidad,
                atendida: item.totalAtendido + item.despachadoAhora,
                faltante: item.pendiente,
                unidadMedida: item.unidadMedida || 'UND'
              }));
              await this.crearSaldosPendientes(itemsFaltantesParaSaldo, estadoFinal);
              console.log('✅ Saldo pendiente parcial registrado en BD:', itemsFaltantesParaSaldo.length, 'items');
            } catch (errSaldo) {
              console.error('⚠️ No se pudo registrar saldo pendiente parcial:', errSaldo);
            }
            
            // Mostrar mensaje al operador sobre notificaciones enviadas
            this.notificationService.info(
              'Despacho Parcial',
              `Se ha notificado al solicitante sobre el despacho parcial de ${itemsParciales.length} item(s). El saldo pendiente quedó registrado para atención cuando haya stock.`,
              6000
            );
          }

          /* -----------------------------------------------------
           * BD LOGISTICA - Actualizar Estado Requerimiento
           * ----------------------------------------------------- */
          const bodyEstado = [
            {
              idrequerimiento: this.selected.idrequerimiento,
              estados: estadoFinal,
              usuario: this.usuario.documentoidentidad
            }
          ];

          this.despachosService.actualizarEstadoRequerimiento(bodyEstado).subscribe({
            next: () => { },
            error: err =>
              console.error('Error actualizando estado LOGISTICA:', err)
          });

          /* -----------------------------------------------------
           * NOTIFICAR AL SOLICITANTE (OPLOGIST)
           * ----------------------------------------------------- */
          const dniSolicitante = this.selected?.dniregistra
            || this.selected?.nrodocumento
            || this.selected?.usuarioregistra
            || '';

          if (dniSolicitante) {
            const numReq = this.selected?.numero || this.selected?.idrequerimiento || 'N/A';
            if (todosAtendidos) {
              await this.notificacionApi.registrarNotificacionSolicitante({
                usuario_destino: dniSolicitante,
                id_dreq: String(this.selected?.idrequerimiento || '0'),
                mensaje: `Tu requerimiento de consumo ${numReq} ha sido despachado completamente. NS: ${resultado.NumeroDocumento}.`,
                tipo_notificacion: 'DESPACHO_REALIZADO'
              }).catch(() => {});
            }
          }

          /* -----------------------------------------------------
           * UI - Mostrar mensaje por 3 segundos
           * ----------------------------------------------------- */
          const mensajeEstado = todosAtendidos
            ? `Salida NS generada correctamente: ${resultado.NumeroDocumento}. Requerimiento DESPACHADO.`
            : `Salida NS generada: ${resultado.NumeroDocumento}. El requerimiento queda en ATENCIÓN PARCIAL con ítems pendientes.`;

          this.alertService.showAlert(
            todosAtendidos ? 'Despacho Completo' : 'Atención Parcial',
            mensajeEstado,
            todosAtendidos ? 'success' : 'warning'
          );

          this.cerrarModalAtencion();
          this.detalle = [];
          this.selected = null;

          /* -----------------------------------------------------
           * TODO: Navegación a Compras para consolidar requerimientos
           * no atendidos. Descomentar cuando esté listo el módulo.
           * ----------------------------------------------------- */
          // setTimeout(() => {
          //   // Navegar a módulo de compras para consolidación
          //   this.router.navigate(['/main/compras'], {
          //     queryParams: {
          //       consolidar: true,
          //       idrequerimiento: this.selected?.idrequerimiento
          //     }
          //   });
          // }, 3000); // Esperar 3 segundos para que usuario vea el mensaje

          await this.cargarRequerimientosAprobados();
        },

        error: err => {
          console.error('Error al generar salida NS:', err);
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Error',
            'Error al generar salida NS en SPRING',
            'error'
          );
        }
      });
    } catch (error) {
      console.error('Error en registrarAtencion:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Error inesperado al procesar la atención',
        'error'
      );
    }
  }


  async abrirDespachoFinal(req: any) {
    this.selected = req;

    this.detalleDespacho = await this.dexieService.detalles
      .where('idrequerimiento')
      .equals(req.idrequerimiento)
      .toArray();

    new bootstrap.Modal(document.getElementById('modalDespacho')).show();
  }

  // async confirmarDespacho() {
  //   try {
  //     for (const d of this.detalleDespacho) {

  //       // Validar stock antes
  //       const stockActual = this.obtenerStock(d.codigo, d.almacen);
  //       if (stockActual < d.atendida) {
  //         this.alertService.showAlert(
  //           'Stock insuficiente',
  //           `No hay stock suficiente para ${d.producto}`,
  //           'warning'
  //         );
  //         return;
  //       }

  //       // Descontar stock (por almacén)
  //       await this.actualizarStock(d.codigo, d.almacen, -d.atendida);
  //     }

  //     // Estado correcto según lógica
  //     this.selected.estado = EstadoRequerimiento.DESPACHADO_COMPLETO;

  //     await this.dexieService.requerimientos.put(this.selected);

  //     this.alertService.showAlert(
  //       'Despacho',
  //       'Salida registrada correctamente',
  //       'success'
  //     );

  //     this.cargarRequerimientos();

  //   } catch (error) {
  //     console.error(error);
  //     this.alertService.showAlert(
  //       'Error',
  //       'Ocurrió un error al confirmar el despacho',
  //       'error'
  //     );
  //   }
  // }

  async confirmarDespacho() {
    try {

      // 🔒 Validación básica
      if (!this.selected || !this.detalleDespacho.length) {
        this.alertService.showAlert(
          'Despacho',
          'No hay información para despachar',
          'warning'
        );
        return;
      }

      const usuario = (await this.dexieService.getUsuarioLogueado())?.usuario || 'SYSTEM';

      // 🔹 Cabecera despacho
      const despacho: Despacho = {
        numeroDespacho: `DES-${Date.now()}`,
        fecha: new Date().toISOString(),
        almacen: this.selected.idalmacen,
        usuarioDespacha: usuario,
        estado: 'PENDIENTE',
        detalle: [],
      };

      let atender: any | number = 0;

      for (const d of this.detalleDespacho) {
        atender = this.calcularAtencion(d); // 🔥 CLAVE
        if (atender <= 0) continue;
        // 🔻 Descontar stock
        await this.actualizarStock(d.codigo, this.selected.almacen, -atender);
      }

      // 🔹 Detalle despacho
      const detalles: DetalleDespacho[] = this.detalleDespacho.map(d => ({
        despachoId: 0, // se asigna en Dexie
        detalleRecepcionId: d.id || 0,
        codigo: d.codigo,
        descripcion: d.producto,
        cantidad: atender,
        unidadMedida: d.unidadMedida || '',
        precioUnitario: 0,
        descuento: 0,
        subtotal: 0,
        impuesto: 0,
        total: 0,
        estado: 'COMPLETO'
      }));

      // 🚀 Confirmar despacho completo
      const despachoId = await this.dexieService.confirmarDespachoCompleto(
        despacho,
        detalles,
        usuario,
        this.selected
      );

      // ✅ UI feedback
      this.alertService.showAlert(
        'Despacho',
        `Despacho N° ${despachoId} confirmado correctamente`,
        'success'
      );

      // 🔄 Refrescar data
      await this.cargarRequerimientos();
      await this.cargarStockDisponible();

      // ❌ Cerrar modal
      const modal = document.getElementById('modalDespacho');
      if (modal) {
        (window as any).bootstrap.Modal.getInstance(modal)?.hide();
      }

    } catch (error: any) {

      console.error('Error confirmando despacho:', error);

      this.alertService.showAlert(
        'Error',
        error?.message || 'No se pudo confirmar el despacho',
        'error'
      );
    }
  }


  generarNumeroDespacho(): string {
    const fecha = new Date();
    return `DSP-${fecha.getFullYear()}${(fecha.getMonth() + 1)
      .toString().padStart(2, '0')}${fecha.getDate()
        .toString().padStart(2, '0')}-${Date.now()}`;
  }

  async guardarDespacho(): Promise<number> {
    const despacho: Despacho = {
      numeroDespacho: this.generarNumeroDespacho(),
      fecha: new Date().toISOString(),
      almacen: this.selected.almacen,
      usuarioDespacha: this.usuario.documentoidentidad,
      estado: 'APROBADO',
      observaciones: this.selected.observaciones || '',
      detalle: [] // ❗ NO se persiste
    };

    // 1️⃣ Guardar cabecera
    const despachoId = await this.dexieService.despachos.add(despacho);
    console.log('✅ Despacho guardado:', despacho);
    // 2️⃣ Guardar detalle
    for (const d of this.detalleDespacho) {
      const detalle: DetalleDespacho = {
        despachoId,
        detalleRecepcionId: d.detalleRecepcionId,
        codigo: d.codigo,
        descripcion: d.descripcion,
        cantidad: d.atendida,
        unidadMedida: d.unidadMedida,
        precioUnitario: d.precioUnitario,
        descuento: d.descuento ?? 0,
        subtotal: d.subtotal,
        impuesto: d.impuesto,
        total: d.total,
        marca: d.marca,
        modelo: d.modelo,
        especificaciones: d.especificaciones,
        fechaEntregaEstimada: d.fechaEntregaEstimada,
        estado: 'COMPLETO',
        observaciones: d.observaciones
      };

      await this.dexieService.detalleDespachos.add(detalle);
      console.log('✅ Detalle de despacho guardado:', detalle);
    }

    return despachoId;
  }

  // async confirmarDespacho() {
  //   for (const d of this.detalleDespacho) {
  //     await this.actualizarStock(d.codigo, -d.atendida);
  //   }

  //   this.selected.estado = EstadoRequerimiento.DESPACHADO_COMPLETO;
  //   await this.dexieService.requerimientos.put(this.selected);

  //   this.alertService.showAlert(
  //     'Despacho',
  //     'Salida registrada correctamente',
  //     'success'
  //   );
  //   this.cargarRequerimientos();
  // }

  /**
   * Actualiza el stock tanto en memoria como en la base de datos local
   * @param codigo Código del producto
   * @param almacenOrCantidad Código del almacén (opcional) o cantidad a sumar/restar
   * @param cantidad Cantidad a sumar/restar (usar negativo para restar)
   */
  // async actualizarStock(
  //   codigo: string,
  //   almacenOrCantidad: string | number,
  //   cantidad?: number
  // ) {
  //   // Manejar ambos casos: (codigo, cantidad) y (codigo, almacen, cantidad)
  //   let almacen: string | undefined;
  //   let cant: number;

  //   if (cantidad !== undefined) {
  //     // Caso con 3 parámetros: (codigo, almacen, cantidad)
  //     almacen = almacenOrCantidad as string;
  //     cant = cantidad;

  //     // Actualizar en memoria
  //     const stock = this.stockDisponible.find(
  //       (s) => s.codigo === codigo && s.almacen === almacen
  //     );

  //     if (stock) {
  //       stock.cantidad += cant; // cantidad negativa para restar en despacho
  //       if (stock.cantidad < 0) stock.cantidad = 0;
  //     } else if (cant > 0) {
  //       // si no existe en la lista local, agregarlo con la cantidad (si la cantidad es positiva)
  //       this.stockDisponible.push({
  //         codigo,
  //         descripcion: '',
  //         almacen: almacen as string,
  //         cantidad: cant,
  //         unidadMedida: '',
  //         ultimaActualizacion: new Date().toISOString(),
  //       });
  //     }
  //   } else {
  //     // Caso con 2 parámetros: (codigo, cantidad)
  //     cant = almacenOrCantidad as number;

  //     // Actualizar en Dexie
  //     const itemStock = await this.dexieService.stock
  //       .where('codigo')
  //       .equals(codigo)
  //       .first();

  //     if (itemStock) {
  //       itemStock.cantidad += cant;
  //       if (itemStock.cantidad < 0) itemStock.cantidad = 0;
  //       await this.dexieService.stock.put(itemStock);
  //     }
  //   }
  // }

  /**
   * Cargar stock disponible desde el backend
   */
  async cargarStockDisponible() {
    try {
      this.requerimientosService.obtenerReporteSaldos([{ idempresa: this.usuario.idempresa }]).subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveStocks(resp);
          this.stockDisponible = await this.dexieService.showStock();
        }
      });
    } catch (error) {
      console.error('Error cargando stock disponible:', error);
    }
  }

  /**
   * Cargar saldos de stock para los detalles de un requerimiento
   */
  async cargarSaldosStock(detalle: any[], idalmacen: string) {
    // Obtener códigos únicos de los detalles
    const codigosUnicos = [...new Set(detalle.map(d => d.codigo))];
    
    console.log('📦 Stock disponible total:', this.stockDisponible);
    console.log('📦 Almacén seleccionado:', idalmacen);
    console.log('📦 Códigos únicos buscados:', codigosUnicos);
    
    // Agrupar y sumar stock por código
    const stockAgrupado = new Map();
    
    this.stockDisponible.forEach(s => {
      if (codigosUnicos.includes(s.codigo) && s.almacen === idalmacen) {
        const key = s.codigo;
        const stockActual = stockAgrupado.get(key) || 0;
        stockAgrupado.set(key, stockActual + (s.stockDisponible || s.cantidad || 0));
      }
    });

    console.log('📦 Stock agrupado por código:', Object.fromEntries(stockAgrupado));

    // Actualizar stock en cada detalle
    detalle.forEach((d: any) => {
      const stockValue = stockAgrupado.get(d.codigo) || 0;
      // Asegurar que el stock no sea negativo
      d.stock = Math.max(0, stockValue);
      console.log(`📦 Item ${d.codigo}: stock=${d.stock}, cantidad=${d.cantidad}`);
    });
  }

  /**
   * Obtener stock disponible para un item en un almacén
   */
  obtenerStock(codigo: string, almacen: string): number {
    // Sumar el stock de todos los registros del mismo código y almacén
    const stockItems = this.stockDisponible.filter(s => 
      s.codigo === codigo && s.almacen === almacen
    );
    
    const stockTotal = stockItems.reduce((total, item) => {
      return total + (item.stockDisponible || item.stockActual || item.cantidad || 0);
    }, 0);
    
    console.log(`🔍 obtenerStock - Código: ${codigo}, Almacén: ${almacen}`);
    console.log(`  - Registros encontrados: ${stockItems.length}`);
    console.log(`  - Stock total: ${stockTotal}`);
    
    return stockTotal;
  }

  async actualizarStock(
    codigo: string,
    almacen: string,
    cantidad: number
  ) {
    // ====== MEMORIA ======
    const stockLocal = this.stockDisponible.find(
      s => s.codigo === codigo && s.almacen === almacen
    );

    if (stockLocal) {
      stockLocal.cantidad += cantidad;
      if (stockLocal.cantidad < 0) stockLocal.cantidad = 0;
    }

    // ====== DEXIE ======
    const itemStock = await this.dexieService.stock
      .where({ codigo, almacen })
      .first();

    if (itemStock) {
      itemStock.cantidad += cantidad;
      if (itemStock.cantidad < 0) itemStock.cantidad = 0;
      await this.dexieService.stock.put(itemStock);
    }
  }

  async cargarUsuario() {
    const usuario = await this.dexieService.showUsuario();
    if (usuario) {
      this.usuario = usuario;
    }
  }

  // Carga solo los requerimientos del store (Dexie)
  async cargarRequerimientosAprobados() {
    this.loading = true;
    const requerimientos = await this.dexieService.showRequerimiento();
    console.log('Requerimientos desde Dexie:', requerimientos);
    
    // Agrupar requerimientos únicos por idrequerimiento
    const requerimientosUnicos = new Map();
    
    (requerimientos || []).forEach((req: any) => {
      // Mostrar todos los estados relevantes para el dashboard
      const estadosVisibles = ['APROBADO', 'ATENCION_PARCIAL', 'SIN_STOCK', 'ATENCION_COMPLETA', 'DESPACHADO_COMPLETO', 'DESPACHADO'];
      const esVisible = estadosVisibles.includes(req.estados) || (req.estados || '').toString().toUpperCase().includes('DESPACHADO');
      if (esVisible || !req.estados) {
        const key = req.idrequerimiento;
        if (!requerimientosUnicos.has(key)) {
          requerimientosUnicos.set(key, {
            ...req,
            detalle: req.detalle || []
          });
        }
      }
    });

    this.requerimientosAprobadosAll = Array.from(requerimientosUnicos.values());

    // Ordenar por fecha de aprobación (más reciente primero)
    this.requerimientosAprobadosAll.sort((a: any, b: any) => {
      const fechaA = new Date(a.fechaAprobacion || a.fecha || 0).getTime();
      const fechaB = new Date(b.fechaAprobacion || b.fecha || 0).getTime();
      return fechaB - fechaA; // Descendente (más reciente primero)
    });

    // inicialmente se muestra todo
    this.requerimientosAprobados = [...this.requerimientosAprobadosAll];
    this.totalRegistros = this.requerimientosAprobados.length;
    this.loading = false;
    console.log('Requerimientos aprobados únicos:', this.requerimientosAprobados);

    // Resolver nombre del área del solicitante (consulta obtener-area-usuario por DNI)
    this.precargarAreasSolicitantes();

    // Contar despachados desde el backend (no están en Dexie)
    this.cargarKpiDespachados();
  }

  private cargarKpiDespachados() {
    this.despachosService.listarDespachosRealizados({ ruc: this.usuario?.ruc })
      .subscribe({
        next: (resp: any) => {
          const lista = Array.isArray(resp) ? resp : (resp?.data || []);
          this.kpiDespachados = lista.length;
        },
        error: () => { this.kpiDespachados = 0; }
      });
  }

  obtenerRol() {
    if (this.usuario.idrol.includes('ALLOGIST')) return 'ALLOGIST';
    if (this.usuario.idrol.includes('APLOGIST')) return 'APLOGIST';
    return '';
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '';
    const d = new Date(fecha);

    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();

    return `${dia}/${mes}/${anio}`;
  }

  async sincronizaAprobados() {
    try {
      // Para usuarios ALLOGIST, filtrar por RUC de la empresa (multiempresa)
      const filtros = this.usuario?.idrol?.includes('ALLOGIST') && this.usuario?.ruc 
        ? { ruc: this.usuario.ruc } 
        : {};
      const requerimmientos = this.requerimientosService.getRequerimientosAprobados(filtros);

      requerimmientos.subscribe(async (resp: any) => {

        if (!!resp && resp.length) {

          // Obtener IDs que ya están en Dexie con estados especiales para preservarlos
          const todosEnDexie = await this.dexieService.requerimientos.toArray();
          const idsEspeciales = new Set(
            todosEnDexie
              .filter((r: any) => ['SIN_STOCK', 'ATENCION_PARCIAL'].includes(r.estados))
              .map((r: any) => r.idrequerimiento)
          );

          // Los que vienen del backend (ya incluye SIN_STOCK y ATENCION_PARCIAL con el SP corregido)
          const idsBackend = new Set(resp.map((r: any) => r.idrequerimiento));

          // Solo limpiar los APROBADOS que el backend no devuelve (ya no existen)
          const aEliminar = todosEnDexie.filter((r: any) =>
            r.estados === 'APROBADO' && !idsBackend.has(r.idrequerimiento)
          );
          if (aEliminar.length) {
            const keysEliminar = aEliminar.map((r: any) => r.idrequerimiento);
            await this.dexieService.requerimientos
              .where('idrequerimiento').anyOf(keysEliminar).delete();
          }

          // Preparar requerimientos del backend — preservar estado local si ya existe como especial
          const requerimientosSinId = resp.map((req: any) => {
            const { id, ...sinId } = req;
            // Si ya está en Dexie con estado especial y el backend lo trae como APROBADO,
            // respetar el estado de Dexie (puede que el backend aún no haya actualizado)
            const localExistente = todosEnDexie.find(
              (r: any) => r.idrequerimiento === sinId.idrequerimiento
            );
            if (localExistente && idsEspeciales.has(sinId.idrequerimiento) && sinId.estados === 'APROBADO') {
              return { ...sinId, estados: localExistente.estados };
            }
            return sinId;
          });

          // Guardar requerimientos usando bulkPut (merge, no borra todo)
          await this.dexieService.requerimientos.bulkPut(requerimientosSinId);

          // No guardar detalles separados ya que vienen embebidos en el requerimiento
          // Esto evita la duplicación en joinDetalle
          // const detallesPlanos: any[] = [];
          // for (const req of resp) {
          //   if (req.detalle?.length) {
          //     for (const det of req.detalle) {
          //       const { id, ...detSinId } = det;
          //       detallesPlanos.push({
          //         ...detSinId,
          //         idrequerimiento: req.idrequerimiento
          //       });
          //     }
          //   }
          // }
          // await this.dexieService.detalles.bulkPut(detallesPlanos);

          console.log('✅ Requerimientos y detalles guardados correctamente');
          await this.cargarRequerimientosAprobados();
        }
      });

    } catch (error: any) {
      console.error(error);
      this.alertService.showAlert(
        'Error!',
        '<p>Ocurrió un error</p>',
        'error'
      );
    }
  }

  // Simula carga de stock (reemplaza por llamada real al backend si tienes)
  // async cargarStockDisponible() {
  //   this.requerimientosService.obtenerReporteSaldos([]).subscribe(async (resp: any) => {
  //     if (!!resp && resp.length) {
  //       await this.dexieService.saveStocks(resp);
  //       this.stockDisponible = await this.dexieService.showStock();
  //     }
  //   });

  //   // this.stockDisponible = [
  //   //   {
  //   //     codigo: 'ITEM001',
  //   //     descripcion: 'Producto A',
  //   //     unidadMedida: 'UN',
  //   //     ultimaActualizacion: new Date().toISOString().split('T')[0],
  //   //     almacen: 'ALM01',
  //   //     cantidad: 100,
  //   //   },
  //   //   {
  //   //     codigo: 'ITEM002',
  //   //     descripcion: 'Producto B',
  //   //     unidadMedida: 'UN',
  //   //     ultimaActualizacion: new Date().toISOString().split('T')[0],
  //   //     almacen: 'ALM01',
  //   //     cantidad: 50,
  //   //   },
  //   //   {
  //   //     codigo: 'ITEM003',
  //   //     descripcion: 'Producto C',
  //   //     unidadMedida: 'UN',
  //   //     ultimaActualizacion: new Date().toISOString().split('T')[0],
  //   //     almacen: 'ALM01',

  // =================================================================
  // MÉTODOS PARA MANEJO DE STOCK INSUFICIENTE
  // =================================================================

  /**
   * Manejar saldo pendiente cuando no hay stock disponible
   */
  private async manejarSaldoPendienteSinStock(itemsSinStock: any[], requerimiento: any) {
    // Construir HTML con los items sin stock
    const htmlItems = itemsSinStock.map(item => 
      `<div style="margin: 5px 0;">
        <strong>${item.codigo}</strong> - ${item.descripcion || item.producto}<br>
        <small>Solicitado: ${item.cantidad} | Stock: 0 | Falta: ${item.faltante}</small>
      </div>`
    ).join('');

    // Mostrar diálogo con 4 opciones
    const result = await this.alertService.showFourButtons(
      '⚠️ Stock Insuficiente',
      `
        <div style="text-align: left;">
          <p>Los siguientes items no tienen stock disponible:</p>
          ${htmlItems}
          <hr style="margin: 15px 0;">
          <p>¿Qué desea hacer?</p>
        </div>
      `,
      'info',
      'Consolidar para Compra',
      'Esperar Stock',
      'Cerrar Saldo',
      'Decidir Después'
    );

    // Ejecutar acción según la opción seleccionada
    switch (result) {
      case 'button1':
        await this.manejarOpcionConsolidarCompra(itemsSinStock);
        break;
      case 'button2':
        await this.manejarOpcionEsperarStock(itemsSinStock);
        break;
      case 'button3':
        await this.manejarOpcionCerrarSaldo(itemsSinStock);
        break;
      case 'button4':
        await this.manejarOpcionDecidirDespues(itemsSinStock);
        break;
      case 'cancel':
        // Usuario cerró el diálogo
        console.log('Usuario canceló la acción');
        break;
      default:
        // Usuario cerró el diálogo
        console.log('Usuario canceló la acción');
        break;
    }
  }

  /**
   * Opción 1: Consolidar items para compra
   */
  private async manejarOpcionConsolidarCompra(itemsFaltantes: any[]) {
    try {
      // Crear ítems pendientes de consolidación
      const itemsPendientes: ItemPendienteConsolidacion[] = itemsFaltantes.map((item: any) => ({
        idDetalle: (this.selected?.idrequerimiento || 0) * 10000 + item.id,
        item: item.codigo,
        descripcion: item.descripcion || item.producto || '',
        familia: item.familia || '',
        categoria: item.categoria || '',
        cantidad: item.faltante,
        unidad: item.unidadMedida || 'UND',
        tipoRequerimiento: 'CONSUMO',
        requerimientoOrigen: this.selected?.numero || `REQ-${this.selected?.idrequerimiento}`,
        fechaCreacion: new Date().toISOString(),
        estadoDetalleConsolidacion: 'PENDIENTE',
        seleccionado: false,
      }));

      // Migrar directamente a consolidación
      const resp = await this.consolidacionService.migrarSaldoDirectoConsolidacion({
        items: itemsPendientes,
      });

      if (resp.success) {
        this.alertService.showAlertAcept(
          'Consolidado para Compra',
          `Los ítems han sido migrados al módulo de consolidación.<br>
           Ya están disponibles para procesar la solicitud de compra.`,
          'success',
        );
        
        // Actualizar estado del requerimiento
        await this.actualizarEstadoRequerimiento('EN CONSOLIDACION');
      } else {
        this.alertService.showAlertError(
          'Error',
          resp.mensaje || 'No se pudo consolidar para compra',
        );
      }
    } catch (err: any) {
      console.error('Error consolidando para compra:', err);
      this.alertService.showAlertError(
        'Error',
        'No se pudo consolidar para compra',
      );
    }
  }

  /**
   * Opción 2: Esperar Stock - notificar al solicitante cuando haya stock
   */
  private async manejarOpcionEsperarStock(itemsFaltantes: any[]) {
    try {
      // Registrar notificaciones para cada item (al solicitante original)
      for (const item of itemsFaltantes) {
        await this.notificacionApi.insertarNotificacionStock({
          iditem: item.codigo,
          itemDescripcion: item.descripcion || item.producto,
          mensaje: `El item ${item.codigo} - ${item.descripcion || item.producto} no tiene stock disponible actualmente. Te notificaremos cuando esté disponible para tu requerimiento ${this.selected?.numero || this.selected?.idrequerimiento || 'N/A'}.`,
          idrequerimiento: this.selected?.idrequerimiento || 0,
          tipo_notificacion: 'SIN_STOCK'
        });
      }

      // Crear saldos pendientes
      await this.crearSaldosPendientes(itemsFaltantes, 'ESPERA_STOCK');

      this.alertService.showAlertAcept(
        'Notificación Registrada',
        `Se ha notificado al solicitante sobre la falta de stock para:<br><br>
         ${itemsFaltantes.map(i => `• ${i.codigo} - ${i.descripcion || i.producto}`).join('<br>')}<br><br>
         El solicitante recibirá una notificación cuando el stock esté disponible.<br>
         Puedes revisar los saldos pendientes en el módulo de Saldo-Requerimiento.`,
        'success',
      );

      // Actualizar estado del requerimiento
      await this.actualizarEstadoRequerimiento('PENDIENTE STOCK');
    } catch (err: any) {
      console.error('Error esperando stock:', err);
      console.error('Error registrando notificaciones:', err);
      this.alertService.showAlertError(
        'Error',
        'No se pudo registrar la notificación de stock',
      );
    }
  }

  /**
   * Opción 3: Decidir después - crear saldo pendiente sin notificaciones
   */
  private async manejarOpcionDecidirDespues(itemsFaltantes: any[]) {
    try {
      // Crear saldos pendientes
      await this.crearSaldosPendientes(itemsFaltantes, 'PENDIENTE');

      this.alertService.showAlert(
        'Saldo Pendiente',
        `Los items con saldo insuficiente han sido registrados como pendientes.<br>
         Puedes decidir qué hacer más tarde en el módulo de Saldo-Requerimiento.`,
        'info',
      );

      // Actualizar estado del requerimiento
      await this.actualizarEstadoRequerimiento('SALDO PENDIENTE');
    } catch (err: any) {
      console.error('Error creando saldos pendientes:', err);
      this.alertService.showAlertError(
        'Error',
        'No se pudo crear el saldo pendiente',
      );
    }
  }

  /**
   * Opción 4: Cerrar saldo - cerrar el requerimiento
   */
  private async manejarOpcionCerrarSaldo(itemsFaltantes: any[]) {
    try {
      // Actualizar estado del requerimiento a cerrado
      await this.actualizarEstadoRequerimiento('CERRADO');

      this.alertService.showAlertAcept(
        'Requerimiento Cerrado',
        'El requerimiento ha sido cerrado por falta de stock.',
        'info',
      );
    } catch (err: any) {
      console.error('Error cerrando requerimiento:', err);
      this.alertService.showAlertError(
        'Error',
        'No se pudo cerrar el requerimiento',
      );
    }
  }

  /**
   * Crear saldos pendientes para los items faltantes
   */
  private async crearSaldosPendientes(itemsFaltantes: any[], estado: string) {
    // Preparar datos para el saldo pendiente
    const saldoPendiente = {
      idrequerimiento: this.selected?.idrequerimiento || 0,
      requerimientoNumero: this.selected?.numero || `REQ-${this.selected?.idrequerimiento}`,
      usuario: this.usuario.documentoidentidad,
      usuarioCreador: this.usuario.documentoidentidad,
      ceco: this.selected?.idcentrocosto || this.selected?.ceco || '',
      items: itemsFaltantes.map(item => ({
        codigo: item.codigo,
        descripcion: item.descripcion || item.producto,
        cantidadSolicitada: item.cantidad,
        cantidadDespachada: item.atendida || 0,
        saldoPendiente: item.faltante,
        unidadMedida: item.unidadMedida || 'UND'
      }))
    };

    // Usar el servicio de consolidación para registrar el saldo pendiente
    const resp = await this.consolidacionService.registrarSaldoPendienteAprobacion(saldoPendiente);
    
    if (!resp.success) {
      throw new Error(resp.mensaje || 'Error al registrar saldo pendiente');
    }

    // Insertar notificaciones para cada item en saldo pendiente
    console.log('📝 Insertando notificaciones de saldo pendiente para:', itemsFaltantes.length, 'items');
    
    for (const item of itemsFaltantes) {
      try {
        await this.notificacionApi.registrarNotificacionAlmacen({
          iditem: item.codigo,
          id_dreq: this.selected?.numero || this.selected?.idrequerimiento?.toString() || 'N/A',
          itemDescripcion: item.descripcion || item.producto,
          mensaje: `El item ${item.codigo} - ${item.descripcion || item.producto} ha quedado en saldo pendiente por falta de stock. Requerimiento: ${this.selected?.numero || this.selected?.idrequerimiento || 'N/A'}.`,
          tipo_notificacion: 'SALDO_PENDIENTE'
        });
        console.log('✅ Notificación de almacén registrada para item:', item.codigo);
      } catch (error) {
        console.error('❌ Error al registrar notificación de almacén para item:', item.codigo, error);
      }
    }
  }

  /**
   * Actualizar el estado del requerimiento
   */
  private async actualizarEstadoRequerimiento(estado: string) {
    if (this.selected) {
      this.selected.estados = estado;
      await this.dexieService.requerimientos.put(this.selected);
      await this.cargarRequerimientosAprobados();
    }
  }

  /**
   * Cargar notificaciones del almacén
   */
  async cargarNotificaciones() {
    try {
      // Cargar todas las notificaciones del usuario
      this.notificaciones = await this.notificacionApi.listarTodasMisNotificaciones();
      
      // Contar las no leídas
      this.notificacionesNoLeidas = this.notificaciones.filter(n => !n.leida).length;
      
      console.log('📬 Notificaciones cargadas:', this.notificaciones.length, 'No leídas:', this.notificacionesNoLeidas);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }

  /**
   * Marcar notificación como leída
   */
  async marcarNotificacionComoLeida(notificacion: any) {
    try {
      await this.notificacionApi.marcarComoLeida(notificacion.id_notificacion);
      notificacion.leida = true;
      this.notificacionesNoLeidas--;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  }

  /**
   * Obtener el total atendido de un item (considerando atendidas anteriores + actual)
   */
  private async getTotalAtendido(codigo: string): Promise<number> {
    try {
      const registro = await this.dexieService.detalles
        .where('idrequerimiento')
        .equals(this.selected?.idrequerimiento || 0)
        .and(x => x.codigo === codigo)
        .first();
      
      return Number(registro?.atendida || 0);
    } catch (error) {
      console.error('Error obteniendo total atendido:', error);
      return 0;
    }
  }

  /**
   * Obtener icono según tipo de notificación
   */
  getTipoNotificacionIcon(tipo: string): string {
    switch (tipo) {
      case 'STOCK_DISPONIBLE':
        return 'bx bx-check-circle text-success';
      case 'SALDO_PENDIENTE':
        return 'bx bx-error text-warning';
      case 'DESPACHO_PARCIAL':
        return 'bx bx-info-circle text-info';
      case 'SIN_STOCK':
        return 'bx bx-x-circle text-danger';
      default:
        return 'bx bx-info-circle text-info';
    }
  }

  // ==========================================================================
  // DESPACHO EN BLOQUE
  // ==========================================================================

  /** Indica si un requerimiento puede ser seleccionado para el bloque masivo. */
  puedeSeleccionarse(r: any): boolean {
    return r?.estados !== 'SIN_STOCK';
  }

  /** Limpia la selección masiva actual. */
  limpiarSeleccion(): void {
    this.selectedRows = [];
  }

  /** Número de SIN_STOCK visibles en el tab activo (para el aviso en la barra). */
  get omitidosSinStockCount(): number {
    return this.despachosVisibles.filter(r => r?.estados === 'SIN_STOCK').length;
  }

  /**
   * Construye el body para generarSalidaNS a partir de un requerimiento.
   * Replica la misma lógica que registrarAtencion() para el caso individual.
   */
  private construirBodyDespacho(req: any): any[] | null {
    const detalle = (req.detalle || []).map((d: any) => {
      const solicitada = Number(d.cantidad) || 0;
      const atendida   = Number(d.atendida)  || 0;
      const pendiente  = Math.max(0, solicitada - atendida);
      const stock      = this.obtenerStock(d.codigo, req.idalmacen || '');
      const atender    = Math.min(pendiente, stock);
      return { ...d, stock, pendiente, atender };
    });

    const detalleAtendido = detalle.filter((d: any) => (d.atender || 0) > 0);
    if (!detalleAtendido.length) return null;

    const ahora = new Date();
    const fechaFormateada =
      ahora.toISOString().slice(0, 10) + ' ' + ahora.toTimeString().slice(0, 8);
    const companiaSocio   = ((req.ruc || this.usuario?.idempresa || '').padStart(6, '0')) + '00';
    const requisicionNum  = (req.RequisicionNumero || '').padStart(10, '0');
    const primerDetalle   = detalleAtendido[0];
    const proyectoAfe     = this.proyectos?.find(
      (p: any) => p.proyectoio === (primerDetalle?.proyecto || req?.proyecto)
    )?.afe || 'FUNDO HP';

    return [{
      CompaniaSocio:     companiaSocio,
      RequisicionNumero: requisicionNum,
      AlmacenCodigo:     req.idalmacen || 'H001',
      Periodo:           new Date().toISOString().slice(0, 7).replace('-', ''),
      UltimoUsuario:     this.usuario?.usuario || 'SYSTEM',
      TipoCambio:        3.356,
      FechaDocumento:    fechaFormateada,
      Proyecto:          proyectoAfe,
      detalle: detalleAtendido.map((d: any, index: number) => ({
        Secuencia:   index + 1,
        Item:        d.codigo.substring(0, 6),
        Condicion:   d.condicion || '0',
        UnidadCodigo: d.unidadMedida || d.unidad || 'UND',
        Cantidad:    d.atender,
        Lote:        d.lote || '00',
        CentroCosto: d.centroCosto || req.centroCosto || '11020',
        Actividad:   d.actividad || '0502'
      }))
    }];
  }

  /**
   * Actualiza Dexie + BD Logistica después de un despacho exitoso en bloque.
   * Replica la misma lógica post-éxito de registrarAtencion().
   */
  private async postDespachoExitoso(
    req: any,
    numeroNS: string,
    detalleAtendido: any[]
  ): Promise<'DESPACHADO' | 'ATENCION_PARCIAL'> {
    // 1) Actualizar detalles en Dexie
    for (const d of detalleAtendido) {
      const registro = await this.dexieService.detalles
        .where('idrequerimiento').equals(req.idrequerimiento)
        .and((x: any) => x.codigo === d.codigo)
        .first();
      if (registro) {
        registro.atendida = (registro.atendida || 0) + d.atender;
        await this.dexieService.detalles.put(registro);
      }
    }

    // 2) Calcular estado final
    const allDetalle = req.detalle || [];
    const todosAtendidos = allDetalle.every((d: any) => {
      const totalNuevo = (Number(d.atendida) || 0) +
        (detalleAtendido.find((x: any) => x.codigo === d.codigo)?.atender || 0);
      return totalNuevo >= (Number(d.cantidad) || 0);
    });
    const estadoFinal: 'DESPACHADO' | 'ATENCION_PARCIAL' =
      todosAtendidos ? 'DESPACHADO' : 'ATENCION_PARCIAL';

    // 3) Actualizar requerimiento en Dexie
    const reqDexie = await this.dexieService.requerimientos
      .where('idrequerimiento').equals(req.idrequerimiento).first();
    if (reqDexie) {
      reqDexie.estados = estadoFinal;
      await this.dexieService.requerimientos.put(reqDexie);
    }

    // 4) Registrar despacho en BD Logistica
    this.despachosService.registrarDespacho({
      idrequerimiento: req.idrequerimiento,
      usuario: this.usuario.documentoidentidad,
      observacion: `Despacho en bloque — NS: ${numeroNS}`,
      numeroNS,
      detalle: detalleAtendido.map((d: any) => ({
        codigo: d.codigo,
        solicitado: d.cantidad,
        despachado: d.atender
      }))
    }).subscribe({ error: err => console.error('registrarDespacho bloque:', err) });

    // 5) Actualizar estado en BD Logistica
    this.despachosService.actualizarEstadoRequerimiento([{
      idrequerimiento: req.idrequerimiento,
      estados: estadoFinal,
      usuario: this.usuario.documentoidentidad
    }]).subscribe({ error: err => console.error('actualizarEstado bloque:', err) });

    return estadoFinal;
  }

  /**
   * Proceso principal de despacho en bloque — secuencial.
   * Solo despacha los selectedRows que NO sean SIN_STOCK.
   */
  async despacharEnBloque(): Promise<void> {
    // 1) Separar omitidos (SIN_STOCK) de los procesables
    const omitidos  = this.selectedRows.filter(r => r?.estados === 'SIN_STOCK');
    const procesables = this.selectedRows.filter(r => r?.estados !== 'SIN_STOCK');

    if (!procesables.length) {
      this.alertService.showAlert(
        'Sin requerimientos válidos',
        'Todos los seleccionados están en SIN STOCK y serán omitidos.',
        'warning'
      );
      return;
    }

    // 2) Confirmación
    const confirmar = await this.alertService.showConfirm(
      '¿Despachar en bloque?',
      `Se procesarán <strong>${procesables.length}</strong> requerimiento(s) de forma secuencial.` +
      (omitidos.length
        ? `<br><small class="text-warning">⚠️ ${omitidos.length} con SIN STOCK serán omitidos.</small>`
        : ''),
      'question'
    );
    if (!confirmar) return;

    // 3) Inicializar estado de progreso
    this.resumenBloque = {
      exitosos:  [],
      parciales: [],
      fallidos:  [],
      omitidos:  omitidos.map(r => ({ req: r.RequisicionNumero || `REQ-${r.idrequerimiento}` }))
    };
    this.bloqueProgresoLog    = [];
    this.bloqueProgresoTotal  = procesables.length;
    this.bloqueProgresoActual = 0;
    this.bloqueProgreso       = true;

    // 4) Loop secuencial
    for (const req of procesables) {
      const etiqueta = req.RequisicionNumero || `REQ-${req.idrequerimiento}`;
      this.bloqueProgresoActual++;
      this.bloqueProgresoReqActual = etiqueta;

      try {
        const body = this.construirBodyDespacho(req);

        // Sin ítems con stock → omitir
        if (!body) {
          this.resumenBloque.omitidos.push({ req: etiqueta });
          this.bloqueProgresoLog.push(`⬜ ${etiqueta} — sin ítems con stock`);
          continue;
        }

        // Calcular detalleAtendido para post-proceso
        const detalleAtendido = (req.detalle || [])
          .map((d: any) => {
            const pendiente = Math.max(0, (Number(d.cantidad) || 0) - (Number(d.atendida) || 0));
            const stock     = this.obtenerStock(d.codigo, req.idalmacen || '');
            return { ...d, stock, pendiente, atender: Math.min(pendiente, stock) };
          })
          .filter((d: any) => (d.atender || 0) > 0);

        // Llamar a SPRING (await convertido a Promise)
        const response = await firstValueFrom(
          this.despachosService.generarSalidaNS(body)
        );

        let resultado = response?.resultado || response;
        if (Array.isArray(resultado)) resultado = resultado[0];

        if (!resultado || resultado.errorgeneral !== 0) {
          const msg = resultado?.mensajeError || 'Error en SP SPRING';
          this.resumenBloque.fallidos.push({ req: etiqueta, error: msg });
          this.bloqueProgresoLog.push(`❌ ${etiqueta} — ${msg}`);
          continue;
        }

        const ns = resultado.NumeroDocumento || '';
        const estado = await this.postDespachoExitoso(req, ns, detalleAtendido);

        if (estado === 'DESPACHADO') {
          this.resumenBloque.exitosos.push({ req: etiqueta, ns });
          this.bloqueProgresoLog.push(`✅ ${etiqueta} → ${ns}`);
        } else {
          this.resumenBloque.parciales.push({
            req: etiqueta,
            motivo: `NS: ${ns} — stock parcial`
          });
          this.bloqueProgresoLog.push(`⚠️ ${etiqueta} → ${ns} (parcial)`);
        }

      } catch (err: any) {
        const msg = err?.message || 'Error inesperado';
        this.resumenBloque.fallidos.push({ req: etiqueta, error: msg });
        this.bloqueProgresoLog.push(`❌ ${etiqueta} — ${msg}`);
      }
    }

    // 5) Finalizar
    this.bloqueProgreso = false;
    this.selectedRows   = [];
    this.modalResumenVisible = true;

    // Recargar tabla para reflejar nuevos estados
    await this.cargarRequerimientosAprobados();
  }

  cerrarResumenBloque(): void {
    this.modalResumenVisible = false;
  }

  get bloqueProgresoPorc(): number {
    if (!this.bloqueProgresoTotal) return 0;
    return Math.round((this.bloqueProgresoActual / this.bloqueProgresoTotal) * 100);
  }
}
