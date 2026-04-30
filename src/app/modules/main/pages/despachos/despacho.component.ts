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
  imports: [CommonModule, FormsModule, TableModule, DatePickerModule, NumeroRequerimientoPipe],
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

  /** KPI: requerimientos pendientes de atención (estado APROBADO). */
  get kpiPendientes(): number {
    return (this.requerimientosAprobadosAll || []).filter(
      (r: any) => r?.estados === 'APROBADO' || !r?.estados,
    ).length;
  }

  /** KPI: requerimientos atendidos (parcial o completo o despachado). */
  get kpiAtendidos(): number {
    return (this.requerimientosAprobadosAll || []).filter((r: any) =>
      ['ATENCION_PARCIAL', 'ATENCION_COMPLETA', 'DESPACHADO_COMPLETO'].includes(
        r?.estado,
      ) || (r?.estados || '').toString().toUpperCase().includes('DESPACHADO'),
    ).length;
  }

  /** KPI: total de requerimientos cargados. */
  get kpiTotal(): number {
    return (this.requerimientosAprobadosAll || []).length;
  }

  /** Datos visibles en la tabla según tab activo y filtros rápidos Requisición. */
  get despachosVisibles(): any[] {
    const base = this.requerimientosAprobados || [];
    const esItem = this.activeTabDespachos === 'ITEMS';
    return base.filter((r: any) => {
      const tipo = (r?.tipo || '').toString().toUpperCase();
      const coincideTab = esItem ? tipo === 'ITEM' : tipo !== 'ITEM';
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

  async verDetalle(r: any) {
    try {
      this.alertService.mostrarModalCarga();
      this.selected = r;
      this.detalle = r.detalle || [];

      // Cargar saldos de stock desde la API
      await this.cargarSaldosStock(this.detalle, r.idalmacen);

      // Calcular atención real para cada línea
      if (this.detalle && this.detalle.length > 0) {
        this.detalle.forEach((d: any) => {
          const solicitada = Number(d.cantidad) || 0;
          const atendida = Number(d.atendida) || 0;
          const pendiente = Math.max(0, solicitada - atendida);

          const stock = this.obtenerStock(d.codigo, this.selected.idalmacen);
          const atender = Math.min(pendiente, stock);

          d.stock = stock;
          d.atender = atender;
          d.compra = Math.max(0, pendiente - stock);

          d.estadoAtencion =
            stock === 0
              ? 'SIN STOCK'
              : stock < pendiente
              ? 'PARCIAL'
              : 'CON STOCK';
        });

        // Verificar si todos los items están SIN STOCK
        const todosSinStock = this.detalle.every((d: any) => d.estadoAtencion === 'SIN STOCK');
        console.log('🔍 Verificando SIN STOCK:', { 
          todosSinStock, 
          cantidadItems: this.detalle.length,
          selected: this.selected,
          selectedNumero: this.selected?.numero,
          selectedId: this.selected?.idrequerimiento
        });
        
        if (todosSinStock && this.detalle.length > 0) {
          console.log('📢 Mostrando notificaciones de SIN STOCK');
          
          // Notificación flotante
          this.notificationService.warning(
            'Sin Stock Disponible',
            `Todos los ítems del requerimiento ${this.selected?.numero || this.selected?.idrequerimiento || 'N/A'} están sin stock. Los ítems quedarán en saldo pendiente.`,
            10000
          );
          
          // Alerta más visible con SweetAlert2
          setTimeout(() => {
            console.log('📢 Mostrando alerta SweetAlert2');
            this.alertService.showAlert(
              'Sin Stock Disponible',
              `Todos los ítems del requerimiento ${this.selected?.numero || this.selected?.idrequerimiento || 'N/A'} están sin stock.\n\nLos ítems han sido movidos a saldo pendiente para su consolidación.`,
              'warning'
            );
          }, 500);
        }
      }

      this.alertService.cerrarModalCarga();
      this.modalAtencionVisible = true;
      this.displayDetalle = true;
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'No se pudo cargar el detalle', 'error');
    }
  }

  cerrarModalAtencion() {
    this.modalAtencionVisible = false;
  }

  buscar() {
    this.pagina = 1;
    this.aplicarFiltros();
    if (this.table) {
      this.table.first = 0; // 👈 vuelve a la página 1
    }
  }

  aplicarFiltros() {
    let data = [...this.requerimientosAprobadosAll];

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

    // 🔹 Filtrar SOLO lo que realmente se va a atender
    const detalleAtendido = this.detalle.filter(
      (d: any) => (d.atender || 0) > 0
    );

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
            Item: d.codigo,
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
            requerimiento.estados = 'DESPACHADO';
            await this.dexieService.requerimientos.put(requerimiento);
          }

          /* -----------------------------------------------------
           * BD LOGISTICA - Registrar Despacho
           * ----------------------------------------------------- */
          const bodyDespacho = {
            idrequerimiento: this.selected.idrequerimiento,
            usuario: this.usuario.documentoidentidad,
            observacion: `Despacho generado - NS: ${resultado.NumeroDocumento}`,
            numeroNS: resultado.NumeroDocumento,
            detalle: detalleAtendido.map(d => ({
              codigo: d.codigo,
              solicitado: d.cantidad,
              despachado: d.atender
            }))
          };

          this.despachosService.registrarDespacho(bodyDespacho).subscribe({
            next: () => console.log('Despacho registrado en BD local'),
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

          // Notificar al solicitante sobre despacho parcial
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
            
            // Mostrar mensaje al operador sobre notificaciones enviadas
            this.notificationService.info(
              'Despacho Parcial',
              `Se ha notificado al solicitante sobre el despacho parcial de ${itemsParciales.length} item(s).`,
              5000
            );
          }

          /* -----------------------------------------------------
           * BD LOGISTICA - Actualizar Estado Requerimiento
           * ----------------------------------------------------- */
          const bodyEstado = [
            {
              idrequerimiento: this.selected.idrequerimiento,
              estados: 'DESPACHADO',
              usuario: this.usuario.documentoidentidad
            }
          ];

          this.despachosService.actualizarEstadoRequerimiento(bodyEstado).subscribe({
            next: () => { },
            error: err =>
              console.error('Error actualizando estado LOGISTICA:', err)
          });

          /* -----------------------------------------------------
           * UI - Mostrar mensaje por 3 segundos
           * ----------------------------------------------------- */
          this.alertService.showAlert(
            'Éxito',
            `Salida NS generada correctamente: ${resultado.NumeroDocumento}`,
            'success'
          );

          this.modalAtencionVisible = false;
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
      this.requerimientosService.obtenerReporteSaldos([]).subscribe(async (resp: any) => {
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
      if (req.estados === 'APROBADO') {
        const key = req.idrequerimiento;
        if (!requerimientosUnicos.has(key)) {
          // Guardar el requerimiento completo con sus detalles
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
      const requerimmientos = this.requerimientosService.getRequerimientosAprobados([]);

      requerimmientos.subscribe(async (resp: any) => {

        if (!!resp && resp.length) {

          // Limpiar Stores para evitar duplicados
          await this.dexieService.requerimientos.clear();
          await this.dexieService.detalles.clear();

          // Preparar requerimientos sin el campo 'id' del backend (Dexie genera su propio ++id)
          const requerimientosSinId = resp.map((req: any) => {
            const { id, ...sinId } = req;
            return sinId;
          });

          // Guardar requerimientos usando bulkPut para evitar errores de duplicados
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
}
