import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KardexService } from '@/app/services/kardex.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Stock } from '@/app/shared/interfaces/Tables';
import { MaestrasService } from '../../services/maestras.service';
import { ProductSearchCardsComponent } from '../../components/product-search-cards/product-search-cards.component';
import { take } from 'rxjs/operators';

// Interfaces para formularios
interface RecepcionOCForm {
  companiaSocio: string;
  numeroOrden: string;
  almacenCodigo: string;
  usuario?: string;
}

interface SincronizacionForm {
  companiaSocio?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  soloPendientes?: boolean;
}

interface EjecutarSincronizacionForm extends SincronizacionForm {
  ejecutarReal?: boolean;
}

interface VerificarEstadoForm {
  companiaSocio?: string;
}

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CardModule,
    TagModule,
    TooltipModule,
    SelectModule,
    TextareaModule,
    DatePickerModule,
    AutoCompleteModule,
    ProductSearchCardsComponent,
  ],
  templateUrl: './kardex.component.html',
  styleUrls: ['./kardex.component.scss'],
})
export class KardexComponent implements OnInit {
  // Tabs
  tabActiva: number = 0;
  private filtroStockTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly formatoMoneda = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  });
  private readonly formatoNumero = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  // Stock
  stock: any[] = [];
  stockFiltrado: any[] = [];
  almacenesStockDisponibles: string[] = [];
  filtroStock = {
    almacen: '',
    codigoItem: '',
  };

  // Kardex
  movimientosKardex: any[] = [];
  itemKardexSeleccionado: any = null;
  filtroKardex = {
    codigoItem: '',
    almacen: '',
    periodoInicio: null as string | null,
    periodoFin: null as string | null,
    tipoMovimiento: '',
    fuente: '' as '' | 'SPRING' | 'LOCAL',
  };

  // Transacciones
  transacciones: any[] = [];
  transaccionesFiltradas: any[] = [];
  filtroTransacciones = {
    fechaInicio: null as string | null,
    fechaFin: null as string | null,
    tipoTransaccion: '',
    estado: '',
    fuente: '' as '' | 'SPRING' | 'LOCAL',
  };

  // Nueva transacción
  modalNuevaTransaccion = false;
  items: any[] = [];
  itemsKardex: any[] = [];
  itemsFiltrados: any[] = [];
  nuevaTransaccion = {
    tipoTransaccion: 'INGRESO',
    tipoDocumentoOrigen: '',
    numeroDocumentoOrigen: '',
    almacenOrigen: '',
    almacenDestino: '',
    observaciones: '',
    detalles: [] as any[],
  };

  // Detalle transacción
  modalDetalleTransaccion = false;
  transaccionDetalle: any = null;

  // Dashboard
  dashboard: any = {
    indicadores: {
      totalItems: 0,
      totalAlmacenes: 0,
      stockTotal: 0,
      valorTotal: 0,
      itemsBajoStock: 0,
      itemsAltoStock: 0,
      recepcionesPendientesIngreso: 0,
      nisGeneradasUltimos30dias: 0,
      nssGeneradasUltimos30dias: 0,
      movimientosLocalesUltimos30dias: 0,
    },
    itemsBajoStock: [],
    itemsMayorValor: [],
    movimientosRecientes: [],
    recepcionesPendientes: [],
  };

  // Reporte valorización
  reporteValorizacion: any[] = [];

  // Opciones
  // almacenes = [
  //   { label: 'Todos', value: '' },
  //   { label: 'ALM-PRINCIPAL', value: 'ALM-PRINCIPAL' },
  //   { label: 'ALM-SUCURSAL', value: 'ALM-SUCURSAL' },
  // ];

  almacenes: any[] = [];
  almacenesDestino: any[] = [];

  tiposMovimiento = [
    { label: 'Todos', value: '' },
    { label: 'ENTRADA', value: 'ENTRADA' },
    { label: 'SALIDA', value: 'SALIDA' },
    { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA' },
    { label: 'AJUSTE', value: 'AJUSTE' },
  ];

  fuentesDato = [
    { label: 'Todas las fuentes', value: '' },
    { label: 'SPRING (real)', value: 'SPRING' },
    { label: 'BD Local', value: 'LOCAL' },
  ];

  tiposTransaccion = [
    { label: 'Todos', value: '' },
    { label: 'INGRESO', value: 'INGRESO' },
    { label: 'SALIDA', value: 'SALIDA' },
    { label: 'AJUSTE', value: 'AJUSTE' },
    { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA' },
    { label: 'REINGRESO', value: 'REINGRESO' },
    { label: 'DEVOLUCION CONSUMO', value: 'DEVOLUCION_CONSUMO' },
  ];

  estadosTransaccion = [
    { label: 'Todos', value: '' },
    { label: 'PENDIENTE', value: 'PENDIENTE' },
    { label: 'PROCESADO', value: 'PROCESADO' },
    { label: 'ANULADO', value: 'ANULADO' },
  ];

  tiposDocumento = [
    { label: 'Seleccione...', value: '' },
    { label: 'ORDEN DE COMPRA', value: 'OC' },
    { label: 'FACTURA', value: 'FAC' },
    { label: 'BOLETA', value: 'BOL' },
    { label: 'NOTA DE CRÉDITO', value: 'NC' },
    { label: 'NOTA DE DÉBITO', value: 'ND' },
    { label: 'GUIA DE REMISIÓN', value: 'GR' },
    { label: 'VALE DE ALMACÉN', value: 'VA' },
    { label: 'NOTA DE INGRESO', value: 'NI' },
    { label: 'NOTA DE SALIDA', value: 'NS' },
  ];

  // Usuario
  usuario: any = null;

  // Loading
  loading = false;
  loadingStock = false;
  loadingKardex = false;
  loadingTransacciones = false;

  // Cache
  private readonly STOCK_CACHE_PREFIX = 'stock_';
  private readonly KARDEX_CACHE_PREFIX = 'kardex_';
  private readonly TRANSACCIONES_CACHE_PREFIX = 'transacciones_';
  sincronizandoStock = false;
  sincronizandoKardex = false;
  sincronizandoTransacciones = false;
  lastSyncStock: Date | null = null;
  lastSyncKardex: Date | null = null;
  lastSyncTransacciones: Date | null = null;
  hayStockCache = false;
  hayKardexCache = false;
  hayTransaccionesCache = false;

  get stockCacheKey(): string {
    return `${this.STOCK_CACHE_PREFIX}${this.alcanceEmpresaCache}`;
  }

  private get kardexCacheKey(): string {
    return `${this.KARDEX_CACHE_PREFIX}${this.alcanceEmpresaCache}_${this.hashString(JSON.stringify(this.construirFiltrosKardex()))}`;
  }

  private get transaccionesCacheKey(): string {
    return `${this.TRANSACCIONES_CACHE_PREFIX}${this.alcanceEmpresaCache}_${this.hashString(JSON.stringify(this.construirFiltrosTransacciones()))}`;
  }

  constructor(
    private kardexService: KardexService,
    private alertService: AlertService,
    private userService: UserService,
    private dexieService: DexieService,
    private maestrasService: MaestrasService,
  ) {}

  // Lista de companias a consultar en kardex. Por defecto la empresa del usuario.
  // TODO: configurar las 3 empresas del grupo cuando se defina el listado.
  companiasSocios: string[] = [];
  todasCompaniasSocios: string[] = [];
  readonly empresasDisponibles: Array<{ label: string; value: string }> = [
    { label: 'HASS PERU SA', value: '00000800' },
    { label: 'Berry Harvest S.A.', value: '00000600' },
    { label: 'Corporacion Agricola Olmos S.A.', value: '00001000' },
  ];
  empresaSeleccionada = '';

  async ngOnInit() {
    console.log('ngOnInit - Iniciando');
    await this.cargarUsuario();
    console.log('Usuario cargado:', this.usuario);

    // Inicializar companias a consultar (por defecto la del usuario)
    await this.configurarAlcanceEmpresas();

    // Inicializar fechas por defecto: ultimos 30 dias
    const hoy = new Date();
    this.filtroKardex.periodoFin = this.formatearPeriodoMes(hoy);
    this.filtroKardex.periodoInicio = this.formatearPeriodoMes(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
    this.filtroTransacciones.fechaFin = this.formatearFechaSQL(hoy.toISOString());
    this.filtroTransacciones.fechaInicio = this.formatearFechaSQL(
      new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    );

    // Cargar stock inmediatamente desde Dexie (cache); si no existe, desde API
    await Promise.all([
      this.cargarStockInicial(),

      // Cargar almacenes desde Dexie si ya existen
      this.cargarAlmacenesDesdeDexie(),
    ]);

    // Sincronizar tablas maestras en segundo plano (sin bloquear UI)
    this.sincronizarTablasMaestrasSilencioso();

    // Cargar transacciones y dashboard

    // Cargar kardex automáticamente al iniciar (cache primero, luego sync silenciosa)

    console.log('ngOnInit - Completado');
  }

  async cambiarTab(indice: number): Promise<void> {
    this.tabActiva = indice;

    if (!this.companiaConsulta || (this.puedeVerTodasEmpresas && !this.empresaSeleccionada)) return;

    if (indice === 0 && this.stock.length === 0) {
      await this.cargarStockInicial();
    }
  }

  async cargarUsuario() {
    this.usuario = await this.dexieService.getUsuarioLogueado();
    if (!this.usuario) {
      this.usuario = this.userService.getUsuario();
    }
    if (this.usuario) {
      this.userService.setUsuario(this.usuario);
    }
  }

  get puedeVerPrecios(): boolean {
    return !this.usuario?.idrol?.includes('ALLOGIST');
  }

  get puedeVerTodasEmpresas(): boolean {
    return this.usuario?.idrol?.includes('JLOLOGIST') ?? false;
  }

  get companiaSocio(): string {
    return this.normalizarCompaniaSocio(this.usuario?.idempresa);
  }

  get alcanceEmpresaCache(): string {
    return this.puedeVerTodasEmpresas && !this.empresaSeleccionada
      ? `TODAS_${this.hashString(this.companiasSocios.join('|'))}`
      : this.companiaConsulta;
  }

  get companiaConsulta(): string {
    return this.puedeVerTodasEmpresas && this.empresaSeleccionada
      ? this.empresaSeleccionada
      : this.companiaSocio;
  }

  private normalizarCompaniaSocio(idempresa: unknown): string {
    const valor = String(idempresa ?? '').trim();
    if (/^\d{8}$/.test(valor) && valor.endsWith('00')) return valor;
    if (/^\d{1,6}$/.test(valor)) return `${valor.padStart(6, '0')}00`;
    return '';
  }

  private async configurarAlcanceEmpresas(): Promise<void> {
    if (!this.puedeVerTodasEmpresas) {
      this.companiasSocios = [this.companiaSocio];
      return;
    }

    this.todasCompaniasSocios = this.empresasDisponibles.map(empresa => empresa.value);
    this.empresaSeleccionada = '';
    this.companiasSocios = [];
  }

  async seleccionarEmpresa(companiaSocio: string): Promise<void> {
    if (!this.puedeVerTodasEmpresas || this.empresaSeleccionada === companiaSocio) return;
    this.empresaSeleccionada = companiaSocio;
    await this.cambiarEmpresaSeleccionada();
  }

  async cambiarEmpresaSeleccionada(): Promise<void> {
    if (!this.puedeVerTodasEmpresas) return;

    this.companiasSocios = [this.empresaSeleccionada];

    this.stock = [];
    this.stockFiltrado = [];
    this.almacenesStockDisponibles = [];
    this.items = [];
    this.itemsKardex = [];
    this.movimientosKardex = [];
    this.transacciones = [];
    this.transaccionesFiltradas = [];

    await this.cargarStockInicial();
  }

  private validarEmpresaSeleccionada(): boolean {
    if (this.puedeVerTodasEmpresas && this.empresaSeleccionada) return true;
    if (!this.puedeVerTodasEmpresas && this.companiaSocio) return true;

    this.alertService.showAlert(
      'Atención',
      this.puedeVerTodasEmpresas
        ? 'Debe seleccionar HASS PERU SA, Berry Harvest S.A. o Corporacion Agricola Olmos S.A.'
        : 'El usuario ALLOGIST no tiene una empresa válida asignada en el login.',
      'warning',
    );
    return false;
  }

  private construirAlcanceEmpresa(): any {
    const incluirTodasEmpresas = false;
    return {
      companiaSocio: this.companiaConsulta,
      companiasSocios: this.companiasSocios,
      incluirTodasEmpresas,
    };
  }

  async cargarDatos() {
    // Cada tabla maneja su propio loading para no bloquear las demás
    try {
      await this.cargarDashboard();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.alertService.showAlert(
        'Error',
        'Error al cargar los datos',
        'error',
      );
    }
  }

  async cargarAlmacenesDesdeDexie() {
    try {
      console.log('Cargando almacenes desde Dexie...');
      await Promise.all([
        this.ListarAlmacenes(),
        this.ListarAlmacenesDestino()
      ]);
      console.log('Almacenes cargados desde Dexie');
    } catch (error) {
      console.error('Error al cargar almacenes desde Dexie:', error);
    }
  }

  async sincronizarTablasMaestras() {
    try {
      console.log('Iniciando sincronización de tablas maestras...');
      this.alertService.mostrarModalCarga();

      // Cargar almacenes una sola vez y usar para ambos arrays
      const almacenes$ = this.maestrasService.getAlmacenes([
        { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' },
      ]);

      almacenes$.pipe(take(1)).subscribe(async (resp: any) => {
        console.log('Respuesta de almacenes:', resp);
        if (!!resp && resp.length) {
          console.log('Guardando almacenes en Dexie...');
          await Promise.all([
            this.dexieService.saveAlmacenes(resp),
            this.dexieService.saveAlmacenesDestino(resp)
          ]);
          console.log('Almacenes guardados, listando...');
          await Promise.all([
            this.ListarAlmacenes(),
            this.ListarAlmacenesDestino()
          ]);
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Éxito!',
            'Almacenes sincronizados correctamente',
            'success'
          );
        } else {
          console.log('No se encontraron almacenes');
          this.alertService.cerrarModalCarga();
          this.alertService.showAlert(
            'Información',
            'No se encontraron almacenes para sincronizar',
            'info'
          );
        }
      });

      // const items = this.maestrasService.getItems([{ ruc: this.usuario?.ruc }]);
      // items.subscribe(async (resp: any) => {
      //   if (!!resp && resp.length) {
      //     await this.dexieService.saveItemComoditys(resp);
      //     await this.ListarItems();
      //   }
      // });

      // const servicios = this.maestrasService.getItems([
      //   { ruc: this.usuario?.ruc },
      // ]);
      // servicios.subscribe(async (resp: any) => {
      //   if (!!resp && resp.length) {
      //     await this.dexieService.saveComodities(resp);
      //   }
      // });

      // const activosFijos = this.maestrasService.getActivosFijos([
      //   { idempresa: this.usuario?.idempresa },
      // ]);
      // activosFijos.subscribe(async (resp: any) => {
      //   if (!!resp && resp.length) {
      //     await this.dexieService.saveActivosFijos(resp);
      //   }
      // });
    } catch (error: any) {
      console.error('Error en sincronizarTablasMaestras:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error!',
        'Ocurrió un error al sincronizar tablas maestras',
        'error',
      );
    }
  }

  private sincronizarTablasMaestrasSilencioso(): void {
    console.log('[Maestras] Iniciando sincronización silenciosa de almacenes');
    const almacenes$ = this.maestrasService.getAlmacenes([
      { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' },
    ]);

    almacenes$.pipe(take(1)).subscribe({
      next: async (resp: any) => {
        if (!!resp && resp.length) {
          await Promise.all([
            this.dexieService.saveAlmacenes(resp),
            this.dexieService.saveAlmacenesDestino(resp),
          ]);
          await Promise.all([
            this.ListarAlmacenes(),
            this.ListarAlmacenesDestino(),
          ]);
          console.log('[Maestras] Almacenes sincronizados silenciosamente');
        }
      },
      error: (error: any) => {
        console.error('[Maestras] Error en sincronización silenciosa:', error);
      },
    });
  }

  async ListarAlmacenes() {
    console.log('ListarAlmacenes - Iniciando');
    const almacenes = await this.dexieService.showAlmacenes();
    console.log('Almacenes desde Dexie:', almacenes);
    this.almacenes = almacenes.map(a => ({
      label: a.almacen,
      value: a.idalmacen.toString()
    }));
    console.log('Almacenes mapeados:', this.almacenes);
  }

  async ListarAlmacenesDestino() {
    console.log('ListarAlmacenesDestino - Iniciando');
    const almacenesDestino = await this.dexieService.showAlmacenesDestino();
    console.log('Almacenes destino desde Dexie:', almacenesDestino);
    this.almacenesDestino = almacenesDestino.map(a => ({
      label: a.almacen,
      value: a.idalmacen.toString()
    }));
    console.log('Almacenes destino mapeados:', this.almacenesDestino);
  }

  // ==================== STOCK ====================

  // ---------- Carga y cache de stock ----------

  async cargarStockInicial(): Promise<void> {
    if (!this.companiaConsulta || (this.puedeVerTodasEmpresas && !this.empresaSeleccionada)) {
      this.stock = [];
      this.stockFiltrado = [];
      this.almacenesStockDisponibles = [];
      this.items = [];
      this.itemsKardex = [];
      return;
    }

    const cargadoDesdeDexie = await this.cargarStockDesdeDexie();

    if (cargadoDesdeDexie) {
      console.log('[Stock] Cargado desde Dexie, iniciando sincronización silenciosa');
      this.sincronizarStockSilencioso();
      return;
    }

    console.log('[Stock] Sin cache en Dexie, cargando desde API');
    this.loadingStock = true;
    try {
      await this.consultarStockDesdeApi();
    } finally {
      this.loadingStock = false;
    }
  }

  private async cargarStockDesdeDexie(): Promise<boolean> {
    try {
      const [cachedStock, meta] = await Promise.all([
        this.dexieService.showStockPorCompanias(this.companiasSocios),
        this.dexieService.getSyncMeta(this.stockCacheKey),
      ]);

      if (!meta || !cachedStock || cachedStock.length === 0) {
        this.hayStockCache = false;
        return false;
      }

      this.stock = cachedStock.map(item => this.normalizarStockItem(item));
      this.filtrarStock();
      this.derivarItemsDesdeStock();
      this.lastSyncStock = meta ? new Date(meta.fechaSync) : null;
      this.hayStockCache = true;

      console.log(`[Stock] Cache cargado: ${cachedStock.length} registros. Último sync: ${this.lastSyncStock}`);
      return true;
    } catch (error) {
      console.error('Error al cargar stock desde Dexie:', error);
      return false;
    }
  }

  private async consultarStockDesdeApi(): Promise<void> {
    try {
      const filtros = this.construirAlcanceEmpresa();
      const raw = await this.kardexService.consultarStock(filtros);
      await this.guardarStockEnCache(raw);
      this.aplicarStock(raw, new Date());
    } catch (error) {
      console.error('Error al consultar stock desde API:', error);
    }
  }

  async consultarStock(): Promise<void> {
    // Refresco manual: limpiar cache, llamar API y mostrar spinner
    this.loadingStock = true;
    try {
      await this.consultarStockDesdeApi();
    } finally {
      this.loadingStock = false;
    }
  }

  private async sincronizarStockSilencioso(): Promise<void> {
    if ((this.puedeVerTodasEmpresas && !this.empresaSeleccionada) || this.sincronizandoStock) return;

    this.sincronizandoStock = true;
    try {
      const filtros = this.construirAlcanceEmpresa();
      const raw = await this.kardexService.consultarStock(filtros);

      const nuevoHash = this.generarHashStock(raw);
      const meta = await this.dexieService.getSyncMeta(this.stockCacheKey);
      const hashActual = meta?.hash ?? '';

      if (nuevoHash === hashActual) {
        console.log('[Stock] Sin cambios respecto al cache. No se actualiza la vista.');
        // Actualizar timestamp de sync para reflejar que se verificó
        if (meta) {
          meta.fechaSync = new Date().toISOString();
          await this.dexieService.saveSyncMeta(meta);
          this.lastSyncStock = new Date();
        }
        return;
      }

      console.log('[Stock] Datos nuevos detectados, actualizando cache y vista');
      await this.guardarStockEnCache(raw);
      this.aplicarStock(raw, new Date());
    } catch (error) {
      console.error('Error en sincronización silenciosa de stock:', error);
    } finally {
      this.sincronizandoStock = false;
    }
  }

  private async guardarStockEnCache(raw: any[]): Promise<void> {
    const stocksParaGuardar: Stock[] = raw.map(item => {
      const normalizado = this.normalizarStockItem(item);
      return {
        ...normalizado,
        codigo: (normalizado.codigoItem ?? normalizado.codigo ?? '').trim(),
        descripcion: (normalizado.descripcionItem ?? normalizado.descripcion ?? '').trim(),
        cantidad: normalizado.stockActual ?? normalizado.cantidad ?? 0,
        companiaSocio: normalizado.companiaSocio ?? this.companiaConsulta,
      };
    });

    const hash = this.generarHashStock(raw);

    await this.dexieService.replaceStocksPorCompanias(this.companiasSocios, stocksParaGuardar);
    await this.dexieService.saveSyncMeta({
      clave: this.stockCacheKey,
      fechaSync: new Date().toISOString(),
      hash,
      cantidadRegistros: stocksParaGuardar.length,
    });
  }

  private normalizarStockItem(item: any): any {
    return {
      ...item,
      codigoItem: (item.codigoItem ?? item.codigo ?? '').trim(),
      descripcionItem: (item.descripcionItem ?? item.descripcion ?? '').trim(),
      unidadMedida: (item.unidadMedida ?? '').trim(),
      almacen: (item.almacen ?? '').trim(),
    };
  }

  private aplicarStock(raw: any[], fechaSync: Date): void {
    this.stock = raw.map(item => this.normalizarStockItem(item));
    this.filtrarStock();
    this.derivarItemsDesdeStock();
    this.lastSyncStock = fechaSync;
    this.hayStockCache = true;
  }

  private derivarItemsDesdeStock(): void {
    this.almacenesStockDisponibles = Array.from(
      new Set(this.stock.map(item => (item.almacen ?? '').trim()).filter(Boolean))
    ).sort();

    this.items = this.stock.map(item => ({
      idItem: item.idItem,
      codigoItem: item.codigoItem ?? item.codigo,
      descripcionItem: item.descripcionItem ?? item.descripcion,
      unidadMedida: item.unidadMedida,
      costoPromedio: item.costoPromedio,
      almacen: item.almacen,
      label: `${item.codigoItem ?? item.codigo} - ${item.descripcionItem ?? item.descripcion}`,
    }));

    this.itemsKardex = Array.from(
      new Map(this.items.map(item => [item.codigoItem, item])).values()
    );
  }

  private generarHashStock(items: any[]): string {
    const normalizado = items
      .map(i => ({
        codigoItem: (i.codigoItem ?? i.codigo ?? '').trim(),
        companiaSocio: (i.companiaSocio ?? '').trim(),
        almacen: (i.almacen ?? '').trim(),
        stockActual: i.stockActual ?? i.cantidad ?? 0,
      }))
      .sort((a, b) => a.codigoItem.localeCompare(b.codigoItem) || a.almacen.localeCompare(b.almacen));

    return this.hashString(JSON.stringify(normalizado));
  }

  private hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return String(hash >>> 0);
  }

  programarFiltroStock(): void {
    if (this.filtroStockTimer) clearTimeout(this.filtroStockTimer);
    this.filtroStockTimer = setTimeout(() => this.filtrarStock(), 180);
  }

  filtrarStock() {
    this.stockFiltrado = this.stock.filter((item) => {
      let cumpleFiltro = true;

      if (this.filtroStock.almacen) {
        cumpleFiltro =
          cumpleFiltro && item.almacen.trim() === this.filtroStock.almacen.trim();
      }

      if (this.filtroStock.codigoItem) {
        const busqueda = this.filtroStock.codigoItem.toLowerCase().trim();
        cumpleFiltro =
          cumpleFiltro &&
          (item.codigoItem.toLowerCase().trim().includes(busqueda) ||
            item.descripcionItem.toLowerCase().trim().includes(busqueda));
      }


      return cumpleFiltro;
    });
  }

  limpiarFiltrosStock() {
    this.filtroStock = {
      almacen: '',
      codigoItem: '',
    };
    this.filtrarStock();
    // Refrescar en segundo plano por si los datos cambiaron
    this.sincronizarStockSilencioso();
  }

  getEstadoStock(item: any): string {
    if (item.stockActual <= item.stockMinimo) return 'BAJO';
    if (item.stockActual >= item.stockMaximo) return 'ALTO';
    return 'NORMAL';
  }

  getSeverityStock(
    estado: string,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' {
    switch (estado) {
      case 'BAJO':
        return 'danger';
      case 'ALTO':
        return 'warn';
      default:
        return 'success';
    }
  }

  // ==================== KARDEX ====================

  async buscarKardex() {
    if (!this.validarEmpresaSeleccionada()) return;

    if (!this.filtroKardex.codigoItem?.trim()) {
      this.alertService.showAlert('Atención', 'Debe ingresar el código de ítem para consultar el Kardex.', 'warning');
      return;
    }

    if (!this.validarRangoPeriodos(this.filtroKardex.periodoInicio, this.filtroKardex.periodoFin)) {
      return;
    }

    const filtros = this.construirFiltrosKardex();
    const cacheCargado = await this.cargarKardexDesdeCache();

    if (cacheCargado) {
      void this.sincronizarKardexSilencioso(filtros, true);
      return;
    }

    this.movimientosKardex = [];
    this.hayKardexCache = false;
    await this.sincronizarKardexSilencioso(filtros, false);
  }

  seleccionarItemKardex(item: any): void {
    this.itemKardexSeleccionado = item;
    this.filtroKardex.codigoItem = item?.codigoItem ?? item?.codigo ?? '';
  }

  private construirFiltrosKardex(): any {
    const filtros: any = this.construirAlcanceEmpresa();

    filtros.codigoItem = this.filtroKardex.codigoItem.trim();

    if (this.filtroKardex.almacen) filtros.almacen = this.filtroKardex.almacen;
    if (this.filtroKardex.tipoMovimiento) filtros.tipoMovimiento = this.filtroKardex.tipoMovimiento;
    if (this.filtroKardex.fuente) filtros.fuente = this.filtroKardex.fuente;

    // Siempre enviar fechas; el SP usa ultimos 30 dias si no vienen,
    // pero enviarlas garantiza cache correcto y filtro explicito.
    filtros.periodoInicio = this.filtroKardex.periodoInicio?.replace('-', '');
    filtros.periodoFin = this.filtroKardex.periodoFin?.replace('-', '');

    if (this.filtroKardex.periodoInicio && this.filtroKardex.periodoFin) {
      filtros.fechaInicio = `${this.filtroKardex.periodoInicio}-01`;
      const [anioFin, mesFin] = this.filtroKardex.periodoFin.split('-').map(Number);
      const ultimoDia = new Date(anioFin, mesFin, 0).getDate();
      filtros.fechaFin = `${this.filtroKardex.periodoFin}-${String(ultimoDia).padStart(2, '0')}`;
    }

    return filtros;
  }

  private async cargarKardexDesdeCache(): Promise<boolean> {
    try {
      const cache = await this.dexieService.getKardexCache(this.kardexCacheKey);
      if (!cache || !cache.movimientos?.length) {
        this.hayKardexCache = false;
        return false;
      }

      this.movimientosKardex = cache.movimientos.map((m: any) => this.normalizarMovimientoKardex(m));
      this.lastSyncKardex = new Date(cache.fechaSync);
      this.hayKardexCache = true;
      console.log(`[Kardex] Cache cargado: ${cache.movimientos.length} movimientos. Último sync: ${this.lastSyncKardex}`);
      return true;
    } catch (error) {
      console.error('Error al cargar kardex desde cache:', error);
      return false;
    }
  }

  private async sincronizarKardexSilencioso(filtros: any, cacheCargado: boolean): Promise<void> {
    if (this.sincronizandoKardex) return;

    // Si no hay cache, mostrar spinner mientras se carga la primera vez
    if (!cacheCargado) {
      this.loadingKardex = true;
    }

    this.sincronizandoKardex = true;
    try {
      const rawKardex = await this.kardexService.consultarKardex(filtros);
      console.log('[Kardex] Respuesta backend:', rawKardex, 'length:', rawKardex?.length);

      const nuevoHash = this.generarHashKardex(rawKardex);
      const cache = await this.dexieService.getKardexCache(this.kardexCacheKey);
      const hashActual = cache?.hash ?? '';

      if (nuevoHash === hashActual) {
        console.log('[Kardex] Sin cambios respecto al cache.');
        if (cache) {
          this.movimientosKardex = cache.movimientos.map((m: any) => this.normalizarMovimientoKardex(m));
          this.hayKardexCache = this.movimientosKardex.length > 0;
          cache.fechaSync = new Date().toISOString();
          await this.dexieService.saveKardexCache(cache);
          this.lastSyncKardex = new Date();
        }
        return;
      }

      console.log('[Kardex] Datos nuevos detectados, actualizando cache y vista');
      const movimientosNormalizados = rawKardex.map((m: any) => this.normalizarMovimientoKardex(m));

      await this.dexieService.saveKardexCache({
        clave: this.kardexCacheKey,
        companiaSocio: this.companiaSocio,
        filtros,
        movimientos: movimientosNormalizados,
        fechaSync: new Date().toISOString(),
        hash: nuevoHash,
        cantidadRegistros: movimientosNormalizados.length,
      });

      this.movimientosKardex = movimientosNormalizados;
      this.lastSyncKardex = new Date();
      this.hayKardexCache = true;
    } catch (error) {
      console.error('Error al buscar kardex:', error);
      this.alertService.showAlert(
        'Error',
        'Error al consultar kardex',
        'error',
      );
    } finally {
      this.sincronizandoKardex = false;
      this.loadingKardex = false;
    }
  }

  private normalizarMovimientoKardex(m: any): any {
    return {
      ...m,
      codigoItem:      (m.codigoItem      ?? '').trim(),
      descripcionItem: (m.descripcionItem ?? '').trim(),
      unidadMedida:    (m.unidadMedida    ?? '').trim(),
      almacenOrigen:   (m.almacenOrigen   ?? '').trim(),
      almacenDestino:  (m.almacenDestino  ?? '').trim(),
      tipoDocumento:   (m.tipoDocumento   ?? '').trim(),
      numeroDocumento: (m.numeroDocumento ?? '').trim(),
    };
  }

  private generarHashKardex(items: any[]): string {
    const normalizado = items
      .map(m => ({
        codigoItem: (m.codigoItem ?? m.codigo ?? '').trim(),
        almacenOrigen: (m.almacenOrigen ?? '').trim(),
        almacenDestino: (m.almacenDestino ?? '').trim(),
        cantidadEntrada: m.cantidadEntrada ?? 0,
        cantidadSalida: m.cantidadSalida ?? 0,
        saldo: m.saldo ?? null,
        periodo: m.periodo ?? '',
        esCierrePeriodo: m.esCierrePeriodo ?? false,
        stockPeriodo: m.stockPeriodo ?? null,
        fecha: m.fecha ?? '',
      }))
      .sort((a, b) =>
        a.fecha.localeCompare(b.fecha) ||
        a.codigoItem.localeCompare(b.codigoItem) ||
        a.almacenOrigen.localeCompare(b.almacenOrigen)
      );

    return this.hashString(JSON.stringify(normalizado));
  }

  private validarRangoPeriodos(periodoInicio: string | null, periodoFin: string | null): boolean {
    if (!periodoInicio || !periodoFin || !/^\d{4}-\d{2}$/.test(periodoInicio) || !/^\d{4}-\d{2}$/.test(periodoFin)) {
      this.alertService.showAlert('Atención', 'Debe seleccionar el período desde y el período hasta.', 'warning');
      return false;
    }

    if (periodoInicio > periodoFin) {
      this.alertService.showAlert('Atención', 'El período desde no puede ser posterior al período hasta.', 'warning');
      return false;
    }

    const [anioInicio, mesInicio] = periodoInicio.split('-').map(Number);
    const [anioFin, mesFin] = periodoFin.split('-').map(Number);
    const meses = (anioFin - anioInicio) * 12 + mesFin - mesInicio;

    if (meses > 11) {
      this.alertService.showAlert('Atención', 'El rango máximo de consulta es de 12 meses.', 'warning');
      return false;
    }

    return true;
  }

  private validarPeriodo(fechaInicio: string | null, fechaFin: string | null, maximoDias = 90): boolean {
    if (!fechaInicio || !fechaFin) {
      this.alertService.showAlert('Atención', 'Debe seleccionar fecha de inicio y fecha de fin.', 'warning');
      return false;
    }

    if (fechaInicio > fechaFin) {
      this.alertService.showAlert('Atención', 'La fecha de inicio no puede ser posterior a la fecha de fin.', 'warning');
      return false;
    }

    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);
    const dias = Math.floor((fin.getTime() - inicio.getTime()) / 86400000);

    if (dias > maximoDias) {
      this.alertService.showAlert('Atención', `El período máximo de consulta es de ${maximoDias} días.`, 'warning');
      return false;
    }

    return true;
  }

  limpiarKardex() {
    this.itemKardexSeleccionado = null;
    const hoy = new Date();
    this.filtroKardex = {
      codigoItem: '',
      almacen: '',
      periodoInicio: this.formatearPeriodoMes(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
      periodoFin: this.formatearPeriodoMes(hoy),
      tipoMovimiento: '',
      fuente: '',
    };
    this.movimientosKardex = [];
  }

  getSeverityMovimiento(
    tipo: string,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' {
    switch (tipo) {
      case 'ENTRADA':
        return 'success';
      case 'SALIDA':
        return 'danger';
      case 'TRANSFERENCIA':
        return 'info';
      case 'AJUSTE':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  // ==================== TRANSACCIONES ====================

  async listarTransacciones(forzarApi = false): Promise<void> {
    if (!this.validarEmpresaSeleccionada()) return;

    if (!this.validarPeriodo(this.filtroTransacciones.fechaInicio, this.filtroTransacciones.fechaFin)) {
      return;
    }

    const filtros = this.construirFiltrosTransacciones();

    if (!forzarApi) {
      const cacheCargado = await this.cargarTransaccionesDesdeCache();
      if (cacheCargado) {
        this.sincronizarTransaccionesSilencioso(filtros, true);
        return;
      }
    }

    // Sin cache o forzado: cargar desde API con spinner
    this.loadingTransacciones = true;
    try {
      const raw = await this.kardexService.listarTransacciones(filtros);
      await this.guardarTransaccionesEnCache(raw);
      this.aplicarTransacciones(raw, new Date());
    } catch (error) {
      console.error('Error al listar transacciones:', error);
    } finally {
      this.loadingTransacciones = false;
    }
  }

  private construirFiltrosTransacciones(): any {
    const filtros: any = this.construirAlcanceEmpresa();

    if (this.filtroTransacciones.tipoTransaccion) filtros.tipoTransaccion = this.filtroTransacciones.tipoTransaccion;
    if (this.filtroTransacciones.estado)          filtros.estado          = this.filtroTransacciones.estado;
    if (this.filtroTransacciones.fuente)          filtros.fuente          = this.filtroTransacciones.fuente;

    if (this.filtroTransacciones.fechaInicio) {
      filtros.fechaInicio = this.formatearFechaSQL(this.filtroTransacciones.fechaInicio);
    }
    if (this.filtroTransacciones.fechaFin) {
      filtros.fechaFin = this.formatearFechaSQL(this.filtroTransacciones.fechaFin);
    }

    return filtros;
  }

  private async cargarTransaccionesDesdeCache(): Promise<boolean> {
    try {
      const cache = await this.dexieService.getTransaccionesCache(this.transaccionesCacheKey);
      if (!cache || !cache.transacciones?.length) {
        this.hayTransaccionesCache = false;
        return false;
      }

      this.transacciones = cache.transacciones.map((t: any) => this.normalizarTransaccion(t));
      this.transaccionesFiltradas = [...this.transacciones];
      this.lastSyncTransacciones = new Date(cache.fechaSync);
      this.hayTransaccionesCache = true;
      console.log(`[Transacciones] Cache cargado: ${cache.transacciones.length} registros. Último sync: ${this.lastSyncTransacciones}`);
      return true;
    } catch (error) {
      console.error('Error al cargar transacciones desde cache:', error);
      return false;
    }
  }

  private async sincronizarTransaccionesSilencioso(filtros: any, cacheCargado: boolean): Promise<void> {
    if (this.sincronizandoTransacciones) return;

    if (!cacheCargado) {
      this.loadingTransacciones = true;
    }

    this.sincronizandoTransacciones = true;
    try {
      const raw = await this.kardexService.listarTransacciones(filtros);
      const nuevoHash = this.generarHashTransacciones(raw);
      const cache = await this.dexieService.getTransaccionesCache(this.transaccionesCacheKey);
      const hashActual = cache?.hash ?? '';

      if (nuevoHash === hashActual) {
        console.log('[Transacciones] Sin cambios respecto al cache.');
        if (cache) {
          cache.fechaSync = new Date().toISOString();
          await this.dexieService.saveTransaccionesCache(cache);
          this.lastSyncTransacciones = new Date();
        }
        return;
      }

      console.log('[Transacciones] Datos nuevos detectados, actualizando cache y vista');
      await this.guardarTransaccionesEnCache(raw);
      this.aplicarTransacciones(raw, new Date());
    } catch (error) {
      console.error('Error al sincronizar transacciones:', error);
    } finally {
      this.sincronizandoTransacciones = false;
      this.loadingTransacciones = false;
    }
  }

  private async guardarTransaccionesEnCache(raw: any[]): Promise<void> {
    const transaccionesNormalizadas = raw.map(t => this.normalizarTransaccion(t));
    const hash = this.generarHashTransacciones(raw);

    await this.dexieService.saveTransaccionesCache({
      clave: this.transaccionesCacheKey,
      companiaSocio: this.companiaSocio,
      filtros: this.construirFiltrosTransacciones(),
      transacciones: transaccionesNormalizadas,
      fechaSync: new Date().toISOString(),
      hash,
      cantidadRegistros: transaccionesNormalizadas.length,
    });
  }

  private aplicarTransacciones(raw: any[], fechaSync: Date): void {
    this.transacciones = raw.map(t => this.normalizarTransaccion(t));
    this.transaccionesFiltradas = [...this.transacciones];
    this.lastSyncTransacciones = fechaSync;
    this.hayTransaccionesCache = true;
  }

  private normalizarTransaccion(t: any): any {
    return {
      ...t,
      tipoTransaccion: (t.tipoTransaccion ?? '').trim(),
      estado: (t.estado ?? '').trim(),
      fuente: (t.fuente ?? '').trim(),
      numeroDocumento: (t.numeroDocumento ?? '').trim(),
      almacenOrigen: (t.almacenOrigen ?? '').trim(),
      almacenDestino: (t.almacenDestino ?? '').trim(),
    };
  }

  private generarHashTransacciones(items: any[]): string {
    const normalizado = items
      .map(t => ({
        idTransaccion: t.idTransaccion ?? t.id ?? '',
        tipoTransaccion: (t.tipoTransaccion ?? '').trim(),
        estado: (t.estado ?? '').trim(),
        numeroDocumento: (t.numeroDocumento ?? '').trim(),
        fecha: t.fecha ?? '',
      }))
      .sort((a, b) =>
        String(a.idTransaccion).localeCompare(String(b.idTransaccion)) ||
        a.fecha.localeCompare(b.fecha)
      );

    return this.hashString(JSON.stringify(normalizado));
  }

  buscarItem(event: any) {
    const query = event.query.toLowerCase();

    // Obtener el almacén seleccionado según el tipo de transacción
    const almacenSeleccionado =
      this.nuevaTransaccion.tipoTransaccion === 'INGRESO' || 
      this.nuevaTransaccion.tipoTransaccion === 'REINGRESO' ||
      this.nuevaTransaccion.tipoTransaccion === 'DEVOLUCION_CONSUMO'
        ? this.nuevaTransaccion.almacenDestino
        : this.nuevaTransaccion.almacenOrigen;

    console.log('=== buscarItem ===');
    console.log('Tipo transacción:', this.nuevaTransaccion.tipoTransaccion);
    console.log('Almacén seleccionado (value):', almacenSeleccionado);
    console.log('Query:', query);
    console.log('Items totales:', this.items.length);

    // Si no hay almacén seleccionado, no mostrar ningún item
    if (!almacenSeleccionado) {
      console.log('No hay almacén seleccionado, no mostrar items');
      this.itemsFiltrados = [];
      return;
    }

    // Primero filtrar por almacén
    console.log('Filtrando por almacén:', almacenSeleccionado);
    
    const itemsPorAlmacen = this.items.filter(item => item.almacen === almacenSeleccionado);
    console.log('Items del almacén:', itemsPorAlmacen.length);
    
    // Si no hay query, mostrar todos los items del almacén
    if (!query) {
      this.itemsFiltrados = itemsPorAlmacen;
    } else {
      // Filtrar por el texto de búsqueda dentro de los items del almacén
      this.itemsFiltrados = itemsPorAlmacen.filter(item =>
        item.codigoItem.toLowerCase().includes(query) ||
        item.descripcionItem.toLowerCase().includes(query)
      );
    }

    console.log('Items filtrados finales:', this.itemsFiltrados.length);
    console.log('Items filtrados:', this.itemsFiltrados);
  }

  cambiarAlmacen() {
    console.log('cambiarAlmacen() - Limpiando items filtrados');
    this.itemsFiltrados = [];

    this.nuevaTransaccion.detalles.forEach((det) => {
      det.itemSeleccionado = null;
      det.codigoItem = '';
      det.descripcionItem = '';
    });

    // Pre-filtrar items por el almacén seleccionado
    const almacenSeleccionado =
      this.nuevaTransaccion.tipoTransaccion === 'INGRESO'
        ? this.nuevaTransaccion.almacenDestino
        : this.nuevaTransaccion.almacenOrigen;

    if (almacenSeleccionado) {
      console.log('Pre-filtrando items para almacén:', almacenSeleccionado);
      this.itemsFiltrados = this.items.filter(item => item.almacen === almacenSeleccionado);
      console.log('Items pre-filtrados:', this.itemsFiltrados);
    }
  }

  cambiarTipoTransaccion() {
    console.log('cambiarTipoTransaccion() - Tipo:', this.nuevaTransaccion.tipoTransaccion);
    
    // Limpiar almacenes seleccionados
    this.nuevaTransaccion.almacenOrigen = '';
    this.nuevaTransaccion.almacenDestino = '';
    
    // Limpiar items filtrados
    this.itemsFiltrados = [];
    
    // Limpiar detalles
    this.nuevaTransaccion.detalles = [];
    
    console.log('Tipo de transacción cambiado, almacenes y detalles limpiados');
  }

  limpiarFiltrosTransacciones() {
    this.filtroTransacciones = {
      fechaInicio: this.formatearFechaSQL(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      ),
      fechaFin: this.formatearFechaSQL(new Date().toISOString()),
      tipoTransaccion: '',
      estado: '',
      fuente: '',
    };
    this.transacciones = [];
    this.transaccionesFiltradas = [];
  }

  abrirModalNuevaTransaccion() {
    if (!this.validarEmpresaSeleccionada()) return;

    console.log('abrirModalNuevaTransaccion() - Inicializando');
    
    // Limpiar items filtrados al abrir el modal
    this.itemsFiltrados = [];
    
    this.nuevaTransaccion = {
      tipoTransaccion: 'INGRESO',
      tipoDocumentoOrigen: '',
      numeroDocumentoOrigen: this.generarNumeroDocumento(),
      almacenOrigen: '',
      almacenDestino: '',
      observaciones: '',
      detalles: [],
    };
    
    this.modalNuevaTransaccion = true;
    console.log('Modal abierto con tipo INGRESO por defecto');
    console.log('Número de documento generado:', this.nuevaTransaccion.numeroDocumentoOrigen);
  }

  generarNumeroDocumento(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');
    
    // Formato: KAR-YYYYMMDD-HHMMSS
    return `KAR-${año}${mes}${dia}-${horas}${minutos}${segundos}`;
  }

  async guardarTransaccion() {
    if (!this.validarTransaccion()) {
      return;
    }

    try {
      this.loading = true;
      const transaccion = {
        ...this.nuevaTransaccion,
        companiaSocio: this.companiaConsulta,
        usuarioRegistro: this.usuario?.documentoidentidad || 'SISTEMA',
      };

      const resultado = await this.kardexService.registrarTransaccion(transaccion);

      if (resultado.success) {
        this.alertService.showAlert(
          'Éxito',
          'Transacción registrada correctamente',
          'success',
        );

        // Generar nuevo número de documento para la siguiente transacción
        this.nuevaTransaccion.numeroDocumentoOrigen = this.generarNumeroDocumento();
        console.log('Nuevo número de documento generado:', this.nuevaTransaccion.numeroDocumentoOrigen);

        const confirmar = await this.alertService.showConfirm(
          'Confirmar',
          '¿Desea procesar la transacción ahora?\n\nEsto actualizará el kardex y el stock',
          'question',
        );

        if (confirmar) {
          await this.procesarTransaccion(resultado.idTransaccion);
        } else {
          // Si no procesa, limpiar solo los detalles pero mantener el nuevo número
          this.nuevaTransaccion.detalles = [];
        }
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al guardar transacción:', error);
      this.alertService.showAlert(
        'Error',
        'Error al registrar transacción',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  validarTransaccion(): boolean {
    if (!this.nuevaTransaccion.tipoTransaccion) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar el tipo de transacción',
        'warning',
      );
      return false;
    }

    if (this.nuevaTransaccion.detalles.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un item',
        'warning',
      );
      return false;
    }

    if (
      (this.nuevaTransaccion.tipoTransaccion === 'INGRESO' ||
       this.nuevaTransaccion.tipoTransaccion === 'REINGRESO' ||
       this.nuevaTransaccion.tipoTransaccion === 'DEVOLUCION_CONSUMO') &&
      !this.nuevaTransaccion.almacenDestino
    ) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar el almacén de destino',
        'warning',
      );
      return false;
    }

    if (
      this.nuevaTransaccion.tipoTransaccion === 'SALIDA' &&
      !this.nuevaTransaccion.almacenOrigen
    ) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar el almacén de origen',
        'warning',
      );
      return false;
    }

    return true;
  }

  async procesarTransaccion(idTransaccion: number) {
    try {
      this.loading = true;
      const resultado =
        await this.kardexService.procesarTransaccion(idTransaccion);

      if (resultado.status === 'success') {
        this.alertService.showAlert('Éxito', resultado.message, 'success');
        await this.cargarDatos();
        // Refrescar stock y transacciones desde API tras cambio local
        await this.consultarStock();
        await this.listarTransacciones(true);
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al procesar transacción:', error);
      this.alertService.showAlert(
        'Error',
        'Error al procesar transacción',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async verDetalleTransaccion(transaccion: any) {
    try {
      this.loading = true;
      this.transaccionDetalle =
        await this.kardexService.obtenerDetalleTransaccion(
          transaccion.idTransaccion,
        );
      this.modalDetalleTransaccion = true;
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      this.alertService.showAlert(
        'Error',
        'Error al obtener detalle de transacción',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async anularTransaccion(transaccion: any) {
    const confirmar = await this.alertService.showConfirm(
      '¿Está seguro de anular esta transacción?',
      'Esta acción no se puede deshacer',
      'warning',
    );

    if (!confirmar) return;

    const motivo = 'Anulado por usuario'; // Simplificado por ahora

    try {
      this.loading = true;
      const resultado = await this.kardexService.anularTransaccion(
        transaccion.idTransaccion,
        motivo,
      );

      if (resultado.status === 'success') {
        this.alertService.showAlert('Éxito', resultado.message, 'success');
        // Refrescar desde API tras cambio local para mantener caches consistentes
        await this.listarTransacciones(true);
        await this.consultarStock();
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al anular transacción:', error);
      this.alertService.showAlert(
        'Error',
        'Error al anular transacción',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  getSeverityEstado(
    estado: string,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' {
    switch (estado) {
      case 'PENDIENTE':
        return 'warn';
      case 'PROCESADO':
        return 'success';
      case 'ANULADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  // ==================== DASHBOARD ====================

  async cargarDashboard() {
    try {
      this.dashboard = await this.kardexService.dashboardInventario();
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    }
  }

  async cargarReporteValorizacion() {
    try {
      this.loading = true;
      this.reporteValorizacion = await this.kardexService.reporteValorizacion();
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      this.alertService.showAlert(
        'Error',
        'Error al cargar reporte de valorización',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  exportarReporte() {
    // Implementar exportación a Excel
    this.alertService.showAlert(
      'Info',
      'Funcionalidad de exportación en desarrollo',
      'info',
    );
  }

  // ==================== UTILIDADES ====================

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatearFechaSQL(fecha: Date | string | null): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') {
      return fecha.substring(0, 10);
    }
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatearPeriodoMes(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  formatearMoneda(valor: number): string {
    return this.formatoMoneda.format(valor);
  }

  formatearNumero(valor: number): string {
    return this.formatoNumero.format(valor);
  }

  // ==================== PRUEBAS Y SINCRONIZACIÓN ====================

  async probarFlujoCompleto() {
    const confirmar = await this.alertService.showConfirm(
      '¿Desea probar el flujo completo de kardex?',
      'Esto insertará datos ficticios para pruebas',
      'info',
    );

    if (!confirmar) return;

    try {
      this.loading = true;
      const resultado = await this.kardexService.probarFlujoCompleto();

      if (resultado.status === 'success') {
        this.alertService.showAlert('Éxito', resultado.message, 'success');
        await this.cargarDatos();
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al probar flujo:', error);
      this.alertService.showAlert(
        'Error',
        'Error al probar flujo completo',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async ejecutarRecepcionOC() {
    const formResult = await this.alertService.showFormDialog(
      'Ejecutar Recepción de Orden de Compra',
      [
        {
          label: 'Compañía Socio',
          name: 'companiaSocio',
          type: 'text',
          defaultValue: '00000800',
          required: true,
        },
        {
          label: 'Número de Orden',
          name: 'numeroOrden',
          type: 'text',
          defaultValue: '0000000146',
          required: true,
        },
        {
          label: 'Almacén',
          name: 'almacenCodigo',
          type: 'text',
          defaultValue: 'H001',
          required: true,
        },
        {
          label: 'Usuario',
          name: 'usuario',
          type: 'text',
          defaultValue: 'MISESF',
          required: false,
        },
      ],
    );

    if (!formResult) return;

    try {
      this.loading = true;
      const formData = formResult as RecepcionOCForm;
      const resultado = await this.kardexService.ejecutarRecepcionOC({
        companiaSocio: formData.companiaSocio,
        numeroOrden: formData.numeroOrden,
        almacenCodigo: formData.almacenCodigo,
        usuario: formData.usuario,
      });

      if (resultado.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          `Recepción ejecutada. Documento: ${resultado.numeroDocumento}`,
          'success',
        );
        await this.cargarDatos();
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al ejecutar recepción:', error);
      this.alertService.showAlert(
        'Error',
        'Error al ejecutar recepción de OC',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async sincronizarSpring() {
    const formResult = await this.alertService.showFormDialog(
      'Sincronizar con SPRING',
      [
        {
          label: 'Compañía Socio (opcional)',
          name: 'companiaSocio',
          type: 'text',
          required: false,
        },
        {
          label: 'Fecha Desde (opcional)',
          name: 'fechaDesde',
          type: 'date',
          required: false,
        },
        {
          label: 'Fecha Hasta (opcional)',
          name: 'fechaHasta',
          type: 'date',
          required: false,
        },
        {
          label: 'Solo pendientes',
          name: 'soloPendientes',
          type: 'checkbox',
          required: false,
        },
      ],
    );

    if (!formResult) return;

    const formData = formResult as SincronizacionForm;
    try {
      this.loading = true;
      const resultado = await this.kardexService.sincronizarSpring(formData);

      if (resultado.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          `Datos preparados: ${resultado.TotalRegistros} registros`,
          'success',
        );
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al sincronizar:', error);
      this.alertService.showAlert(
        'Error',
        'Error al sincronizar con SPRING',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async ejecutarSincronizacionSpring() {
    const formResult = await this.alertService.showFormDialog(
      'Ejecutar Sincronización con SPRING',
      [
        {
          label: 'Compañía Socio (opcional)',
          name: 'companiaSocio',
          type: 'text',
          required: false,
        },
        {
          label: 'Fecha Desde (opcional)',
          name: 'fechaDesde',
          type: 'date',
          required: false,
        },
        {
          label: 'Fecha Hasta (opcional)',
          name: 'fechaHasta',
          type: 'date',
          required: false,
        },
        {
          label: 'Solo pendientes',
          name: 'soloPendientes',
          type: 'checkbox',
          required: false,
        },
        {
          label: 'Ejecutar Real (no simular)',
          name: 'ejecutarReal',
          type: 'checkbox',
          required: false,
        },
      ],
    );

    if (!formResult) return;

    const formData = formResult as EjecutarSincronizacionForm;
    const modo = formData.ejecutarReal ? 'real' : 'simulación';
    const confirmar = await this.alertService.showConfirm(
      `¿Desea ejecutar la sincronización en modo ${modo}?`,
      'Esta acción procesará los datos para SPRING',
      'info',
    );

    if (!confirmar) return;

    try {
      this.loading = true;
      const resultado =
        await this.kardexService.ejecutarSincronizacionSpring(formData);

      if (resultado.status === 'success') {
        let mensaje = `Procesados: ${resultado.TotalProcesados} registros\n`;
        mensaje += `Errores: ${resultado.TotalErrores}\n`;
        if (resultado.TotalSimulados > 0)
          mensaje += `Simulados: ${resultado.TotalSimulados}\n`;
        if (resultado.TotalEnviados > 0)
          mensaje += `Enviados: ${resultado.TotalEnviados}`;

        this.alertService.showAlert('Éxito', mensaje, 'success');
      } else {
        this.alertService.showAlert('Error', resultado.message, 'error');
      }
    } catch (error) {
      console.error('Error al ejecutar sincronización:', error);
      this.alertService.showAlert(
        'Error',
        'Error al ejecutar sincronización con SPRING',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  async verificarEstadoSincronizacion() {
    const formResult = await this.alertService.showFormDialog(
      'Verificar Estado de Sincronización',
      [
        {
          label: 'Compañía Socio (opcional)',
          name: 'companiaSocio',
          type: 'text',
          required: false,
        },
      ],
    );

    if (!formResult) return;

    const formData = formResult as VerificarEstadoForm;
    try {
      this.loading = true;
      const resultado = await this.kardexService.verificarEstadoSincronizacion(
        formData.companiaSocio,
      );

      if (Array.isArray(resultado) && resultado.length > 0) {
        let mensaje = 'Estado de sincronización:\n\n';
        resultado.forEach((tabla: any) => {
          mensaje += `${tabla.Tabla}:\n`;
          mensaje += `  - Total: ${tabla.TotalRegistros}\n`;
          mensaje += `  - Pendientes: ${tabla.PendientesSincronizar}\n`;
          mensaje += `  - Completados: ${tabla.Completados}\n`;
          mensaje += `  - Última modificación: ${this.formatearFecha(tabla.UltimaModificacion)}\n\n`;
        });

        this.alertService.showAlert(
          'Estado de Sincronización',
          mensaje,
          'info',
        );
      } else {
        this.alertService.showAlert(
          'Información',
          'No se encontraron datos',
          'info',
        );
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
      this.alertService.showAlert(
        'Error',
        'Error al verificar estado de sincronización',
        'error',
      );
    } finally {
      this.loading = false;
    }
  }

  // Métodos para el modal de nueva transacción
  agregarDetalleTransaccion() {
    this.nuevaTransaccion.detalles.push({
      idItem: null,
      codigoItem: '',
      descripcionItem: '',
      unidadMedida: '',
      cantidad: null,
      costoUnitario: null,
      costoTotal: 0,
      lote: '',
      fechaVencimiento: null,
      observaciones: '',
      itemSeleccionado: null, // Agregado para autocomplete
    });
  }

  eliminarDetalleTransaccion(index: number) {
    this.nuevaTransaccion.detalles.splice(index, 1);
  }

  seleccionarItemEnDetalle(index: number) {
    const detalle = this.nuevaTransaccion.detalles[index];
    let itemSeleccionado = detalle.itemSeleccionado;
    
    // Si es string, buscar el objeto completo
    if (typeof itemSeleccionado === 'string') {
      itemSeleccionado = this.items.find(item => 
        item.codigoItem === itemSeleccionado || 
        item.label === itemSeleccionado
      );
    }

    if (itemSeleccionado) {
      detalle.idItem = itemSeleccionado.idItem;
      detalle.codigoItem = itemSeleccionado.codigoItem;
      detalle.descripcionItem = itemSeleccionado.descripcionItem;
      detalle.unidadMedida = itemSeleccionado.unidadMedida;
      detalle.costoUnitario = itemSeleccionado.costoPromedio || 0;
      
      // Mantener el objeto completo para el autocomplete
      detalle.itemSeleccionado = itemSeleccionado;
      
      this.calcularTotalDetalle(index);
    }
  }

  calcularTotalDetalle(index: number) {
    const detalle = this.nuevaTransaccion.detalles[index];
    detalle.costoTotal = (detalle.cantidad || 0) * (detalle.costoUnitario || 0);
  }

  calcularTotalTransaccion(): number {
    return this.nuevaTransaccion.detalles.reduce(
      (total, det) => total + (det.costoTotal || 0),
      0,
    );
  }

  // Cargar items para el dropdown desde el stock cacheado
  async cargarItems() {
    // Los items se derivan del stock ya cargado; no se llama al API nuevamente
    this.derivarItemsDesdeStock();
  }
}
