import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { RequerimientosMaestrasService } from './services/requerimientos-maestras.service';
import { RequerimientosItemService } from './services/requerimientos-item.service';
import { RequerimientosCommodityService } from './services/requerimientos-commodity.service';
import { RequerimientosActivoFijoService } from './services/requerimientos-activo-fijo.service';
import { RequerimientosActivoMenorService } from './services/requerimientos-activo-menor.service';
import { RequerimientosSyncService } from './services/requerimientos-sync.service';
import { MaestrasService } from '@/app/modules/main/services/maestras.service';
import {
  Requerimiento,
  DetalleRequerimiento,
  Usuario,
  DetalleRequerimientoCommodity,
  DetalleRequerimientoActivoFijo,
  ActivoFijo,
  RequerimientoCommodity,
  RequerimientoActivoFijo,
  RequerimientoActivoFijoMenor,
  DetalleRequerimientoActivoFijoMenor,
  DetalleExcelPreview,
  ErrorExcel,
} from 'src/app/shared/interfaces/Tables';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { CommodityService } from '@/app/modules/main/services/commoditys.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { PrioridadRequerimientoService } from '@/app/shared/services/prioridad-requerimiento.service';
import {
  PrioridadSpring,
  TipoRequerimiento,
} from '@/app/shared/interfaces/PrioridadRequerimiento';
import {
  Ceco,
  Configuracion,
  Labor,
  Proyecto,
  Turno,
} from '@/app/shared/interfaces/Tables';
import {
  Area,
  ItemComodity,
  Comodity,
  Almacen,
  Clasificacion,
} from '@/app/shared/interfaces/Tables';
import * as XLSX from 'xlsx';
import { TabItemComponent } from './components/tab-item/tab-item.component';
import { TabCommodityComponent } from './components/tab-commodity/tab-commodity.component';
import { TabActivoFijoComponent } from './components/tab-activo-fijo/tab-activo-fijo.component';
import { TabActivoMenorComponent } from './components/tab-activo-menor/tab-activo-menor.component';
import { ModalStockValidacionComponent } from './components/modal-stock-validacion/modal-stock-validacion.component';
@Component({
  selector: 'app-requerimientos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabItemComponent,
    TabCommodityComponent,
    TabActivoFijoComponent,
    TabActivoMenorComponent,
    ModalStockValidacionComponent,
  ],
  templateUrl: './requerimientos.component.html',
  styleUrls: ['./requerimientos.component.scss'],
})
export class RequerimientosComponent implements OnInit, OnDestroy {
  private contadorReq = 0; // contador para IDs Ãºnicos en la sesiÃ³n
  private visibilityChangeHandler = this.onVisibilityChange.bind(this);
  private windowFocusHandler = this.onWindowFocus.bind(this);
  private estadoSyncIntervalId: any = null;
  tabActiva: 'ITEM' | 'COMMODITY' | 'ACTIVOFIJO' | 'ACTIVOFIJOMENOR' = 'ITEM';
  mostrarFormulario = false;
  modoEdicion: boolean = false;
  mostrarFormularioCommodity = false;
  modoEdicionCommodity: boolean = false;
  mostrarFormularioActivoFijo = false;
  modoEdicionActivoFijo: boolean = false;
  mostrarFormularioActivoFijoMenor = false;
  modoEdicionActivoFijoMenor: boolean = false;

  // === MODO SERVICIO (desde configuración en Parámetros) ===
  get esModoServicio(): boolean {
    return localStorage.getItem('tipoRequerimientoConfig') === 'SERVICIO';
  }

  // Tab Servicios visible solo cuando se configuró COMPRA o SERVICIO (no CONSUMO)
  get mostrarTabServicios(): boolean {
    const tipo = localStorage.getItem('tipoRequerimientoConfig');
    return tipo === 'COMPRA' || tipo === 'SERVICIO';
  }

  // Tabs Activos Fijos y Activos Menores solo visibles cuando se configuró COMPRA en Parámetros
  get mostrarTabsActivosFijos(): boolean {
    return localStorage.getItem('tipoRequerimientoConfig') === 'COMPRA';
  }

  get tabActivaInicial(): 'ITEM' | 'COMMODITY' | 'ACTIVOFIJO' | 'ACTIVOFIJOMENOR' {
    return this.esModoServicio ? 'COMMODITY' : 'ITEM';
  }

  requerimientos: Requerimiento[] = [];
  requerimientosItems: any[] = []; // ITEMS
  requerimientosCommodity: RequerimientoCommodity[] = []; // SERVICIOS
  requerimientosActivoFijo: RequerimientoActivoFijo[] = []; // ACTIVO FIJO
  requerimientosActivoFijoMenor: RequerimientoActivoFijoMenor[] = []; // ACTIVO FIJO MENOR
  detalles: DetalleRequerimiento[] = []; // para ITEMS
  detallesCommodity: DetalleRequerimientoCommodity[] = []; // para SERVICIOS
  detallesActivoFijo: DetalleRequerimientoActivoFijo[] = []; // para ACTIVO FIJO
  detallesActivoFijoMenor: DetalleRequerimientoActivoFijoMenor[] = []; // para ACTIVO FIJO MENOR
  loading: boolean = false;
  pendientes = 0;
  sincronizando = false;
  progreso = 0;
  lineasPreview: DetalleExcelPreview[] = [];
  puedeGuardar = false;
  modalVisible = false;
  erroresExcel: ErrorExcel[] = [];
  tieneErroresExcel: boolean = false;
  modalAbierto: boolean = false;
  editIndex: number = -1;
  permitirEditarParametros: boolean = false; // Checkbox para habilitar ediciÃ³n
  lineasTemporales: DetalleRequerimiento[] = []; // Tabla de lÃ­neas agregadas
  editingTempIndex: number = -1; // Ãndice de lÃ­nea temporal en ediciÃ³n (-1 = nueva lÃ­nea)
  turnoModal: string = '';
  cecoModal: string = '';
  laborModal: string = '';
  proyectoModal: string = '';
  filteredCecosModal: Ceco[] = [];
  filteredLaboresModal: Labor[] = [];
  filteredProyectosModal: Proyecto[] = [];
  unidadesMedidaFiltradas: any[] = [];
  get modalTurnoValue(): string {
    return this.editIndex >= 0 || this.editingTempIndex >= 0
      ? this.lineaTemp?.turno || ''
      : this.turnoModal;
  }
  set modalTurnoValue(value: string) {
    if (this.editIndex >= 0 || this.editingTempIndex >= 0) {
      this.lineaTemp.turno = value;
    } else {
      this.turnoModal = value;
    }
  }
  get modalCecoValue(): string {
    return this.editIndex >= 0 || this.editingTempIndex >= 0
      ? this.lineaTemp?.ceco || ''
      : this.cecoModal;
  }
  set modalCecoValue(value: string) {
    if (this.editIndex >= 0 || this.editingTempIndex >= 0) {
      this.lineaTemp.ceco = value;
    } else {
      this.cecoModal = value;
    }
  }
  get modalProyectoValue(): string {
    return this.editIndex >= 0 || this.editingTempIndex >= 0
      ? this.lineaTemp?.proyecto || ''
      : this.proyectoModal;
  }
  set modalProyectoValue(value: string) {
    if (this.editIndex >= 0 || this.editingTempIndex >= 0) {
      this.lineaTemp.proyecto = value;
    } else {
      this.proyectoModal = value;
    }
  }
  get modalLaborValue(): string {
    return this.editIndex >= 0 || this.editingTempIndex >= 0
      ? this.lineaTemp?.labor || ''
      : this.laborModal;
  }
  set modalLaborValue(value: string) {
    if (this.editIndex >= 0 || this.editingTempIndex >= 0) {
      this.lineaTemp.labor = value;
    } else {
      this.laborModal = value;
    }
  }
  private get enModoEdicion(): boolean {
    return this.editIndex >= 0
      || this.editingTempIndex >= 0
      || this.commodityEditIndex >= 0
      || this.activoFijoEditIndex >= 0
      || this.activoFijoMenorEditIndex >= 0;
  }
  get modalTurnoEditable(): boolean {
    return this.enModoEdicion ? true : this.permitirEditarParametros;
  }
  get modalTurnoDisabled(): boolean {
    return this.enModoEdicion ? false : !this.permitirEditarParametros;
  }
  get modalCecoData(): Ceco[] {
    if (this.enModoEdicion)
      return this.filteredCecosModal.length > 0
        ? this.filteredCecosModal
        : this.cecos;
    return this.permitirEditarParametros ? this.filteredCecosModal : this.cecos;
  }
  get modalCecoEditable(): boolean {
    return this.enModoEdicion ? true : this.permitirEditarParametros;
  }
  get modalCecoDisabled(): boolean {
    return this.enModoEdicion ? false : !this.permitirEditarParametros;
  }
  get modalProyectoData(): Proyecto[] {
    if (this.enModoEdicion)
      return this.filteredProyectosModal.length > 0
        ? this.filteredProyectosModal
        : this.proyectos;
    return this.permitirEditarParametros
      ? this.filteredProyectosModal
      : this.proyectos;
  }
  get modalProyectoEditable(): boolean {
    return this.enModoEdicion ? true : this.permitirEditarParametros;
  }
  get modalProyectoDisabled(): boolean {
    return this.enModoEdicion ? false : !this.permitirEditarParametros;
  }
  get modalLaborData(): Labor[] {
    if (this.enModoEdicion)
      return this.filteredLaboresModal.length > 0
        ? this.filteredLaboresModal
        : this.labores;
    return this.permitirEditarParametros
      ? (this.filteredLaboresModal.length > 0 ? this.filteredLaboresModal : this.labores)
      : this.labores;
  }
  get modalLaborEditable(): boolean {
    return this.enModoEdicion ? true : this.permitirEditarParametros;
  }
  get modalLaborDisabled(): boolean {
    return this.enModoEdicion ? false : !this.permitirEditarParametros;
  }
  modalAbiertoCommodity: boolean = false;
  commodityEditIndex: number = -1;
  modalAbiertoActivoFijo: boolean = false;
  activoFijoEditIndex: number = -1;
  modalAbiertoActivoFijoMenor: boolean = false;
  activoFijoMenorEditIndex: number = -1;
  modalStockAbierto: boolean = false;
  itemsStockValidacion: any[] = [];
  requerimientoValidandoStock: any = null;
  validandoStock: boolean = false;
  requerimientosOmitirValidacion: Set<string> = new Set();

  cambiarTab(tab: 'ITEM' | 'COMMODITY' | 'ACTIVOFIJO' | 'ACTIVOFIJOMENOR') {
    // ALLOGIST solo puede ver el tab ITEM (COMPRA)
    if (this.esAlmacen && tab !== 'ITEM') {
      return;
    }
    this.tabActiva = tab;
    this.mostrarFormulario = false;
    this.mostrarFormularioCommodity = false;
    this.mostrarFormularioActivoFijo = false;
    this.mostrarFormularioActivoFijoMenor = false;
    if (tab === 'COMMODITY' && this.opcionesPrioridadCOMMODITY.length === 0) {
      this.opcionesPrioridadCOMMODITY =
        this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    } else if (
      tab === 'ACTIVOFIJO' &&
      this.opcionesPrioridadACTIVOFIJO.length === 0
    ) {
      this.opcionesPrioridadACTIVOFIJO =
        this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    } else if (
      tab === 'ACTIVOFIJOMENOR' &&
      this.opcionesPrioridadACTIVOFIJOMENOR.length === 0
    ) {
      this.opcionesPrioridadACTIVOFIJOMENOR =
        this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    }
  }

  verBotones: boolean = false;
  verBotonEliminar: boolean = false;
  modoItemPrincipal: boolean = false;
  dataSelected: any = [];
  allSelected: boolean = false;
  requerimientoActivo: any = null;
  dataSelectedCommodity: any = [];
  requerimientoCommodityActivo: any = null;
  dataSelectedActivoFijo: any = [];
  requerimientoActivoFijoActivo: any = null;
  dataSelectedActivoFijoMenor: any = [];
  requerimientoActivoFijoMenorActivo: any = null;
  verBotonesActivoFijoMenor: boolean = false;
  fecha = new Date();
  mensajeFundos: String = '';
  fundos: any[] = [];
  cultivos: any[] = [];
  areas: any[] = [];
  proyectos: any[] = [];
  items: any[] = [];
  turnos: any[] = [];
  labores: any[] = [];
  cecos: any[] = [];
  almacenes: any[] = [];
  alamcenesDestino: any[] = [];
  clasificaciones: any[] = [];
  glosa: string = '';
  glosaCommodity: string = '';
  glosaActivoFijo: string = '';
  glosaActivoFijoMenor: string = '';
  proveedoresServicios: any[] = [];
  proveedoresActivoFijo: any[] = [];
  tipoGastos: any[] = [];
  servicios: any[] = [];
  servicioAF: any[] = [];
  servicioAFMenor: any[] = [];
  subservicios: any[] = [];
  subserviciosAF: any[] = [];
  subserviciosAFMenor: any[] = [];
  subservicioFiltradosAF: any[] = [];
  subservicioFiltradosAFMenor: any[] = [];
  activosFijos: any[] = [];
  activoFijoFiltrados: any[] = [];
  columns = [
    { header: 'Editar', field: 'editar', type: 'button', visible: true },
    { header: 'Fecha', field: 'fecha', visible: true, sortable: true },
    { header: 'Fundo', field: 'idfundo', visible: true, sortable: true },
    { header: 'Ãrea', field: 'idarea', visible: true, sortable: true },
    { header: 'AlmacÃ©n', field: 'almacen', visible: true, sortable: true },
    { header: 'Glosa', field: 'glosa', visible: true },
    { header: 'Estado', field: 'estado', visible: true },
    { header: 'Acciones', field: 'acciones', type: 'actions', visible: true },
  ];
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

  get esAlmacen(): boolean {
    return this.usuario?.idrol?.includes('ALLOGIST') ?? false;
  }
  detalle: DetalleRequerimiento = {
    idrequerimiento: '', // ?? SE ASIGNA AL GUARDAR CABECERA
    codigo: '',
    producto: null,
    descripcion: '',
    cantidad: 0,
    unidadMedida: '', // Unidad de medida del producto
    proyecto: '',
    ceco: '',
    turno: '',
    labor: '',
    esActivoFijo: false,
    activoFijo: '',
    estado: 0,
  };
  requerimiento: Requerimiento = {
    idrequerimiento: '',
    fecha: '',
    almacen: '',
    glosa: '',
    tipo: '',
    itemtipo: '',
    referenciaGasto: '',
    prioridad: '',
    ruc: '',
    estados: 'PENDIENTE',
    idfundo: '',
    idarea: '',
    idclasificacion: '',
    nrodocumento: '',
    idalmacen: '',
    idalmacendestino: '',
    idproyecto: '',
    estado: 0,
    disabled: false,
    checked: false,
    eliminado: 0,
    despachado: false,
    detalle: [],
  };
  requerimientoCommodity: RequerimientoCommodity = {
    idrequerimiento: '',
    fecha: '',
    proveedor: '',
    servicio: '',
    descripcion: '',
    almacen: '',
    glosa: '',
    tipo: '',
    itemtipo: '',
    ruc: '',
    estados: 'PENDIENTE',
    idfundo: '',
    idarea: '',
    idclasificacion: '',
    prioridad: '',
    nrodocumento: '',
    idalmacen: '',
    idalmacendestino: '',
    idproyecto: '',
    estado: 0,
    disabled: false,
    checked: false,
    eliminado: 0,
    detalleCommodity: [],
  };
  requerimientoActivoFijo: RequerimientoActivoFijo = {
    idrequerimiento: '',
    fecha: '',
    proveedor: '',
    servicio: '',
    descripcion: '',
    almacen: '',
    glosa: '',
    tipo: '',
    itemtipo: '',
    ruc: '',
    estados: 'PENDIENTE',
    idfundo: '',
    idarea: '',
    idclasificacion: '',
    prioridad: '',
    nrodocumento: '',
    idalmacen: '',
    idalmacendestino: '',
    idproyecto: '',
    estado: 0,
    disabled: false,
    checked: false,
    eliminado: 0,
    detalleActivoFijo: [],
  };
  requerimientoActivoFijoMenor: RequerimientoActivoFijoMenor = {
    idrequerimiento: '',
    ruc: '',
    fecha: '',
    servicio: '',
    descripcion: '',
    almacen: '',
    glosa: '',
    tipo: '',
    itemtipo: '',
    estados: 'PENDIENTE',
    idfundo: '',
    idarea: '',
    idclasificacion: '',
    prioridad: '',
    nrodocumento: '',
    idalmacen: '',
    idalmacendestino: '',
    idproyecto: '',
    estado: 0,
    disabled: false,
    checked: false,
    eliminado: 0,
    detalleActivoFijoMenor: [],
  };
  detalleActivoFijoMenor: DetalleRequerimientoActivoFijoMenor = {
    idrequerimiento: '', // ?? SE ASIGNA AL GUARDAR CABECERA
    codigo: '',
    descripcion: '',
    proveedor: '',
    cantidad: 0,
    proyecto: '',
    ceco: '',
    turno: '',
    labor: '',
    esActivoFijo: false,
    activoFijo: '',
    estado: 0,
  };
  detalleCommodity: DetalleRequerimientoCommodity = {
    idrequerimiento: '', // ?? SE ASIGNA AL GUARDAR CABECERA
    codigo: '',
    descripcion: '',
    proveedor: '',
    cantidad: 0,
    proyecto: '',
    ceco: '',
    turno: '',
    labor: '',
    esActivoFijo: false,
    activoFijo: '',
    estado: 0,
  };
  detalleActivoFijo: DetalleRequerimientoActivoFijo = {
    idrequerimiento: '', // ?? SE ASIGNA AL GUARDAR CABECERA
    codigo: '',
    descripcion: '',
    proveedor: '',
    cantidad: 0,
    proyecto: '',
    ceco: '',
    turno: '',
    labor: '',
    esActivoFijo: false,
    activoFijo: '',
    estado: 0,
  };
  configuracion: Configuracion = {
    id: '',
    idempresa: '',
    idfundo: '',
    idcultivo: '',
    idarea: '',
    idalmacen: '',
    idproyecto: '',
    idacopio: 0,
    idceco: '',
    idlabor: '',
    iditem: '',
    idturno: '',
    idclasificacion: '',
    idgrupolabor: '',
    idproveedor: '',
    idtipoGasto: '',
    idactivoFijo: '',
    idTipoItem: '',
  };
  filteredCecos: Ceco[] = [];
  filteredTurnos: Turno[] = [];
  filteredProyectos: Proyecto[] = [];
  filteredLabores: Labor[] = [];
  filteredAreas: Area[] = [];
  filteredItems: ItemComodity[] = [];
  filteredClasificaciones: Clasificacion[] = [];
  filteredAlmacenes: Almacen[] = [];
  filteredServicios: Comodity[] = [];
  filteredActivosFijos: ActivoFijo[] = [];
  filterdActivoFijoServicio: ActivoFijo[] = [];
  lineaTemp: DetalleRequerimiento = this.nuevaLinea();
  lineaTempCommodity: DetalleRequerimientoCommodity =
    this.nuevaLineaCommodity();
  lineaTempActivoFijo: DetalleRequerimientoActivoFijo =
    this.nuevaLineaActivoFijo();
  lineaTempActivoFijoMenor: DetalleRequerimientoActivoFijoMenor =
    this.nuevaLineaActivoFijoMenor();
  servicioDetalleSeleccionado: Comodity | null = null;
  cecoSeleccionado: Ceco | null = null;
  proyectoSeleccionado: Proyecto | null = null;
  laborSeleccionado: Labor | null = null;
  sinenviar: number = 0;
  enviados: number = 0;
  sinenviarCommodity: number = 0;
  enviadosCommodity: number = 0;
  sinenviarActivoFijo: number = 0;
  enviadosActivoFijo: number = 0;
  sienvinarActivoFijoMenor: number = 0;
  enviadosActivoFijoMenor: number = 0;
  SeleccionaPrioridadITEM: PrioridadSpring | '' = '';
  SeleccionaPrioridadCOMMODITY: PrioridadSpring | '' = '';
  SeleccionaPrioridadACTIVOFIJO: PrioridadSpring | '' = '';
  SeleccionaPrioridadACTIVOFIJOMENOR: PrioridadSpring | '' = '';
  opcionesPrioridadITEM: {
    value: PrioridadSpring;
    label: string;
    descripcion: string;
  }[] = [];
  opcionesPrioridadCOMMODITY: {
    value: PrioridadSpring;
    label: string;
    descripcion: string;
  }[] = [];
  opcionesPrioridadACTIVOFIJO: {
    value: PrioridadSpring;
    label: string;
    descripcion: string;
  }[] = [];
  opcionesPrioridadACTIVOFIJOMENOR: {
    value: PrioridadSpring;
    label: string;
    descripcion: string;
  }[] = [];
  fundoSeleccionado = '';
  cultivoSeleccionado = '';
  areaSeleccionada = '';
  almacenSeleccionado = '';
  itemSeleccionado = '';
  clasificacionSeleccionado = '';
  turnoSeleccionado = '';
  TipoSelecionado: TipoRequerimiento | '' = '';
  almacenOrigen = '';
  almacenDestino = '';
  RequerimientoSelecionado = 'I';
  seleccionaProveedor = '';
  SeleccionaTipoGasto = '';
  SeleccionaServicio = '';
  SeleccionaServicioAF = '';
  SeleccionaServicioAFMenor = '';
  SeleccionaSubServicio = '';
  SeleccionaSubServicioAF = '';
  SeleccionaSubServicioAFMenor = '';
  selecccionaActivoFijo = '';
  selecccionaActivoFijoMenor = '';
  itemsFiltrados: any[] = [];
  commodityFiltrados: any[] = [];
  subservicioFiltrados: any[] = [];
  commodityFiltradosAF: any[] = [];
  commodityFiltradosAFMenor: any[] = [];
  clasificacionesFiltrados: any[] = [];
  activosFijosFiltrados: any[] = [];
  activosFijosServicioFiltrados: any[] = [];
  constructor(
    private userService: UserService,
    private utilsService: UtilsService,
    private dexieService: DexieService,
    public maestrasSvc: RequerimientosMaestrasService,
    public itemSvc: RequerimientosItemService,
    public commoditySvc: RequerimientosCommodityService,
    public activoFijoSvc: RequerimientosActivoFijoService,
    public activoMenorSvc: RequerimientosActivoMenorService,
    private syncSvc: RequerimientosSyncService,
    private alertService: AlertService, // ? inyectar el servicio
    private requerimientosService: RequerimientosService,
    private aprobacionesAreaService: AprobacionesAreaService, // ? Servicio de aprobaciones por área
    public prioridadService: PrioridadRequerimientoService, // ? Servicio de prioridades (public para usar en template)
    private commodityService: CommodityService, // ? Servicio para sincronizar maestro commodity
    private maestrasService: MaestrasService,
  ) { }
  async ngOnInit() {
    await this.maestrasSvc.cargarUsuario();
    this.usuario = this.maestrasSvc.usuario;

    await this.sincronizaMaestroCommodity(); // Sincronizar maestro commodity desde API
    await this.sincronizaMaestroSubCommodity(); // Sincronizar maestro subcommodity desde API
    await this.maestrasSvc.cargarMaestras();
    this.syncMaestrasDesdeServicio();
    await this.maestrasSvc.cargarConfiguracion();
    this.syncConfigDesdeServicio();

    // Establecer tipo de requerimiento basado en la configuración guardada en Parámetros
    const tipoConfigurado = this.configuracion.idTipoItem;
    const tipoLocalStorage = localStorage.getItem('tipoRequerimientoConfig');
    const rol = this.usuario.idrol;
    const puedeTransferencia = rol === 'LOLOGIST' || rol === 'ALLOGIST' || rol === 'JLOLOGIST' || rol === 'ADLOGIST';

    console.log('🔧 Tipo configurado:', tipoConfigurado, '| localStorage:', tipoLocalStorage, '| Rol:', rol);

    // Priorizar localStorage (compatibilidad con flujo anterior), luego configuración guardada
    const tipoActivo = (tipoLocalStorage || tipoConfigurado || '').toString().toUpperCase().trim();
    console.log('🔧 tipoActivo final:', tipoActivo);

    if (tipoActivo === 'SERVICIO') {
      // SERVICIO: forzar tab COMMODITY
      this.tabActiva = 'COMMODITY';
      console.log('✅ Establecido modo SERVICIO');
    } else if (tipoActivo === 'COMPRA') {
      // COMPRA: tab ITEM para crear reqs ITEM tipo COMPRA
      this.TipoSelecionado = 'COMPRA';
      this.requerimiento.itemtipo = 'COMPRA';
      this.tabActiva = 'ITEM';
      this.opcionesPrioridadITEM = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
      console.log('✅ Establecido tipo COMPRA');
    } else if (tipoActivo === 'TRANSFERENCIA' && puedeTransferencia) {
      // TRANSFERENCIA: LOLOGIST, OPLOGIST y ALLOGIST
      this.TipoSelecionado = 'TRANSFERENCIA';
      this.requerimiento.itemtipo = 'TRANSFERENCIA';
      this.tabActiva = 'ITEM';
      this.opcionesPrioridadITEM = this.prioridadService.obtenerOpcionesPrioridad('TRANSFERENCIA');
      console.log('✅ Establecido tipo TRANSFERENCIA');
    } else if (tipoActivo === 'CONSUMO') {
      // CONSUMO
      this.TipoSelecionado = 'CONSUMO';
      this.requerimiento.itemtipo = 'CONSUMO';
      this.tabActiva = 'ITEM';
      this.opcionesPrioridadITEM = this.prioridadService.obtenerOpcionesPrioridad('CONSUMO');
      console.log('✅ Establecido tipo CONSUMO');
    } else if (this.esAlmacen) {
      // ALLOGIST sin configuración específica → COMPRA
      this.TipoSelecionado = 'COMPRA';
      this.requerimiento.itemtipo = 'COMPRA';
      this.tabActiva = 'ITEM';
      this.opcionesPrioridadITEM = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
      console.log('✅ Establecido tipo COMPRA (ALLOGIST)');
    }

    console.log('🔧 TipoSelecionado final en ngOnInit:', this.TipoSelecionado);

    await this.ListarItems();

    // Limpiar posibles detalles duplicados previamente acumulados en IndexedDB
    await this.dexieService.limpiarDetallesDuplicados();

    await this.cargarRequerimientos();

    // Sincronizar estados con el servidor (online inmediato / offline al restaurar)
    this.syncSvc.escucharConectividad(this.usuario, async () => {
      await this.cargarRequerimientos();
      this.actualizarContadores();
    });
    await this.sincronizarEstadosYRecargar();

    // Re-sincronizar estados cuando el usuario vuelve a la página/app
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    window.addEventListener('focus', this.windowFocusHandler);

    // Sincronizar estados periódicamente para reflejar aprobaciones desde otros dispositivos
    this.iniciarSincronizacionPeriodica();

    await this.cargarPendientes();
    this.actualizarContadores();
    this.opcionesPrioridadCOMMODITY = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.opcionesPrioridadACTIVOFIJO = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.opcionesPrioridadACTIVOFIJOMENOR = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    await this.verificarRequerimientoConsolidado();
    this.mostrarInformacionArea();
  }

  ngOnDestroy(): void {
    this.syncSvc.detenerEscucha();
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    window.removeEventListener('focus', this.windowFocusHandler);
    if (this.estadoSyncIntervalId) {
      clearInterval(this.estadoSyncIntervalId);
      this.estadoSyncIntervalId = null;
    }
  }

  private async onVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible') {
      await this.sincronizarEstadosYRecargar();
    }
  }

  private async onWindowFocus(): Promise<void> {
    await this.sincronizarEstadosYRecargar();
  }

  private iniciarSincronizacionPeriodica(): void {
    // Cada 30 segundos, si la pestaña es visible y hay conexion,
    // sincroniza estados con el servidor para reflejar aprobaciones
    // hechas desde otros dispositivos.
    this.estadoSyncIntervalId = setInterval(async () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      await this.sincronizarEstadosYRecargar();
    }, 30000);
  }

  private async sincronizarEstadosYRecargar(): Promise<void> {
    try {
      await this.syncSvc.sincronizarEstados(this.usuario);
      await this.cargarRequerimientos();
      this.actualizarContadores();
    } catch (error) {
      console.error('Error al sincronizar estados de requerimientos:', error);
    }
  }

  private syncMaestrasDesdeServicio() {
    this.fundos = this.maestrasSvc.fundos;
    this.cultivos = this.maestrasSvc.cultivos;
    this.areas = this.maestrasSvc.areas;
    this.almacenes = this.maestrasSvc.almacenes;
    this.alamcenesDestino = this.maestrasSvc.alamcenesDestino;
    this.proyectos = this.maestrasSvc.proyectos;
    this.turnos = this.maestrasSvc.turnos;
    this.labores = this.maestrasSvc.labores;
    this.cecos = this.maestrasSvc.cecos;
    this.clasificaciones = this.maestrasSvc.clasificaciones;
    this.clasificacionesFiltrados = this.maestrasSvc.clasificacionesFiltrados;
    this.proveedoresServicios = this.maestrasSvc.proveedoresServicios;
    this.proveedoresActivoFijo = this.maestrasSvc.proveedoresActivoFijo;
    this.tipoGastos = this.maestrasSvc.tipoGastos;
    this.servicios = this.maestrasSvc.servicios;
    this.servicioAF = this.maestrasSvc.servicioAF;
    this.servicioAFMenor = this.maestrasSvc.servicioAFMenor;
    this.subservicioFiltrados = this.maestrasSvc.subservicioFiltrados;
    this.subservicioFiltradosAF = this.maestrasSvc.subservicioFiltradosAF;
    this.subservicioFiltradosAFMenor = this.maestrasSvc.subservicioFiltradosAFMenor;
    this.commodityFiltrados = this.maestrasSvc.commodityFiltrados;
    this.commodityFiltradosAF = this.maestrasSvc.commodityFiltradosAF;
    this.commodityFiltradosAFMenor = this.maestrasSvc.commodityFiltradosAFMenor;
    this.activosFijosFiltrados = this.maestrasSvc.activosFijosFiltrados;
    this.activosFijosServicioFiltrados = this.maestrasSvc.activosFijosServicioFiltrados;
  }

  private syncConfigDesdeServicio() {
    this.configuracion = this.maestrasSvc.configuracion;
    this.fundoSeleccionado = this.maestrasSvc.fundoSeleccionado;
    this.areaSeleccionada = this.maestrasSvc.areaSeleccionada;
    this.cultivoSeleccionado = this.maestrasSvc.cultivoSeleccionado;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.clasificacionSeleccionado = this.maestrasSvc.clasificacionSeleccionado;
    this.turnoSeleccionado = this.maestrasSvc.turnoSeleccionado;
    this.cecoSeleccionado = this.maestrasSvc.cecoSeleccionado;
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.laborSeleccionado = this.maestrasSvc.laborSeleccionado;
  }
  mostrarInformacionArea() {
    if (this.usuario.idarea) {
      console.log(
        `?? Usuario asignado al Ã¡rea: ${this.usuario.nombreArea || this.usuario.idarea}`,
      );
      if (this.usuario.esJefeArea) {
        console.log(
          '?? El usuario es Jefe de Ãrea - puede aprobar requerimientos de su Ã¡rea',
        );
      }
    } else {
      console.log(
        '?? Usuario sin Ã¡rea asignada - usarÃ¡ flujo de aprobaciÃ³n normal',
      );
    }
  }

  async verificarRequerimientoConsolidado() {
    const consolidadoData = sessionStorage.getItem('requerimientoConsolidado');
    if (consolidadoData) {
      try {
        const data = JSON.parse(consolidadoData);
        this.TipoSelecionado = data.tipo;
        this.requerimiento.itemtipo = data.tipo;
        this.opcionesPrioridadITEM =
          this.prioridadService.obtenerOpcionesPrioridad(
            this.TipoSelecionado as 'COMPRA' | 'CONSUMO' | 'TRANSFERENCIA',
          );
        await this.onTipoChange();
        this.mostrarFormulario = true;
        this.modoEdicion = false;
        this.SeleccionaPrioridadITEM = '1';
        this.glosa = data.descripcion;
        this.tabActiva = 'ITEM';

        // Establecer almacén por defecto del requerimiento consolidado
        if (data.detalles && data.detalles.length > 0) {
          const primerDetalle = data.detalles[0];
          const almacenOrigen = primerDetalle.almacen || primerDetalle.AlmacenCodigo || '';
          if (almacenOrigen) {
            // Buscar el almacén en la lista de almacenes
            const almacenEnLista = this.almacenes.find((a: any) =>
              a.idalmacen === almacenOrigen ||
              a.codigo === almacenOrigen ||
              a.AlmacenCodigo === almacenOrigen
            );
            if (almacenEnLista) {
              this.almacenSeleccionado = almacenEnLista.idalmacen || almacenEnLista.codigo || almacenEnLista.AlmacenCodigo;
            }
          }
        }

        data.detalles.forEach((detalle: any) => {
          this.agregarDetalleConsolidado(detalle);
        });
        sessionStorage.removeItem('requerimientoConsolidado');
        this.alertService.showAlert(
          'InformaciÃ³n',
          'Requerimiento de compra consolidado cargado. Complete los datos adicionales y guarde.',
          'info',
        );
      } catch (error) {
        console.error('Error al procesar requerimiento consolidado:', error);
        sessionStorage.removeItem('requerimientoConsolidado');
      }
    }
  }

  agregarDetalleConsolidado(detalle: any) {
    console.log(detalle);
    
    // Buscar precio en maestro de ítems
    const itemEnMaestro = this.maestrasSvc.items.find((it: any) => it.codigo === detalle.codigo);
    const precioEstimado = itemEnMaestro?.precioEstimado || 0;
    const moneda = itemEnMaestro?.moneda || 'PEN';
    
    const nuevoDetalle: any = {
      id: this.contadorReq++,
      idrequerimiento: '', // Will be set when saving
      codigo: detalle.codigo, // Empty since item code goes in producto
      producto: detalle.descripcion, // Item code goes here
      descripcion: '',
      cantidad: detalle.cantidad,
      cantidadAprobada: detalle.cantidad,
      cantidadAtendida: 0,
      unidadMedida: 'UNIDAD',
      precioReferencial: precioEstimado,
      monedaReferencial: moneda,
      montoReferencial: precioEstimado * detalle.cantidad,
      proyecto: detalle.proyecto || this.proyectoSeleccionado?.proyectoio || '', // Use from consolidated detail first
      ceco: detalle.ceco || this.cecoSeleccionado?.localname || '', // Use from consolidated detail first
      turno: '', // No se usa turnos en compras
      labor: this.laborSeleccionado?.labor || '', // Use the labor display name
      familia: detalle.familia,
      requerimientosOrigen: detalle.requerimientosOrigen,
      estado: 0,
      esActivoFijo: false,
      activoFijo: '',
      seleccionado: false,
      eliminado: 0,
    };
    this.detalles.push(nuevoDetalle);
  }

  actualizarContadores() {
    this.contarSinEnviar();
    this.contarEnviados();
  }

  esEnviado(e: any): boolean {
    return e.estado === 1;
  }

  esSinEnviar(e: any): boolean {
    return e.estado === 0;
  }

  contarSinEnviar() {
    this.sinenviar = this.requerimientos.filter((r) =>
      this.esSinEnviar(r),
    ).length;
    this.sinenviarCommodity = this.requerimientosCommodity.filter((r) =>
      this.esSinEnviar(r),
    ).length;
    this.sinenviarActivoFijo = this.requerimientosActivoFijo.filter((r) =>
      this.esSinEnviar(r),
    ).length;
    this.sienvinarActivoFijoMenor = this.requerimientosActivoFijoMenor.filter(
      (r) => this.esSinEnviar(r),
    ).length;
  }

  contarEnviados() {
    this.enviados = this.requerimientos.filter((r) => this.esEnviado(r)).length;
    this.enviadosCommodity = this.requerimientosCommodity.filter((r) =>
      this.esEnviado(r),
    ).length;
    this.enviadosActivoFijo = this.requerimientosActivoFijo.filter((r) =>
      this.esEnviado(r),
    ).length;
    this.enviadosActivoFijoMenor = this.requerimientosActivoFijoMenor.filter(
      (r) => this.esEnviado(r),
    ).length;
  }

  async cargarConfiguracion() {
    await this.maestrasSvc.cargarConfiguracion();
    this.syncConfigDesdeServicio();
    this.TipoSelecionado = this.configuracion.idTipoItem as TipoRequerimiento | '';
    this.itemSeleccionado = this.configuracion.iditem;
    await this.onTipoChange();
    if (!this.requerimiento.idalmacen) {
      this.requerimiento.idalmacen = this.configuracion.idalmacen;
    }
  }

  async nuevoCommodity() {
    await this.commoditySvc.nuevo();
    this.requerimientoCommodity = this.commoditySvc.requerimientoCommodity;
    this.detallesCommodity = this.commoditySvc.detallesCommodity;
    this.glosaCommodity = this.commoditySvc.glosaCommodity;
    this.mostrarFormularioCommodity = this.commoditySvc.mostrarFormularioCommodity;
    this.modoEdicionCommodity = this.commoditySvc.modoEdicionCommodity;
    this.SeleccionaPrioridadCOMMODITY = this.commoditySvc.SeleccionaPrioridadCOMMODITY;
  }

  editarCommodity(index: number) {
    this.commoditySvc.editar(index);
    this.requerimientoCommodity = this.commoditySvc.requerimientoCommodity;
    this.detallesCommodity = this.commoditySvc.detallesCommodity;
    this.mostrarFormularioCommodity = this.commoditySvc.mostrarFormularioCommodity;
    this.modoEdicionCommodity = this.commoditySvc.modoEdicionCommodity;
    this.commodityEditIndex = this.commoditySvc.commodityEditIndex;
    this.opcionesPrioridadCOMMODITY = this.commoditySvc.opcionesPrioridadCOMMODITY;
    this.fundoSeleccionado = this.maestrasSvc.fundoSeleccionado;
    this.areaSeleccionada = this.maestrasSvc.areaSeleccionada;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.clasificacionSeleccionado = this.maestrasSvc.clasificacionSeleccionado;
    this.SeleccionaPrioridadCOMMODITY = this.commoditySvc.SeleccionaPrioridadCOMMODITY;
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.seleccionaProveedor = this.commoditySvc.seleccionaProveedor;
    this.SeleccionaServicio = this.commoditySvc.SeleccionaServicio;
    this.onServicioChange();
    this.glosaCommodity = this.commoditySvc.glosaCommodity;
    this.modalAbiertoCommodity = false;
  }

  async eliminarCommodity(index: number) {
    await this.commoditySvc.eliminar(index);
    this.requerimientosCommodity = this.commoditySvc.requerimientosCommodity;
    this.actualizarContadores();
    this.ordenarRequerimientosCommodity();
  }

  async guardarCommodity() {
    if (!this.detallesCommodity || this.detallesCommodity.length === 0) {
      alert('Debe agregar detalles antes de guardar');
      return;
    }
    this.commoditySvc.glosaCommodity = this.glosaCommodity;
    this.commoditySvc.seleccionaProveedor = this.seleccionaProveedor;
    this.commoditySvc.SeleccionaServicio = this.SeleccionaServicio;
    this.commoditySvc.SeleccionaSubServicio = this.SeleccionaSubServicio;
    this.commoditySvc.SeleccionaPrioridadCOMMODITY = this.SeleccionaPrioridadCOMMODITY;
    this.commoditySvc.detallesCommodity = this.detallesCommodity;
    await this.commoditySvc.guardar();
    this.requerimientosCommodity = this.commoditySvc.requerimientosCommodity;
    this.detallesCommodity = this.commoditySvc.detallesCommodity;
    this.mostrarFormularioCommodity = this.commoditySvc.mostrarFormularioCommodity;
    this.modoEdicionCommodity = this.commoditySvc.modoEdicionCommodity;
    this.glosaCommodity = this.commoditySvc.glosaCommodity;
    this.seleccionaProveedor = this.commoditySvc.seleccionaProveedor;
    this.SeleccionaServicio = this.commoditySvc.SeleccionaServicio;
    this.commodityEditIndex = this.commoditySvc.commodityEditIndex;
    this.actualizarContadores();
    this.ordenarRequerimientosCommodity();
  }
  cancelarCommodity() {
    this.commoditySvc.cancelar();
    this.mostrarFormularioCommodity = this.commoditySvc.mostrarFormularioCommodity;
  }

  async nuevoActivoFijoMenor() {
    await this.nuevoRequerimientoActivoFijoMenor();
  }

  async editarActivoFijoMenor(index: number) {
    await this.activoMenorSvc.editar(index);
    this.subservicioFiltradosAFMenor = this.maestrasSvc.subservicioFiltradosAFMenor;
    this.commodityFiltradosAFMenor = this.maestrasSvc.commodityFiltradosAFMenor;
    this.requerimientoActivoFijoMenor = this.activoMenorSvc.requerimientoActivoFijoMenor;
    this.detallesActivoFijoMenor = this.activoMenorSvc.detallesActivoFijoMenor;
    this.mostrarFormularioActivoFijoMenor = this.activoMenorSvc.mostrarFormularioActivoFijoMenor;
    this.modoEdicionActivoFijoMenor = this.activoMenorSvc.modoEdicionActivoFijoMenor;
    this.activoFijoMenorEditIndex = this.activoMenorSvc.activoFijoMenorEditIndex;
    this.opcionesPrioridadACTIVOFIJOMENOR = this.activoMenorSvc.opcionesPrioridadACTIVOFIJOMENOR;
    this.fundoSeleccionado = this.maestrasSvc.fundoSeleccionado;
    this.areaSeleccionada = this.maestrasSvc.areaSeleccionada;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.clasificacionSeleccionado = this.maestrasSvc.clasificacionSeleccionado;
    this.SeleccionaPrioridadACTIVOFIJOMENOR = this.activoMenorSvc.SeleccionaPrioridadACTIVOFIJOMENOR;
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.selecccionaActivoFijoMenor = this.activoMenorSvc.selecccionaActivoFijoMenor;
    this.SeleccionaServicioAFMenor = this.activoMenorSvc.SeleccionaServicioAFMenor;
    this.onServicioAFMenorChange();
    this.glosaActivoFijoMenor = this.activoMenorSvc.glosaActivoFijoMenor;
    this.modalAbiertoActivoFijoMenor = false;
  }

  async eliminarActivoFijoMenor(index: number) {
    await this.activoMenorSvc.eliminar(index);
    this.requerimientosActivoFijoMenor = this.activoMenorSvc.requerimientosActivoFijoMenor;
    this.actualizarContadores();
    this.ordenarRequerimientosActivoFijoMenor();
  }

  editarDetalleActivoFijoMenor(index: number): void {
    this.activoMenorSvc.editarDetalle(index);
    this.activoFijoMenorEditIndex = this.activoMenorSvc.activoFijoMenorEditIndex;
    this.lineaTempActivoFijoMenor = this.activoMenorSvc.lineaTempActivoFijoMenor;
    this.modoEdicionActivoFijoMenor = this.activoMenorSvc.modoEdicionActivoFijoMenor;
    this.modalAbiertoActivoFijoMenor = this.activoMenorSvc.modalAbiertoActivoFijoMenor;
  }

  async eliminarDetalleActivoFijoMenor(index: number) {
    await this.activoMenorSvc.eliminarDetalle(index);
    this.detallesActivoFijoMenor = this.activoMenorSvc.detallesActivoFijoMenor;
  }

  async guardarActivoFijoMenor() {
    if (!this.detallesActivoFijoMenor || this.detallesActivoFijoMenor.length === 0) {
      alert('Debe agregar detalles antes de guardar');
      return;
    }
    this.activoMenorSvc.glosaActivoFijoMenor = this.glosaActivoFijoMenor;
    this.activoMenorSvc.SeleccionaServicioAFMenor = this.SeleccionaServicioAFMenor;
    this.activoMenorSvc.SeleccionaSubServicioAFMenor = this.SeleccionaSubServicioAFMenor;
    this.activoMenorSvc.SeleccionaPrioridadACTIVOFIJOMENOR = this.SeleccionaPrioridadACTIVOFIJOMENOR;
    this.activoMenorSvc.detallesActivoFijoMenor = this.detallesActivoFijoMenor;
    await this.activoMenorSvc.guardar();
    this.requerimientosActivoFijoMenor = this.activoMenorSvc.requerimientosActivoFijoMenor;
    this.detallesActivoFijoMenor = this.activoMenorSvc.detallesActivoFijoMenor;
    this.mostrarFormularioActivoFijoMenor = this.activoMenorSvc.mostrarFormularioActivoFijoMenor;
    this.modoEdicionActivoFijoMenor = this.activoMenorSvc.modoEdicionActivoFijoMenor;
    this.glosaActivoFijoMenor = this.activoMenorSvc.glosaActivoFijoMenor;
    this.activoFijoMenorEditIndex = this.activoMenorSvc.activoFijoMenorEditIndex;
    this.actualizarContadores();
    this.ordenarRequerimientosActivoFijoMenor();
  }
  cancelarActivoFijoMenor() {
    this.activoMenorSvc.cancelar();
    this.mostrarFormularioActivoFijoMenor = this.activoMenorSvc.mostrarFormularioActivoFijoMenor;
  }

  async nuevoActivoFijo() {
    await this.activoFijoSvc.nuevo();
    this.requerimientoActivoFijo = this.activoFijoSvc.requerimientoActivoFijo;
    this.detallesActivoFijo = this.activoFijoSvc.detallesActivoFijo;
    this.glosaActivoFijo = this.activoFijoSvc.glosaActivoFijo;
    this.mostrarFormularioActivoFijo = this.activoFijoSvc.mostrarFormularioActivoFijo;
    this.modoEdicionActivoFijo = this.activoFijoSvc.modoEdicionActivoFijo;
    this.opcionesPrioridadACTIVOFIJO = this.activoFijoSvc.opcionesPrioridadACTIVOFIJO;
    this.SeleccionaPrioridadACTIVOFIJO = this.activoFijoSvc.SeleccionaPrioridadACTIVOFIJO;
  }

  async editarActivoFijo(index: number) {
    await this.activoFijoSvc.editar(index);
    this.subservicioFiltradosAF = this.maestrasSvc.subservicioFiltradosAF;
    this.commodityFiltradosAF = this.maestrasSvc.commodityFiltradosAF;
    this.requerimientoActivoFijo = this.activoFijoSvc.requerimientoActivoFijo;
    this.detallesActivoFijo = this.activoFijoSvc.detallesActivoFijo;
    this.mostrarFormularioActivoFijo = this.activoFijoSvc.mostrarFormularioActivoFijo;
    this.modoEdicionActivoFijo = this.activoFijoSvc.modoEdicionActivoFijo;
    this.activoFijoEditIndex = this.activoFijoSvc.activoFijoEditIndex;
    this.opcionesPrioridadACTIVOFIJO = this.activoFijoSvc.opcionesPrioridadACTIVOFIJO;
    this.fundoSeleccionado = this.maestrasSvc.fundoSeleccionado;
    this.areaSeleccionada = this.maestrasSvc.areaSeleccionada;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.clasificacionSeleccionado = this.maestrasSvc.clasificacionSeleccionado;
    this.SeleccionaPrioridadACTIVOFIJO = this.activoFijoSvc.SeleccionaPrioridadACTIVOFIJO;
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.SeleccionaServicioAF = this.activoFijoSvc.SeleccionaServicioAF;
    this.onServicioAFChange();
    this.glosaActivoFijo = this.activoFijoSvc.glosaActivoFijo;
    this.modalAbiertoActivoFijo = false;
  }

  async eliminarActivoFijo(index: number) {
    await this.activoFijoSvc.eliminar(index);
    this.requerimientosActivoFijo = this.activoFijoSvc.requerimientosActivoFijo;
    this.actualizarContadores();
    this.ordenarRequerimientosActivoFijo();
  }

  editarDetalleActivoFijo(index: number): void {
    this.activoFijoSvc.editarDetalle(index);
    this.activoFijoEditIndex = this.activoFijoSvc.activoFijoEditIndex;
    this.lineaTempActivoFijo = this.activoFijoSvc.lineaTempActivoFijo;
    this.SeleccionaSubServicioAF = this.activoFijoSvc.lineaTempActivoFijo.codigo;
    this.modoEdicionActivoFijo = this.activoFijoSvc.modoEdicionActivoFijo;
    this.modalAbiertoActivoFijo = this.activoFijoSvc.modalAbiertoActivoFijo;
  }

  async eliminarDetalleActivoFijo(index: number) {
    await this.activoFijoSvc.eliminarDetalle(index);
    this.detallesActivoFijo = this.activoFijoSvc.detallesActivoFijo;
  }

  async guardarActivoFijo() {
    if (!this.detallesActivoFijo || this.detallesActivoFijo.length === 0) {
      alert('Debe agregar detalles antes de guardar');
      return;
    }
    this.activoFijoSvc.glosaActivoFijo = this.glosaActivoFijo;
    this.activoFijoSvc.SeleccionaServicioAF = this.SeleccionaServicioAF;
    this.activoFijoSvc.SeleccionaSubServicioAF = this.SeleccionaSubServicioAF;
    this.activoFijoSvc.SeleccionaPrioridadACTIVOFIJO = this.SeleccionaPrioridadACTIVOFIJO;
    this.activoFijoSvc.detallesActivoFijo = this.detallesActivoFijo;
    await this.activoFijoSvc.guardar();
    this.requerimientosActivoFijo = this.activoFijoSvc.requerimientosActivoFijo;
    this.detallesActivoFijo = this.activoFijoSvc.detallesActivoFijo;
    this.mostrarFormularioActivoFijo = this.activoFijoSvc.mostrarFormularioActivoFijo;
    this.modoEdicionActivoFijo = this.activoFijoSvc.modoEdicionActivoFijo;
    this.glosaActivoFijo = this.activoFijoSvc.glosaActivoFijo;
    this.activoFijoEditIndex = this.activoFijoSvc.activoFijoEditIndex;
    this.actualizarContadores();
    this.ordenarRequerimientosActivoFijo();
  }
  cancelarActivoFijo() {
    this.activoFijoSvc.cancelar();
    this.mostrarFormularioActivoFijo = this.activoFijoSvc.mostrarFormularioActivoFijo;
  }

  onClasificacionChange(limpiar = false) {
    if (limpiar) {
      this.configuracion.idturno = '';
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto;
    }
    this.filtrarClasificaciones();
  }

  filtroClasificaciones() {
    this.clasificacionesFiltrados = this.clasificaciones.filter(
      (it) => it.tipoClasificacion === this.configuracion.idclasificacion,
    );
    console.log(this.clasificacionesFiltrados);
  }

  async onTipoChange() {
    this.itemSvc.requerimiento.itemtipo = this.requerimiento.itemtipo;
    await this.itemSvc.onTipoChange();
    this.TipoSelecionado = this.itemSvc.TipoSelecionado;
    this.almacenes = this.maestrasSvc.almacenes;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.almacenOrigen = this.maestrasSvc.almacenOrigen;
    this.almacenDestino = this.maestrasSvc.almacenDestino;
    this.clasificacionSeleccionado = this.maestrasSvc.clasificacionSeleccionado;
    this.clasificacionesFiltrados = this.maestrasSvc.clasificacionesFiltrados;
    this.opcionesPrioridadITEM = this.itemSvc.opcionesPrioridadITEM;
    this.SeleccionaPrioridadITEM = this.itemSvc.SeleccionaPrioridadITEM;
  }

  async recargarValoresDesdeConfiguracion() {
    await this.maestrasSvc.recargarValoresDesdeConfiguracion(this.TipoSelecionado);
    this.cecoSeleccionado = this.maestrasSvc.cecoSeleccionado;
    this.laborSeleccionado = this.maestrasSvc.laborSeleccionado;
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.cecos = this.maestrasSvc.cecos;
    this.labores = this.maestrasSvc.labores;
    this.proyectos = this.maestrasSvc.proyectos;
  }

  limpiarCamposCompraEspecificos() {
    this.itemSvc.TipoSelecionado = this.TipoSelecionado;
    this.itemSvc.modalAbierto = this.modalAbierto;
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.limpiarCamposCompraEspecificos();
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.cecoSeleccionado = this.maestrasSvc.cecoSeleccionado;
    this.laborSeleccionado = this.maestrasSvc.laborSeleccionado;
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.detalles = this.itemSvc.detalles;
  }

  limpiarCamposCompra() {
    this.itemSvc.TipoSelecionado = this.TipoSelecionado;
    this.itemSvc.modalAbierto = this.modalAbierto;
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.limpiarCamposCompra();
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.cecoSeleccionado = this.maestrasSvc.cecoSeleccionado;
    this.laborSeleccionado = this.maestrasSvc.laborSeleccionado;
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.detalles = this.itemSvc.detalles;
  }

  limpiarCamposConsumo() {
    this.itemSvc.TipoSelecionado = this.TipoSelecionado;
    this.itemSvc.modalAbierto = this.modalAbierto;
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.limpiarCamposConsumo();
    this.turnoSeleccionado = this.maestrasSvc.turnoSeleccionado;
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.detalles = this.itemSvc.detalles;
  }

  limpiarCamposCompraConsumo() {
    this.itemSvc.TipoSelecionado = this.TipoSelecionado;
    this.itemSvc.modalAbierto = this.modalAbierto;
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.limpiarCamposCompraConsumo();
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.cecoSeleccionado = this.maestrasSvc.cecoSeleccionado;
    this.laborSeleccionado = this.maestrasSvc.laborSeleccionado;
    this.turnoSeleccionado = this.maestrasSvc.turnoSeleccionado;
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.detalles = this.itemSvc.detalles;
  }
  async cargarDatosParaConsumo() {
    await this.maestrasSvc.cargarDatosParaConsumo();
    this.turnoSeleccionado = this.maestrasSvc.turnoSeleccionado;
    this.cecoSeleccionado = this.maestrasSvc.cecoSeleccionado;
    this.laborSeleccionado = this.maestrasSvc.laborSeleccionado;
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.cecos = this.maestrasSvc.cecos;
    this.labores = this.maestrasSvc.labores;
    this.proyectos = this.maestrasSvc.proyectos;
  }
  async cargarDatosParaCompra() {
    await this.maestrasSvc.cargarDatosParaCompra();
    this.cecos = this.maestrasSvc.cecos;
    this.labores = this.maestrasSvc.labores;
    this.proyectos = this.maestrasSvc.proyectos;
  }
  /**
   * Verifica si los campos CECO, LABOR, PROYECTO deben ser editables
   * Para COMPRA y CONSUMO, estos campos deben estar disponibles
   */
  esCompraConConsumo(): boolean {
    return (
      this.TipoSelecionado === 'COMPRA' || this.TipoSelecionado === 'CONSUMO'
    );
  }

  /**
   * Verifica si los campos CECO, LABOR, PROYECTO deben ser editables en el modal
   * Retorna false para que siempre estÃ©n bloqueados y no se puedan editar
   */
  camposParametrosEditables(): boolean {
    return false; // Siempre bloqueados para que no se puedan editar
  }

  filtrarClasificaciones() {
    this.clasificacionesFiltrados = this.clasificaciones.filter(
      (it) => it.tipoClasificacion === this.RequerimientoSelecionado,
    );
    console.log(this.clasificacionesFiltrados);
  }

  obtenerDescripcionServicio(codigo: string): string {
    const serv = this.commodityFiltrados.find((s) => s.commodity01 === codigo);
    return serv ? serv.descripcionLocal : codigo;
  }

  obtenerDescripcionServicioAF(codigo: string): string {
    const serv = this.commodityFiltradosAF.find(
      (s) => s.commodity01 === codigo,
    );
    return serv ? serv.descripcionLocal : codigo;
  }

  obtenerDescripcionServicioAFM(codigo: string): string {
    const serv = this.commodityFiltradosAFMenor.find(
      (s) => s.commodity01 === codigo,
    );
    return serv ? serv.descripcionLocal : codigo;
  }

  obtenerUnidadMedidaProducto(producto: any): string {
    if (typeof producto === 'string') {
      const item = this.items?.find((i: any) => i.codigo === producto);
      return item?.um || item?.unidadMedida || 'UN';
    }
    return producto?.um || producto?.unidadMedida || 'UN';
  }

  actualizarUnidadMedidaDesdeProducto() {
    const producto = this.lineaTemp?.producto;
    if (producto) {
      const unidadMedida = this.obtenerUnidadMedidaProducto(producto);
      this.lineaTemp.unidadMedida = unidadMedida;
      this.unidadesMedidaFiltradas = [
        { label: unidadMedida, value: unidadMedida },
      ];
    }
  }

  obtenerDescripcionSubservicio(codigo: string): string {
    const sub = this.subservicioFiltrados.find((x) => x.commodity === codigo);
    return sub ? sub.descripcionLocal : codigo;
  }

  obtenerDescripcionSubservicioAF(codigo: string): string {
    const sub = this.subservicioFiltradosAF.find((x) => x.commodity === codigo);
    return sub ? sub.descripcionLocal : codigo;
  }

  obtenerDescripcionSubservicioAFM(codigo: string): string {
    const sub = this.subservicioFiltradosAFMenor.find(
      (x) => x.commodity === codigo,
    );
    return sub ? sub.descripcionLocal : codigo;
  }

  obtenerDescripcionActivoFijo(codigo: string): string {
    const af = this.activosFijosFiltrados.find(
      (a) => a.activoFijo01 === codigo,
    );
    return af ? af.descripcionLocal : codigo;
  }

  async nuevoRequerimiento(): Promise<void> {
    await this.itemSvc.nuevo();

    // ALLOGIST puede crear COMPRA o TRANSFERENCIA (según configuración)
    // Solo forzar a COMPRA si no hay tipo configurado o si no es TRANSFERENCIA
    const tipoActual = this.itemSvc.TipoSelecionado;
    const esTransferenciaPermitida = tipoActual === 'TRANSFERENCIA' && (this.esAlmacen || this.usuario.idrol === 'LOLOGIST' || this.usuario.idrol === 'JLOLOGIST' || this.usuario.idrol === 'ADLOGIST');

    if (this.esAlmacen && !esTransferenciaPermitida && !tipoActual) {
      // Solo forzar a COMPRA si no hay tipo configurado y no es transferencia permitida
      this.itemSvc.TipoSelecionado = 'COMPRA';
      this.itemSvc.requerimiento.itemtipo = 'COMPRA';
      console.log('📝 Forzado a COMPRA (no hay tipo configurado)');
    } else if (esTransferenciaPermitida) {
      console.log('📝 Manteniendo TRANSFERENCIA desde configuración');
    }

    this.requerimiento = this.itemSvc.requerimiento;
    this.detalles = this.itemSvc.detalles;
    this.glosa = this.itemSvc.glosa;
    this.modalAbierto = this.itemSvc.modalAbierto;
    this.modoEdicion = this.itemSvc.modoEdicion;
    this.TipoSelecionado = this.itemSvc.TipoSelecionado;
    this.almacenes = this.maestrasSvc.almacenes;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.almacenOrigen = this.maestrasSvc.almacenOrigen;
    this.almacenDestino = this.maestrasSvc.almacenDestino;
    this.areaSeleccionada = this.maestrasSvc.areaSeleccionada;
    this.SeleccionaPrioridadITEM = this.itemSvc.SeleccionaPrioridadITEM;
    this.mostrarFormulario = this.itemSvc.mostrarFormulario;

    console.log('🆕 Nuevo requerimiento creado:', {
      tipo: this.TipoSelecionado,
      almacenes: this.almacenes.length,
      almacenSeleccionado: this.almacenSeleccionado,
      almacenOrigen: this.almacenOrigen,
      almacenDestino: this.almacenDestino,
    });
  }

  async nuevoRequerimientoCommodity(): Promise<void> {
    await this.commoditySvc.nuevo();
    this.requerimientoCommodity = this.commoditySvc.requerimientoCommodity;
    this.detallesCommodity = this.commoditySvc.detallesCommodity;
    this.glosaCommodity = this.commoditySvc.glosaCommodity;
    this.mostrarFormularioCommodity = this.commoditySvc.mostrarFormularioCommodity;
    this.modoEdicionCommodity = this.commoditySvc.modoEdicionCommodity;
    this.opcionesPrioridadCOMMODITY = this.commoditySvc.opcionesPrioridadCOMMODITY;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
  }

  async nuevoRequerimientoActivoFijo(): Promise<void> {
    await this.activoFijoSvc.nuevo();
    this.requerimientoActivoFijo = this.activoFijoSvc.requerimientoActivoFijo;
    this.detallesActivoFijo = this.activoFijoSvc.detallesActivoFijo;
    this.glosaActivoFijo = this.activoFijoSvc.glosaActivoFijo;
    this.mostrarFormularioActivoFijo = this.activoFijoSvc.mostrarFormularioActivoFijo;
    this.modoEdicionActivoFijo = this.activoFijoSvc.modoEdicionActivoFijo;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
  }

  async nuevoRequerimientoActivoFijoMenor(): Promise<void> {
    await this.activoMenorSvc.nuevo();
    this.requerimientoActivoFijoMenor = this.activoMenorSvc.requerimientoActivoFijoMenor;
    this.detallesActivoFijoMenor = this.activoMenorSvc.detallesActivoFijoMenor;
    this.glosaActivoFijoMenor = this.activoMenorSvc.glosaActivoFijoMenor;
    this.mostrarFormularioActivoFijoMenor = this.activoMenorSvc.mostrarFormularioActivoFijoMenor;
    this.modoEdicionActivoFijoMenor = this.activoMenorSvc.modoEdicionActivoFijoMenor;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
  }

  async sincronizarRequerimiento() {
    this.itemSvc.requerimiento = this.requerimiento;
    this.itemSvc.SeleccionaPrioridadITEM = this.SeleccionaPrioridadITEM;
    this.itemSvc.TipoSelecionado = this.TipoSelecionado;
    this.itemSvc.SeleccionaTipoGasto = this.SeleccionaTipoGasto;
    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      this.maestrasSvc.almacenOrigen = this.almacenOrigen;
      this.maestrasSvc.almacenDestino = this.almacenDestino;
    }
    await this.itemSvc.sincronizarRequerimiento();
    this.requerimientos = this.itemSvc.requerimientos;
    this.sincronizando = this.maestrasSvc.sincronizando;
    this.progreso = this.maestrasSvc.progreso;
    this.actualizarContadores();
  }

  async cargarPendientes() {
    await this.itemSvc.cargarPendientes();
    this.pendientes = this.itemSvc.pendientes;
  }

  async sincronizarPendientes() {
    await this.itemSvc.sincronizarPendientes();
    this.requerimientos = this.itemSvc.requerimientos;
    this.sincronizando = this.maestrasSvc.sincronizando;
    this.progreso = this.maestrasSvc.progreso;
    this.actualizarContadores();
    await this.cargarPendientes();
  }

  async sincronizarPendientesCommodity() {
    await this.commoditySvc.sincronizarPendientes();
    this.requerimientosCommodity = this.commoditySvc.requerimientosCommodity;
    this.sincronizando = this.maestrasSvc.sincronizando;
    this.progreso = this.maestrasSvc.progreso;
    this.actualizarContadores();
    await this.cargarPendientes();
  }

  async sincronizarPendientesActivoFijo() {
    await this.activoFijoSvc.sincronizarPendientes();
    this.requerimientosActivoFijo = this.activoFijoSvc.requerimientosActivoFijo;
    this.sincronizando = this.maestrasSvc.sincronizando;
    this.progreso = this.maestrasSvc.progreso;
    this.actualizarContadores();
    await this.cargarPendientes();
  }

  async sincronizarPendientesActivoFijoMenor() {
    await this.activoMenorSvc.sincronizarPendientes();
    this.requerimientosActivoFijoMenor = this.activoMenorSvc.requerimientosActivoFijoMenor;
    this.sincronizando = this.maestrasSvc.sincronizando;
    this.progreso = this.maestrasSvc.progreso;
    this.actualizarContadores();
    await this.cargarPendientes();
  }

  async sincronizarRequerimientoCommodity() {
    await this.commoditySvc.sincronizarRequerimiento();
    this.requerimientosCommodity = this.commoditySvc.requerimientosCommodity;
    this.actualizarContadores();
  }
  async sincronizarRequerimientoActivoFijo() {
    await this.activoFijoSvc.sincronizarRequerimiento();
    this.requerimientosActivoFijo = this.activoFijoSvc.requerimientosActivoFijo;
    this.actualizarContadores();
  }

  async sincronizarRequerimientoActivoFijoMenor() {
    await this.activoMenorSvc.sincronizarRequerimiento();
    this.requerimientosActivoFijoMenor = this.activoMenorSvc.requerimientosActivoFijoMenor;
    this.actualizarContadores();
  }

  async cargarUsuario() {
    await this.maestrasSvc.cargarUsuario();
    this.usuario = this.maestrasSvc.usuario;
  }

  async generarGlosaAutomatica(): Promise<string> {
    return this.maestrasSvc.generarGlosaAutomatica();
  }

  async cargarMaestras() {
    await this.maestrasSvc.cargarMaestras();
    this.syncMaestrasDesdeServicio();
  }

  async cargarDetalles() {
    this.detalles = await this.dexieService.showDetallesRequerimiento();
  }

  private ordenarLista(lista: any[]): void {
    lista.sort((a, b) => {
      if (a.estado !== b.estado) return a.estado - b.estado;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  ordenarRequerimientos() { this.ordenarLista(this.requerimientos); }
  ordenarRequerimientosCommodity() { this.ordenarLista(this.requerimientosCommodity); }
  ordenarRequerimientosActivoFijo() { this.ordenarLista(this.requerimientosActivoFijo); }
  ordenarRequerimientosActivoFijoMenor() { this.ordenarLista(this.requerimientosActivoFijoMenor); }

  async cargarRequerimientos() {
    const result = await this.itemSvc.cargarRequerimientos(this.usuario?.documentoidentidad ?? '');
    this.requerimientos = result.requerimientos;
    this.requerimientosCommodity = result.requerimientosCommodity;
    this.requerimientosActivoFijo = result.requerimientosActivoFijo;
    this.requerimientosActivoFijoMenor = result.requerimientosActivoFijoMenor;
    // Sincronizar listas en cada servicio para que editar/eliminar usen el mismo array
    this.commoditySvc.requerimientosCommodity = result.requerimientosCommodity;
    this.activoFijoSvc.requerimientosActivoFijo = result.requerimientosActivoFijo;
    this.activoMenorSvc.requerimientosActivoFijoMenor = result.requerimientosActivoFijoMenor;
    this.modoItemPrincipal = true;
  }

  async ListarFundos() {
    await this.maestrasSvc.ListarFundos();
    this.fundos = this.maestrasSvc.fundos;
  }

  async ListarCultivos() {
    await this.maestrasSvc.ListarCultivos();
    this.cultivos = this.maestrasSvc.cultivos;
  }

  async ListarAreas() {
    await this.maestrasSvc.ListarAreas();
    this.areas = this.maestrasSvc.areas;
  }

  async ListarAlmacenes() {
    await this.maestrasSvc.ListarAlmacenes();
    this.almacenes = this.maestrasSvc.almacenes;
    console.log('📦 Almacenes cargados desde Dexie:', this.almacenes.length, this.almacenes);

    // Si no hay almacenes en Dexie, cargar desde API como fallback
    if (!this.almacenes || this.almacenes.length === 0) {
      console.log('⚠️ No hay almacenes en Dexie, cargando desde API...');
      try {
        const resp: any = await lastValueFrom(
          this.maestrasService.getAlmacenes([
            { ruc: this.usuario?.ruc, aplicacion: 'LOGISTICA' }
          ])
        );
        this.almacenes = Array.isArray(resp) ? resp : [];
        console.log('📦 Almacenes cargados desde API:', this.almacenes.length, this.almacenes);
        // Guardar en Dexie para futuros usos
        await this.dexieService.saveAlmacenes(this.almacenes);
      } catch (error) {
        console.error('❌ Error al cargar almacenes desde API:', error);
      }
    }

    if (this.modoEdicion) { this.reasignarAlmacenDesdeDescripcion(); }
  }

  async ListarAlmacenDestino() {
    await this.maestrasSvc.ListarAlmacenDestino();
    this.alamcenesDestino = this.maestrasSvc.alamcenesDestino;
    if (this.modoEdicion) { this.reasignarAlmacenDesdeDescripcion(); }
  }

  async ListarProyectos() {
    await this.maestrasSvc.ListarProyectos();
    this.proyectos = this.maestrasSvc.proyectos;
  }

  async ListarItems() {
    await this.maestrasSvc.ListarItems();
    this.items = this.maestrasSvc.items;
    this.itemsFiltrados = this.maestrasSvc.itemsFiltrados;
  }

  async ListarClasificaciones() {
    await this.maestrasSvc.ListarClasificaciones();
    this.clasificaciones = this.maestrasSvc.clasificaciones;
  }

  async ListarTurnos() {
    await this.maestrasSvc.ListarTurnos();
    this.turnos = this.maestrasSvc.turnos;
  }

  async ListarLabores() {
    await this.maestrasSvc.ListarLabores();
    this.labores = this.maestrasSvc.labores;
  }

  async ListarCecos() {
    await this.maestrasSvc.ListarCecos();
    this.cecos = this.maestrasSvc.cecos;
  }

  async ListarProveedores() {
    await this.maestrasSvc.ListarProveedores();
    this.proveedoresServicios = this.maestrasSvc.proveedoresServicios;
    this.proveedoresActivoFijo = this.maestrasSvc.proveedoresActivoFijo;
  }

  async ListarTipoGastos() {
    await this.maestrasSvc.ListarTipoGastos();
    this.tipoGastos = this.maestrasSvc.tipoGastos;
  }

  // Sincroniza maestro commodity desde API si Dexie está vacío
  async sincronizaMaestroCommodity() {
    const count = await this.dexieService.countMaestroCommodity();
    if (count > 0) {
      console.log('📌 Dexie ya tiene MaestroCommodity → NO se llama API');
      return;
    }
    console.log('📌 Cargando MaestroCommodity desde API...');
    return new Promise<void>((resolve) => {
      this.commodityService.getCommodity([]).subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveMaestroCommodities(resp);
          console.log('📌 MaestroCommodity guardado en Dexie:', resp.length, 'registros');
        }
        resolve();
      }, () => resolve());
    });
  }

  // Sincroniza maestro subcommodity desde API si Dexie está vacío
  async sincronizaMaestroSubCommodity() {
    const count = await this.dexieService.countMaestroSubCommodity();
    if (count > 0) {
      console.log('📌 Dexie ya tiene MaestroSubCommodity → NO se llama API');
      return;
    }
    console.log('📌 Cargando MaestroSubCommodity desde API...');
    return new Promise<void>((resolve) => {
      this.commodityService.getSubCommodity([]).subscribe(async (resp: any) => {
        if (!!resp && resp.length) {
          await this.dexieService.saveMaestroSubCommodities(resp);
          console.log('📌 MaestroSubCommodity guardado en Dexie:', resp.length, 'registros');
        }
        resolve();
      }, () => resolve());
    });
  }

  async ListarServicios() {
    await this.maestrasSvc.ListarServicios();
    this.servicios = this.maestrasSvc.servicios;
    this.commodityFiltrados = this.maestrasSvc.commodityFiltrados;
  }

  async ListarServiciosAF() {
    await this.maestrasSvc.ListarServiciosAF();
    this.servicioAF = this.maestrasSvc.servicioAF;
    this.commodityFiltradosAF = this.maestrasSvc.commodityFiltradosAF;
  }

  async ListarServiciosAFMenor() {
    await this.maestrasSvc.ListarServiciosAFMenor();
    this.servicioAFMenor = this.maestrasSvc.servicioAFMenor;
    this.commodityFiltradosAFMenor = this.maestrasSvc.commodityFiltradosAFMenor;
  }

  getDescripcionFundo(idfundo: any) {
    return this.maestrasSvc.getDescripcionFundo(idfundo);
  }

  async onServicioChange() {
    this.subservicioFiltrados = await this.maestrasSvc.onServicioChange(this.SeleccionaServicio);
    if (!this.SeleccionaServicio) this.SeleccionaSubServicio = '';
  }

  async onServicioAFChange() {
    this.subservicioFiltradosAF = await this.maestrasSvc.onServicioAFChange(this.SeleccionaServicioAF);
    if (!this.SeleccionaServicioAF) this.SeleccionaSubServicioAF = '';
  }

  async onServicioAFMenorChange() {
    this.subservicioFiltradosAFMenor = await this.maestrasSvc.onServicioAFMenorChange(this.SeleccionaServicioAFMenor);
    if (!this.SeleccionaServicioAFMenor) this.SeleccionaSubServicioAFMenor = '';
  }

  async ListarActivosFijos() {
    await this.maestrasSvc.ListarActivosFijos();
    this.activosFijos = this.maestrasSvc.activosFijos;
    this.activosFijosFiltrados = this.maestrasSvc.activosFijosFiltrados;
    this.activosFijosServicioFiltrados = this.maestrasSvc.activosFijosServicioFiltrados;
  }

  nuevaLinea(): DetalleRequerimiento {
    return {
      idrequerimiento: '', // ?? SE ASIGNA AL GUARDAR CABECERA
      codigo: '',
      producto: null,
      descripcion: '',
      cantidad: 0,
      unidadMedida: '', // Unidad de medida del producto
      proyecto: this.proyectoSeleccionado
        ? String(this.proyectoSeleccionado)
        : '',
      ceco: this.cecoSeleccionado ? String(this.cecoSeleccionado) : '',
      turno: this.turnoSeleccionado ?? '',
      labor: this.laborSeleccionado ? String(this.laborSeleccionado) : '',
      esActivoFijo: false,
      activoFijo: '',
      estado: 0,
    };
  }

  nuevaLineaCommodity(): DetalleRequerimientoCommodity {
    return {
      idrequerimiento: '', // ?? SE ASIGNA AL GUARDAR CABECERA
      codigo: '',
      descripcion: '',
      proveedor: '',
      cantidad: 0,
      proyecto: this.proyectoSeleccionado
        ? String(this.proyectoSeleccionado)
        : '',
      ceco: this.cecoSeleccionado ? String(this.cecoSeleccionado) : '',
      turno: this.turnoSeleccionado ?? '',
      labor: this.laborSeleccionado ? String(this.laborSeleccionado) : '',
      estado: 0,
      esActivoFijo: false,
      activoFijo: '',
    };
  }
  nuevaLineaActivoFijo(): DetalleRequerimientoActivoFijo {
    return {
      idrequerimiento: '', // SE ASIGNA AL GUARDAR CABECERA
      codigo: '',
      descripcion: '',
      proveedor: '',
      cantidad: 0,
      proyecto: this.proyectoSeleccionado
        ? String(this.proyectoSeleccionado)
        : '',
      ceco: this.cecoSeleccionado ? String(this.cecoSeleccionado) : '',
      turno: this.turnoSeleccionado ?? '',
      labor: this.laborSeleccionado ? String(this.laborSeleccionado) : '',
      esActivoFijo: false,
      activoFijo: '',
      estado: 0,
    };
  }

  nuevaLineaActivoFijoMenor(): DetalleRequerimientoActivoFijoMenor {
    return {
      idrequerimiento: '', // ?? SE ASIGNA AL GUARDAR CABECERA
      codigo: '',
      descripcion: '',
      proveedor: '',
      cantidad: 0,
      proyecto: this.proyectoSeleccionado
        ? String(this.proyectoSeleccionado)
        : '',
      ceco: this.cecoSeleccionado ? String(this.cecoSeleccionado) : '',
      turno: this.turnoSeleccionado ?? '',
      labor: this.laborSeleccionado ? String(this.laborSeleccionado) : '',
      esActivoFijo: false,
      activoFijo: '',
      estado: 0,
    };
  }

  async abrirModal() {
    this.itemSvc.editIndex = this.editIndex;
    await this.itemSvc.abrirModal();
    this.modalAbierto = this.itemSvc.modalAbierto;
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.turnoModal = this.itemSvc.turnoModal;
    this.cecoModal = this.itemSvc.cecoModal;
    this.laborModal = this.itemSvc.laborModal;
    this.proyectoModal = this.itemSvc.proyectoModal;
    this.filteredCecosModal = this.itemSvc.filteredCecosModal;
    this.filteredLaboresModal = this.itemSvc.filteredLaboresModal;
    this.filteredProyectosModal = this.itemSvc.filteredProyectosModal;
  }

  cerrarModal(): void {
    this.itemSvc.cerrarModal();
    this.modalAbierto = this.itemSvc.modalAbierto;
    this.editIndex = this.itemSvc.editIndex;
    this.lineasTemporales = this.itemSvc.lineasTemporales;
  }

  onTurnoChangeModal() {
    this.itemSvc.turnoModal = this.turnoModal;
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.enModoEdicion = this.enModoEdicion;
    this.itemSvc.onTurnoChangeModal();
    this.filteredCecosModal = this.itemSvc.filteredCecosModal;
    this.filteredLaboresModal = this.itemSvc.filteredLaboresModal;
    this.filteredProyectosModal = this.itemSvc.filteredProyectosModal;
    this.cecoModal = this.itemSvc.cecoModal;
    this.laborModal = this.itemSvc.laborModal;
    this.proyectoModal = this.itemSvc.proyectoModal;
    this.lineaTemp = this.itemSvc.lineaTemp;
  }

  onCecoChangeModal() {
    this.itemSvc.cecoModal = this.cecoModal;
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.enModoEdicion = this.enModoEdicion;
    this.itemSvc.onCecoChangeModal();
    this.filteredLaboresModal = this.itemSvc.filteredLaboresModal;
    this.filteredProyectosModal = this.itemSvc.filteredProyectosModal;
    this.laborModal = this.itemSvc.laborModal;
    this.proyectoModal = this.itemSvc.proyectoModal;
    this.lineaTemp = this.itemSvc.lineaTemp;
  }

  onLaborChangeModal() {
    this.itemSvc.laborModal = this.laborModal;
    this.itemSvc.cecoModal = this.cecoModal;
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.enModoEdicion = this.enModoEdicion;
    this.itemSvc.onLaborChangeModal();
    this.filteredProyectosModal = this.itemSvc.filteredProyectosModal;
    this.proyectoModal = this.itemSvc.proyectoModal;
    this.lineaTemp = this.itemSvc.lineaTemp;
  }

  insertarLineaEnTabla() {
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.lineasTemporales = this.lineasTemporales;
    this.itemSvc.editingTempIndex = this.editingTempIndex;
    this.itemSvc.insertarLineaEnTabla();
    this.lineasTemporales = this.itemSvc.lineasTemporales;
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.editingTempIndex = this.itemSvc.editingTempIndex;
  }

  eliminarLineaTemporal(index: number) {
    this.itemSvc.lineasTemporales = this.lineasTemporales;
    this.itemSvc.editingTempIndex = this.editingTempIndex;
    this.itemSvc.eliminarDetalleItem(index);
    this.lineasTemporales = this.itemSvc.lineasTemporales;
    this.editingTempIndex = this.itemSvc.editingTempIndex;
    this.lineaTemp = this.itemSvc.lineaTemp;
  }

  editarLineaTemporal(index: number) {
    this.itemSvc.lineasTemporales = this.lineasTemporales;
    this.itemSvc.editarDetalleItem(index);
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.editingTempIndex = this.itemSvc.editingTempIndex;
    this.turnoModal = this.itemSvc.turnoModal;
    this.cecoModal = this.itemSvc.cecoModal;
    this.laborModal = this.itemSvc.laborModal;
    this.proyectoModal = this.itemSvc.proyectoModal;
    this.filteredCecosModal = this.itemSvc.filteredCecosModal;
    this.filteredLaboresModal = this.itemSvc.filteredLaboresModal;
    this.filteredProyectosModal = this.itemSvc.filteredProyectosModal;
  }

  limpiarFormularioModal() {
    this.itemSvc.inicializarVariablesModal();
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.editingTempIndex = this.itemSvc.editingTempIndex;
  }

  registrarTodasLasLineas() {
    this.itemSvc.lineasTemporales = this.lineasTemporales;
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.registrarTodasLasLineas();
    this.detalles = this.itemSvc.detalles;
    this.lineasTemporales = this.itemSvc.lineasTemporales;
    this.modalAbierto = this.itemSvc.modalAbierto;
    this.editIndex = this.itemSvc.editIndex;
  }

  inicializarVariablesModal() {
    this.permitirEditarParametros = false;
    this.lineasTemporales = [];
    this.turnoModal = this.turnoSeleccionado || '';
    this.cecoModal = this.cecoSeleccionado?.localname ?? '';
    this.laborModal = this.laborSeleccionado?.labor ?? '';
    this.proyectoModal = this.proyectoSeleccionado
      ? String(this.proyectoSeleccionado.proyectoio)
      : '';
    this.filteredCecosModal = [...this.cecos];
    this.filteredLaboresModal = [...this.labores];
    this.filteredProyectosModal = [...this.proyectos];
    console.log('?? [Modal] Variables inicializadas:', {
      turno: this.turnoModal,
      ceco: this.cecoModal,
      labor: this.laborModal,
      proyecto: this.proyectoModal,
    });
  }

  async abrirModalCommodity() {
    this.commoditySvc.commodityEditIndex = this.commodityEditIndex;
    await this.commoditySvc.abrirModal();
    this.modalAbiertoCommodity = this.commoditySvc.modalAbiertoCommodity;
    this.lineaTempCommodity = this.commoditySvc.lineaTempCommodity;
    this.cecoSeleccionado = this.maestrasSvc.cecoSeleccionado;
    this.proyectoSeleccionado = this.maestrasSvc.proyectoSeleccionado;
    this.laborSeleccionado = this.maestrasSvc.laborSeleccionado;
    this.turnoSeleccionado = this.maestrasSvc.turnoSeleccionado;
  }

  cerrarModalCommodity() {
    this.modalAbiertoCommodity = false;
    this.commodityEditIndex = -1;
    this.commoditySvc.commodityEditIndex = -1;
    this.filteredCecosModal = [];
    this.filteredLaboresModal = [];
    this.filteredProyectosModal = [];
  }

  async guardarLineaCommodity() {
    this.commoditySvc.lineaTempCommodity = this.lineaTempCommodity;
    this.commoditySvc.commodityEditIndex = this.commodityEditIndex;
    this.commoditySvc.SeleccionaSubServicio = this.SeleccionaSubServicio;
    await this.commoditySvc.guardarLinea();
    this.detallesCommodity = this.commoditySvc.detallesCommodity;
    this.modalAbiertoCommodity = this.commoditySvc.modalAbiertoCommodity;
    this.commodityEditIndex = this.commoditySvc.commodityEditIndex;
  }

  editarDetalleCommodity(index: number): void {
    this.commoditySvc.detallesCommodity = this.detallesCommodity;
    this.commoditySvc.editarDetalle(index);
    this.lineaTempCommodity = this.commoditySvc.lineaTempCommodity;
    this.commodityEditIndex = this.commoditySvc.commodityEditIndex;
    this.SeleccionaSubServicio = this.commoditySvc.SeleccionaSubServicio;
    this.modoEdicionCommodity = this.commoditySvc.modoEdicionCommodity;
    this.modalAbiertoCommodity = this.commoditySvc.modalAbiertoCommodity;
    this._inicializarFiltrosCascadaCommodityEdicion();
  }

  async eliminarDetalleCommodity(index: number) {
    this.commoditySvc.detallesCommodity = this.detallesCommodity;
    this.commoditySvc.requerimientoCommodity = this.requerimientoCommodity;
    await this.commoditySvc.eliminarDetalle(index);
    this.detallesCommodity = this.commoditySvc.detallesCommodity;
  }

  async abrirModalActivoFijoMenor() {
    this.activoMenorSvc.activoFijoMenorEditIndex = this.activoFijoMenorEditIndex;
    await this.activoMenorSvc.abrirModal();
    this.modalAbiertoActivoFijoMenor = this.activoMenorSvc.modalAbiertoActivoFijoMenor;
    this.lineaTempActivoFijoMenor = this.activoMenorSvc.lineaTempActivoFijoMenor;
  }

  cerrarModalActivoFijoMenor() {
    this.activoMenorSvc.cerrarModal();
    this.modalAbiertoActivoFijoMenor = this.activoMenorSvc.modalAbiertoActivoFijoMenor;
    this.activoFijoMenorEditIndex = this.activoMenorSvc.activoFijoMenorEditIndex;
    this.filteredCecosModal = [];
    this.filteredLaboresModal = [];
    this.filteredProyectosModal = [];
  }

  async guardarLineaActivoFijoMenor() {
    this.activoMenorSvc.lineaTempActivoFijoMenor = this.lineaTempActivoFijoMenor;
    this.activoMenorSvc.activoFijoMenorEditIndex = this.activoFijoMenorEditIndex;
    this.activoMenorSvc.SeleccionaSubServicioAFMenor = this.SeleccionaSubServicioAFMenor;
    this.activoMenorSvc.detallesActivoFijoMenor = this.detallesActivoFijoMenor;
    await this.activoMenorSvc.guardarLinea();
    this.detallesActivoFijoMenor = this.activoMenorSvc.detallesActivoFijoMenor;
    this.modalAbiertoActivoFijoMenor = this.activoMenorSvc.modalAbiertoActivoFijoMenor;
    this.activoFijoMenorEditIndex = this.activoMenorSvc.activoFijoMenorEditIndex;
  }

  async abrirModalActivoFijo() {
    this.activoFijoSvc.activoFijoEditIndex = this.activoFijoEditIndex;
    await this.activoFijoSvc.abrirModal();
    this.modalAbiertoActivoFijo = this.activoFijoSvc.modalAbiertoActivoFijo;
    this.lineaTempActivoFijo = this.activoFijoSvc.lineaTempActivoFijo;
  }

  cerrarModalActivoFijo() {
    this.activoFijoSvc.cerrarModal();
    this.modalAbiertoActivoFijo = this.activoFijoSvc.modalAbiertoActivoFijo;
    this.activoFijoEditIndex = this.activoFijoSvc.activoFijoEditIndex;
    this.filteredCecosModal = [];
    this.filteredLaboresModal = [];
    this.filteredProyectosModal = [];
  }

  async guardarLineaActivoFijo() {
    this.activoFijoSvc.lineaTempActivoFijo = this.lineaTempActivoFijo;
    this.activoFijoSvc.activoFijoEditIndex = this.activoFijoEditIndex;
    this.activoFijoSvc.SeleccionaSubServicioAF = this.SeleccionaSubServicioAF;
    this.activoFijoSvc.detallesActivoFijo = this.detallesActivoFijo;
    await this.activoFijoSvc.guardarLinea();
    this.detallesActivoFijo = this.activoFijoSvc.detallesActivoFijo;
    this.modalAbiertoActivoFijo = this.activoFijoSvc.modalAbiertoActivoFijo;
    this.activoFijoEditIndex = this.activoFijoSvc.activoFijoEditIndex;
  }

  async guardarLinea() {
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.editIndex = this.editIndex;
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.TipoSelecionado = this.TipoSelecionado;
    await this.itemSvc.guardarLinea();
    this.detalles = this.itemSvc.detalles;
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.modalAbierto = this.itemSvc.modalAbierto;
    this.editIndex = this.itemSvc.editIndex;
  }

  editarLinea(index: number): void {
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.editarLinea(index);
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.editIndex = this.itemSvc.editIndex;
    this.cecoModal = this.itemSvc.cecoModal;
    this.proyectoModal = this.itemSvc.proyectoModal;
    this.laborModal = this.itemSvc.laborModal;
    this.turnoModal = this.itemSvc.turnoModal;
    this.filteredCecosModal = this.itemSvc.filteredCecosModal;
    this.filteredLaboresModal = this.itemSvc.filteredLaboresModal;
    this.filteredProyectosModal = this.itemSvc.filteredProyectosModal;
    this.modalAbierto = this.itemSvc.modalAbierto;
  }

  guardarEdicionLinea(): void {
    this.itemSvc.lineaTemp = this.lineaTemp;
    this.itemSvc.editIndex = this.editIndex;
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.guardarEdicionLinea();
    this.detalles = this.itemSvc.detalles;
    this.modalAbierto = this.itemSvc.modalAbierto;
  }

  async eliminarLinea(index: number) {
    const detalle = this.detalles[index];
    const id = detalle.id;
    if (id) {
      await this.dexieService.deleteDetalleRequerimiento(id);
    }
    this.detalles.splice(index, 1);
    this.requerimiento.detalle = [...this.detalles];
    if (this.requerimiento.id) {
      await this.dexieService.requerimientos.update(this.requerimiento.id, {
        detalle: this.detalles,
        modificado: 1,
      });
    }
    const idx = this.requerimientos.findIndex(
      (r) => r.idrequerimiento === this.requerimiento.idrequerimiento,
    );
    if (idx >= 0) {
      this.requerimientos[idx].detalle = [...this.detalles];
    }
    this.alertService.mostrarInfo('LÃ­nea eliminada.');
  }

  copiarLinea(index: number): void {
    const detalleOriginal = this.detalles[index];
    const producto = this.items.find(
      (it) => it.descripcion === detalleOriginal.producto,
    );
    this.lineaTemp = {
      ...detalleOriginal,
      id: undefined, // Sin ID para que se guarde como nueva lÃ­nea
      producto: producto ? { ...producto } : null,
    };
    this.editIndex = -1;
    this.modalAbierto = true;
    this.alertService.mostrarInfo(
      'LÃ­nea copiada. Modifica los campos y guarda.',
    );
  }

  mostrarAlmacen(c: any): string {
    if (c.itemtipo === 'TRANSFERENCIA') {
      const origen = this.almacenes.find((a) => a.idalmacen == c.idalmacen);
      const destino = this.alamcenesDestino.find(
        (a) => a.idalmacen == c.idalmacendestino,
      );
      return `${origen?.almacen ?? '---'} - ${destino?.almacen ?? '---'}`;
    }
    const almacen = this.almacenes.find((a) => a.idalmacen == c.idalmacen);
    return almacen?.almacen ?? '---';
  }

  mostrarAlmacenDestino(c: any): string {
    const destino = this.alamcenesDestino.find(
      (a) => a.idalmacen == c.idalmacendestino,
    );
    return destino?.almacen ?? '---';
  }

  getNombreAlmacen(id: string): string {
    const almacen = this.almacenes.find((a) => a.idalmacen == id);
    return almacen?.almacen ?? '---';
  }
  async guardar() {
    if (!this.detalles || this.detalles.length === 0) {
      alert('Debe agregar detalles antes de guardar');
      return;
    }
    // Si hay una línea en edición en el modal, guardarla primero
    if (this.modalAbierto && this.editIndex >= 0) {
      this.itemSvc.lineaTemp = this.lineaTemp;
      this.itemSvc.editIndex = this.editIndex;
      this.itemSvc.detalles = this.detalles;
      this.itemSvc.TipoSelecionado = this.TipoSelecionado;
      await this.itemSvc.guardarLinea();
      this.detalles = this.itemSvc.detalles;
      this.lineaTemp = this.itemSvc.lineaTemp;
      this.modalAbierto = this.itemSvc.modalAbierto;
      this.editIndex = this.itemSvc.editIndex;
    }
    this.itemSvc.requerimiento.glosa = this.glosa;
    this.itemSvc.glosa = this.glosa;
    this.itemSvc.TipoSelecionado = this.TipoSelecionado;
    this.itemSvc.SeleccionaPrioridadITEM = this.SeleccionaPrioridadITEM;
    this.itemSvc.SeleccionaTipoGasto = this.SeleccionaTipoGasto;
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.modoEdicion = this.modoEdicion;
    this.itemSvc.requerimiento = { ...this.requerimiento };
    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      this.maestrasSvc.almacenOrigen = this.almacenOrigen;
      this.maestrasSvc.almacenDestino = this.almacenDestino;
    }
    await this.itemSvc.guardarRequerimiento();
    this.requerimientos = this.itemSvc.requerimientos;
    this.detalles = this.itemSvc.detalles;
    this.mostrarFormulario = this.itemSvc.mostrarFormulario;
    this.modoEdicion = this.itemSvc.modoEdicion;
    this.glosa = this.itemSvc.glosa;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.areaSeleccionada = this.maestrasSvc.areaSeleccionada;
    this.clasificacionSeleccionado = this.maestrasSvc.clasificacionSeleccionado;
    this.actualizarContadores();
    this.ordenarRequerimientos();
  }

  obtenerIdReq(idReq: string): string {
    if (!idReq) return '';
    return idReq.slice(-12); // YYMMDDhhmmss
  }

  async guardarEdicion() {
    // Si hay una línea en edición en el modal, guardarla primero
    if (this.modalAbierto && this.editIndex >= 0) {
      this.itemSvc.lineaTemp = this.lineaTemp;
      this.itemSvc.editIndex = this.editIndex;
      this.itemSvc.detalles = this.detalles;
      this.itemSvc.TipoSelecionado = this.TipoSelecionado;
      await this.itemSvc.guardarLinea();
      this.detalles = this.itemSvc.detalles;
      this.lineaTemp = this.itemSvc.lineaTemp;
      this.modalAbierto = this.itemSvc.modalAbierto;
      this.editIndex = this.itemSvc.editIndex;
    }
    this.itemSvc.requerimiento = { ...this.requerimiento };
    this.itemSvc.detalles = this.detalles;
    this.itemSvc.glosa = this.glosa;
    this.itemSvc.TipoSelecionado = this.TipoSelecionado;
    this.itemSvc.SeleccionaPrioridadITEM = this.SeleccionaPrioridadITEM;
    this.itemSvc.SeleccionaTipoGasto = this.SeleccionaTipoGasto;
    this.itemSvc.modoEdicion = true;
    await this.itemSvc.guardarRequerimiento();
    this.requerimientos = this.itemSvc.requerimientos;
    this.modoEdicion = this.itemSvc.modoEdicion;
    this.mostrarFormulario = this.itemSvc.mostrarFormulario;
    this.actualizarContadores();
    this.ordenarRequerimientos();
  }

  getAlmacenNombre(id: string) {
    return this.almacenes.find((a) => a.idalmacen == id)?.almacen || '';
  }

  cancelar(): void {
    this.itemSvc.cancelar();
    this.mostrarFormulario = this.itemSvc.mostrarFormulario;
    this.modoEdicion = this.itemSvc.modoEdicion;
    this.SeleccionaPrioridadITEM = this.itemSvc.SeleccionaPrioridadITEM;
    this.SeleccionaTipoGasto = this.itemSvc.SeleccionaTipoGasto;
  }

  async editarRequerimiento(idOrIndex: string | number) {
    let index: number;
    if (typeof idOrIndex === 'string') {
      index = this.itemSvc.requerimientos.findIndex((r: any) => r.idrequerimiento === idOrIndex);
    } else {
      index = idOrIndex;
    }
    if (index < 0 || index >= this.itemSvc.requerimientos.length) return;
    const req = this.itemSvc.requerimientos[index];
    // ALLOGIST solo puede editar requerimientos de COMPRA
    if (this.esAlmacen && req?.itemtipo !== 'COMPRA') {
      await this.alertService.showAlert('Acceso denegado', 'Solo puede editar requerimientos de tipo COMPRA.', 'warning');
      return;
    }
    this.itemSvc.editar(index);
    this.requerimiento = this.itemSvc.requerimiento;
    this.detalles = this.itemSvc.detalles;
    this.modoEdicion = this.itemSvc.modoEdicion;
    this.editIndex = this.itemSvc.editIndex;
    this.TipoSelecionado = this.itemSvc.TipoSelecionado;
    this.fundoSeleccionado = this.maestrasSvc.fundoSeleccionado;
    this.areaSeleccionada = this.maestrasSvc.areaSeleccionada;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.clasificacionSeleccionado = this.maestrasSvc.clasificacionSeleccionado;
    this.SeleccionaPrioridadITEM = this.itemSvc.SeleccionaPrioridadITEM;
    this.glosa = this.itemSvc.glosa;
    this.SeleccionaTipoGasto = this.itemSvc.SeleccionaTipoGasto;
    this.almacenOrigen = this.maestrasSvc.almacenOrigen;
    this.almacenDestino = this.maestrasSvc.almacenDestino;
    this.mostrarFormulario = this.itemSvc.mostrarFormulario;
    this.modalAbierto = this.itemSvc.modalAbierto;
    this.reasignarAlmacenDesdeDescripcion();
  }

  reasignarAlmacenDesdeDescripcion() {
    this.maestrasSvc.reasignarAlmacenDesdeDescripcion(this.requerimiento, this.TipoSelecionado);
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.almacenOrigen = this.maestrasSvc.almacenOrigen;
    this.almacenDestino = this.maestrasSvc.almacenDestino;
  }

  async eliminarRequerimiento(index: number) {
    await this.itemSvc.eliminar(index);
    this.requerimientos = this.itemSvc.requerimientos;
    this.actualizarContadores();
    this.ordenarRequerimientos();
  }

  async copiarRequerimiento(index: number) {
    const reqOriginal: any = this.requerimientos[index];
    // ALLOGIST solo puede copiar requerimientos de COMPRA
    if (this.esAlmacen && reqOriginal?.itemtipo !== 'COMPRA') {
      await this.alertService.showAlert('Acceso denegado', 'Solo puede copiar requerimientos de tipo COMPRA.', 'warning');
      return;
    }
    const nuevoId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.itemSvc.requerimiento = { ...reqOriginal, id: undefined, idrequerimiento: nuevoId, fecha: new Date(), estados: 'PENDIENTE', estado: 0, checked: false, eliminado: 0, despachado: false };
    const detallesOriginales = reqOriginal.detalle ?? reqOriginal.detalles ?? [];
    this.itemSvc.detalles = detallesOriginales.map((det: any) => ({ ...det, id: undefined, idrequerimiento: nuevoId, estado: 0 }));
    this.itemSvc.requerimiento.detalle = this.itemSvc.detalles;
    this.maestrasSvc.fundoSeleccionado = this.itemSvc.requerimiento.idfundo;
    this.maestrasSvc.areaSeleccionada = this.itemSvc.requerimiento.idarea;
    this.maestrasSvc.almacenSeleccionado = this.itemSvc.requerimiento.idalmacen;
    this.maestrasSvc.clasificacionSeleccionado = this.itemSvc.requerimiento.idclasificacion;
    this.itemSvc.glosa = this.itemSvc.requerimiento.glosa + ' (Copia)';
    this.itemSvc.SeleccionaTipoGasto = this.itemSvc.requerimiento.referenciaGasto;
    this.itemSvc.TipoSelecionado = this.itemSvc.requerimiento.itemtipo as TipoRequerimiento | '';
    this.itemSvc.modoEdicion = false;
    this.itemSvc.mostrarFormulario = true;
    this.itemSvc.modalAbierto = false;
    this.requerimiento = this.itemSvc.requerimiento;
    this.detalles = this.itemSvc.detalles;
    this.fundoSeleccionado = this.maestrasSvc.fundoSeleccionado;
    this.areaSeleccionada = this.maestrasSvc.areaSeleccionada;
    this.almacenSeleccionado = this.maestrasSvc.almacenSeleccionado;
    this.clasificacionSeleccionado = this.maestrasSvc.clasificacionSeleccionado;
    this.glosa = this.itemSvc.glosa;
    this.SeleccionaTipoGasto = this.itemSvc.SeleccionaTipoGasto;
    this.TipoSelecionado = this.itemSvc.TipoSelecionado;
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.modalAbierto = false;
    this.alertService.mostrarInfo('Requerimiento copiado. Modifica los campos y guarda como nuevo.');
  }

  copiarRequerimientoSelect(dataSelected: any[]) {
    if (!this.validarSeleccionUnica(dataSelected)) return;
    const index = this.requerimientos.findIndex(
      (r) => r.idrequerimiento === dataSelected[0].idrequerimiento,
    );
    if (index >= 0) this.copiarRequerimiento(index);
  }

  async validarStockRequerimiento(requerimiento: any): Promise<boolean> {
    this.itemSvc.requerimientosOmitirValidacion = this.requerimientosOmitirValidacion;
    const result = await this.itemSvc.validarStockRequerimiento(requerimiento);
    this.validandoStock = this.itemSvc.validandoStock;
    this.itemsStockValidacion = this.itemSvc.itemsStockValidacion;
    this.requerimientoValidandoStock = this.itemSvc.requerimientoValidandoStock;
    this.modalStockAbierto = this.itemSvc.modalStockAbierto;
    return result;
  }

  async confirmarAjusteStock() {
    this.itemSvc.requerimientoValidandoStock = this.requerimientoValidandoStock;
    this.itemSvc.itemsStockValidacion = this.itemsStockValidacion;
    this.itemSvc.requerimientosOmitirValidacion = this.requerimientosOmitirValidacion;
    this.itemSvc.requerimientos = this.requerimientos;
    this.itemSvc.detalles = this.detalles;
    await this.itemSvc.confirmarAjusteStock(
      () => this.sincronizarPendientes(),
      (idx) => this.editarRequerimiento(idx),
      () => this.cargarPendientes(),
    );
    this.requerimientos = this.itemSvc.requerimientos;
    this.requerimientoValidandoStock = this.itemSvc.requerimientoValidandoStock;
    this.itemsStockValidacion = this.itemSvc.itemsStockValidacion;
    this.modalStockAbierto = this.itemSvc.modalStockAbierto;
    this.lineaTemp = this.itemSvc.lineaTemp;
    this.modalAbierto = this.itemSvc.modalAbierto;
    this.editIndex = this.itemSvc.editIndex;
    this.actualizarContadores();
  }


  cerrarModalStock() {
    this.itemSvc.cerrarModalStock();
    this.modalStockAbierto = this.itemSvc.modalStockAbierto;
    this.itemsStockValidacion = this.itemSvc.itemsStockValidacion;
    this.requerimientoValidandoStock = this.itemSvc.requerimientoValidandoStock;
  }

  getEstadoStockClass(estado: string): string {
    switch (estado) {
      case 'SUFICIENTE':
        return 'badge bg-success';
      case 'PARCIAL':
        return 'badge bg-warning text-dark';
      case 'SIN_STOCK':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getEstadoStockTexto(estado: string): string {
    switch (estado) {
      case 'SUFICIENTE':
        return 'Stock OK';
      case 'PARCIAL':
        return 'Stock Parcial';
      case 'SIN_STOCK':
        return 'Sin Stock';
      default:
        return estado;
    }
  }

  abrirModalConsolidacion() {
    const pendientes = this.requerimientosItems.filter(
      (r) => r.estado === 'ATENDIDO_PARCIAL' || r.estado === 'GENERADO',
    );
    if (pendientes.length === 0) {
      alert('No hay requerimientos pendientes para consolidar');
      return;
    }
    const consolidado = {
      id: 'CON_' + new Date().getTime(),
      fecha: new Date(),
      items: [].concat(
        ...pendientes.map((p) =>
          p.detalles
            .filter((d: any) => d.saldo && d.saldo > 0)
            .map((d: any) => ({ ...d, origenReq: p.id })),
        ),
      ),
      origenReqs: pendientes.map((p) => p.id),
    };
    console.log('Consolidado:', consolidado);
  }

  allChecked() {
    this.requerimientos.forEach((t: any) => {
      if (t.eliminado == 0) {
        t.checked = !this.allSelected;
      }
    });
    if (!this.allSelected) {
      this.dataSelected = this.requerimientos;
    } else {
      this.dataSelected = [];
    }
    this.dataSelected.length == 0
      ? (this.verBotones = false)
      : (this.verBotones = true);
  }


  simpleSelected(row: any) {
    if (!row.checked) {
      this.requerimientos.forEach((r) => (r.checked = false));
      this.requerimientoActivo = null;
      this.detalles = [];
      this.dataSelected = [];
      this.verBotones = false;
      return;
    }
    this.requerimientos.forEach((r) => (r.checked = false));
    row.checked = true;
    this.requerimientoActivo = row;
    this.detalles = row.detalle ? row.detalle.map((d: any) => ({ ...d })) : [];
    this.dataSelected = [row];
    this.verBotones = true;
  }

  onCheckChange(event: Event, row: any) {
    const checked = (event.target as HTMLInputElement).checked;
    this.requerimientos.forEach((r) => (r.checked = false));
    if (!checked) { this.requerimientoActivo = null; this.detalles = []; this.dataSelected = []; this.verBotones = false; return; }
    row.checked = true;
    this.requerimientoActivo = row;
    this.detalles = row.detalle ? row.detalle.map((d: any) => ({ ...d })) : [];
    this.dataSelected = [row];
    this.verBotones = true;
  }

  onCheckChangeCommodity(event: Event, row: any) {
    const checked = (event.target as HTMLInputElement).checked;
    this.requerimientosCommodity.forEach((r) => (r.checked = false));
    if (!checked) { this.requerimientoCommodityActivo = null; this.detalles = []; this.dataSelectedCommodity = []; this.verBotones = false; return; }
    row.checked = true;
    this.requerimientoCommodityActivo = row;
    this.detalles = row.detalle ? row.detalle.map((d: any) => ({ ...d })) : [];
    this.dataSelectedCommodity = [row];
    this.verBotones = true;
  }

  onCheckChangeActivoFIjo(event: Event, row: any) {
    const checked = (event.target as HTMLInputElement).checked;
    this.requerimientosActivoFijo.forEach((r) => (r.checked = false));
    if (!checked) { this.requerimientoActivoFijoActivo = null; this.detallesActivoFijo = []; this.dataSelectedActivoFijo = []; this.verBotones = false; return; }
    row.checked = true;
    this.requerimientoActivoFijoActivo = row;
    this.detallesActivoFijo = (row.detalleActivoFijo && row.detalleActivoFijo.length) ? row.detalleActivoFijo.map((d: any) => ({ ...d })) : ((row.detalle || []).map((d: any) => ({ ...d })));
    this.dataSelectedActivoFijo = [row];
    this.verBotones = true;
  }

  onCheckChangeActivoFIjoMenor(event: Event, row: any) {
    const checked = (event.target as HTMLInputElement).checked;
    this.requerimientosActivoFijoMenor.forEach((r) => (r.checked = false));
    if (!checked) { this.requerimientoActivoFijoMenorActivo = null; this.detallesActivoFijoMenor = []; this.dataSelectedActivoFijoMenor = []; this.verBotonesActivoFijoMenor = false; return; }
    row.checked = true;
    this.requerimientoActivoFijoMenorActivo = row;
    this.detallesActivoFijoMenor = (row.detalleActivoFijoMenor && row.detalleActivoFijoMenor.length) ? row.detalleActivoFijoMenor.map((d: any) => ({ ...d })) : ((row.detalle || []).map((d: any) => ({ ...d })));
    this.dataSelectedActivoFijoMenor = [row];
    this.verBotonesActivoFijoMenor = true;
  }

  formatoFecha(date: any) {
    return this.utilsService.formatDate1(date);
  }

  scrollLeft() {
    const buttonsContainer = document.querySelector('.buttons') as HTMLElement;
    if (buttonsContainer) {
      buttonsContainer.scrollLeft -= 200; // Desplaza 200 pÃ­xeles hacia la izquierda
    }
  }

  scrollRight() {
    const buttonsContainer = document.querySelector('.buttons') as HTMLElement;
    if (buttonsContainer) {
      buttonsContainer.scrollLeft += 200; // Desplaza 200 pÃ­xeles hacia la derecha
    }
  }

  private validarSeleccionUnica(dataSelected: any[]): boolean {
    if (!dataSelected || dataSelected.length === 0) {
      this.alertService.showAlert('Atención', 'Debe seleccionar un requerimiento para editar', 'warning');
      return false;
    }
    if (dataSelected.length > 1) {
      this.alertService.showAlert('Atención', 'Solo puede editar un requerimiento a la vez', 'warning');
      return false;
    }
    return true;
  }

  editarRequerimientoSelect(dataSelected: any[]) {
    if (!this.validarSeleccionUnica(dataSelected)) return;
    const item = this.requerimientoActivo;
    this.requerimiento = { ...item };
    this.requerimiento.id = item.id; // necesario para update
    this.detalles = item.detalles
      ? item.detalles.map((d: any) => ({ ...d }))
      : [];
    console.log('Detalle del requerimiento a editar:', this.detalles);
    this.fundoSeleccionado = item.idfundo;
    this.areaSeleccionada = item.idarea;
    this.SeleccionaPrioridadITEM = item.prioridad;
    this.almacenSeleccionado = item.idalmacen;
    this.clasificacionSeleccionado = item.idclasificacion;
    this.glosa = item.glosa;
    this.SeleccionaTipoGasto = item.referenciaGasto;
    this.TipoSelecionado = item.itemtipo;
    this.almacenOrigen = item.idalmacen;
    this.almacenDestino = item.idalmacendestino;
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.modalAbierto = false;
    this.reasignarAlmacenDesdeDescripcion();
  }

  editarRequerimientoCommoditySelect(dataSelectedCommodity: any[]) {
    if (!this.validarSeleccionUnica(dataSelectedCommodity)) return;
    const commodity = this.requerimientoCommodityActivo;
    this.requerimientoCommodity = { ...commodity };
    this.requerimiento.id = commodity.id; // necesario para update
    this.detallesCommodity = commodity.detalles
      ? commodity.detalles.map((d: any) => ({ ...d }))
      : [];
    console.log('Detalle del requerimiento a editar:', this.detallesCommodity);
    this.fundoSeleccionado = commodity.idfundo;
    this.areaSeleccionada = commodity.idarea;
    this.SeleccionaPrioridadITEM = commodity.prioridad;
    this.almacenSeleccionado = commodity.idalmacen;
    this.clasificacionSeleccionado = commodity.idclasificacion;
    this.glosa = commodity.glosa;
    this.SeleccionaTipoGasto = commodity.referenciaGasto;
    this.SeleccionaServicio = commodity.servicio;
    this.onServicioChange();
    this.TipoSelecionado = commodity.itemtipo;
    this.almacenOrigen = commodity.idalmacen;
    this.almacenDestino = commodity.idalmacendestino;
    this.modoEdicionCommodity = true;
    this.mostrarFormularioCommodity = true;
    this.modalAbiertoCommodity = false;
    this.opcionesPrioridadCOMMODITY =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.reasignarAlmacenDesdeDescripcion();
  }

  editarRequerimientoActivoFijoSelect(dataSelectedActivoFijo: any[]) {
    if (!this.validarSeleccionUnica(dataSelectedActivoFijo)) return;
    const activofijo = this.requerimientoActivoFijoActivo;
    this.requerimientoActivoFijo = { ...activofijo };
    this.requerimiento.id = activofijo.id; // necesario para update
    this.detallesActivoFijo = activofijo.detalles
      ? activofijo.detalles.map((d: any) => ({ ...d }))
      : [];
    console.log('Detalle del requerimiento a editar:', this.detallesActivoFijo);
    this.fundoSeleccionado = activofijo.idfundo;
    this.areaSeleccionada = activofijo.idarea;
    this.SeleccionaPrioridadITEM = activofijo.prioridad;
    this.almacenSeleccionado = activofijo.idalmacen;
    this.clasificacionSeleccionado = activofijo.idclasificacion;
    this.glosa = activofijo.glosa;
    this.SeleccionaTipoGasto = activofijo.referenciaGasto;
    this.SeleccionaServicio = activofijo.servicio;
    this.onServicioAFChange();
    this.TipoSelecionado = activofijo.itemtipo;
    this.almacenOrigen = activofijo.idalmacen;
    this.almacenDestino = activofijo.idalmacendestino;
    this.modoEdicionActivoFijo = true;
    this.mostrarFormularioActivoFijo = true;
    this.modalAbiertoActivoFijo = false;
    this.opcionesPrioridadACTIVOFIJO =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.reasignarAlmacenDesdeDescripcion();
  }

  editarRequerimientoActivoFijoMenorSelect(dataSelected: any[]) {
    if (!this.validarSeleccionUnica(dataSelected)) return;
    const activofijomenor = this.requerimientoActivoFijoMenorActivo;
    this.requerimientoActivoFijoMenor = { ...activofijomenor };
    this.requerimiento.id = activofijomenor.id;
    this.detallesActivoFijoMenor = activofijomenor.detalles
      ? activofijomenor.detalles.map((d: any) => ({ ...d }))
      : [];
    console.log(
      'Detalle del requerimiento a editar:',
      this.detallesActivoFijoMenor,
    );
    this.fundoSeleccionado = activofijomenor.idfundo;
    this.areaSeleccionada = activofijomenor.idarea;
    this.SeleccionaPrioridadACTIVOFIJOMENOR = activofijomenor.prioridad;
    this.almacenSeleccionado = activofijomenor.idalmacen;
    this.clasificacionSeleccionado = activofijomenor.idclasificacion;
    this.glosaActivoFijoMenor = activofijomenor.glosa;
    this.SeleccionaTipoGasto = activofijomenor.referenciaGasto;
    this.SeleccionaServicioAFMenor = activofijomenor.servicio;
    this.onServicioAFMenorChange();
    this.TipoSelecionado = activofijomenor.itemtipo;
    this.almacenOrigen = activofijomenor.idalmacen;
    this.almacenDestino = activofijomenor.idalmacendestino;
    this.modoEdicionActivoFijoMenor = true;
    this.mostrarFormularioActivoFijoMenor = true;
    this.modalAbiertoActivoFijoMenor = false;
    this.opcionesPrioridadACTIVOFIJOMENOR =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.reasignarAlmacenDesdeDescripcion();
  }

  async eliminarRequerimientoSelect(dataSelected: any[]) {
    this.requerimientos = await this.itemSvc.eliminarDesdeSeleccion(
      dataSelected, this.requerimientos, () => this.contarSinEnviar()
    );
    this.actualizarContadores();
  }

  async eliminarRequerimientoCommoditySelect(dataSelected: any[]) {
    this.requerimientosCommodity = await this.itemSvc.eliminarDesdeSeleccion(
      dataSelected, this.requerimientosCommodity, () => this.contarSinEnviar()
    );
    this.actualizarContadores();
  }

  async eliminarRequerimientoActivoFijoSelect(dataSelected: any[]) {
    this.requerimientosActivoFijo = await this.itemSvc.eliminarDesdeSeleccion(
      dataSelected, this.requerimientosActivoFijo, () => this.contarSinEnviar()
    );
    this.actualizarContadores();
  }

  async eliminarRequerimientoActivoFijoMenorSelect(dataSelected: any[]) {
    this.requerimientosActivoFijoMenor = await this.itemSvc.eliminarDesdeSeleccion(
      dataSelected, this.requerimientosActivoFijoMenor, () => this.contarSinEnviar()
    );
    this.actualizarContadores();
  }

  onExcelUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    this.cargarExcel(file);
  }

  async cargarExcel(file: File) {
    const result = await this.itemSvc.cargarExcel(file, this.activosFijos);
    this.lineasPreview = result.lineasPreview;
    this.tieneErroresExcel = result.tieneErrores;
    this.puedeGuardar = result.puedeGuardar;
    this.abrirModalCargaMasiva();
  }

  validarFila(row: DetalleExcelPreview) {
    this.itemSvc.validarFila(row, this.lineasPreview, this.activosFijos);
    this.tieneErroresExcel = this.lineasPreview.some((r) => r.errores.length > 0);
    this.actualizarEstadoGuardar();
  }

  actualizarEstadoGuardar() {
    this.puedeGuardar = !this.lineasPreview.some((l) => l.error);
  }
  guardarDetalleMasivo() {
    this.itemSvc.detalles = this.detalles;
    const result = this.itemSvc.guardarDetalleMasivo(this.lineasPreview, this.puedeGuardar);
    if (result === null) return;
    this.detalles = this.itemSvc.detalles;
    this.lineasPreview = [];
    this.cerrarModalCargaMasiva();
  }

  tieneError(row: any, columna: string): boolean {
    if (!row || !row.errores) return false;
    return row.errores.some((e: any) => e.columna === columna);
  }

  filaConError(row: any): boolean {
    return row?.errores?.length > 0;
  }

  abrirModalCargaMasiva() {
    this.modalVisible = true;
    document.body.classList.add('modal-open');
  }

  cerrarModalCargaMasiva() {
    this.modalVisible = false;
    document.body.classList.remove('modal-open');
  }

  contarLineasConError(): number {
    return this.lineasPreview.filter((l) => l.error).length;
  }

  contarLineasSinError(): number {
    return this.lineasPreview.filter((l) => !l.error).length;
  }

  obtenerDescripcionProducto(producto: any): string {
    if (!producto) return '';
    if (producto.descripcion) {
      return producto.descripcion;
    }
    if (typeof producto === 'string' || producto.codigo) {
      const codigo = typeof producto === 'string' ? producto : producto.codigo;
      const itemEncontrado = this.items?.find(
        (item: any) => item.codigo === codigo,
      );
      return itemEncontrado ? itemEncontrado.descripcion : '';
    }
    return '';
  }

  private _inicializarFiltrosCascadaCommodityEdicion(): void {
    const linea = this.lineaTempCommodity as any;
    const turno = linea?.turno || '';
    const ceco = linea?.ceco || '';
    const labor = linea?.labor || '';

    if (turno) {
      const turnoObj = this.turnos.find((t: any) => t.nombreTurno === turno);
      this.filteredCecosModal = turnoObj
        ? this.cecos.filter((c: any) => c.conturno?.includes(turnoObj.conturno || ''))
        : [...this.cecos];
    } else {
      this.filteredCecosModal = [...this.cecos];
    }

    if (ceco) {
      const cecoObj = this.cecos.find((c: any) => c.localname === ceco);
      this.filteredLaboresModal = cecoObj
        ? this.labores.filter((l: any) => l.ceco === (cecoObj.costcenter || ''))
        : [...this.labores];
    } else {
      this.filteredLaboresModal = [...this.labores];
    }

    if (ceco && labor) {
      const cecoObj = this.cecos.find((c: any) => c.localname === ceco);
      const laborObj = this.labores.find((l: any) => l.labor === labor);
      this.filteredProyectosModal = this.proyectos.filter(
        (p: any) =>
          p.ceco?.trim() === (cecoObj?.costcenter || '')?.trim() &&
          p.idlabor?.trim() === (laborObj?.idlabor || '')?.trim() &&
          p.idcultivo?.trim() === this.maestrasSvc.cultivoSeleccionado?.trim(),
      );
    } else {
      this.filteredProyectosModal = [...this.proyectos];
    }
  }
}
