import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
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
  selector: 'app-requerimientos-original',
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
  templateUrl: './requerimientos-original.component.html',
  styleUrls: ['./requerimientos-original.component.scss'],
})
export class RequerimientosOriginalComponent implements OnInit {
  private contadorReq = 0; // contador para IDs únicos en la sesión
  // Control de tabs
  tabActiva: 'ITEM' | 'COMMODITY' | 'ACTIVOFIJO' | 'ACTIVOFIJOMENOR' = 'ITEM';
  // ====================
  // FORMULARIOS VISIBLES
  // ====================
  //-------ITEMS----------
  mostrarFormulario = false;
  modoEdicion: boolean = false;
  //-------Servicios----------
  mostrarFormularioCommodity = false;
  modoEdicionCommodity: boolean = false;
  //-------Activo Fijo----------
  mostrarFormularioActivoFijo = false;
  modoEdicionActivoFijo: boolean = false;
  //-------Activo Fijo Menor----------
  mostrarFormularioActivoFijoMenor = false;
  modoEdicionActivoFijoMenor: boolean = false;
  // listas
  requerimientos: Requerimiento[] = [];
  requerimientosItems: any[] = []; // ITEMS
  requerimientosCommodity: RequerimientoCommodity[] = []; // SERVICIOS
  requerimientosActivoFijo: RequerimientoActivoFijo[] = []; // ACTIVO FIJO
  requerimientosActivoFijoMenor: RequerimientoActivoFijoMenor[] = []; // ACTIVO FIJO MENOR
  // detalles por cada requerimiento
  detalles: DetalleRequerimiento[] = []; // para ITEMS
  detallesCommodity: DetalleRequerimientoCommodity[] = []; // para SERVICIOS
  detallesActivoFijo: DetalleRequerimientoActivoFijo[] = []; // para ACTIVO FIJO
  detallesActivoFijoMenor: DetalleRequerimientoActivoFijoMenor[] = []; // para ACTIVO FIJO MENOR
  loading: boolean = false;
  // sincronización
  pendientes = 0;
  sincronizando = false;
  progreso = 0;
  // Excel Preview para carga masiva
  lineasPreview: DetalleExcelPreview[] = [];
  puedeGuardar = false;
  modalVisible = false;
  erroresExcel: ErrorExcel[] = [];
  tieneErroresExcel: boolean = false;
  // modal (reutilizado)
  //-----MODAL ITEMS----------
  modalAbierto: boolean = false;
  editIndex: number = -1;
  // 🔥 MODAL MEJORADO - Nuevas propiedades
  permitirEditarParametros: boolean = false; // Checkbox para habilitar edición
  lineasTemporales: DetalleRequerimiento[] = []; // Tabla de líneas agregadas
  editingTempIndex: number = -1; // Índice de línea temporal en edición (-1 = nueva línea)
  // Variables para modo editable (cascada)
  turnoModal: string = '';
  cecoModal: string = '';
  laborModal: string = '';
  proyectoModal: string = '';
  // Arrays filtrados para el modal
  filteredCecosModal: Ceco[] = [];
  filteredLaboresModal: Labor[] = [];
  filteredProyectosModal: Proyecto[] = [];
  unidadesMedidaFiltradas: any[] = [];
  // 🔥 Getters para bindings condicionales en el modal
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
    return this.editIndex >= 0 || this.editingTempIndex >= 0;
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
    return this.enModoEdicion
      ? this.filteredLaboresModal
      : this.permitirEditarParametros
        ? this.filteredLaboresModal
        : this.labores;
  }
  get modalLaborEditable(): boolean {
    return this.enModoEdicion ? true : this.permitirEditarParametros;
  }
  get modalLaborDisabled(): boolean {
    return this.enModoEdicion ? false : !this.permitirEditarParametros;
  }
  //-----MODAL COMMODITY----------
  modalAbiertoCommodity: boolean = false;
  commodityEditIndex: number = -1;
  //-----MODAL ACTIVO FIJO----------
  modalAbiertoActivoFijo: boolean = false;
  activoFijoEditIndex: number = -1;
  //-----MODAL ACTIVO FIJO MENOR----------
  modalAbiertoActivoFijoMenor: boolean = false;
  activoFijoMenorEditIndex: number = -1;
  //-----MODAL VALIDACION STOCK----------
  modalStockAbierto: boolean = false;
  itemsStockValidacion: any[] = [];
  requerimientoValidandoStock: any = null;
  validandoStock: boolean = false;
  requerimientosOmitirValidacion: Set<string> = new Set();

  // Cambia entre las diferentes pestañas del componente (ITEM, COMMODITY, ACTIVOFIJO, ACTIVOFIJOMENOR)
  cambiarTab(tab: 'ITEM' | 'COMMODITY' | 'ACTIVOFIJO' | 'ACTIVOFIJOMENOR') {
    this.tabActiva = tab;
    // cerrar cualquier formulario abierto para evitar confusión
    this.mostrarFormulario = false;
    this.mostrarFormularioCommodity = false;
    this.mostrarFormularioActivoFijo = false;
    this.mostrarFormularioActivoFijoMenor = false;
    // 🔥 Cargar opciones de prioridad según el tab activo
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

  //Requerimiento Item
  verBotones: boolean = false;
  verBotonEliminar: boolean = false;
  modoItemPrincipal: boolean = false;
  dataSelected: any = [];
  allSelected: boolean = false;
  requerimientoActivo: any = null;
  //Requerimiento Commodity
  dataSelectedCommodity: any = [];
  requerimientoCommodityActivo: any = null;
  //Requerimiento Activo Fijo
  dataSelectedActivoFijo: any = [];
  requerimientoActivoFijoActivo: any = null;
  //Requerimiento Activo Fijo Menor
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
    { header: 'Área', field: 'idarea', visible: true, sortable: true },
    { header: 'Almacén', field: 'almacen', visible: true, sortable: true },
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
  detalle: DetalleRequerimiento = {
    idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
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
    idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
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
    idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
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
    idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
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
  // lineaTemp: LineaDetalle = this.nuevaLinea();
  lineaTemp: DetalleRequerimiento = this.nuevaLinea();
  lineaTempCommodity: DetalleRequerimientoCommodity =
    this.nuevaLineaCommodity();
  lineaTempActivoFijo: DetalleRequerimientoActivoFijo =
    this.nuevaLineaActivoFijo();
  lineaTempActivoFijoMenor: DetalleRequerimientoActivoFijoMenor =
    this.nuevaLineaActivoFijoMenor();
  // editIndex: number = -1;
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
  // Opciones dinámicas de prioridad según tipo de requerimiento
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
  // filtroClasificaciones: any[] = [];
  constructor(
    private userService: UserService,
    private utilsService: UtilsService,
    private dexieService: DexieService,
    private alertService: AlertService, // ✅ inyectar el servicio
    private requerimientosService: RequerimientosService,
    private aprobacionesAreaService: AprobacionesAreaService, // ✅ Servicio de aprobaciones por área
    public prioridadService: PrioridadRequerimientoService, // ✅ Servicio de prioridades (public para usar en template)
  ) { }
  async ngOnInit() {
    await this.cargarUsuario(); // 👈 carga el usuario primero
    await this.cargarMaestras(); // 👈 Cargar las maestras primero (incluyendo CECOS)
    await this.cargarConfiguracion(); // 👈 REUTILIZA LO GUARDADO EN PARÁMETROS
    await this.ListarItems(); // 👈 Cargar items después de tener la configuración del almacén
    await this.cargarRequerimientos(); // 👈 Esto llena la tabla al inicio
    await this.cargarPendientes(); // 👈 carga el número de pendientes
    this.actualizarContadores();
    // 🔥 Inicializar opciones de prioridad para todos los tipos
    this.opcionesPrioridadCOMMODITY =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.opcionesPrioridadACTIVOFIJO =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.opcionesPrioridadACTIVOFIJOMENOR =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    // Verificar si viene de una consolidación
    await this.verificarRequerimientoConsolidado();
    // Mostrar información del área si está asignada
    this.mostrarInformacionArea();
  }
  mostrarInformacionArea() {
    if (this.usuario.idarea) {
      console.log(
        `📍 Usuario asignado al área: ${this.usuario.nombreArea || this.usuario.idarea}`,
      );
      // Si es jefe de área, mostrar mensaje especial
      if (this.usuario.esJefeArea) {
        console.log(
          '👑 El usuario es Jefe de Área - puede aprobar requerimientos de su área',
        );
      }
    } else {
      console.log(
        '⚠️ Usuario sin área asignada - usará flujo de aprobación normal',
      );
    }
  }

  // Verifica si viene de una consolidación de requerimientos y carga los datos prellenados
  async verificarRequerimientoConsolidado() {
    const consolidadoData = sessionStorage.getItem('requerimientoConsolidado');
    if (consolidadoData) {
      try {
        const data = JSON.parse(consolidadoData);
        // Configurar el tipo como COMPRA
        this.TipoSelecionado = data.tipo;
        this.requerimiento.itemtipo = data.tipo;
        // 🔥 Cargar opciones de prioridad según el tipo
        this.opcionesPrioridadITEM =
          this.prioridadService.obtenerOpcionesPrioridad(
            this.TipoSelecionado as 'COMPRA' | 'CONSUMO' | 'TRANSFERENCIA',
          );
        // 🔥 Llamar a onTipoChange para establecer la clasificación automáticamente
        await this.onTipoChange();
        // Abrir el formulario de items
        this.mostrarFormulario = true;
        this.modoEdicion = false;
        // 🔹 Prioridad por defecto: Normal (1)
        this.SeleccionaPrioridadITEM = '1';
        // Preencher la descripción
        this.glosa = data.descripcion;
        // Cambiar a la pestaña de items
        this.tabActiva = 'ITEM';
        // Agregar los detalles consolidados
        data.detalles.forEach((detalle: any) => {
          this.agregarDetalleConsolidado(detalle);
        });
        // Limpiar sessionStorage
        sessionStorage.removeItem('requerimientoConsolidado');
        // Mostrar alerta de éxito
        this.alertService.showAlert(
          'Información',
          'Requerimiento de compra consolidado cargado. Complete los datos adicionales y guarde.',
          'info',
        );
      } catch (error) {
        console.error('Error al procesar requerimiento consolidado:', error);
        sessionStorage.removeItem('requerimientoConsolidado');
      }
    }
  }

  // Agrega un detalle consolidado a la lista de detalles del requerimiento
  agregarDetalleConsolidado(detalle: any) {
    console.log(detalle);
    const nuevoDetalle: any = {
      // Using any to avoid type issues temporarily
      id: this.contadorReq++,
      idrequerimiento: '', // Will be set when saving
      codigo: detalle.codigo, // Empty since item code goes in producto
      producto: detalle.descripcion, // Item code goes here
      descripcion: '',
      cantidad: detalle.cantidad,
      cantidadAprobada: detalle.cantidad,
      cantidadAtendida: 0,
      unidadMedida: 'UNIDAD',
      precioReferencial: 0,
      montoReferencial: 0,
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

  // Actualiza los contadores de requerimientos enviados y sin enviar
  actualizarContadores() {
    this.contarSinEnviar();
    this.contarEnviados();
  }

  // Verifica si un requerimiento ya fue enviado (estado === 1)
  esEnviado(e: any): boolean {
    return e.estado === 1;
  }

  // Verifica si un requerimiento está sin enviar (estado === 0)
  esSinEnviar(e: any): boolean {
    return e.estado === 0;
  }

  // Cuenta los requerimientos sin enviar para cada tipo (ITEM, COMMODITY, ACTIVOFIJO, ACTIVOFIJOMENOR)
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

  // Cuenta los requerimientos enviados para cada tipo
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

  // Carga la configuración guardada en Dexie (CECO, proyecto, labor, almacén, tipo de item)
  async cargarConfiguracion() {
    const config = await this.dexieService.obtenerPrimeraConfiguracion();
    if (config) {
      this.configuracion = config;
      console.log(
        '⚙️ Configuración cargada en Requerimientos:',
        this.configuracion,
      );
      // Opcional: precargar selects con esta configuración
      this.fundoSeleccionado = config.idfundo;
      // Priorizar el área del usuario sobre la configuración
      this.areaSeleccionada = this.usuario.idarea || config.idarea;
      this.cultivoSeleccionado = config.idcultivo;
      this.almacenSeleccionado = config.idalmacen;
      this.clasificacionSeleccionado = config.idclasificacion;
      this.turnoSeleccionado = config.idturno;
      this.itemSeleccionado = config.iditem;
      this.TipoSelecionado = config.idTipoItem as TipoRequerimiento | '';
      // 🌟 Cargar el CECO completo desde la configuración
      if (config.idceco) {
        console.log('🔍 Buscando CECO con id:', config.idceco);
        console.log('🔍 Lista de CECOS disponibles:', this.cecos.slice(0, 3));
        this.cecoSeleccionado = (await this.dexieService.getCecoById(
          config.idceco,
        )) as Ceco | null;
        console.log('🔍 CECO cargado desde config:', this.cecoSeleccionado);
        // Si no encuentra por ID, intentar buscar por localname o costcenter
        if (!this.cecoSeleccionado) {
          console.log(
            '⚠️ No se encontró CECO por ID, intentando por localname...',
          );
          const cecoByLocalname = this.cecos.find(
            (c) =>
              c.localname === config.idceco || c.costcenter === config.idceco,
          );
          if (cecoByLocalname) {
            this.cecoSeleccionado = cecoByLocalname;
            console.log(
              '✅ CECO encontrado por localname/costcenter:',
              this.cecoSeleccionado,
            );
          }
        }
      }
      // 🌟 Cargar el proyecto completo desde la configuración
      if (config.idproyecto) {
        this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(
          config.idproyecto,
        )) as Proyecto | null;
        console.log(
          '🔍 Proyecto cargado desde config:',
          this.proyectoSeleccionado,
        );
      }
      // 🌟 Cargar la labor completa desde la configuración
      if (config.idlabor) {
        this.laborSeleccionado = (await this.dexieService.getLaborById(
          config.idlabor,
        )) as Labor | null;
        console.log('🔍 Labor cargada desde config:', this.laborSeleccionado);
      }
      // 🔥 Ejecutar lógica según tipo
      await this.onTipoChange();
      if (!this.requerimiento.idalmacen) {
        this.requerimiento.idalmacen = config.idalmacen;
      }
    } else {
      console.warn('⚠️ No existe configuración guardada.');
    }
  }

  // Inicializa un nuevo requerimiento de tipo COMMODITY (servicio)
  async nuevoCommodity() {
    this.requerimientoCommodity = {
      idrequerimiento: '',
      fecha: '',
      proveedor: '',
      servicio: '',
      descripcion: '',
      almacen: '',
      glosa: '',
      tipo: '',
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
      detalleCommodity: [],
      estado: 0,
      disabled: false,
      checked: false,
      eliminado: 0,
    };
    this.detallesCommodity = [];
    this.glosaCommodity = await this.generarGlosaAutomatica(); // 🔥 Generar glosa automática
    this.mostrarFormularioCommodity = true;
    this.modoEdicionCommodity = false;
    // 🔹 Prioridad por defecto: Normal (1)
    this.SeleccionaPrioridadCOMMODITY = '1';
  }

  // Edita un requerimiento de tipo COMMODITY existente
  editarCommodity(index: number) {
    const req = this.requerimientosCommodity[index];
    req.id = this.requerimientosCommodity[index].id; // 🔥 Necesario para update()
    if (!req) return;
    this.mostrarFormularioCommodity = true;
    this.modoEdicionCommodity = true;
    this.commodityEditIndex = index;
    // 🔥 Cargar opciones de prioridad para COMMODITY (usa las mismas que COMPRA)
    this.opcionesPrioridadCOMMODITY =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    // Copiar el requerimiento seleccionado
    this.requerimientoCommodity = { ...req };
    // ⭐ CARGA CORRECTA DE DETALLES
    this.detallesCommodity = req.detalleCommodity?.length
      ? req.detalleCommodity
      : req.detalle || [];
    // Cargar selects
    this.fundoSeleccionado = req.idfundo;
    this.areaSeleccionada = req.idarea;
    this.almacenSeleccionado = req.idalmacen;
    this.clasificacionSeleccionado = req.idclasificacion;
    this.SeleccionaPrioridadCOMMODITY = req.prioridad as PrioridadSpring | '';
    // Find the proyecto object that matches the ID
    const proyectoObj = this.proyectos.find(
      (p) => p.idproyecto === req.idproyecto,
    );
    this.proyectoSeleccionado = proyectoObj || null;
    // this.proyectoSeleccionado = req.idproyecto;
    // Campos propios del servicio
    this.seleccionaProveedor = req.proveedor;
    this.SeleccionaServicio = req.servicio;
    this.onServicioChange();
    this.glosaCommodity = req.glosa;
    // Asegurar que no esté abierto algún modal
    this.modalAbiertoCommodity = false;
  }

  // Elimina un requerimiento de tipo COMMODITY
  async eliminarCommodity(index: number) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning',
    );
    if (!confirmacion) return;
    try {
      const req = this.requerimientosCommodity[index];
      // 1️⃣ Eliminar detalles del requerimiento en la tabla detallesCommodity
      await this.dexieService.detallesCommodity
        .where('idrequerimiento')
        .equals(req.idrequerimiento)
        .delete();
      // 2️⃣ Eliminar el requerimiento de la tabla requerimientosCommodity
      await this.dexieService.deleteRequerimientoCommodity(req.idrequerimiento);
      // 3️⃣ Eliminar del array local sin recargar toda la BD
      this.requerimientosCommodity.splice(index, 1);
      // 4️⃣ Actualizar contadores y ordenar
      this.actualizarContadores();
      this.ordenarRequerimientosCommodity();
      // 5️⃣ Notificar
      this.alertService.showAlert(
        'Éxito',
        'Requerimiento eliminado correctamente.',
        'success',
      );
    } catch (error) {
      console.error('Error al eliminar requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar el requerimiento.',
        'error',
      );
    }
  }

  // Guarda un requerimiento de tipo COMMODITY en Dexie y lo sincroniza con el backend
  async guardarCommodity() {
    if (!this.fundoSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Fundo antes de guardar.',
        'warning',
      );
      return;
    }
    if (!this.glosaCommodity) {
      this.alertService.showAlert(
        'Atención',
        'Debes ingresar una glosa antes de guardar.',
        'warning',
      );
      return;
    }
    try {
      this.alertService.mostrarModalCarga();
      // Obtener datos de almacén
      const almacenObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenSeleccionado,
      );
      const idAlmacenSync = almacenObj ? almacenObj.idalmacen : '';
      // =============== GENERAR ID ==================
      const idreq =
        this.usuario.ruc +
        idAlmacenSync +
        this.usuario.documentoidentidad +
        this.utilsService.formatoAnioMesDiaHoraMinSec();
      // =============== ARMAR OBJETO ==================
      const reqCommodity: RequerimientoCommodity = {
        idrequerimiento: idreq,
        ruc: this.usuario.ruc,
        idfundo: this.fundoSeleccionado,
        idarea: this.areaSeleccionada,
        idclasificacion: this.clasificacionSeleccionado,
        prioridad: this.SeleccionaPrioridadCOMMODITY ?? '1',
        nrodocumento: this.usuario.documentoidentidad,
        idalmacen: idAlmacenSync,
        idalmacendestino: '',
        glosa: this.glosaCommodity,
        tipo: 'COMMODITY',
        estados: 'PENDIENTE',
        fecha: new Date().toISOString(),
        proveedor: this.seleccionaProveedor,
        servicio: this.SeleccionaServicio,
        descripcion: this.SeleccionaSubServicio,
        almacen: almacenObj?.almacen || '',
        idproyecto: this.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,
        checked: false,
        disabled: false,
        eliminado: 0,
        detalleCommodity: [...this.detallesCommodity],
      };
      let idGuardado;
      // =============== EDITAR ==================
      if (this.modoEdicionCommodity) {
        // Eliminar detalles antiguos antes de guardar los nuevos
        await this.dexieService.detallesCommodity
          .where('idrequerimiento')
          .equals(reqCommodity.idrequerimiento)
          .delete();
        await this.dexieService.requerimientosCommodity.put(reqCommodity);
        const index = this.requerimientosCommodity.findIndex(
          (r) => r.idrequerimiento === reqCommodity.idrequerimiento,
        );
        if (index !== -1) {
          this.requerimientosCommodity[index] = { ...reqCommodity };
        }
        idGuardado = reqCommodity.idrequerimiento;
        this.modoEdicionCommodity = false;
      } else {
        // =============== NUEVO ==================
        idGuardado =
          await this.dexieService.requerimientosCommodity.put(reqCommodity);
        this.requerimientosCommodity.push({ ...reqCommodity });
      }
      // 🔥 GUARDAR DETALLE (AQUÍ ES DONDE DEBE IR)
      for (const d of this.detallesCommodity) {
        await this.dexieService.detallesCommodity.put({
          ...d,
          idrequerimiento: idreq,
        });
      }
      // 🔹 Integración con Sistema de Aprobaciones por Área
      try {
        // Solo registrar aprobaciones si tiene área asignada
        if (reqCommodity.idarea) {
          // 1. Registrar el requerimiento en el sistema de aprobaciones
          const dataRegistro = {
            ruc: reqCommodity.ruc,
            idrequerimiento: reqCommodity.idrequerimiento,
            idarea: Number(reqCommodity.idarea),
            tipoRequerimiento: 'SERVICIO',
            descripcion: reqCommodity.glosa,
            usuarioSolicitud: this.usuario.documentoidentidad,
            glosa: reqCommodity.glosa,
            monto: 0,
          };
          await this.aprobacionesAreaService
            .registrarRequerimiento(dataRegistro)
            .toPromise();
          // 2. Asignar aprobadores automáticamente
          const dataAsignacion = {
            ruc: reqCommodity.ruc,
            idrequerimiento: reqCommodity.idrequerimiento,
            idarea: Number(reqCommodity.idarea),
            tipoRequerimiento: 'SERVICIO',
            usuarioSolicitud: this.usuario.documentoidentidad,
          };
          await this.aprobacionesAreaService
            .asignarAprobadoresRequerimiento(dataAsignacion)
            .toPromise();
          console.log(
            '✅ Requerimiento Commodity registrado en sistema de aprobaciones por área',
          );
        }
      } catch (error) {
        console.error(
          '⚠️ Error al registrar Commodity en sistema de aprobaciones:',
          error,
        );
        // No fallamos el guardado principal, solo lo registramos en consola
      }
      this.alertService.cerrarModalCarga();
      this.actualizarContadores();
      this.ordenarRequerimientosCommodity();
      this.alertService.showAlert(
        'Éxito',
        `Requerimiento de Servicio #${idGuardado} guardado correctamente.`,
        'success',
      );
      // =============== LIMPIAR ==================
      this.detallesCommodity = [];
      this.mostrarFormularioCommodity = false;
      this.glosa = '';
      this.seleccionaProveedor = '';
      this.SeleccionaServicio = '';
      this.commodityEditIndex = -1;
    } catch (e) {
      console.error('Error al guardar commodity', e);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un problema al guardar el Requerimiento de Servicio.',
        'error',
      );
    }
  }
  cancelarCommodity() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.',
    );
    if (!confirmar) return;
    this.mostrarFormularioCommodity = false;
  }

  // Inicializa un nuevo requerimiento de tipo ACTIVO FIJO MENOR
  async nuevoActivoFijoMenor() {
    this.requerimientoActivoFijoMenor = {
      idrequerimiento: '',
      ruc: '',
      fecha: '',
      servicio: '',
      descripcion: '',
      almacen: '',
      glosa: '',
      tipo: '',
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
    this.mostrarFormularioActivoFijoMenor = true;
    this.detallesActivoFijoMenor = [];
    this.glosaActivoFijoMenor = await this.generarGlosaAutomatica(); // 🔥 Generar glosa automática
    this.modoEdicionActivoFijoMenor = false;
    // 🔥 Cargar opciones de prioridad para ACTIVOFIJOMENOR (usa las mismas que COMPRA)
    this.opcionesPrioridadACTIVOFIJOMENOR =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    // 🔹 Prioridad por defecto: Normal (1)
    this.SeleccionaPrioridadACTIVOFIJOMENOR = '1';
  }

  // Edita un requerimiento de tipo ACTIVO FIJO MENOR existente
  editarActivoFijoMenor(index: number) {
    const req = this.requerimientosActivoFijoMenor[index];
    if (!req) return;
    this.mostrarFormularioActivoFijoMenor = true;
    this.modoEdicionActivoFijoMenor = true;
    this.activoFijoMenorEditIndex = index;
    // 🔥 Cargar opciones de prioridad para ACTIVOFIJOMENOR (usa las mismas que COMPRA)
    this.opcionesPrioridadACTIVOFIJOMENOR =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    // Copia del registro
    this.requerimientoActivoFijoMenor = { ...req };
    // Cargar detalles
    this.detallesActivoFijoMenor = req.detalleActivoFijoMenor || [];
    // Cargar selects principales
    this.fundoSeleccionado = req.idfundo;
    this.areaSeleccionada = req.idarea;
    this.almacenSeleccionado = req.idalmacen;
    this.clasificacionSeleccionado = req.idclasificacion;
    this.SeleccionaPrioridadACTIVOFIJOMENOR = req.prioridad as
      | PrioridadSpring
      | '';
    const proyectoEncontrado = this.proyectos.find(
      (p) => p.id === req.idproyecto,
    );
    this.proyectoSeleccionado = proyectoEncontrado || null;
    // Campos propios del activo fijo
    this.selecccionaActivoFijoMenor = req.servicio;
    this.onServicioAFMenorChange();
    this.glosaActivoFijoMenor = req.glosa;
    this.modalAbiertoActivoFijoMenor = false;
  }

  // Elimina un requerimiento de tipo ACTIVO FIJO MENOR
  async eliminarActivoFijoMenor(index: number) {
    // this.requerimientosActivoFijoMenor.splice(index, 1);
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning',
    );
    if (!confirmacion) return;
    try {
      const req = this.requerimientosActivoFijoMenor[index];
      // 1️⃣ Eliminar solo ese requerimiento en Dexie
      await this.dexieService.deleteRequerimiento(req.idrequerimiento);
      // 2️⃣ Eliminar del array local sin recargar toda la BD
      this.requerimientosActivoFijoMenor.splice(index, 1);
      // 3️⃣ Notificar
      this.alertService.showAlert(
        'Éxito',
        'Requerimiento eliminado correctamente.',
        'success',
      );
    } catch (error) {
      console.error('Error al eliminar requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar el requerimiento.',
        'error',
      );
    }
  }

  // Edita un detalle de un requerimiento ACTIVO FIJO MENOR
  editarDetalleActivoFijoMenor(index: number): void {
    this.activoFijoMenorEditIndex = index;
    this.lineaTempActivoFijoMenor = { ...this.detallesActivoFijoMenor[index] };
    this.modoEdicionActivoFijoMenor = true;
    this.modalAbiertoActivoFijoMenor = true;
  }

  // Elimina un detalle de un requerimiento ACTIVO FIJO MENOR
  async eliminarDetalleActivoFijoMenor(index: number) {
    // 1. ID del detalle a eliminar
    const detalle = this.detallesActivoFijoMenor[index];
    const id = detalle.id;
    // 2. Eliminar de la tabla separada de detalles en Dexie
    if (id) {
      await this.dexieService.deleteDetalleRequerimiento(id);
    }
    // 3. Eliminar del array local que alimenta la tabla
    this.detallesActivoFijoMenor.splice(index, 1);
    // 4. Actualizar el array embebido en el requerimiento actual
    (this.requerimiento as any).detalle = [...this.detallesActivoFijoMenor];
    // 5. Actualizar en Dexie el requerimiento con el nuevo detalle embebido
    if (this.requerimiento.id) {
      await (this.dexieService.requerimientos as any).update(
        this.requerimiento.id,
        {
          detalle: this.detallesActivoFijoMenor,
          modificado: 1,
        },
      );
    }
    // 6. Actualizar también en la lista local de requerimientos
    const idx = this.requerimientos.findIndex(
      (r) => r.idrequerimiento === this.requerimiento.idrequerimiento,
    );
    if (idx >= 0) {
      (this.requerimientos[idx] as any).detalle = [
        ...this.detallesActivoFijoMenor,
      ];
    }
    // 7. Notificación
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  // Guarda un requerimiento de tipo ACTIVO FIJO MENOR en Dexie
  async guardarActivoFijoMenor() {
    if (!this.fundoSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Fundo antes de guardar.',
        'warning',
      );
      return;
    }
    if (!this.glosaActivoFijoMenor) {
      this.alertService.showAlert(
        'Atención',
        'Debes ingresar una glosa antes de guardar.',
        'warning',
      );
      return;
    }
    try {
      this.alertService.mostrarModalCarga();
      const almacenObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenSeleccionado,
      );
      const idAlmacenSync = almacenObj ? almacenObj.idalmacen : '';
      // ================================
      // GENERAR ID ACTIVO FIJO
      // ================================
      const idreq =
        this.usuario.ruc +
        idAlmacenSync +
        this.usuario.documentoidentidad +
        this.utilsService.formatoAnioMesDiaHoraMinSec();
      // ================================
      // ARMAR OBJETO
      // ================================
      const reqAF: RequerimientoActivoFijoMenor = {
        idrequerimiento: idreq,
        fecha: new Date().toISOString(),
        servicio: this.SeleccionaServicioAFMenor,
        descripcion: this.SeleccionaSubServicioAFMenor,
        almacen: almacenObj?.almacen || '',
        glosa: this.glosaActivoFijoMenor,
        tipo: 'ACTIVOFIJOMENOR',
        ruc: this.usuario.ruc,
        estados: 'PENDIENTE',
        prioridad: this.SeleccionaPrioridadACTIVOFIJOMENOR ?? '1',
        idfundo: this.fundoSeleccionado,
        idarea: this.areaSeleccionada,
        idclasificacion: this.clasificacionSeleccionado,
        nrodocumento: this.usuario.documentoidentidad,
        idalmacen: idAlmacenSync,
        idalmacendestino: '',
        idproyecto: this.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,
        disabled: false,
        checked: false,
        eliminado: 0,
        detalleActivoFijoMenor: [...this.detallesActivoFijoMenor],
      };
      // ================================
      // GUARDAR EN DEXIE
      // ================================
      const idGuardado =
        await this.dexieService.requerimientosActivoFijoMenor.put(reqAF);
      // ================================
      // GUARDAR EN MEMORIA
      // ================================
      this.requerimientosActivoFijoMenor.push(reqAF);
      this.alertService.cerrarModalCarga();
      this.actualizarContadores();
      this.ordenarRequerimientosActivoFijoMenor();
      this.alertService.showAlert(
        'Éxito',
        `Requerimiento Activo Fijo #${idGuardado} guardado correctamente.`,
        'success',
      );
      // ================================
      // LIMPIAR
      // ================================
      this.detallesActivoFijoMenor = [];
      this.mostrarFormularioActivoFijoMenor = false;
      this.glosaActivoFijoMenor = '';
      this.seleccionaProveedor = '';
      this.SeleccionaServicioAFMenor = '';
      this.activoFijoMenorEditIndex = -1;
    } catch (e) {
      console.error('Error Guardando Activo Fijo', e);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Hubo un problema al guardar el Requerimiento de Activo Fijo.',
        'error',
      );
    }
  }
  cancelarActivoFijoMenor() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.',
    );
    if (!confirmar) return;
    this.mostrarFormularioActivoFijoMenor = false;
  }

  // Inicializa un nuevo requerimiento de tipo ACTIVO FIJO
  async nuevoActivoFijo() {
    this.requerimientoActivoFijo = {
      idrequerimiento: '',
      fecha: '',
      proveedor: '',
      servicio: '',
      descripcion: '',
      almacen: '',
      glosa: '',
      tipo: '',
      ruc: '',
      estados: 'PENDIENTE',
      idfundo: '',
      idarea: '',
      idclasificacion: '',
      prioridad: '',
      nrodocumento: '',
      idalmacen: '',
      idalmacendestino: '',
      idproyecto: this.proyectoSeleccionado?.proyectoio || '',
      estado: 0,
      disabled: false,
      checked: false,
      eliminado: 0,
      detalleActivoFijo: [],
    };
    this.mostrarFormularioActivoFijo = true;
    this.detallesActivoFijo = [];
    this.glosaActivoFijo = await this.generarGlosaAutomatica(); // 🔥 Generar glosa automática
    this.modoEdicionActivoFijo = false;
    // 🔥 Cargar opciones de prioridad para ACTIVOFIJO (usa las mismas que COMPRA)
    this.opcionesPrioridadACTIVOFIJO =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    // 🔹 Prioridad por defecto: Normal (1)
    this.SeleccionaPrioridadACTIVOFIJO = '1';
  }

  // Edita un requerimiento de tipo ACTIVO FIJO existente
  editarActivoFijo(index: number) {
    const req = this.requerimientosActivoFijo[index];
    if (!req) return;
    this.mostrarFormularioActivoFijo = true;
    this.modoEdicionActivoFijo = true;
    this.activoFijoEditIndex = index;
    // 🔥 Cargar opciones de prioridad para ACTIVOFIJO (usa las mismas que COMPRA)
    this.opcionesPrioridadACTIVOFIJO =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    // Copia del registro
    this.requerimientoActivoFijo = { ...req };
    // Cargar detalles
    // ⭐ CARGA CORRECTA DE DETALLES
    this.detallesActivoFijo = req.detalleActivoFijo?.length
      ? req.detalleActivoFijo
      : req.detalle || [];
    // Cargar selects principales
    this.fundoSeleccionado = req.idfundo;
    this.areaSeleccionada = req.idarea;
    this.almacenSeleccionado = req.idalmacen;
    this.clasificacionSeleccionado = req.idclasificacion;
    this.SeleccionaPrioridadACTIVOFIJO = req.prioridad as PrioridadSpring | '';
    this.proyectoSeleccionado =
      this.proyectos.find((p) => p.proyectoio === req.idproyecto) ?? null;
    // Campos propios del activo fijo
    this.SeleccionaServicioAF = req.servicio;
    this.onServicioAFChange();
    this.glosaActivoFijo = req.glosa;
    this.modalAbiertoActivoFijo = false;
  }

  // Elimina un requerimiento de tipo ACTIVO FIJO
  async eliminarActivoFijo(index: number) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning',
    );
    if (!confirmacion) return;
    try {
      const req = this.requerimientosActivoFijo[index];
      // 1️⃣ Eliminar solo ese requerimiento en Dexie
      await this.dexieService.deleteRequerimiento(req.idrequerimiento);
      // 2️⃣ Eliminar del array local sin recargar toda la BD
      this.requerimientosActivoFijo.splice(index, 1);
      // 3️⃣ Notificar
      this.alertService.showAlert(
        'Éxito',
        'Requerimiento eliminado correctamente.',
        'success',
      );
    } catch (error) {
      console.error('Error al eliminar requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar el requerimiento.',
        'error',
      );
    }
  }

  // Edita un detalle de un requerimiento ACTIVO FIJO
  editarDetalleActivoFijo(index: number): void {
    this.activoFijoEditIndex = index;
    this.lineaTempActivoFijo = { ...this.detallesActivoFijo[index] };
    this.SeleccionaSubServicioAF = this.lineaTempActivoFijo.codigo;
    this.modoEdicionActivoFijo = true;
    this.modalAbiertoActivoFijo = true;
  }

  // Elimina un detalle de un requerimiento ACTIVO FIJO
  async eliminarDetalleActivoFijo(index: number) {
    // 1. ID del detalle a eliminar
    const detalle = this.detallesActivoFijo[index];
    const id = detalle.id;
    // 2. Eliminar de la tabla separada de detalles en Dexie
    if (id) {
      await this.dexieService.deleteDetalleRequerimiento(id);
    }
    // 3. Eliminar del array local que alimenta la tabla
    this.detallesActivoFijo.splice(index, 1);
    // 4. Actualizar el array embebido en el requerimiento actual
    (this.requerimiento as any).detalle = [...this.detallesActivoFijo];
    // 5. Actualizar en Dexie el requerimiento con el nuevo detalle embebido
    if (this.requerimiento.id) {
      await (this.dexieService.requerimientos as any).update(
        this.requerimiento.id,
        {
          detalle: this.detallesActivoFijo,
          modificado: 1,
        },
      );
    }
    // 6. Actualizar también en la lista local de requerimientos
    const idx = this.requerimientos.findIndex(
      (r) => r.idrequerimiento === this.requerimiento.idrequerimiento,
    );
    if (idx >= 0) {
      (this.requerimientos[idx] as any).detalle = [...this.detallesActivoFijo];
    }
    // 7. Notificación
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  // Guarda un requerimiento de tipo ACTIVO FIJO en Dexie
  async guardarActivoFijo() {
    if (!this.fundoSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Fundo antes de guardar.',
        'warning',
      );
      return;
    }
    if (!this.glosaActivoFijo) {
      this.alertService.showAlert(
        'Atención',
        'Debes ingresar una glosa antes de guardar.',
        'warning',
      );
      return;
    }
    try {
      this.alertService.mostrarModalCarga();
      const almacenObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenSeleccionado,
      );
      const idAlmacenSync = almacenObj ? almacenObj.idalmacen : '';
      // ================================
      // GENERAR ID ACTIVO FIJO
      // ================================
      const idreq =
        this.usuario.ruc +
        idAlmacenSync +
        this.usuario.documentoidentidad +
        this.utilsService.formatoAnioMesDiaHoraMinSec();
      // ================================
      // ARMAR OBJETO
      // ================================
      const reqAF: RequerimientoActivoFijo = {
        idrequerimiento: idreq,
        fecha: new Date().toISOString(),
        proveedor: this.seleccionaProveedor,
        servicio: this.SeleccionaServicioAF,
        descripcion: this.SeleccionaSubServicioAF,
        almacen: almacenObj?.almacen || '',
        glosa: this.glosaActivoFijo,
        tipo: 'ACTIVOFIJO',
        ruc: this.usuario.ruc,
        estados: 'PENDIENTE',
        prioridad: this.SeleccionaPrioridadACTIVOFIJO ?? '1',
        idfundo: this.fundoSeleccionado,
        idarea: this.areaSeleccionada,
        idclasificacion: this.clasificacionSeleccionado,
        nrodocumento: this.usuario.documentoidentidad,
        idalmacen: idAlmacenSync,
        idalmacendestino: '',
        idproyecto: this.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,
        disabled: false,
        checked: false,
        eliminado: 0,
        detalleActivoFijo: [...this.detallesActivoFijo],
      };
      // ================================
      // GUARDAR EN DEXIE
      // ================================
      const idGuardado =
        await this.dexieService.requerimientosActivoFijo.put(reqAF);
      // ================================
      // GUARDAR EN MEMORIA
      // ================================
      this.requerimientosActivoFijo.push(reqAF);
      this.alertService.cerrarModalCarga();
      this.actualizarContadores();
      this.ordenarRequerimientosActivoFijo();
      this.alertService.showAlert(
        'Éxito',
        `Requerimiento Activo Fijo #${idGuardado} guardado correctamente.`,
        'success',
      );
      // ================================
      // LIMPIAR
      // ================================
      this.detallesActivoFijo = [];
      this.mostrarFormularioActivoFijo = false;
      this.glosa = '';
      this.seleccionaProveedor = '';
      this.SeleccionaServicio = '';
      this.activoFijoEditIndex = -1;
    } catch (e) {
      console.error('Error Guardando Activo Fijo', e);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Hubo un problema al guardar el Requerimiento de Activo Fijo.',
        'error',
      );
    }
  }
  cancelarActivoFijo() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.',
    );
    if (!confirmar) return;
    this.mostrarFormularioActivoFijo = false;
  }

  // Maneja el cambio de clasificación y filtra los campos relacionados
  onClasificacionChange(limpiar = false) {
    if (limpiar) {
      this.configuracion.idturno = '';
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto;
    }
    this.filtrarClasificaciones();
  }

  // Filtra las clasificaciones según el tipo seleccionado
  filtroClasificaciones() {
    this.clasificacionesFiltrados = this.clasificaciones.filter(
      (it) => it.tipoClasificacion === this.configuracion.idclasificacion,
    );
    console.log(this.clasificacionesFiltrados);
  }

  // Maneja el cambio de tipo de requerimiento (COMPRA, CONSUMO, TRANSFERENCIA) y actualiza campos relacionados
  async onTipoChange() {
    // Actualizar la variable local para compatibilidad con el resto del código
    this.TipoSelecionado = this.requerimiento.itemtipo as
      | TipoRequerimiento
      | '';
    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      this.almacenSeleccionado = ''; // limpia almacén normal
      this.clasificacionSeleccionado = 'TRA';
      this.clasificacionesFiltrados = this.clasificaciones.filter(
        (c) => c.id === 'TRA',
      );
      // Limpiar campos específicos de COMPRA/CONSUMO
      this.limpiarCamposCompraConsumo();
    } else if (this.TipoSelecionado === 'CONSUMO') {
      this.almacenOrigen = ''; // limpia origen
      this.almacenDestino = ''; // limpia destino
      this.clasificacionSeleccionado = 'STO';
      this.clasificacionesFiltrados = this.clasificaciones.filter(
        (c) => c.id === 'STO',
      );
      // Limpiar campos específicos de COMPRA (pero mantener proyecto, ceco, labor)
      this.limpiarCamposCompraEspecificos();
      // 🔥 Cargar datos para CONSUMO desde configuración
      await this.cargarDatosParaConsumo();
    } else if (this.TipoSelecionado === 'COMPRA') {
      this.clasificacionSeleccionado = 'CMP';
      this.clasificacionesFiltrados = this.clasificaciones.filter(
        (c) => c.id === 'CMP',
      );
      // Limpiar campos específicos de CONSUMO
      this.limpiarCamposConsumo();
      // 🔥 Forzar recarga de datos para COMPRA
      await this.cargarDatosParaCompra();
      // 🔥 Recargar valores desde configuración si existen
      await this.recargarValoresDesdeConfiguracion();
    }
    // 🔥 Cargar opciones de prioridad dinámicas según tipo de requerimiento
    if (this.TipoSelecionado) {
      this.opcionesPrioridadITEM =
        this.prioridadService.obtenerOpcionesPrioridad(
          this.TipoSelecionado as 'COMPRA' | 'CONSUMO' | 'TRANSFERENCIA',
        );
      // Resetear prioridad seleccionada al cambiar tipo
      this.SeleccionaPrioridadITEM = '';
    }
  }

  // Recarga los valores de CECO, PROYECTO y LABOR desde la configuración cuando cambia el tipo
  async recargarValoresDesdeConfiguracion() {
    try {
      // Primero asegurarse que los datos maestros estén cargados
      if (!this.cecos || this.cecos.length === 0) {
        await this.ListarCecos();
      }
      if (!this.labores || this.labores.length === 0) {
        await this.ListarLabores();
      }
      if (!this.proyectos || this.proyectos.length === 0) {
        await this.ListarProyectos();
      }
      const config = await this.dexieService.obtenerPrimeraConfiguracion();
      if (config && this.TipoSelecionado === 'COMPRA') {
        // Recargar CECO si existe en configuración
        if (config.idceco) {
          this.cecoSeleccionado = (await this.dexieService.getCecoById(
            config.idceco,
          )) as Ceco | null;
          console.log('🔄 CECO recargado desde config:', this.cecoSeleccionado);
          console.log('📊 Lista de CECOS disponibles:', this.cecos.length);
        }
        // Recargar LABOR si existe en configuración
        if (config.idlabor) {
          this.laborSeleccionado = (await this.dexieService.getLaborById(
            config.idlabor,
          )) as Labor | null;
          console.log(
            '🔄 LABOR recargado desde config:',
            this.laborSeleccionado,
          );
          console.log('📊 Lista de LABORES disponibles:', this.labores.length);
        }
        // Recargar PROYECTO si existe en configuración
        if (config.idproyecto) {
          this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(
            config.idproyecto,
          )) as Proyecto | null;
          console.log(
            '🔄 PROYECTO recargado desde config:',
            this.proyectoSeleccionado,
          );
          console.log(
            '📊 Lista de PROYECTOS disponibles:',
            this.proyectos.length,
          );
        }
      }
    } catch (error) {
      console.error('❌ Error al recargar valores desde configuración:', error);
    }
  }

  // Limpia campos específicos de COMPRA manteniendo proyecto, ceco, labor para CONSUMO
  limpiarCamposCompraEspecificos() {
    // No limpiar proyecto, ceco, labor ya que se usan en CONSUMO
    // Solo limpiar si NO estamos cambiando a CONSUMO
    if (this.TipoSelecionado !== 'CONSUMO') {
      this.proyectoSeleccionado = null;
      this.cecoSeleccionado = null;
      this.laborSeleccionado = null;
      // Limpiar también en las líneas temporales si hay modal abierto
      if (this.modalAbierto && this.lineaTemp) {
        this.lineaTemp.proyecto = '';
        this.lineaTemp.ceco = '';
        this.lineaTemp.labor = '';
      }
      // Limpiar detalles existentes
      this.detalles.forEach((detalle) => {
        detalle.proyecto = '';
        detalle.ceco = '';
        detalle.labor = '';
      });
    }
  }

  // Limpia todos los campos específicos de COMPRA
  limpiarCamposCompra() {
    // Solo limpiar si NO estamos cambiando a COMPRA
    if (this.TipoSelecionado !== 'COMPRA') {
      this.proyectoSeleccionado = null;
      this.cecoSeleccionado = null;
      this.laborSeleccionado = null;
      // Limpiar también en las líneas temporales si hay modal abierto
      if (this.modalAbierto && this.lineaTemp) {
        this.lineaTemp.proyecto = '';
        this.lineaTemp.ceco = '';
        this.lineaTemp.labor = '';
      }
      // Limpiar detalles existentes
      this.detalles.forEach((detalle) => {
        detalle.proyecto = '';
        detalle.ceco = '';
        detalle.labor = '';
      });
    }
  }

  // Limpia campos específicos de CONSUMO (turno)
  limpiarCamposConsumo() {
    // Solo limpiar si NO estamos cambiando a CONSUMO
    if (this.TipoSelecionado !== 'CONSUMO') {
      this.turnoSeleccionado = '';
      // Limpiar también en las líneas temporales si hay modal abierto
      if (this.modalAbierto && this.lineaTemp) {
        this.lineaTemp.turno = '';
      }
      // Limpiar detalles existentes
      this.detalles.forEach((detalle) => {
        detalle.turno = '';
      });
    }
  }

  // Limpia todos los campos de COMPRA y CONSUMO para TRANSFERENCIA
  limpiarCamposCompraConsumo() {
    // Limpiar todos los campos para TRANSFERENCIA
    this.proyectoSeleccionado = null;
    this.cecoSeleccionado = null;
    this.laborSeleccionado = null;
    this.turnoSeleccionado = '';
    // Limpiar también en las líneas temporales si hay modal abierto
    if (this.modalAbierto && this.lineaTemp) {
      this.lineaTemp.proyecto = '';
      this.lineaTemp.ceco = '';
      this.lineaTemp.labor = '';
      this.lineaTemp.turno = '';
    }
    // Limpiar detalles existentes
    this.detalles.forEach((detalle) => {
      detalle.proyecto = '';
      detalle.ceco = '';
      detalle.labor = '';
      detalle.turno = '';
    });
  }
  /**
   * Carga los datos necesarios para el flujo de CONSUMO
   */
  async cargarDatosParaConsumo() {
    try {
      // Cargar valores desde configuración si existen
      const config = await this.dexieService.obtenerPrimeraConfiguracion();
      if (config) {
        // Cargar turno
        if (config.idturno) {
          this.turnoSeleccionado = config.idturno;
          console.log('🔄 TURNO cargado desde config:', this.turnoSeleccionado);
        }
        // Cargar CECO
        if (config.idceco) {
          this.cecoSeleccionado = (await this.dexieService.getCecoById(
            config.idceco,
          )) as Ceco | null;
          console.log('🔄 CECO cargado desde config:', this.cecoSeleccionado);
        }
        // Cargar labor
        if (config.idlabor) {
          this.laborSeleccionado = (await this.dexieService.getLaborById(
            config.idlabor,
          )) as Labor | null;
          console.log('🔄 LABOR cargada desde config:', this.laborSeleccionado);
        }
        // Cargar proyecto
        if (config.idproyecto) {
          this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(
            config.idproyecto,
          )) as Proyecto | null;
          console.log(
            '🔄 PROYECTO cargado desde config:',
            this.proyectoSeleccionado,
          );
        }
      }
      // Asegurarse que los datos estén cargados
      if (!this.cecos || this.cecos.length === 0) {
        await this.ListarCecos();
      }
      if (!this.labores || this.labores.length === 0) {
        await this.ListarLabores();
      }
      if (!this.proyectos || this.proyectos.length === 0) {
        await this.ListarProyectos();
      }
      console.log('📊 Datos para CONSUMO cargados:', {
        cecos: this.cecos.length,
        labores: this.labores.length,
        proyectos: this.proyectos.length,
        turno: this.turnoSeleccionado,
      });
    } catch (error) {
      console.error('❌ Error al cargar datos para CONSUMO:', error);
    }
  }
  /**
   * Carga los datos necesarios para el flujo de COMPRA
   */
  async cargarDatosParaCompra() {
    try {
      // Asegurarse que los datos estén cargados
      if (!this.cecos || this.cecos.length === 0) {
        await this.ListarCecos();
      }
      if (!this.labores || this.labores.length === 0) {
        await this.ListarLabores();
      }
      if (!this.proyectos || this.proyectos.length === 0) {
        await this.ListarProyectos();
      }
      console.log('📊 Datos para COMPRA cargados:', {
        cecos: this.cecos.length,
        labores: this.labores.length,
        proyectos: this.proyectos.length,
      });
    } catch (error) {
      console.error('❌ Error al cargar datos para COMPRA:', error);
    }
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
   * Retorna false para que siempre estén bloqueados y no se puedan editar
   */
  camposParametrosEditables(): boolean {
    return false; // Siempre bloqueados para que no se puedan editar
  }

  // Filtra las clasificaciones según el tipo de requerimiento seleccionado
  filtrarClasificaciones() {
    this.clasificacionesFiltrados = this.clasificaciones.filter(
      (it) => it.tipoClasificacion === this.RequerimientoSelecionado,
    );
    console.log(this.clasificacionesFiltrados);
  }

  // Obtiene la descripción de un servicio COMMODITY por su código
  obtenerDescripcionServicio(codigo: string): string {
    const serv = this.commodityFiltrados.find((s) => s.commodity01 === codigo);
    return serv ? serv.descripcionLocal : codigo;
  }

  // Obtiene la descripción de un servicio ACTIVO FIJO por su código
  obtenerDescripcionServicioAF(codigo: string): string {
    const serv = this.commodityFiltradosAF.find(
      (s) => s.commodity01 === codigo,
    );
    return serv ? serv.descripcionLocal : codigo;
  }

  // Obtiene la descripción de un servicio ACTIVO FIJO MENOR por su código
  obtenerDescripcionServicioAFM(codigo: string): string {
    const serv = this.commodityFiltradosAFMenor.find(
      (s) => s.commodity01 === codigo,
    );
    return serv ? serv.descripcionLocal : codigo;
  }

  // Obtiene la unidad de medida de un producto
  obtenerUnidadMedidaProducto(producto: any): string {
    if (typeof producto === 'string') {
      const item = this.items?.find((i: any) => i.codigo === producto);
      return item?.um || item?.unidadMedida || 'UN';
    }
    return producto?.um || producto?.unidadMedida || 'UN';
  }

  // Actualiza la unidad de medida en la línea temporal basándose en el producto seleccionado
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

  // Obtiene la descripción de un subservicio COMMODITY por su código
  obtenerDescripcionSubservicio(codigo: string): string {
    const sub = this.subservicioFiltrados.find((x) => x.commodity === codigo);
    return sub ? sub.descripcionLocal : codigo;
  }

  // Obtiene la descripción de un subservicio ACTIVO FIJO por su código
  obtenerDescripcionSubservicioAF(codigo: string): string {
    const sub = this.subservicioFiltradosAF.find((x) => x.commodity === codigo);
    return sub ? sub.descripcionLocal : codigo;
  }

  // Obtiene la descripción de un subservicio ACTIVO FIJO MENOR por su código
  obtenerDescripcionSubservicioAFM(codigo: string): string {
    const sub = this.subservicioFiltradosAFMenor.find(
      (x) => x.commodity === codigo,
    );
    return sub ? sub.descripcionLocal : codigo;
  }

  // Obtiene la descripción de un activo fijo por su código
  obtenerDescripcionActivoFijo(codigo: string): string {
    const af = this.activosFijosFiltrados.find(
      (a) => a.activoFijo01 === codigo,
    );
    return af ? af.descripcionLocal : codigo;
  }

  // Inicializa un nuevo requerimiento de tipo ITEM con valores por defecto
  async nuevoRequerimiento(): Promise<void> {
    console.log('🆕 Creando nuevo requerimiento...');
    // Limpiar variables
    this.detalles = [];
    this.glosa = await this.generarGlosaAutomatica(); // 🔥 Generar glosa automática
    this.modalAbierto = false;
    this.modoEdicion = false; // 🔹 Desactivamos modo edición
    // 🔹 Inicializar tipo desde configuración y establecer clasificación automáticamente
    if (this.configuracion?.idTipoItem) {
      this.TipoSelecionado = this.configuracion.idTipoItem as
        | TipoRequerimiento
        | '';
      this.requerimiento.itemtipo = this.configuracion.idTipoItem;
      console.log(
        '🎯 Tipo asignado desde configuración:',
        this.TipoSelecionado,
      );
      await this.onTipoChange();
    } else {
      console.log(
        '⚠️ No hay configuración de tipo, usando CONSUMO por defecto',
      );
      this.TipoSelecionado = 'CONSUMO';
      this.requerimiento.itemtipo = 'CONSUMO';
      await this.onTipoChange();
    }
    // 🔹 Asignar almacén desde configuración si existe
    if (this.configuracion?.idalmacen) {
      this.almacenSeleccionado = this.configuracion.idalmacen;
      this.requerimiento.idalmacen = this.configuracion.idalmacen;
      console.log(
        '🏪 Almacén asignado desde configuración:',
        this.almacenSeleccionado,
      );
    }
    // 🔹 Asignar área desde el usuario o configuración
    this.areaSeleccionada =
      this.usuario.idarea || this.configuracion?.idarea || '';
    this.requerimiento.idarea = this.areaSeleccionada;
    console.log(
      '📍 Área asignada en nuevoRequerimiento:',
      this.areaSeleccionada,
    );
    console.log('📍 Usuario.idarea:', this.usuario.idarea);
    console.log('📍 Configuracion.idarea:', this.configuracion?.idarea);
    // 🔹 Prioridad por defecto: Normal (1)
    this.SeleccionaPrioridadITEM = '1';
    this.filtroClasificaciones();
  }

  // Inicializa un nuevo requerimiento de tipo COMMODITY
  nuevoRequerimientoCommodity(): void {
    // 🔹 Asignar almacén desde configuración si existe
    if (this.configuracion?.idalmacen) {
      this.almacenSeleccionado = this.configuracion.idalmacen;
      console.log(
        '🏪 Almacén asignado desde configuración (Commodity):',
        this.almacenSeleccionado,
      );
    }
    // 🔥 Cargar opciones de prioridad para COMMODITY (usa las mismas que COMPRA)
    this.opcionesPrioridadCOMMODITY =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.requerimientoCommodity = {
      idrequerimiento: '',
      fecha: new Date().toISOString(),
      almacen: this.almacenSeleccionado || '',
      proveedor: '',
      servicio: '',
      descripcion: '',
      glosa: '',
      tipo: '',
      ruc: this.usuario.ruc,
      idfundo: '',
      idarea: '',
      idclasificacion: '',
      prioridad: '',
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: '',
      idalmacendestino: '',
      idproyecto: '',
      estado: 0,
      disabled: false,
      checked: false,
      eliminado: 0,
      estados: 'PENDIENTE',
      detalleCommodity: [],
    };
    this.detalles = [];
    this.glosa = '';
    this.modalAbierto = false;
    this.modoEdicion = false; // 🔹 Desactivamos modo edición
    this.filtroClasificaciones();
  }

  // Inicializa un nuevo requerimiento de tipo ACTIVO FIJO
  nuevoRequerimientoActivoFijo(): void {
    // 🔹 Asignar almacén desde configuración si existe
    if (this.configuracion?.idalmacen) {
      this.almacenSeleccionado = this.configuracion.idalmacen;
      console.log(
        '🏪 Almacén asignado desde configuración (Activo Fijo):',
        this.almacenSeleccionado,
      );
    }
    this.requerimientoActivoFijo = {
      idrequerimiento: '',
      fecha: new Date().toISOString(),
      almacen: this.almacenSeleccionado || '',
      proveedor: '',
      servicio: '',
      descripcion: '',
      glosa: '',
      tipo: '',
      ruc: this.usuario.ruc,
      idfundo: '',
      idarea: '',
      idclasificacion: '',
      prioridad: '',
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: '',
      idalmacendestino: '',
      idproyecto: '',
      estado: 0,
      disabled: false,
      checked: false,
      eliminado: 0,
      estados: 'PENDIENTE',
      detalleActivoFijo: [],
    };
    this.detalles = [];
    this.glosa = '';
    this.modalAbierto = false;
    this.modoEdicion = false; // 🔹 Desactivamos modo edición
    this.filtroClasificaciones();
  }

  // Inicializa un nuevo requerimiento de tipo ACTIVO FIJO MENOR
  nuevoRequerimientoActivoFijoMenor(): void {
    // 🔹 Asignar almacén desde configuración si existe
    if (this.configuracion?.idalmacen) {
      this.almacenSeleccionado = this.configuracion.idalmacen;
      console.log(
        '🏪 Almacén asignado desde configuración (Activo Fijo Menor):',
        this.almacenSeleccionado,
      );
    }
    this.requerimientoActivoFijoMenor = {
      idrequerimiento: '',
      fecha: new Date().toISOString(),
      almacen: this.almacenSeleccionado || '',
      servicio: '',
      descripcion: '',
      glosa: '',
      tipo: '',
      ruc: this.usuario.ruc,
      idfundo: '',
      idarea: '',
      idclasificacion: '',
      prioridad: '',
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: '',
      idalmacendestino: '',
      idproyecto: '',
      estado: 0,
      disabled: false,
      checked: false,
      eliminado: 0,
      estados: 'PENDIENTE',
      detalleActivoFijoMenor: [],
    };
    this.detalles = [];
    this.glosa = '';
    this.modalAbierto = false;
    this.modoEdicion = false; // 🔹 Desactivamos modo edición
    this.filtroClasificaciones();
  }

  // Sincroniza un requerimiento individual con el backend
  async sincronizarRequerimiento() {
    console.log('🔄 Sincronizando requerimiento...');
    console.log('Área seleccionada:', this.areaSeleccionada);
    console.log('Área del usuario:', this.usuario.idarea);
    console.log('Área del requerimiento:', this.requerimiento.idarea);
    // 1️⃣ Validación de detalles
    if (this.requerimiento.detalle.length === 0) {
      this.alertService.showAlert(
        'Alerta',
        'Debe ingresar al menos un requerimiento',
        'warning',
      );
      return;
    }
    // ===============================
    // 2️⃣ VALIDAR DUPLICADOS (codigo + turno) EN FRONT
    // ===============================
    const claves = new Set<string>();
    const existeDuplicado = this.requerimiento.detalle.some((d: any) => {
      const key = `${d.codigo}-${d.turno || ''}`;
      if (claves.has(key)) return true;
      claves.add(key);
      return false;
    });
    if (existeDuplicado) {
      this.alertService.showAlert(
        'Validación',
        'Existen líneas duplicadas con el mismo código y turno',
        'warning',
      );
      return;
    }
    // 3️⃣ Confirmación
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar los datos?',
      'warning',
    );
    if (!confirmacion) return;
    console.log(this.requerimiento);
    console.log(this.requerimiento.idalmacen);
    // 3️⃣ Inicializar progreso
    this.sincronizando = true;
    this.progreso = 0;
    const prioridadFinal: PrioridadSpring = (this.SeleccionaPrioridadITEM ||
      this.requerimiento.prioridad ||
      '1') as PrioridadSpring;
    const idReq =
      this.usuario.sociedad +
      this.usuario.documentoidentidad +
      this.utilsService.formatoAnioMesDiaHoraMinSec();
    // 👇 Aquí formamos el objeto según el SP
    const requerimiento = {
      // idrequerimiento: `${this.usuario.ruc}${this.requerimiento.idalmacen}${this.usuario.documentoidentidad
      //   }${new Date().toISOString().replace(/[-:TZ.]/g, '')}`,
      idrequerimiento: idReq,
      ruc: this.usuario.ruc,
      idfundo: this.requerimiento.idfundo,
      idarea: this.areaSeleccionada, // ✅ Usar areaSeleccionada en lugar de requerimiento.idarea
      idclasificacion: this.requerimiento.idclasificacion,
      prioridad: prioridadFinal,
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: this.requerimiento.idalmacen,
      idalmacendestino:
        this.TipoSelecionado === 'TRANSFERENCIA' ? this.almacenDestino : '',
      glosa: this.requerimiento.glosa || '',
      referenciaGasto: this.SeleccionaTipoGasto || '',
      eliminado: 0,
      tipo: this.requerimiento.tipo,
      itemtipo: this.requerimiento.itemtipo,
      estados: 'PENDIENTE',
      detalle: this.requerimiento.detalle.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: 'I',
        cantidad: d.cantidad,
        idproducto: d.producto || '',
        iddescripcion: d.descripcion || '',
        idproyecto: d.proyecto || '',
        idcentrocosto: d.ceco || '',
        idturno: d.turno || '',
        idlabor: d.labor || '',
        eliminado: 0,
      })),
    };
    // 👇 Mandamos directamente el array (NO dentro de { json: ... })
    const payload = [requerimiento];
    console.log('📤 Enviando al backend:', payload);
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: async (resp) => {
        console.log('✅ Respuesta del backend:', resp);
        // Manejo del resultado del SP
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          const req = idReq.slice(-12);
          this.alertService.showAlert(
            'Éxito',
            'Requerimiento sincronizado correctamente' + req,
            'success',
          );
          // ---- 5️⃣ GUARDO EN DEXIE ----
          this.dexieService.requerimientos
            .update(this.requerimiento.id!, { estado: 1 })
            .then(() => {
              this.cargarRequerimientos();
            });
          this.actualizarContadores();
        } else {
          this.alertService.showAlertError(
            'Error',
            'Hubo un problema al sincronizar el requerimiento',
          );
          console.error('Detalles del error:', resp);
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP:', err);
        this.alertService.showAlertError(
          'Error',
          'No se pudo conectar con el servidor',
        );
      },
    });
  }

  // Cuenta los requerimientos pendientes de sincronización
  async cargarPendientes() {
    // Usar el mismo filtro que sincronizarPendientes: (estado === 0 OR modificado === 1) AND estado !== 1
    const pendientesArray = await this.dexieService.requerimientos
      .filter((r) => (r.estado === 0 || r.modificado === 1) && r.estado !== 1)
      .toArray();
    this.pendientes = pendientesArray.length;
  }

  // Sincroniza todos los requerimientos pendientes de tipo ITEM con el backend
  async sincronizarPendientes() {
    // 1️⃣ Obtener pendientes reales desde Dexie
    const pendientes = await this.dexieService.requerimientos
      .filter((r) => (r.estado === 0 || r.modificado === 1) && r.estado !== 1)
      .toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert(
        'Información',
        'No hay requerimientos pendientes por sincronizar',
        'info',
      );
      return;
    }
    // 2️⃣ Confirmación
    const confirmar = await this.alertService.showConfirm(
      'Confirmación',
      `Se sincronizarán ${pendientes.length} requerimientos ¿Desea continuar?`,
      'warning',
    );
    if (!confirmar) return;
    // 2.5️⃣ Validar stock para requerimientos tipo CONSUMO
    const pendientesConsumo = pendientes.filter(
      (r) => r.itemtipo === 'CONSUMO',
    );
    for (const req of pendientesConsumo) {
      const stockOk = await this.validarStockRequerimiento(req);
      if (!stockOk) {
        // Modal de stock se mostró, el usuario debe confirmar ajustes
        // La sincronización continuará después de confirmar en el modal
        return;
      }
    }
    // 3️⃣ Inicializar progreso
    this.sincronizando = true;
    this.progreso = 0;
    // const idReq =
    //   this.usuario.sociedad +
    //   this.usuario.documentoidentidad +
    //   this.utilsService.formatoAnioMesDiaHoraMinSec();
    // 4️⃣ Construir payload completo
    const payload = pendientes.map((req: any) => ({
      idrequerimiento: req.idrequerimiento,
      ruc: this.usuario.ruc,
      idfundo: req.idfundo,
      idarea: req.idarea,
      idclasificacion: req.idclasificacion,
      prioridad: req.prioridad || '1',
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: req.idalmacen,
      idalmacendestino:
        req.tipo === 'TRANSFERENCIA' ? req.idalmacendestino : '',
      glosa: req.glosa || '',
      referenciaGasto: req.referenciaGasto || '',
      eliminado: 0,
      tipo: req.tipo,
      itemtipo: req.itemtipo,
      estados: 'PENDIENTE',
      detalle: req.detalle.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: 'I',
        cantidad: d.cantidad,
        idproducto: d.producto || '',
        iddescripcion: d.descripcion || '',
        idproyecto: d.proyecto || '',
        idcentrocosto: d.ceco || '',
        idturno: d.turno || '',
        idlabor: d.labor || '',
        eliminado: 0,
      })),
    }));
    // 5️⃣ Enviar al backend
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: async (resp) => {
        const resultado = resp?.[0];
        // 🛑 1. Error general del SP
        if (resultado?.errorgeneral === 1) {
          this.alertService.showAlert('Error', resultado.mensaje, 'error');
          this.sincronizando = false;
          return;
        }
        // 6️⃣ IDs con error (idrequerimiento)
        const idsConError: string[] = (resultado?.detalle || []).map(
          (d: any) => d.id.split('-')[0],
        );
        // 7️⃣ IDs enviados
        const idsEnviados: string[] = pendientes.map((r) => r.idrequerimiento);
        // 8️⃣ IDs sincronizados correctamente
        const idsOk: string[] = idsEnviados.filter(
          (idreq) => !idsConError.includes(idreq),
        );
        // 6️⃣ ACTUALIZAR DEXIE (TU LÍNEA CORREGIDA)
        if (idsOk.length) {
          await this.dexieService.requerimientos
            .where('idrequerimiento')
            .anyOf(idsOk)
            .modify({
              estado: 1,
            });
        }
        // 7️⃣ Mensajes al usuario
        if (idsConError.length) {
          this.alertService.showAlert(
            'Sincronización parcial',
            `Se sincronizaron ${idsOk.length} requerimientos.\n${idsConError.length} con error.`,
            'warning',
          );
        } else {
          this.alertService.showAlert(
            'Éxito',
            'Todos los requerimientos se sincronizaron correctamente',
            'success',
          );
        }
        // 🔟 Actualizar progreso
        this.progreso = 100;
        // 1️⃣ Recargar DESDE DEXIE
        await this.cargarRequerimientos();
        // 2️⃣ Recalcular contadores
        this.actualizarContadores();
        // 3️⃣ Opcional: refrescar pendientes
        await this.cargarPendientes();
        // 4️⃣ Limpiar set de requerimientos que omitieron validación
        this.requerimientosOmitirValidacion.clear();
        this.sincronizando = false;
      },
      error: (err) => {
        console.error(err);
        this.sincronizando = false;
        this.alertService.showAlertError(
          'Error',
          'No se pudo conectar con el servidor',
        );
      },
    });
  }

  // Sincroniza todos los requerimientos pendientes de tipo COMMODITY con el backend
  async sincronizarPendientesCommodity() {
    // 1️⃣ Obtener pendientes reales desde Dexie
    const pendientes = await this.dexieService.requerimientosCommodity
      .filter((r) => r.estado === 0 || r.modificado === 1)
      .toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert(
        'Información',
        'No hay requerimientos pendientes por sincronizar',
        'info',
      );
      return;
    }
    // 2️⃣ Confirmación
    const confirmar = await this.alertService.showConfirm(
      'Confirmación',
      `Se sincronizarán ${pendientes.length} requerimientos ¿Desea continuar?`,
      'warning',
    );
    if (!confirmar) return;
    // 3️⃣ Inicializar progreso
    this.sincronizando = true;
    this.progreso = 0;
    // const idReq =
    //   this.usuario.sociedad +
    //   this.usuario.documentoidentidad +
    //   this.utilsService.formatoAnioMesDiaHoraMinSec();
    // 4️⃣ Construir payload completo
    const payload = pendientes.map((req: any) => ({
      idrequerimiento: req.idrequerimiento,
      ruc: this.usuario.ruc,
      idfundo: req.idfundo,
      idarea: req.idarea,
      idclasificacion: req.idclasificacion,
      prioridad: req.prioridad || '1',
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: req.idalmacen,
      idalmacendestino:
        req.tipo === 'TRANSFERENCIA' ? req.idalmacendestino : '',
      glosa: req.glosa || '',
      referenciaGasto: req.referenciaGasto || '',
      eliminado: 0,
      tipo: req.tipo,
      itemtipo: req.itemtipo,
      estados: 'PENDIENTE',
      detalle: req.detalle.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: 'I',
        cantidad: d.cantidad,
        idproducto: d.producto || '',
        iddescripcion: d.descripcion || '',
        idproyecto: d.proyecto || '',
        idcentrocosto: d.ceco || '',
        idturno: d.turno || '',
        idlabor: d.labor || '',
        eliminado: 0,
      })),
    }));
    // 5️⃣ Enviar al backend
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: async (resp) => {
        const resultado = resp?.[0];
        // 🛑 1. Error general del SP
        if (resultado?.errorgeneral === 1) {
          this.alertService.showAlert('Error', resultado.mensaje, 'error');
          this.sincronizando = false;
          return;
        }
        // 6️⃣ IDs con error (idrequerimiento)
        const idsConError: string[] = (resultado?.detalle || []).map(
          (d: any) => d.id.split('-')[0],
        );
        // 7️⃣ IDs enviados
        const idsEnviados: string[] = pendientes.map((r) => r.idrequerimiento);
        // 8️⃣ IDs sincronizados correctamente
        const idsOk: string[] = idsEnviados.filter(
          (idreq) => !idsConError.includes(idreq),
        );
        // 6️⃣ ACTUALIZAR DEXIE (TU LÍNEA CORREGIDA)
        if (idsOk.length) {
          await this.dexieService.requerimientos
            .where('idrequerimiento')
            .anyOf(idsOk)
            .modify({
              estado: 1,
            });
        }
        // 7️⃣ Mensajes al usuario
        if (idsConError.length) {
          this.alertService.showAlert(
            'Sincronización parcial',
            `Se sincronizaron ${idsOk.length} requerimientos.\n${idsConError.length} con error.`,
            'warning',
          );
        } else {
          this.alertService.showAlert(
            'Éxito',
            'Todos los requerimientos se sincronizaron correctamente',
            'success',
          );
        }
        // 🔟 Actualizar progreso
        this.progreso = 100;
        // 1️⃣ Recargar DESDE DEXIE
        await this.cargarRequerimientos();
        // 2️⃣ Recalcular contadores
        this.actualizarContadores();
        // 3️⃣ Opcional: refrescar pendientes
        await this.cargarPendientes();
        this.sincronizando = false;
      },
      error: (err) => {
        console.error(err);
        this.sincronizando = false;
        this.alertService.showAlertError(
          'Error',
          'No se pudo conectar con el servidor',
        );
      },
    });
  }

  // Sincroniza todos los requerimientos pendientes de tipo ACTIVO FIJO con el backend
  async sincronizarPendientesActivoFijo() {
    // 1️⃣ Obtener pendientes reales desde Dexie
    // const pendientes = await this.dexieService.requerimientos
    //   .where('estado')
    //   .equals(0)
    //   .toArray();
    // const pendientes = await this.dexieService.requerimientos.toArray();
    const pendientes = await this.dexieService.requerimientosActivoFijo
      .filter((r) => r.estado === 0 || r.modificado === 1)
      .toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert(
        'Información',
        'No hay requerimientos pendientes por sincronizar',
        'info',
      );
      return;
    }
    // 2️⃣ Confirmación
    const confirmar = await this.alertService.showConfirm(
      'Confirmación',
      `Se sincronizarán ${pendientes.length} requerimientos ¿Desea continuar?`,
      'warning',
    );
    if (!confirmar) return;
    // 3️⃣ Inicializar progreso
    this.sincronizando = true;
    this.progreso = 0;
    // const idReq =
    //   this.usuario.sociedad +
    //   this.usuario.documentoidentidad +
    //   this.utilsService.formatoAnioMesDiaHoraMinSec();
    // 4️⃣ Construir payload completo
    const payload = pendientes.map((req: any) => ({
      idrequerimiento: req.idrequerimiento,
      ruc: this.usuario.ruc,
      idfundo: req.idfundo,
      idarea: req.idarea,
      idclasificacion: req.idclasificacion,
      prioridad: req.prioridad || '1',
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: req.idalmacen,
      idalmacendestino:
        req.tipo === 'TRANSFERENCIA' ? req.idalmacendestino : '',
      glosa: req.glosa || '',
      referenciaGasto: req.referenciaGasto || '',
      eliminado: 0,
      tipo: req.tipo,
      itemtipo: req.itemtipo,
      estados: 'PENDIENTE',
      detalle: req.detalle.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: 'I',
        cantidad: d.cantidad,
        idproducto: d.producto || '',
        iddescripcion: d.descripcion || '',
        idproyecto: d.proyecto || '',
        idcentrocosto: d.ceco || '',
        idturno: d.turno || '',
        idlabor: d.labor || '',
        eliminado: 0,
      })),
    }));
    // 5️⃣ Enviar al backend
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: async (resp) => {
        const resultado = resp?.[0];
        // 🛑 1. Error general del SP
        if (resultado?.errorgeneral === 1) {
          this.alertService.showAlert('Error', resultado.mensaje, 'error');
          this.sincronizando = false;
          return;
        }
        // 6️⃣ IDs con error (idrequerimiento)
        const idsConError: string[] = (resultado?.detalle || []).map(
          (d: any) => d.id.split('-')[0],
        );
        // 7️⃣ IDs enviados
        const idsEnviados: string[] = pendientes.map((r) => r.idrequerimiento);
        // 8️⃣ IDs sincronizados correctamente
        const idsOk: string[] = idsEnviados.filter(
          (idreq) => !idsConError.includes(idreq),
        );
        // 6️⃣ ACTUALIZAR DEXIE (TU LÍNEA CORREGIDA)
        if (idsOk.length) {
          await this.dexieService.requerimientos
            .where('idrequerimiento')
            .anyOf(idsOk)
            .modify({
              estado: 1,
            });
        }
        // 7️⃣ Mensajes al usuario
        if (idsConError.length) {
          this.alertService.showAlert(
            'Sincronización parcial',
            `Se sincronizaron ${idsOk.length} requerimientos.\n${idsConError.length} con error.`,
            'warning',
          );
        } else {
          this.alertService.showAlert(
            'Éxito',
            'Todos los requerimientos se sincronizaron correctamente',
            'success',
          );
        }
        // 🔟 Actualizar progreso
        this.progreso = 100;
        // 1️⃣ Recargar DESDE DEXIE
        await this.cargarRequerimientos();
        // 2️⃣ Recalcular contadores
        this.actualizarContadores();
        // 3️⃣ Opcional: refrescar pendientes
        await this.cargarPendientes();
        this.sincronizando = false;
      },
      error: (err) => {
        console.error(err);
        this.sincronizando = false;
        this.alertService.showAlertError(
          'Error',
          'No se pudo conectar con el servidor',
        );
      },
    });
  }

  // Sincroniza todos los requerimientos pendientes de tipo ACTIVO FIJO MENOR con el backend
  async sincronizarPendientesActivoFijoMenor() {
    // 1️⃣ Obtener pendientes reales desde Dexie
    // const pendientes = await this.dexieService.requerimientos
    //   .where('estado')
    //   .equals(0)
    //   .toArray();
    // const pendientes = await this.dexieService.requerimientos.toArray();
    const pendientes = await this.dexieService.requerimientosActivoFijoMenor
      .filter((r) => r.estado === 0 || r.modificado === 1)
      .toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert(
        'Información',
        'No hay requerimientos pendientes por sincronizar',
        'info',
      );
      return;
    }
    // 2️⃣ Confirmación
    const confirmar = await this.alertService.showConfirm(
      'Confirmación',
      `Se sincronizarán ${pendientes.length} requerimientos ¿Desea continuar?`,
      'warning',
    );
    if (!confirmar) return;
    // 3️⃣ Inicializar progreso
    this.sincronizando = true;
    this.progreso = 0;
    // const idReq =
    //   this.usuario.sociedad +
    //   this.usuario.documentoidentidad +
    //   this.utilsService.formatoAnioMesDiaHoraMinSec();
    // 4️⃣ Construir payload completo
    const payload = pendientes.map((req: any) => ({
      idrequerimiento: req.idrequerimiento,
      ruc: this.usuario.ruc,
      idfundo: req.idfundo,
      idarea: req.idarea,
      idclasificacion: req.idclasificacion,
      prioridad: req.prioridad || '1',
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: req.idalmacen,
      idalmacendestino:
        req.tipo === 'TRANSFERENCIA' ? req.idalmacendestino : '',
      glosa: req.glosa || '',
      referenciaGasto: req.referenciaGasto || '',
      eliminado: 0,
      tipo: req.tipo,
      itemtipo: req.itemtipo,
      estados: 'PENDIENTE',
      detalle: req.detalle.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: 'I',
        cantidad: d.cantidad,
        idproducto: d.producto || '',
        iddescripcion: d.descripcion || '',
        idproyecto: d.proyecto || '',
        idcentrocosto: d.ceco || '',
        idturno: d.turno || '',
        idlabor: d.labor || '',
        eliminado: 0,
      })),
    }));
    // 5️⃣ Enviar al backend
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: async (resp) => {
        const resultado = resp?.[0];
        // 🛑 1. Error general del SP
        if (resultado?.errorgeneral === 1) {
          this.alertService.showAlert('Error', resultado.mensaje, 'error');
          this.sincronizando = false;
          return;
        }
        // 6️⃣ IDs con error (idrequerimiento)
        const idsConError: string[] = (resultado?.detalle || []).map(
          (d: any) => d.id.split('-')[0],
        );
        // 7️⃣ IDs enviados
        const idsEnviados: string[] = pendientes.map((r) => r.idrequerimiento);
        // 8️⃣ IDs sincronizados correctamente
        const idsOk: string[] = idsEnviados.filter(
          (idreq) => !idsConError.includes(idreq),
        );
        // 6️⃣ ACTUALIZAR DEXIE (TU LÍNEA CORREGIDA)
        if (idsOk.length) {
          await this.dexieService.requerimientos
            .where('idrequerimiento')
            .anyOf(idsOk)
            .modify({
              estado: 1,
            });
        }
        // 7️⃣ Mensajes al usuario
        if (idsConError.length) {
          this.alertService.showAlert(
            'Sincronización parcial',
            `Se sincronizaron ${idsOk.length} requerimientos.\n${idsConError.length} con error.`,
            'warning',
          );
        } else {
          this.alertService.showAlert(
            'Éxito',
            'Todos los requerimientos se sincronizaron correctamente',
            'success',
          );
        }
        // 🔟 Actualizar progreso
        this.progreso = 100;
        // 1️⃣ Recargar DESDE DEXIE
        await this.cargarRequerimientos();
        // 2️⃣ Recalcular contadores
        this.actualizarContadores();
        // 3️⃣ Opcional: refrescar pendientes
        await this.cargarPendientes();
        this.sincronizando = false;
      },
      error: (err) => {
        console.error(err);
        this.sincronizando = false;
        this.alertService.showAlertError(
          'Error',
          'No se pudo conectar con el servidor',
        );
      },
    });
  }

  // Sincroniza un requerimiento individual de tipo COMMODITY con el backend
  async sincronizarRequerimientoCommodity() {
    // if (this.requerimientoCommodity.detalleCommodity.length === 0) {
    //   this.alertService.showAlert(
    //     'Alerta',
    //     'Debe ingresar al menos un requerimiento de commodity',
    //     'warning',
    //   );
    //   return;
    // }
    // 1️⃣ Obtener pendientes reales desde Dexie
    const pendientes = await this.dexieService.requerimientosCommodity
      .filter((r) => (r.estado === 0 || r.modificado === 1) && r.estado !== 1)
      .toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert(
        'Información',
        'No hay requerimientos pendientes por sincronizar',
        'info',
      );
      return;
    }
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      `¿Desea enviar ${pendientes.length} requerimiento(s) pendiente(s)?`,
      'warning',
    );
    if (!confirmacion) return;
    // 2️⃣ Preparar todos los requerimientos pendientes para enviar
    const requerimientos = pendientes.map((req) => {
      const prioridadFinal = req.prioridad || '1';
      return {
        idrequerimiento: req.idrequerimiento,
        ruc: req.ruc,
        idfundo: req.idfundo,
        idarea: req.idarea,
        idclasificacion: 'SER',
        servicio: req.servicio,
        nrodocumento: req.nrodocumento,
        idalmacen: req.idalmacen,
        idalmacendestino: req.idalmacendestino || '',
        glosa: req.glosa || '',
        eliminado: 0,
        tipo: req.tipo,
        estados: 'PENDIENTE',
        prioridad: prioridadFinal,
        detalle:
          req.detalleCommodity?.map((d: any) => ({
            codigo: d.codigo,
            tipoclasificacion: 'C',
            cantidad: d.cantidad,
            iddescripcion: d.descripcion,
            idproyecto: d.proyecto || '',
            idcentrocosto: d.ceco || '',
            idturno: d.turno || '',
            idlabor: d.labor || '',
            eliminado: 0,
          })) || [],
      };
    });
    // 👇 Mandamos directamente el array de todos los requerimientos pendientes
    const payload = requerimientos;
    console.log('📤 Enviando al backend:', payload);
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta del backend:', resp);
        // Manejo del resultado del SP
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert(
            'Éxito',
            `${pendientes.length} requerimiento(s) sincronizado(s) correctamente`,
            'success',
          );
          // ---- 5️⃣ ACTUALIZAR TODOS LOS REQUERIMIENTOS ENVIADOS ----
          const idsParaActualizar = pendientes.map((p) => p.id!);
          // Actualizar todos los requerimientos que se enviaron
          Promise.all(
            idsParaActualizar.map((id) =>
              this.dexieService.requerimientosCommodity.update(id, {
                estado: 1,
                modificado: 0,
              }),
            ),
          ).then(async () => {
            await this.cargarRequerimientos();
            // 2️⃣ Recalcular contadores
            this.actualizarContadores();
          });
        } else {
          this.alertService.showAlert(
            'Error',
            'Hubo un problema al sincronizar los requerimientos',
            'error',
          );
          console.error('Detalles del error:', resp);
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP:', err);
        this.alertService.showAlert(
          'Error',
          'No se pudo conectar con el servidor',
          'error',
        );
      },
    });
  }
  async sincronizarRequerimientoActivoFijo() {
    // if (this.requerimientoActivoFijo.detalleActivoFijo.length === 0) {
    //   this.alertService.showAlert(
    //     'Alerta',
    //     'Debe ingresar al menos un requerimiento de activo fijo',
    //     'warning',
    //   );
    //   return;
    // }
    // 1️⃣ Obtener pendientes reales desde Dexie
    const pendientes = await this.dexieService.requerimientosActivoFijo
      .filter((r) => (r.estado === 0 || r.modificado === 1) && r.estado !== 1)
      .toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert(
        'Información',
        'No hay requerimientos pendientes por sincronizar',
        'info',
      );
      return;
    }
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      `¿Desea enviar ${pendientes.length} requerimiento(s) pendiente(s)?`,
      'warning',
    );
    if (!confirmacion) return;
    // 2️⃣ Preparar todos los requerimientos pendientes para enviar
    const requerimientos = pendientes.map((req) => {
      const prioridadFinal = req.prioridad || '1';
      return {
        idrequerimiento: req.idrequerimiento,
        ruc: req.ruc,
        idfundo: req.idfundo,
        idarea: req.idarea,
        idclasificacion: 'ACT',
        servicio: req.servicio,
        nrodocumento: req.nrodocumento,
        idalmacen: req.idalmacen,
        idalmacendestino: req.idalmacendestino || '',
        glosa: req.glosa || '',
        eliminado: 0,
        tipo: req.tipo,
        estados: 'PENDIENTE',
        prioridad: prioridadFinal,
        detalle:
          req.detalleActivoFijo?.map((d: any) => ({
            codigo: d.codigo,
            tipoclasificacion: d.tipoclasificacion,
            cantidad: d.cantidad,
            iddescripcion: d.descripcion,
            idproyecto: d.proyecto || '',
            idcentrocosto: d.ceco || '',
            idturno: d.turno || '',
            idlabor: d.labor || '',
            eliminado: 0,
          })) || [],
      };
    });
    // 👇 Mandamos directamente el array de todos los requerimientos pendientes
    const payload = requerimientos;
    console.log('📤 Enviando al backend:', payload);
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta del backend:', resp);
        // Manejo del resultado del SP
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert(
            'Éxito',
            `${pendientes.length} requerimiento(s) sincronizado(s) correctamente`,
            'success',
          );
          // ---- ACTUALIZAR TODOS LOS REQUERIMIENTOS ENVIADOS ----
          const idsParaActualizar = pendientes.map((p) => p.id!);
          // Actualizar todos los requerimientos que se enviaron
          Promise.all(
            idsParaActualizar.map((id) =>
              this.dexieService.requerimientosActivoFijo.update(id, {
                estado: 1,
                modificado: 0,
              }),
            ),
          ).then(async () => {
            await this.cargarRequerimientos();
            // Recalcular contadores
            this.actualizarContadores();
          });
        } else {
          this.alertService.showAlert(
            'Error',
            'Hubo un problema al sincronizar los requerimientos',
            'error',
          );
          console.error('Detalles del error:', resp);
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP:', err);
        this.alertService.showAlert(
          'Error',
          'No se pudo conectar con el servidor',
          'error',
        );
      },
    });
  }

  // Sincroniza un requerimiento individual de tipo ACTIVO FIJO MENOR con el backend
  async sincronizarRequerimientoActivoFijoMenor() {
    // 1️⃣ Obtener pendientes reales desde Dexie
    const pendientes = await this.dexieService.requerimientosActivoFijoMenor
      .filter((r) => (r.estado === 0 || r.modificado === 1) && r.estado !== 1)
      .toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert(
        'Información',
        'No hay requerimientos pendientes por sincronizar',
        'info',
      );
      return;
    }
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      `¿Desea enviar ${pendientes.length} requerimiento(s) pendiente(s)?`,
      'warning',
    );
    if (!confirmacion) return;
    // 2️⃣ Preparar todos los requerimientos pendientes para enviar
    const requerimientos = pendientes.map((req) => {
      const prioridadFinal = req.prioridad || '1';
      return {
        idrequerimiento: req.idrequerimiento,
        ruc: req.ruc,
        idfundo: req.idfundo,
        idarea: req.idarea,
        idclasificacion: 'ACM',
        servicio: req.servicio,
        nrodocumento: req.nrodocumento,
        idalmacen: req.idalmacen,
        idalmacendestino: req.idalmacendestino || '',
        glosa: req.glosa || '',
        eliminado: 0,
        tipo: req.tipo,
        estados: 'PENDIENTE',
        prioridad: prioridadFinal,
        detalle:
          req.detalleActivoFijoMenor?.map((d: any) => ({
            codigo: d.codigo,
            tipoclasificacion: d.tipoclasificacion,
            cantidad: d.cantidad,
            iddescripcion: d.descripcion,
            idproyecto: d.proyecto || '',
            idcentrocosto: d.ceco || '',
            idturno: d.turno || '',
            idlabor: d.labor || '',
            eliminado: 0,
          })) || [],
      };
    });
    // 👇 Mandamos directamente el array de todos los requerimientos pendientes
    const payload = requerimientos;
    console.log('📤 Enviando al backend:', payload);
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta del backend:', resp);
        // Manejo del resultado del SP
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert(
            'Éxito',
            `${pendientes.length} requerimiento(s) sincronizado(s) correctamente`,
            'success',
          );
          // ---- ACTUALIZAR TODOS LOS REQUERIMIENTOS ENVIADOS ----
          const idsParaActualizar = pendientes.map((p) => p.id!);
          // Actualizar todos los requerimientos que se enviaron
          Promise.all(
            idsParaActualizar.map((id) =>
              this.dexieService.requerimientosActivoFijoMenor.update(id, {
                estado: 1,
                modificado: 0,
              }),
            ),
          ).then(async () => {
            await this.cargarRequerimientos();
            // Recalcular contadores
            this.actualizarContadores();
          });
        } else {
          this.alertService.showAlert(
            'Error',
            'Hubo un problema al sincronizar los requerimientos',
            'error',
          );
          console.error('Detalles del error:', resp);
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP:', err);
        this.alertService.showAlert(
          'Error',
          'No se pudo conectar con el servidor',
          'error',
        );
      },
    });
  }

  // Carga los datos del usuario actual desde Dexie
  async cargarUsuario() {
    try {
      const usuarioActual = await this.dexieService.showUsuario();
      if (usuarioActual) {
        this.usuario = usuarioActual;
        console.log('Usuario cargado:', this.usuario);
      } else {
        console.warn('⚠️ No se encontró usuario en UserService.');
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario:', error);
    }
  }

  // Genera una glosa automática basada en el área y semana del mes
  async generarGlosaAutomatica(): Promise<string> {
    try {
      // 1. Obtener nombre del área del usuario
      const nombreArea =
        this.usuario.nombreArea || this.usuario.idarea || 'Sin Área';
      // 2. Calcular número de semana del mes actual
      const fechaActual = new Date();
      const primerDiaDelMes = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth(),
        1,
      );
      const diasTranscurridos =
        Math.floor(
          (fechaActual.getTime() - primerDiaDelMes.getTime()) /
          (1000 * 60 * 60 * 24),
        ) + 1;
      const numeroSemanaDelMes = Math.ceil(diasTranscurridos / 7);
      // 3. Generar correlativo único basado en fecha y hora
      const ahora = new Date();
      const correlativo =
        String(ahora.getHours()).padStart(2, '0') +
        String(ahora.getMinutes()).padStart(2, '0');
      // 4. Formatear glosa
      const glosaGenerada = `Requerimiento ${correlativo} para el área de ${nombreArea} - Semana ${numeroSemanaDelMes}`;
      console.log('🔤 Glosa generada automáticamente:', glosaGenerada);
      return glosaGenerada;
    } catch (error) {
      console.error('❌ Error al generar glosa automática:', error);
      return `Requerimiento para el área de ${this.usuario.nombreArea || 'Sin Área'} - ${new Date().toLocaleDateString()}`;
    }
  }

  // Carga todas las tablas maestras (fundos, cultivos, áreas, almacenes, proyectos, etc.)
  async cargarMaestras() {
    await this.ListarFundos();
    await this.ListarCultivos();
    await this.ListarAreas();
    await this.ListarAlmacenes();
    await this.ListarAlmacenDestino();
    await this.ListarProyectos();
    // ListarItems se moverá después de cargarConfiguracion para tener el almacén disponible
    await this.ListarTurnos();
    await this.ListarLabores();
    await this.ListarCecos();
    await this.ListarClasificaciones();
    await this.ListarProveedores();
    await this.ListarServicios();
    await this.ListarServiciosAF();
    await this.ListarServiciosAFMenor();
    await this.ListarTipoGastos();
    await this.ListarActivosFijos();
  }

  // Carga los detalles de requerimientos desde Dexie
  async cargarDetalles() {
    this.detalles = await this.dexieService.showDetallesRequerimiento();
  }

  // Ordena los requerimientos de tipo ITEM (sin enviar primero, luego por fecha)
  ordenarRequerimientos() {
    this.requerimientos.sort((a, b) => {
      // 1️⃣ Sin enviar primero
      if (a.estado !== b.estado) {
        return a.estado - b.estado; // 0 primero
      }
      // 2️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  // Ordena los requerimientos de tipo COMMODITY
  ordenarRequerimientosCommodity() {
    this.requerimientosCommodity.sort((a, b) => {
      // 1️⃣ Sin enviar primero
      if (a.estado !== b.estado) {
        return a.estado - b.estado; // 0 primero
      }
      // 2️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  // Ordena los requerimientos de tipo ACTIVO FIJO
  ordenarRequerimientosActivoFijo() {
    this.requerimientosActivoFijo.sort((a, b) => {
      // 1️⃣ Sin enviar primero
      if (a.estado !== b.estado) {
        return a.estado - b.estado; // 0 primero
      }
      // 2️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  // Ordena los requerimientos de tipo ACTIVO FIJO MENOR
  ordenarRequerimientosActivoFijoMenor() {
    this.requerimientosActivoFijoMenor.sort((a, b) => {
      // 1️⃣ Sin enviar primero
      if (a.estado !== b.estado) {
        return a.estado - b.estado; // 0 primero
      }
      // 2️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  // Carga todos los requerimientos desde Dexie y los ordena
  async cargarRequerimientos() {
    const itemsTodos = await this.dexieService.showRequerimiento();
    this.requerimientos = itemsTodos.filter(
      (r: any) => r.nrodocumento === this.usuario?.documentoidentidad,
    );
    // this.requerimientos = await this.dexieService.showRequerimiento();
    this.ordenarRequerimientos(); // 👈 CLAVE
    this.modoItemPrincipal = true;
    const commodityTodos = await this.dexieService.showRequerimientoCommodity();
    this.requerimientosCommodity = commodityTodos.filter(
      (r: any) => r.nrodocumento === this.usuario?.documentoidentidad,
    );
    //
    // this.requerimientosCommodity =
    //   await this.dexieService.showRequerimientoCommodity();
    this.ordenarRequerimientosCommodity(); // 👈 CLAVE
    const activoFijoTodos =
      await this.dexieService.showRequerimientoActivoFijo();
    this.requerimientosActivoFijo = activoFijoTodos.filter(
      (r: any) => r.nrodocumento === this.usuario?.documentoidentidad,
    );
    // this.requerimientosActivoFijo =
    //   await this.dexieService.showRequerimientoActivoFijo();
    this.ordenarRequerimientosActivoFijo(); // 👈 CLAVE
    const activoFijoMenorTodos =
      await this.dexieService.showRequerimientoActivoFijoMenor();
    this.requerimientosActivoFijoMenor = activoFijoMenorTodos.filter(
      (r: any) => r.nrodocumento === this.usuario?.documentoidentidad,
    );
    // this.requerimientosActivoFijoMenor =
    //   await this.dexieService.showRequerimientoActivoFijoMenor();
    this.ordenarRequerimientosActivoFijoMenor(); // 👈 CLAVE
    console.log('📌 ITEM:', this.requerimientos);
    console.log('📌 COMMODITY:', this.requerimientosCommodity);
    console.log('📌 ACTIVO FIJO:', this.requerimientosActivoFijo);
    console.log('📌 AF MENOR:', this.requerimientosActivoFijoMenor);
  }

  // Lista todos los fundos desde Dexie
  async ListarFundos() {
    this.fundos = await this.dexieService.showFundos();
  }

  // Lista todos los cultivos desde Dexie
  async ListarCultivos() {
    this.cultivos = await this.dexieService.showCultivos();
  }

  // Lista todas las áreas desde Dexie
  async ListarAreas() {
    this.areas = await this.dexieService.showAreas();
  }

  // Lista todos los almacenes desde Dexie
  async ListarAlmacenes() {
    this.almacenes = await this.dexieService.showAlmacenes();
    // Si estamos editando, reasignar almacén correctamente
    if (this.modoEdicion) {
      this.reasignarAlmacenDesdeDescripcion();
    }
  }

  // Lista todos los almacenes de destino desde Dexie
  async ListarAlmacenDestino() {
    this.alamcenesDestino = await this.dexieService.showAlmacenesDestino();
    // Si estamos editando, reasignar almacén correctamente
    if (this.modoEdicion) {
      this.reasignarAlmacenDesdeDescripcion();
    }
  }

  // Lista todos los proyectos desde Dexie
  async ListarProyectos() {
    this.proyectos = await this.dexieService.showProyectos();
  }

  // Lista todos los items filtrados por almacén desde Dexie
  async ListarItems() {
    this.items = await this.dexieService.showItemComoditys();
    console.log('ITEMS', this.items);
    console.log('Configuración:', this.configuracion);
    console.log('ID Almacen configuración:', this.configuracion?.idalmacen);
    // Si hay configuración y almacén, filtrar por almacén
    if (this.configuracion?.idalmacen) {
      this.itemsFiltrados = this.items.filter(
        (it) =>
          it.tipoclasificacion === 'I' &&
          it.almacen === this.configuracion.idalmacen,
      );
    } else {
      // Si no hay configuración, filtrar solo por tipo
      this.itemsFiltrados = this.items.filter(
        (it) => it.tipoclasificacion === 'I',
      );
      console.warn(
        '⚠️ No hay configuración de almacén, mostrando todos los items',
      );
    }
    console.log('Items Filtrados', this.itemsFiltrados);
  }

  // Lista todas las clasificaciones desde Dexie
  async ListarClasificaciones() {
    this.clasificaciones = await this.dexieService.showClasificaciones();
  }

  // Lista todos los turnos desde Dexie
  async ListarTurnos() {
    this.turnos = await this.dexieService.showTurnos();
  }

  // Lista todas las labores desde Dexie
  async ListarLabores() {
    this.labores = await this.dexieService.showLabores();
  }

  // Lista todos los CECOs desde Dexie
  async ListarCecos() {
    this.cecos = await this.dexieService.showCecos();
  }

  // Lista todos los proveedores desde Dexie
  async ListarProveedores() {
    this.proveedoresServicios = await this.dexieService.showProveedores();
    this.proveedoresActivoFijo = await this.dexieService.showProveedores();
  }

  // Lista todos los tipos de gasto desde Dexie
  async ListarTipoGastos() {
    this.tipoGastos = await this.dexieService.showTipoGastos();
  }

  // Lista todos los servicios de tipo COMMODITY desde Dexie
  async ListarServicios() {
    this.servicios = await this.dexieService.showMaestroCommodity();
    this.commodityFiltrados = this.servicios.filter(
      (serv) => serv.clasificacion === 'SER',
    );
  }

  // Lista todos los servicios de tipo ACTIVO FIJO desde Dexie
  async ListarServiciosAF() {
    this.servicioAF = await this.dexieService.showMaestroCommodity();
    this.commodityFiltradosAF = this.servicioAF.filter(
      (servaf) => servaf.clasificacion === 'ACT',
    );
  }

  // Lista todos los servicios de tipo ACTIVO FIJO MENOR desde Dexie
  async ListarServiciosAFMenor() {
    this.servicioAFMenor = await this.dexieService.showMaestroCommodity();
    this.commodityFiltradosAFMenor = this.servicioAFMenor.filter(
      (servafmenor) => servafmenor.clasificacion === 'ACM',
    );
  }

  // Obtiene el nombre del fundo por su ID
  getDescripcionFundo(idfundo: any) {
    const f = this.fundos.find((x) => x.codigoFundo == idfundo);
    return f ? f.nombreFundo : idfundo;
  }

  // Maneja el cambio de servicio y filtra los subservicios relacionados
  async onServicioChange() {
    if (!this.SeleccionaServicio) {
      this.subservicioFiltrados = [];
      this.SeleccionaSubServicio = '';
      return;
    }
    this.subservicios = await this.dexieService.showMaestroSubCommodity();
    // SeleccionaServicio YA ES el Commodity01
    this.subservicioFiltrados = this.subservicios.filter(
      (sub) => sub.commodity01 === this.SeleccionaServicio,
    );
    this.SeleccionaSubServicio = '';
  }

  // Maneja el cambio de servicio ACTIVO FIJO y filtra los subservicios relacionados
  async onServicioAFChange() {
    if (!this.SeleccionaServicioAF) {
      this.subservicioFiltradosAF = [];
      this.SeleccionaSubServicioAF = '';
      return;
    }
    this.subserviciosAF = await this.dexieService.showMaestroSubCommodity();
    this.subservicioFiltradosAF = this.subserviciosAF.filter(
      (sub) => sub.commodity01 === this.SeleccionaServicioAF,
    );
    this.SeleccionaSubServicioAF = '';
  }

  // Maneja el cambio de servicio ACTIVO FIJO MENOR y filtra los subservicios relacionados
  async onServicioAFMenorChange() {
    if (!this.SeleccionaServicioAFMenor) {
      this.subservicioFiltradosAFMenor = [];
      this.SeleccionaSubServicioAFMenor = '';
      return;
    }
    this.subserviciosAFMenor =
      await this.dexieService.showMaestroSubCommodity();
    this.subservicioFiltradosAFMenor = this.subserviciosAFMenor.filter(
      (sub) => sub.commodity01 === this.SeleccionaServicioAFMenor,
    );
    this.SeleccionaSubServicioAFMenor = '';
  }

  // Lista todos los activos fijos desde Dexie y los filtra por tipo
  async ListarActivosFijos() {
    this.activosFijos = await this.dexieService.showActivosFijos();
    // 1. Mapea y concatena
    const activosMapeados: ActivoFijo[] = this.activosFijos.map((act) => ({
      ...act,
      activo_descripcion: `${act.activo} - ${act.descripcion}`, // <-- ¡AQUÍ ESTÁ LA CLAVE!
    }));
    // 2. Aplica los filtros usando los arrays mapeados
    this.activosFijosFiltrados = activosMapeados.filter(
      (act) => act.tipoActivo === 'I', // Nota: La interfaz dice TipoActivo con 'T' mayúscula.
    );
    this.activosFijosServicioFiltrados = activosMapeados.filter(
      (act) => act.tipoActivo === 'C',
    );
  }

  // Crea una nueva línea vacía de detalle para requerimiento ITEM
  nuevaLinea(): DetalleRequerimiento {
    return {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
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

  // Crea una nueva línea vacía de detalle para requerimiento COMMODITY
  nuevaLineaCommodity(): DetalleRequerimientoCommodity {
    return {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
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

  // Crea una nueva línea vacía de detalle para requerimiento ACTIVO FIJO MENOR
  nuevaLineaActivoFijoMenor(): DetalleRequerimientoActivoFijoMenor {
    return {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
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

  // Abre el modal para agregar/editar líneas de detalle con valores desde configuración
  async abrirModal() {
    if (this.editIndex === -1) {
      console.log('🔍 Datos al abrir modal:', {
        cecoSeleccionado: this.cecoSeleccionado,
        localname: this.cecoSeleccionado?.localname,
        cecosDisponibles: this.cecos.length,
        configuracion: this.configuracion,
      });
      // 🔥 CARGAR TODOS LOS VALORES DESDE CONFIGURACIÓN SI NO ESTÁN SELECCIONADOS
      // 1️⃣ CECO
      if (!this.cecoSeleccionado && this.configuracion?.idceco) {
        console.log(
          '🔄 Cargando CECO desde configuración:',
          this.configuracion.idceco,
        );
        this.cecoSeleccionado = (await this.dexieService.getCecoById(
          this.configuracion.idceco,
        )) as Ceco | null;
        if (!this.cecoSeleccionado) {
          // Intentar buscar por localname o costcenter
          const cecoByLocalname = this.cecos.find(
            (c) =>
              c.localname === this.configuracion.idceco ||
              c.costcenter === this.configuracion.idceco,
          );
          if (cecoByLocalname) {
            this.cecoSeleccionado = cecoByLocalname;
            console.log(
              '✅ CECO encontrado por localname/costcenter:',
              this.cecoSeleccionado,
            );
          }
        } else {
          console.log('✅ CECO cargado por ID:', this.cecoSeleccionado);
        }
      }
      // 2️⃣ PROYECTO
      if (!this.proyectoSeleccionado && this.configuracion?.idproyecto) {
        console.log(
          '🔄 Cargando Proyecto desde configuración:',
          this.configuracion.idproyecto,
        );
        this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(
          this.configuracion.idproyecto,
        )) as Proyecto | null;
        console.log('✅ Proyecto cargado:', this.proyectoSeleccionado);
      }
      // 3️⃣ LABOR
      if (!this.laborSeleccionado && this.configuracion?.idlabor) {
        console.log(
          '🔄 Cargando Labor desde configuración:',
          this.configuracion.idlabor,
        );
        this.laborSeleccionado = (await this.dexieService.getLaborById(
          this.configuracion.idlabor,
        )) as Labor | null;
        console.log('✅ Labor cargada:', this.laborSeleccionado);
      }
      // 4️⃣ TURNO (solo para CONSUMO)
      if (
        !this.turnoSeleccionado &&
        this.configuracion?.idturno &&
        this.TipoSelecionado === 'CONSUMO'
      ) {
        console.log(
          '🔄 Cargando Turno desde configuración:',
          this.configuracion.idturno,
        );
        this.turnoSeleccionado = this.configuracion.idturno;
        console.log('✅ Turno cargado:', this.turnoSeleccionado);
      }
      // 🔥 INICIALIZAR VARIABLES DEL MODAL MEJORADO
      this.inicializarVariablesModal();
      this.lineaTemp = {
        idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
        codigo: '',
        producto: null,
        descripcion: '',
        estado: 0,
        cantidad: 0,
        unidadMedida: '', // Unidad de medida del producto
        proyecto: this.proyectoSeleccionado
          ? String(this.proyectoSeleccionado.proyectoio)
          : '',
        ceco: this.cecoSeleccionado?.localname ?? '',
        turno:
          this.TipoSelecionado === 'COMPRA'
            ? ''
            : (this.turnoSeleccionado ?? ''), // Vacío para COMPRA
        labor: this.laborSeleccionado?.labor ?? '',
        esActivoFijo: false,
        activoFijo: '',
      };
      console.log('🔍 lineaTemp creada con valores:', {
        ceco: this.lineaTemp.ceco,
        proyecto: this.lineaTemp.proyecto,
        labor: this.lineaTemp.labor,
        turno: this.lineaTemp.turno,
      });
    }
    this.modalAbierto = true;
  }

  // Cierra el modal de detalles y limpia las líneas temporales
  cerrarModal(): void {
    this.modalAbierto = false;
    this.editIndex = -1;
    // Limpiar líneas temporales y resetear checkbox
    this.lineasTemporales = [];
    this.permitirEditarParametros = false;
  }

  // Maneja el cambio de turno en el modal y filtra los CECOs relacionados
  onTurnoChangeModal() {
    const turnoActual = this.enModoEdicion
      ? this.lineaTemp?.turno || ''
      : this.turnoModal;
    console.log('🔄 [Modal] Turno cambiado:', turnoActual);
    // Buscar el objeto turno para obtener conturno (igual que parametros)
    const turnoObj = this.turnos.find((t) => t.nombreTurno === turnoActual);
    console.log('🔍 [Modal] Turno objeto encontrado:', turnoObj?.conturno);
    // Filtrar CECOs por turno usando conturno.includes (igual que parametros)
    if (turnoObj && turnoActual) {
      this.filteredCecosModal = this.cecos.filter((c) =>
        c.conturno?.includes(turnoObj.conturno || ''),
      );
    } else {
      this.filteredCecosModal = [];
    }
    // Limpiar selecciones dependientes
    if (this.enModoEdicion) {
      this.lineaTemp.ceco = '';
      this.lineaTemp.labor = '';
      this.lineaTemp.proyecto = '';
    } else {
      this.cecoModal = '';
      this.laborModal = '';
      this.proyectoModal = '';
    }
    this.filteredLaboresModal = [];
    this.filteredProyectosModal = [];
    // Auto-seleccionar si solo hay 1 CECO
    if (this.filteredCecosModal.length === 1) {
      if (this.enModoEdicion) {
        this.lineaTemp.ceco = this.filteredCecosModal[0].localname;
      } else {
        this.cecoModal = this.filteredCecosModal[0].localname;
      }
      this.onCecoChangeModal();
    }
    console.log('✅ [Modal] CECOs filtrados:', this.filteredCecosModal.length);
  }

  // Maneja el cambio de CECO en el modal y filtra las labores y proyectos relacionados
  onCecoChangeModal() {
    const cecoActual = this.enModoEdicion
      ? this.lineaTemp?.ceco || ''
      : this.cecoModal;
    console.log('🔄 [Modal] CECO cambiado:', cecoActual);
    console.log('🔍 [Modal] Modo edición:', this.enModoEdicion);
    console.log(
      '🔍 [Modal] editIndex:',
      this.editIndex,
      'editingTempIndex:',
      this.editingTempIndex,
    );
    console.log('🔍 [Modal] lineaTemp.ceco:', this.lineaTemp?.ceco);
    console.log('🔍 [Modal] cecoModal:', this.cecoModal);
    if (!cecoActual) return;
    // cecoModal guarda el localname, necesitamos buscar el costcenter para filtrar labores
    const cecoObj = this.cecos.find((c) => c.localname === cecoActual);
    console.log('🔍 [Modal] CECO obj encontrado:', cecoObj);
    console.log('🔍 [Modal] CECO costcenter:', cecoObj?.costcenter);
    console.log('🔍 [Modal] Total labores disponibles:', this.labores.length);
    this.filteredLaboresModal = this.labores.filter(
      (l) => l.ceco === (cecoObj?.costcenter || ''),
    );
    console.log(
      '🔍 [Modal] Labores filtradas:',
      this.filteredLaboresModal.length,
    );
    this.filteredLaboresModal.forEach((labor, index) => {
      if (index < 3)
        console.log(`  ${index + 1}. ${labor.labor} (ceco: ${labor.ceco})`);
    });
    // Limpiar selecciones dependientes
    if (this.enModoEdicion) {
      this.lineaTemp.labor = '';
      this.lineaTemp.proyecto = '';
    } else {
      this.laborModal = '';
      this.proyectoModal = '';
    }
    this.filteredProyectosModal = [];
    // Auto-seleccionar si solo hay 1 Labor
    if (this.filteredLaboresModal.length === 1) {
      if (this.enModoEdicion) {
        this.lineaTemp.labor = this.filteredLaboresModal[0].labor;
      } else {
        this.laborModal = this.filteredLaboresModal[0].labor;
      }
      this.onLaborChangeModal();
    }
    console.log(
      '✅ [Modal] Labores filtradas:',
      this.filteredLaboresModal.length,
    );
  }

  // Maneja el cambio de labor en el modal y filtra los proyectos relacionados por CECO, LABOR y CULTIVO
  onLaborChangeModal() {
    const laborActual = this.enModoEdicion
      ? this.lineaTemp?.labor || ''
      : this.laborModal;
    const cecoActual = this.enModoEdicion
      ? this.lineaTemp?.ceco || ''
      : this.cecoModal;
    const turnoActual = this.enModoEdicion
      ? this.lineaTemp?.turno || ''
      : this.turnoModal;
    console.log('🔄 [Modal] Labor cambiada:', laborActual);
    if (!laborActual || !cecoActual) return;
    // Filtrar Proyectos por Labor, CECO y Cultivo seleccionados
    // Igual que filtrarProyectoPorLabor en parámetros
    const laborObj = this.labores.find((l) => l.labor === laborActual);
    const cecoObj = this.cecos.find((c) => c.localname === cecoActual);
    // Para COMPRA: filtrar por CECO + LABOR + CULTIVO (igual que parametros)
    if (this.TipoSelecionado === 'COMPRA') {
      console.log(
        '🎯 [Modal] Filtrando proyectos para COMPRA (CECO + LABOR + CULTIVO)...',
      );
      this.filteredProyectosModal = this.proyectos.filter(
        (p) =>
          p.ceco?.trim() === (cecoObj?.costcenter || '')?.trim() &&
          p.idlabor?.trim() === (laborObj?.idlabor || '')?.trim() &&
          p.idcultivo?.trim() === this.cultivoSeleccionado?.trim(),
      );
      console.log(
        '✅ [Modal] PROYECTOS FILTRADOS (CECO + LABOR + CULTIVO):',
        this.filteredProyectosModal.length,
      );
    } else {
      // Para CONSUMO: filtrar por CECO + LABOR + CULTIVO (igual que parametros)
      console.log(
        '🎯 [Modal] Filtrando proyectos para CONSUMO (CECO + LABOR + CULTIVO)...',
      );
      this.filteredProyectosModal = this.proyectos.filter(
        (p) =>
          p.ceco?.trim() === (cecoObj?.costcenter || '')?.trim() &&
          p.idlabor?.trim() === (laborObj?.idlabor || '')?.trim() &&
          p.idcultivo?.trim() === this.cultivoSeleccionado?.trim(),
      );
      console.log(
        '✅ [Modal] PROYECTOS FILTRADOS (CECO + LABOR + CULTIVO):',
        this.filteredProyectosModal.length,
      );
    }
    // Auto-seleccionar si solo hay 1 Proyecto
    if (this.filteredProyectosModal.length === 1) {
      if (this.enModoEdicion) {
        this.lineaTemp.proyecto = String(
          this.filteredProyectosModal[0].proyectoio,
        );
      } else {
        this.proyectoModal = String(this.filteredProyectosModal[0].proyectoio);
      }
    }
    console.log(
      '📦 [Modal] Proyectos filtrados:',
      this.filteredProyectosModal.length,
    );
  }

  // Inserta una línea en la tabla temporal del modal de detalles
  insertarLineaEnTabla() {
    // Validaciones básicas
    if (
      !this.lineaTemp.producto ||
      !this.lineaTemp.cantidad ||
      this.lineaTemp.cantidad <= 0
    ) {
      this.alertService.showAlert(
        'Validación',
        'Complete los campos obligatorios: Producto y Cantidad',
        'warning',
      );
      return;
    }
    // lineaTemp ya tiene los valores del formulario (editables o desde config)
    const ceco = this.lineaTemp.ceco || this.cecoSeleccionado?.localname || '';
    const proyecto =
      this.lineaTemp.proyecto ||
      (this.proyectoSeleccionado
        ? String(this.proyectoSeleccionado.proyectoio)
        : '');
    const labor = this.lineaTemp.labor || this.laborSeleccionado?.labor || '';
    const turno =
      this.TipoSelecionado === 'COMPRA'
        ? ''
        : this.lineaTemp.turno || this.turnoSeleccionado || '';
    // Crear nueva línea
    const nuevaLinea: DetalleRequerimiento = {
      idrequerimiento: '',
      codigo: this.lineaTemp.codigo || '',
      producto: this.obtenerDescripcionProducto(this.lineaTemp.producto) || '',
      descripcion:
        this.obtenerDescripcionProducto(this.lineaTemp.producto) || '',
      cantidad: this.lineaTemp.cantidad,
      unidadMedida: this.lineaTemp.unidadMedida || '',
      proyecto: proyecto,
      ceco: ceco,
      turno: turno,
      labor: labor,
      esActivoFijo: this.lineaTemp.esActivoFijo || false,
      activoFijo: this.lineaTemp.activoFijo || '',
      estado: 0,
    };
    if (this.editingTempIndex >= 0) {
      // Actualizar línea temporal existente
      this.lineasTemporales[this.editingTempIndex] = nuevaLinea;
      this.editingTempIndex = -1;
      console.log(
        '✅ [Modal] Línea temporal actualizada en índice:',
        this.editingTempIndex,
      );
    } else {
      // Agregar nueva línea a la tabla temporal
      this.lineasTemporales.push(nuevaLinea);
      console.log('✅ [Modal] Línea agregada a tabla temporal:', nuevaLinea);
    }
    // Limpiar formulario para siguiente línea
    this.limpiarFormularioModal();
    console.log(
      '📊 [Modal] Total líneas temporales:',
      this.lineasTemporales.length,
    );
  }

  // Elimina una línea de la tabla temporal del modal
  eliminarLineaTemporal(index: number) {
    this.lineasTemporales.splice(index, 1);
    if (this.editingTempIndex === index) {
      this.editingTempIndex = -1;
      this.limpiarFormularioModal();
    }
    console.log(
      '🗑️ [Modal] Línea eliminada, total restante:',
      this.lineasTemporales.length,
    );
  }

  // Edita una línea temporal existente cargándola en el formulario del modal
  editarLineaTemporal(index: number) {
    this.editingTempIndex = index;
    const linea = this.lineasTemporales[index];
    // Buscar el producto en la lista
    let producto = null;
    if (linea.codigo) {
      producto = this.items.find((it) => it.codigo === linea.codigo);
    }
    if (!producto && linea.producto) {
      producto = this.items.find((it) => it.descripcion === linea.producto);
    }
    // Cargar en lineaTemp
    this.lineaTemp = {
      ...linea,
      producto: producto ? { ...producto } : null,
    };
    // Sincronizar variables del modal
    this.turnoModal = linea.turno || '';
    this.cecoModal = linea.ceco || '';
    this.laborModal = linea.labor || '';
    this.proyectoModal = linea.proyecto || '';
    // Inicializar arrays filtrados para la cascada (igual que parametros)
    const turnoObj = this.turnos.find((t) => t.nombreTurno === this.turnoModal);
    if (turnoObj) {
      this.filteredCecosModal = this.cecos.filter((c) =>
        c.conturno?.includes(turnoObj.conturno || ''),
      );
    } else {
      this.filteredCecosModal = this.cecos;
    }
    const cecoObj = this.cecos.find((c) => c.localname === this.cecoModal);
    this.filteredLaboresModal = this.labores.filter(
      (l) => l.ceco === (cecoObj?.costcenter || ''),
    );
    this.filteredProyectosModal = this.proyectos;
    // Actualizar unidad de medida
    if (producto) {
      const unidadMedida = this.obtenerUnidadMedidaProducto(producto);
      this.unidadesMedidaFiltradas = [
        { label: unidadMedida, value: unidadMedida },
      ];
    }
    console.log('✏️ [Modal] Editando línea temporal #', index, linea);
  }

  // Limpia el formulario del modal y resetea las variables temporales
  limpiarFormularioModal() {
    this.editingTempIndex = -1;
    this.lineaTemp = {
      idrequerimiento: '',
      codigo: '',
      producto: null,
      descripcion: '',
      cantidad: 0,
      unidadMedida: '',
      proyecto: '',
      ceco: '',
      turno: '',
      labor: '',
      esActivoFijo: false,
      activoFijo: '',
      estado: 0,
    };
  }

  // Registra todas las líneas temporales en la tabla principal de detalles
  registrarTodasLasLineas() {
    if (this.lineasTemporales.length === 0) {
      this.alertService.showAlert(
        'Validación',
        'Debe agregar al menos una línea',
        'warning',
      );
      return;
    }
    // Agregar todas las líneas temporales al array detalles (tabla principal)
    this.lineasTemporales.forEach((linea) => {
      this.detalles.push(linea);
    });
    console.log(
      '✅ [Modal] Todas las líneas registradas:',
      this.lineasTemporales.length,
    );
    console.log(
      '📊 [Modal] Total líneas en tabla principal:',
      this.detalles.length,
    );
    // Cerrar modal y limpiar
    this.cerrarModal();
    // Mostrar mensaje de éxito
    this.alertService.showAlert(
      'Éxito',
      `${this.lineasTemporales.length} línea(s) agregada(s) correctamente`,
      'success',
    );
  }

  // Inicializa las variables del modal con valores de configuración
  inicializarVariablesModal() {
    // Resetear checkbox y líneas temporales
    this.permitirEditarParametros = false;
    this.lineasTemporales = [];
    // Inicializar variables del modal con valores de configuración
    this.turnoModal = this.turnoSeleccionado || '';
    this.cecoModal = this.cecoSeleccionado?.localname ?? '';
    this.laborModal = this.laborSeleccionado?.labor ?? '';
    this.proyectoModal = this.proyectoSeleccionado
      ? String(this.proyectoSeleccionado.proyectoio)
      : '';
    // Inicializar arrays filtrados
    this.filteredCecosModal = [...this.cecos];
    this.filteredLaboresModal = [...this.labores];
    this.filteredProyectosModal = [...this.proyectos];
    console.log('🔧 [Modal] Variables inicializadas:', {
      turno: this.turnoModal,
      ceco: this.cecoModal,
      labor: this.laborModal,
      proyecto: this.proyectoModal,
    });
  }

  // Abre el modal para agregar/editar líneas de detalle COMMODITY
  async abrirModalCommodity() {
    if (this.commodityEditIndex === -1) {
      // 🔥 CARGAR TODOS LOS VALORES DESDE CONFIGURACIÓN SI NO ESTÁN SELECCIONADOS
      // 1️⃣ CECO
      if (!this.cecoSeleccionado && this.configuracion?.idceco) {
        console.log(
          '🔄 [Commodity] Cargando CECO desde configuración:',
          this.configuracion.idceco,
        );
        this.cecoSeleccionado = (await this.dexieService.getCecoById(
          this.configuracion.idceco,
        )) as Ceco | null;
        if (!this.cecoSeleccionado) {
          const cecoByLocalname = this.cecos.find(
            (c) =>
              c.localname === this.configuracion.idceco ||
              c.costcenter === this.configuracion.idceco,
          );
          if (cecoByLocalname) {
            this.cecoSeleccionado = cecoByLocalname;
          }
        }
      }
      // 2️⃣ PROYECTO
      if (!this.proyectoSeleccionado && this.configuracion?.idproyecto) {
        console.log(
          '🔄 [Commodity] Cargando Proyecto desde configuración:',
          this.configuracion.idproyecto,
        );
        this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(
          this.configuracion.idproyecto,
        )) as Proyecto | null;
      }
      // 3️⃣ LABOR
      if (!this.laborSeleccionado && this.configuracion?.idlabor) {
        console.log(
          '🔄 [Commodity] Cargando Labor desde configuración:',
          this.configuracion.idlabor,
        );
        this.laborSeleccionado = (await this.dexieService.getLaborById(
          this.configuracion.idlabor,
        )) as Labor | null;
      }
      // 4️⃣ TURNO
      if (!this.turnoSeleccionado && this.configuracion?.idturno) {
        console.log(
          '🔄 [Commodity] Cargando Turno desde configuración:',
          this.configuracion.idturno,
        );
        this.turnoSeleccionado = this.configuracion.idturno;
      }
      this.lineaTempCommodity = {
        idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
        codigo: '',
        descripcion: '',
        proveedor: '',
        cantidad: 0,
        proyecto: this.proyectoSeleccionado
          ? String(this.proyectoSeleccionado.proyectoio)
          : '',
        ceco: this.cecoSeleccionado?.localname ?? '',
        turno: this.turnoSeleccionado ?? '',
        labor: this.laborSeleccionado?.labor ?? '',
        estado: 0,
        esActivoFijo: false,
        activoFijo: '',
      };
    }
    this.modalAbiertoCommodity = true;
  }

  // Cierra el modal de commodity
  cerrarModalCommodity() {
    this.modalAbiertoCommodity = false;
  }

  // Guarda una línea de detalle COMMODITY en memoria con validaciones
  async guardarLineaCommodity() {
    // Validaciones de Commodity
    // Verifica que la cantidad sea mayor a 0
    if (
      !this.lineaTempCommodity.cantidad ||
      this.lineaTempCommodity.cantidad <= 0
    ) {
      this.alertService.showAlert(
        'Campo inválido',
        'La cantidad debe ser mayor a 0.',
        'warning',
      );
      return;
    }
    if (
      !this.lineaTempCommodity.proyecto ||
      this.lineaTempCommodity.proyecto.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un proyecto.',
        'warning',
      );
      return;
    }
    if (
      !this.lineaTempCommodity.ceco ||
      this.lineaTempCommodity.ceco.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un CECO.',
        'warning',
      );
      return;
    }
    // Validar turno solo si el tipo es CONSUMO
    if (
      this.TipoSelecionado === 'CONSUMO' &&
      (!this.lineaTempCommodity.turno ||
        this.lineaTempCommodity.turno.trim() === '')
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un turno.',
        'warning',
      );
      return;
    }
    if (
      !this.lineaTempCommodity.labor ||
      this.lineaTempCommodity.labor.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar una labor.',
        'warning',
      );
      return;
    }
    const subservicioSeleccionado = this.subservicioFiltrados.find(
      (subs) => subs.commodity === this.SeleccionaSubServicio,
    );
    if (!subservicioSeleccionado) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un subservicio válido.',
        'warning',
      );
      return;
    }
    console.log('Servicio seleccionado:', subservicioSeleccionado);
    console.log(
      'descripcion subservicio:',
      subservicioSeleccionado.descripcionLocal,
    );
    const nuevaLineaDetalle = {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
      codigo: subservicioSeleccionado.commodity, // ✅ código servicio
      descripcion: subservicioSeleccionado.descripcionLocal, // ✅ descripción
      proveedor: this.lineaTempCommodity.proveedor,
      cantidad: this.lineaTempCommodity.cantidad,
      proyecto: this.lineaTempCommodity.proyecto,
      ceco: this.lineaTempCommodity.ceco,
      turno: this.lineaTempCommodity.turno,
      labor: this.lineaTempCommodity.labor,
      esActivoFijo: this.lineaTempCommodity.esActivoFijo,
      activoFijo: this.lineaTempCommodity.activoFijo,
      estado: 0, // 👈 agrega cualquier campo adicional que tu tabla Dexie requiera
    };
    // ================= EDITAR / AGREGAR =================
    if (this.commodityEditIndex >= 0) {
      // ✏️ editar SOLO en memoria
      this.detallesCommodity[this.commodityEditIndex] = {
        ...nuevaLineaDetalle,
      };
    } else {
      // ➕ agregar SOLO en memoria
      this.detallesCommodity.push({ ...nuevaLineaDetalle });
    }
    this.cerrarModalCommodity();
    this.alertService.showAlert(
      'Éxito',
      'Línea guardada correctamente.',
      'success',
    );
  }

  // Edita una línea de detalle COMMODITY existente cargándola en el formulario
  editarDetalleCommodity(index: number): void {
    this.commodityEditIndex = index;
    const linea = this.detallesCommodity[index];
    // Cargar la línea temporal
    this.lineaTempCommodity = { ...linea };
    console.log('Descripción de la línea:', linea.descripcion);
    console.log('Código de la línea:', linea.codigo);
    this.SeleccionaSubServicio = linea.codigo;
    this.modoEdicionCommodity = true;
    this.modalAbiertoCommodity = true;
  }

  // Elimina una línea de detalle COMMODITY de Dexie y del array local
  async eliminarDetalleCommodity(index: number) {
    // 1. ID del detalle a eliminar
    const detalle = this.detallesCommodity[index];
    const id = detalle.id;
    // 2. Eliminar de la tabla separada de detalles en Dexie
    if (id) {
      await this.dexieService.deleteDetalleCommodity(id);
    }
    // 3. Eliminar del array local que alimenta la tabla
    this.detallesCommodity.splice(index, 1);
    // 4. Actualizar el array embebido en el requerimiento commodity actual
    if (this.requerimientoCommodity) {
      this.requerimientoCommodity.detalleCommodity = [
        ...this.detallesCommodity,
      ];
      // 5. Actualizar en Dexie el requerimiento con el nuevo detalle embebido
      if (this.requerimientoCommodity.id) {
        await this.dexieService.requerimientosCommodity.update(
          this.requerimientoCommodity.id,
          {
            detalleCommodity: this.detallesCommodity,
          },
        );
      }
    }
    // 6. Notificación
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  // Abre el modal para agregar/editar líneas de detalle ACTIVO FIJO MENOR
  async abrirModalActivoFijoMenor() {
    if (this.activoFijoMenorEditIndex === -1) {
      // 🔥 CARGAR TODOS LOS VALORES DESDE CONFIGURACIÓN SI NO ESTÁN SELECCIONADOS
      // 1️⃣ CECO
      if (!this.cecoSeleccionado && this.configuracion?.idceco) {
        console.log(
          '🔄 [ActivoFijoMenor] Cargando CECO desde configuración:',
          this.configuracion.idceco,
        );
        this.cecoSeleccionado = (await this.dexieService.getCecoById(
          this.configuracion.idceco,
        )) as Ceco | null;
        if (!this.cecoSeleccionado) {
          const cecoByLocalname = this.cecos.find(
            (c) =>
              c.localname === this.configuracion.idceco ||
              c.costcenter === this.configuracion.idceco,
          );
          if (cecoByLocalname) {
            this.cecoSeleccionado = cecoByLocalname;
          }
        }
      }
      // 2️⃣ PROYECTO
      if (!this.proyectoSeleccionado && this.configuracion?.idproyecto) {
        console.log(
          '🔄 [ActivoFijoMenor] Cargando Proyecto desde configuración:',
          this.configuracion.idproyecto,
        );
        this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(
          this.configuracion.idproyecto,
        )) as Proyecto | null;
      }
      // 3️⃣ LABOR
      if (!this.laborSeleccionado && this.configuracion?.idlabor) {
        console.log(
          '🔄 [ActivoFijoMenor] Cargando Labor desde configuración:',
          this.configuracion.idlabor,
        );
        this.laborSeleccionado = (await this.dexieService.getLaborById(
          this.configuracion.idlabor,
        )) as Labor | null;
      }
      // 4️⃣ TURNO
      if (!this.turnoSeleccionado && this.configuracion?.idturno) {
        console.log(
          '🔄 [ActivoFijoMenor] Cargando Turno desde configuración:',
          this.configuracion.idturno,
        );
        this.turnoSeleccionado = this.configuracion.idturno;
      }
      this.lineaTempActivoFijoMenor = {
        idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
        codigo: '',
        descripcion: '',
        proveedor: '',
        cantidad: 0,
        proyecto: this.proyectoSeleccionado
          ? String(this.proyectoSeleccionado.proyectoio)
          : '',
        ceco: this.cecoSeleccionado?.localname ?? '',
        turno: this.turnoSeleccionado ?? '',
        labor: this.laborSeleccionado?.labor ?? '',
        estado: 0,
        esActivoFijo: false,
        activoFijo: '',
      };
    }
    this.modalAbiertoActivoFijoMenor = true;
  }

  // Cierra el modal de ACTIVO FIJO MENOR
  cerrarModalActivoFijoMenor() {
    this.modalAbiertoActivoFijoMenor = false;
  }

  // Guarda una línea de detalle ACTIVO FIJO MENOR en Dexie con validaciones
  async guardarLineaActivoFijoMenor() {
    // ✅ Validaciones previas
    if (
      !this.lineaTempActivoFijoMenor.cantidad ||
      this.lineaTempActivoFijoMenor.cantidad <= 0
    ) {
      this.alertService.showAlert(
        'Campo inválido',
        'La cantidad debe ser mayor a 0.',
        'warning',
      );
      return;
    }
    if (
      !this.lineaTempActivoFijoMenor.proyecto ||
      this.lineaTempActivoFijoMenor.proyecto.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un proyecto.',
        'warning',
      );
      return;
    }
    if (
      !this.lineaTempActivoFijoMenor.ceco ||
      this.lineaTempActivoFijoMenor.ceco.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un CECO.',
        'warning',
      );
      return;
    }
    // Validar turno solo si el tipo es CONSUMO
    if (
      this.TipoSelecionado === 'CONSUMO' &&
      (!this.lineaTempActivoFijoMenor.turno ||
        this.lineaTempActivoFijoMenor.turno.trim() === '')
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un turno.',
        'warning',
      );
      return;
    }
    if (
      !this.lineaTempActivoFijoMenor.labor ||
      this.lineaTempActivoFijoMenor.labor.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar una labor.',
        'warning',
      );
      return;
    }
    if (
      this.lineaTempActivoFijoMenor.esActivoFijo &&
      !this.lineaTempActivoFijoMenor.activoFijo
    ) {
      this.alertService.showAlert(
        'Advertencia',
        'Debe ingresar el código de activo fijo.',
        'warning',
      );
      return;
    }
    const nuevaLineaDetalle = {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
      codigo: this.lineaTempActivoFijoMenor.codigo,
      descripcion: this.SeleccionaSubServicioAFMenor,
      proveedor: this.lineaTempActivoFijoMenor.proveedor,
      cantidad: this.lineaTempActivoFijoMenor.cantidad,
      proyecto: this.lineaTempActivoFijoMenor.proyecto,
      ceco: this.lineaTempActivoFijoMenor.ceco,
      turno: this.lineaTempActivoFijoMenor.turno,
      labor: this.lineaTempActivoFijoMenor.labor,
      esActivoFijo: this.lineaTempActivoFijoMenor.esActivoFijo,
      activoFijo: this.lineaTempActivoFijoMenor.activoFijo,
      estado: 0, // 👈 agrega cualquier campo adicional que tu tabla Dexie requiera
    };
    // ✅ Si pasa todas las validaciones
    if (this.activoFijoMenorEditIndex >= 0) {
      // Editar línea existente
      const idExistente =
        this.detallesActivoFijoMenor[this.activoFijoMenorEditIndex].id!;
      await this.dexieService.detallesActivoFijoMenor.put({
        id: idExistente,
        ...nuevaLineaDetalle,
      });
      // ✅ Actualizar en memoria también
      this.detallesActivoFijoMenor[this.activoFijoMenorEditIndex] = {
        id: idExistente,
        ...nuevaLineaDetalle,
      };
    } else {
      // Agregar nueva línea
      delete this.lineaTemp.id;
      // Agregar nueva línea
      const idNuevo = await this.dexieService.detallesActivoFijoMenor.add({
        ...nuevaLineaDetalle,
      });
      // ✅ Añadir al arreglo en memoria
      this.detallesActivoFijoMenor.push({ id: idNuevo, ...nuevaLineaDetalle });
    }
    // await this.cargarDetalles();
    this.cerrarModalActivoFijoMenor();
    this.alertService.showAlert(
      'Éxito',
      'Línea guardada correctamente.',
      'success',
    );
  }

  // Abre el modal para agregar/editar líneas de detalle ACTIVO FIJO
  async abrirModalActivoFijo() {
    if (this.activoFijoEditIndex === -1) {
      // 🔥 CARGAR TODOS LOS VALORES DESDE CONFIGURACIÓN SI NO ESTÁN SELECCIONADOS
      // 1️⃣ CECO
      if (!this.cecoSeleccionado && this.configuracion?.idceco) {
        console.log(
          '🔄 [ActivoFijo] Cargando CECO desde configuración:',
          this.configuracion.idceco,
        );
        this.cecoSeleccionado = (await this.dexieService.getCecoById(
          this.configuracion.idceco,
        )) as Ceco | null;
        if (!this.cecoSeleccionado) {
          const cecoByLocalname = this.cecos.find(
            (c) =>
              c.localname === this.configuracion.idceco ||
              c.costcenter === this.configuracion.idceco,
          );
          if (cecoByLocalname) {
            this.cecoSeleccionado = cecoByLocalname;
          }
        }
      }
      // 2️⃣ PROYECTO
      if (!this.proyectoSeleccionado && this.configuracion?.idproyecto) {
        console.log(
          '🔄 [ActivoFijo] Cargando Proyecto desde configuración:',
          this.configuracion.idproyecto,
        );
        this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(
          this.configuracion.idproyecto,
        )) as Proyecto | null;
      }
      // 3️⃣ LABOR
      if (!this.laborSeleccionado && this.configuracion?.idlabor) {
        console.log(
          '🔄 [ActivoFijo] Cargando Labor desde configuración:',
          this.configuracion.idlabor,
        );
        this.laborSeleccionado = (await this.dexieService.getLaborById(
          this.configuracion.idlabor,
        )) as Labor | null;
      }
      // 4️⃣ TURNO
      if (!this.turnoSeleccionado && this.configuracion?.idturno) {
        console.log(
          '🔄 [ActivoFijo] Cargando Turno desde configuración:',
          this.configuracion.idturno,
        );
        this.turnoSeleccionado = this.configuracion.idturno;
      }
      this.lineaTempActivoFijo = {
        idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
        codigo: '',
        descripcion: '',
        proveedor: '',
        cantidad: 0,
        proyecto: this.proyectoSeleccionado
          ? String(this.proyectoSeleccionado.proyectoio)
          : '',
        ceco: this.cecoSeleccionado?.localname ?? '',
        turno: this.turnoSeleccionado ?? '',
        labor: this.laborSeleccionado?.labor ?? '',
        estado: 0,
        esActivoFijo: false,
        activoFijo: '',
      };
    }
    this.modalAbiertoActivoFijo = true;
  }
  cerrarModalActivoFijo() {
    this.modalAbiertoActivoFijo = false;
  }
  async guardarLineaActivoFijo() {
    // ✅ Validaciones previas
    if (
      !this.lineaTempActivoFijo.cantidad ||
      this.lineaTempActivoFijo.cantidad <= 0
    ) {
      this.alertService.showAlert(
        'Campo inválido',
        'La cantidad debe ser mayor a 0.',
        'warning',
      );
      return;
    }
    if (
      !this.lineaTempActivoFijo.proyecto ||
      this.lineaTempActivoFijo.proyecto.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un proyecto.',
        'warning',
      );
      return;
    }
    if (
      !this.lineaTempActivoFijo.ceco ||
      this.lineaTempActivoFijo.ceco.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un CECO.',
        'warning',
      );
      return;
    }
    // Validar turno solo si el tipo es CONSUMO
    if (
      this.TipoSelecionado === 'CONSUMO' &&
      (!this.lineaTempActivoFijo.turno ||
        this.lineaTempActivoFijo.turno.trim() === '')
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un turno.',
        'warning',
      );
      return;
    }
    if (
      !this.lineaTempActivoFijo.labor ||
      this.lineaTempActivoFijo.labor.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar una labor.',
        'warning',
      );
      return;
    }
    if (
      this.lineaTempActivoFijo.esActivoFijo &&
      !this.lineaTempActivoFijo.activoFijo
    ) {
      this.alertService.showAlert(
        'Advertencia',
        'Debe ingresar el código de activo fijo.',
        'warning',
      );
      return;
    }
    console.log('Subservicio seleccionado:', this.SeleccionaSubServicioAF);
    const subservicioSeleccionadoAF = this.subservicioFiltradosAF.find(
      (subs) => subs.commodity === this.SeleccionaSubServicioAF,
    );
    console.log('Servicio seleccionado:', subservicioSeleccionadoAF);
    if (!subservicioSeleccionadoAF) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un subservicio válido.',
        'warning',
      );
      return;
    }
    const nuevaLineaDetalle = {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
      codigo: subservicioSeleccionadoAF.commodity, // ✅ código servicio
      descripcion: subservicioSeleccionadoAF.descripcionLocal, // ✅ descripción
      proveedor: this.lineaTempActivoFijo.proveedor,
      cantidad: this.lineaTempActivoFijo.cantidad,
      proyecto: this.lineaTempActivoFijo.proyecto,
      ceco: this.lineaTempActivoFijo.ceco,
      turno: this.lineaTempActivoFijo.turno,
      labor: this.lineaTempActivoFijo.labor,
      esActivoFijo: this.lineaTempActivoFijo.esActivoFijo,
      activoFijo: this.lineaTempActivoFijo.activoFijo,
      estado: 0, // 👈 agrega cualquier campo adicional que tu tabla Dexie requiera
    };
    // ✅ Si pasa todas las validaciones
    if (this.activoFijoEditIndex >= 0) {
      // Editar línea existente
      const idExistente = this.detallesActivoFijo[this.activoFijoEditIndex].id!;
      await this.dexieService.detallesActivoFijo.put({
        id: idExistente,
        ...nuevaLineaDetalle,
      });
      // ✅ Actualizar en memoria también
      this.detallesActivoFijo[this.activoFijoEditIndex] = {
        id: idExistente,
        ...nuevaLineaDetalle,
      };
    } else {
      // Agregar nueva línea
      delete this.lineaTemp.id;
      // Agregar nueva línea
      const idNuevo = await this.dexieService.detallesActivoFijo.add({
        ...nuevaLineaDetalle,
      });
      // ✅ Añadir al arreglo en memoria
      this.detallesActivoFijo.push({ id: idNuevo, ...nuevaLineaDetalle });
    }
    // await this.cargarDetalles();
    this.cerrarModalActivoFijo();
    this.alertService.showAlert(
      'Éxito',
      'Línea guardada correctamente.',
      'success',
    );
  }

  // Guarda una línea de detalle ITEM en Dexie con validaciones
  async guardarLinea() {
    // Buscar producto seleccionado
    const productoSeleccionado = this.items.find(
      (it) => it.codigo === this.lineaTemp.producto?.codigo,
    );
    console.log('Producto seleccionado:', productoSeleccionado);
    console.log('Producto en lineaTemp:', this.lineaTemp.producto);
    // ✅ Validaciones previas
    if (!this.lineaTemp.producto || !this.lineaTemp.producto.codigo) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un producto.',
        'warning',
      );
      return;
    }
    if (!this.lineaTemp.cantidad || this.lineaTemp.cantidad <= 0) {
      this.alertService.showAlert(
        'Campo inválido',
        'La cantidad debe ser mayor a 0.',
        'warning',
      );
      return;
    }
    // Validar PROYECTO solo si es COMPRA o está habilitado
    if (
      this.esCompraConConsumo() &&
      (!this.lineaTemp.proyecto || this.lineaTemp.proyecto.trim() === '')
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un proyecto.',
        'warning',
      );
      return;
    }
    // Validar CECO solo si es COMPRA o está habilitado
    if (
      this.esCompraConConsumo() &&
      (!this.lineaTemp.ceco || this.lineaTemp.ceco.trim() === '')
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un CECO.',
        'warning',
      );
      return;
    }
    // Validar TURNO solo si el tipo es CONSUMO
    if (
      this.TipoSelecionado === 'CONSUMO' &&
      (!this.lineaTemp.turno || this.lineaTemp.turno.trim() === '')
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un turno.',
        'warning',
      );
      return;
    }
    // Validar LABOR solo si es COMPRA o está habilitado
    if (
      this.esCompraConConsumo() &&
      (!this.lineaTemp.labor || this.lineaTemp.labor.trim() === '')
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar una labor.',
        'warning',
      );
      return;
    }
    if (this.lineaTemp.esActivoFijo && !this.lineaTemp.activoFijo) {
      this.alertService.showAlert(
        'Advertencia',
        'Debe ingresar el código de activo fijo.',
        'warning',
      );
      return;
    }
    const nuevaLineaDetalle = {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
      codigo: productoSeleccionado.codigo,
      producto: productoSeleccionado.descripcion, // 👈 Guardamos la descripción visible
      descripcion: '',
      cantidad: this.lineaTemp.cantidad,
      unidadMedida: this.lineaTemp.unidadMedida, // Unidad de medida del producto
      proyecto: this.lineaTemp.proyecto,
      ceco: this.lineaTemp.ceco,
      turno: this.TipoSelecionado === 'COMPRA' ? '' : this.lineaTemp.turno, // Vacío para COMPRA
      labor: this.lineaTemp.labor,
      esActivoFijo: this.lineaTemp.esActivoFijo,
      activoFijo: this.lineaTemp.activoFijo,
      estado: 0, // 👈 agrega cualquier campo adicional que tu tabla Dexie requiera
    };
    // ✅ Si pasa todas las validaciones
    if (this.editIndex >= 0) {
      // Editar línea existente
      const idExistente = this.detalles[this.editIndex].id!;
      await this.dexieService.detalles.put({
        id: idExistente,
        ...nuevaLineaDetalle,
      });
      // ✅ Actualizar en memoria también
      this.detalles[this.editIndex] = { id: idExistente, ...nuevaLineaDetalle };
    } else {
      // Agregar nueva línea
      delete this.lineaTemp.id;
      // Agregar nueva línea
      const idNuevo = await this.dexieService.detalles.add({
        ...nuevaLineaDetalle,
      });
      // ✅ Añadir al arreglo en memoria
      this.detalles.push({ id: idNuevo, ...nuevaLineaDetalle });
    }
    // await this.cargarDetalles();
    this.cerrarModal();
    this.alertService.showAlert(
      'Éxito',
      'Línea guardada correctamente.',
      'success',
    );
  }

  // Edita una línea de detalle ITEM existente cargándola en el formulario del modal
  editarLinea(index: number): void {
    this.editIndex = index;
    const detalleSeleccionado = this.detalles[index];
    // Buscar el producto en la lista de items por código primero, luego por descripción
    let producto = null;
    if (detalleSeleccionado.codigo) {
      producto = this.items.find(
        (it) => it.codigo === detalleSeleccionado.codigo,
      );
    }
    if (!producto && detalleSeleccionado.producto) {
      producto = this.items.find(
        (it) => it.descripcion === detalleSeleccionado.producto,
      );
    }
    // Cargar en lineaTemp todos los campos necesarios
    this.lineaTemp = {
      ...detalleSeleccionado,
      producto: producto ? { ...producto } : null,
      // Asegurar que los campos de parámetros tengan valores
      proyecto: detalleSeleccionado.proyecto || '',
      ceco: detalleSeleccionado.ceco || '',
      labor: detalleSeleccionado.labor || '',
      turno: detalleSeleccionado.turno || '',
    };
    // Sincronizar variables del modal con los valores de la línea seleccionada
    this.cecoModal = detalleSeleccionado.ceco || '';
    this.proyectoModal = detalleSeleccionado.proyecto || '';
    this.laborModal = detalleSeleccionado.labor || '';
    this.turnoModal = detalleSeleccionado.turno || '';
    // 🔥 INICIALIZAR ARRAYS FILTRADOS PARA QUE LA CASCADA FUNCIONE AL EDITAR
    // Filtrar CECOs por turno seleccionado
    this.filteredCecosModal = this.cecos.filter(
      (c) => c.turno === this.turnoModal,
    );
    // Filtrar Labores por CECO seleccionado
    const cecoObj = this.cecos.find((c) => c.localname === this.cecoModal);
    this.filteredLaboresModal = this.labores.filter(
      (l) => l.ceco === (cecoObj?.costcenter || ''),
    );
    // 🔥 EN MODO EDICIÓN: NO FILTRAR PROYECTOS, MOSTRAR TODOS PARA PERMITIR EDICIÓN
    // La cascada funcionará cuando el usuario cambie Labor
    this.filteredProyectosModal = this.proyectos;
    console.log('📝 [Modal] Editando línea:', this.lineaTemp);
    console.log(
      '📊 [Modal] Arrays filtrados inicializados - CECOs:',
      this.filteredCecosModal.length,
      'Labores:',
      this.filteredLaboresModal.length,
      'Proyectos:',
      this.filteredProyectosModal.length,
    );
    this.modalAbierto = true;
  }

  // Guarda la edición de una línea de detalle ITEM en el array local
  guardarEdicionLinea(): void {
    if (this.editIndex === -1) {
      return;
    }
    // Actualizar la línea en el array detalles
    this.detalles[this.editIndex] = { ...this.lineaTemp };
    console.log('✅ [Modal] Línea actualizada en índice:', this.editIndex);
    // Cerrar modal y limpiar
    this.cerrarModal();
    // Mostrar mensaje de éxito
    this.alertService.showAlert(
      'Éxito',
      'Línea actualizada correctamente',
      'success',
    );
  }

  // Elimina una línea de detalle ITEM de Dexie y del array local
  async eliminarLinea(index: number) {
    // 1. ID del detalle a eliminar
    const detalle = this.detalles[index];
    const id = detalle.id;
    // 2. Eliminar de la tabla separada de detalles en Dexie
    if (id) {
      await this.dexieService.deleteDetalleRequerimiento(id);
    }
    // 3. Eliminar del array local que alimenta la tabla
    this.detalles.splice(index, 1);
    // 4. Actualizar el array embebido en el requerimiento actual
    this.requerimiento.detalle = [...this.detalles];
    // 5. Actualizar en Dexie el requerimiento con el nuevo detalle embebido
    if (this.requerimiento.id) {
      await this.dexieService.requerimientos.update(this.requerimiento.id, {
        detalle: this.detalles,
        modificado: 1,
      });
    }
    // 6. Actualizar también en la lista local de requerimientos
    const idx = this.requerimientos.findIndex(
      (r) => r.idrequerimiento === this.requerimiento.idrequerimiento,
    );
    if (idx >= 0) {
      this.requerimientos[idx].detalle = [...this.detalles];
    }
    // 7. Notificación
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  // Copia una línea de detalle ITEM existente para crear una nueva basada en ella
  copiarLinea(index: number): void {
    const detalleOriginal = this.detalles[index];
    // Buscar el producto en la lista de items por descripción
    const producto = this.items.find(
      (it) => it.descripcion === detalleOriginal.producto,
    );
    // Cargar en lineaTemp los datos copiados (sin id para que se cree como nueva)
    this.lineaTemp = {
      ...detalleOriginal,
      id: undefined, // Sin ID para que se guarde como nueva línea
      producto: producto ? { ...producto } : null,
    };
    // editIndex = -1 indica que es nueva línea (no edición)
    this.editIndex = -1;
    this.modalAbierto = true;
    this.alertService.mostrarInfo(
      'Línea copiada. Modifica los campos y guarda.',
    );
  }

  // Muestra el almacén de un requerimiento (Origen - Destino para TRANSFERENCIA)
  mostrarAlmacen(c: any): string {
    // TRANSFERENCIA → Origen - Destino
    if (c.itemtipo === 'TRANSFERENCIA') {
      const origen = this.almacenes.find((a) => a.idalmacen == c.idalmacen);
      const destino = this.alamcenesDestino.find(
        (a) => a.idalmacen == c.idalmacendestino,
      );
      return `${origen?.almacen ?? '---'} - ${destino?.almacen ?? '---'}`;
    }
    // CONSUMO / COMPRA
    const almacen = this.almacenes.find((a) => a.idalmacen == c.idalmacen);
    return almacen?.almacen ?? '---';
  }

  // Muestra el almacén de destino de un requerimiento TRANSFERENCIA
  mostrarAlmacenDestino(c: any): string {
    const destino = this.alamcenesDestino.find(
      (a) => a.idalmacen == c.idalmacendestino,
    );
    return destino?.almacen ?? '---';
  }

  // Obtiene el nombre del almacén por su ID
  getNombreAlmacen(id: string): string {
    const almacen = this.almacenes.find((a) => a.idalmacen == id);
    return almacen?.almacen ?? '---';
  }
  // async guardar() {
  //   if (!this.fundoSeleccionado) {
  //     this.alertService.showAlert(
  //       'Atención',
  //       'Debes seleccionar un Fundo antes de guardar.',
  //       'warning'
  //     );
  //     return;
  //   }
  //   // 2️⃣ Validación según tipo:
  //   // ✔ Para CONSUMO y COMPRA → almacenSeleccionado es obligatorio
  //   if (
  //     (this.TipoSelecionado === 'CONSUMO' ||
  //       this.TipoSelecionado === 'COMPRA') &&
  //     !this.almacenSeleccionado
  //   ) {
  //     this.alertService.showAlert(
  //       'Atención',
  //       'Debes seleccionar un Almacén antes de guardar.',
  //       'warning'
  //     );
  //     return;
  //   }
  //   // ✔ Para TRANSFERENCIA → validar Origen y Destino
  //   if (this.TipoSelecionado === 'TRANSFERENCIA') {
  //     if (!this.almacenOrigen) {
  //       this.alertService.showAlert(
  //         'Atención',
  //         'Debes seleccionar un Almacén Origen antes de guardar.',
  //         'warning'
  //       );
  //       return;
  //     }
  //     if (!this.almacenDestino) {
  //       this.alertService.showAlert(
  //         'Atención',
  //         'Debes seleccionar un Almacén Destino antes de guardar.',
  //         'warning'
  //       );
  //       return;
  //     }
  //   }
  //   if (!this.clasificacionSeleccionado) {
  //     this.alertService.showAlert(
  //       'Atención',
  //       'Debes seleccionar una clasificación antes de guardar.',
  //       'warning'
  //     );
  //     return;
  //   }
  //   if (!this.glosa) {
  //     this.alertService.showAlert(
  //       'Atención',
  //       'Debes ingresar una glosa antes de guardar.',
  //       'warning'
  //     );
  //     return;
  //   }
  //   try {
  //     // 🔹 Mostrar modal de carga
  //     this.alertService.mostrarModalCarga();
  //     // 🔹 Simulación del guardado (aquí reemplaza por tu lógica real)
  //     await new Promise((resolve) => setTimeout(resolve, 1500)); // simulación de espera
  //     // 🔹 Cerrar modal de carga
  //     this.alertService.cerrarModalCarga();
  //     const almacenOrigenObj = this.almacenes.find(
  //       (a) => a.idalmacen == this.almacenOrigen
  //     );
  //     const almacenDestinoObj = this.almacenes.find(
  //       (a) => a.idalmacen == this.almacenDestino
  //     );
  //     const almacenNormalObj = this.almacenes.find(
  //       (a) => a.idalmacen == this.almacenSeleccionado
  //     );
  //     // 🔎 Convertir la descripción almacen → ID solo para sincronizar
  //     const almacenEncontrado = this.almacenes.find(
  //       (a) => a.almacen === this.requerimiento.almacen
  //     );
  //     const idAlmacenSincronizado = almacenEncontrado
  //       ? almacenEncontrado.idalmacen
  //       : this.requerimiento.idalmacen;
  //     // =========================
  //     // ID ALMACÉN FINAL (CLAVE)
  //     // =========================
  //     const idAlmacenFinal =
  //       this.TipoSelecionado === 'TRANSFERENCIA'
  //         ? this.almacenOrigen
  //         : this.almacenSeleccionado;
  //     // =========================
  //     // 3️⃣ GENERAR ID ÚNICO
  //     // =========================
  //     const idReq =
  //       this.usuario.sociedad +
  //       this.usuario.documentoidentidad +
  //       this.utilsService.formatoAnioMesDiaHoraMinSec() +
  //       String(new Date().getMilliseconds()).padStart(3, '0');
  //     // 3️⃣ Crear requerimiento
  //     // this.requerimiento.idrequerimiento =
  //     //   this.usuario.ruc +
  //     //   idAlmacenSincronizado +
  //     //   this.usuario.documentoidentidad +
  //     //   this.utilsService.formatoAnioMesDiaHoraMinSec();
  //     this.requerimiento.idrequerimiento = idReq;
  //     this.requerimiento.ruc = this.usuario.ruc;
  //     this.requerimiento.idfundo = this.fundoSeleccionado;
  //     this.requerimiento.idarea = this.areaSeleccionada;
  //     this.requerimiento.idclasificacion = this.clasificacionSeleccionado;
  //     this.requerimiento.nrodocumento = this.usuario.documentoidentidad;
  //     this.requerimiento.idalmacen = String(idAlmacenFinal);
  //     this.requerimiento.idalmacendestino =
  //       this.TipoSelecionado === 'TRANSFERENCIA'
  //         ? String(this.almacenDestino)
  //         : '';
  //     this.requerimiento.idproyecto = this.proyectoSeleccionado
  //       ? String(this.proyectoSeleccionado)
  //       : '';
  //     this.requerimiento.fecha = new Date().toISOString();
  //     // mostrar en la tabla tal como pediste
  //     this.requerimiento.almacen =
  //       this.TipoSelecionado === 'TRANSFERENCIA'
  //         ? `${almacenOrigenObj?.almacen} → ${almacenDestinoObj?.almacen}`
  //         : `${almacenNormalObj?.almacen}`;
  //     this.requerimiento.glosa = this.glosa;
  //     this.requerimiento.detalle = this.detalles;
  //     this.requerimiento.prioridad = this.SeleccionaPrioridadITEM;
  //     this.requerimiento.tipo = 'ITEM';
  //     this.requerimiento.itemtipo = this.TipoSelecionado;
  //     this.requerimiento.referenciaGasto = this.SeleccionaTipoGasto;
  //     console.log('Requerimiento', this.requerimiento);
  //     // 4️⃣ Guardar requerimiento en Dexie
  //     this.requerimiento.estado = 0; // 👈 CLAVE
  //     // 4️⃣ Guardar requerimiento en Dexie
  //     const requerimientoId = await this.dexieService.requerimientos.put(
  //       this.requerimiento
  //     );
  //     // =========================
  //     // 6️⃣ GUARDAR DETALLE (ESTO ES LO QUE FALTABA)
  //     // =========================
  //     for (const d of this.detalles) {
  //       await this.dexieService.detalles.put({
  //         ...d,
  //         idrequerimiento: idReq, // 🔥 FK REAL
  //       });
  //     }
  //     console.log('Guardando parámetros:', {
  //       fundo: this.fundoSeleccionado,
  //       almacen: this.almacenSeleccionado,
  //       idalmacen: idAlmacenSincronizado,
  //       ceco: this.cecoSeleccionado,
  //       proyecto: this.proyectoSeleccionado,
  //       clasificacion: this.clasificacionSeleccionado,
  //       area: this.areaSeleccionada,
  //       usuario: this.usuario?.nombre || 'Desconocido',
  //     });
  //     // ✅ Si estás editando, actualiza la lista en memoria
  //     if (this.modoEdicion) {
  //       const index = this.requerimientos.findIndex(
  //         (r) => r.idrequerimiento === this.requerimiento.idrequerimiento
  //       );
  //       if (index !== -1) {
  //         this.requerimientos[index] = { ...this.requerimiento };
  //       }
  //       this.modoEdicion = false;
  //     } else {
  //       // ✅ Si es nuevo, agrégalo normalmente
  //       this.requerimientos.push({ ...this.requerimiento });
  //       this.ordenarRequerimientos(); // 👈 CLAVE
  //     }
  //     this.actualizarContadores();
  //     this.mostrarFormulario = false;
  //     await this.cargarPendientes();
  //     const req = idReq.slice(-12);
  //     // 🔹 Mostrar éxito
  //     this.alertService.showAlert(
  //       'Éxito',
  //       `Requerimiento #${req} guardado correctamente.`,
  //       'success'
  //     );
  //     // 5️⃣ Limpiar formulario
  //     this.detalles = [];
  //     this.almacenSeleccionado = '';
  //     this.areaSeleccionada = '';
  //     this.clasificacionSeleccionado = '';
  //     this.glosa = '';
  //   } catch (err) {
  //     console.error('❌ Error al guardar parámetros:', err);
  //     // Cerrar modal y mostrar error
  //     this.alertService.cerrarModalCarga();
  //     this.modoEdicion = false;
  //     this.mostrarFormulario = false;
  //     this.modalAbierto = false;
  //     this.alertService.showAlert(
  //       'Error',
  //       'Ocurrió un error al guardar los parámetros.',
  //       'error'
  //     );
  //   }
  // }
  async guardar() {
    // 1️⃣ Validaciones iniciales
    if (!this.fundoSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Fundo antes de guardar.',
        'warning',
      );
      return;
    }
    if (
      (this.TipoSelecionado === 'CONSUMO' ||
        this.TipoSelecionado === 'COMPRA') &&
      !this.almacenSeleccionado
    ) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Almacén antes de guardar.',
        'warning',
      );
      return;
    }
    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      if (!this.almacenOrigen) {
        this.alertService.showAlert(
          'Atención',
          'Debes seleccionar un Almacén Origen antes de guardar.',
          'warning',
        );
        return;
      }
      if (!this.almacenDestino) {
        this.alertService.showAlert(
          'Atención',
          'Debes seleccionar un Almacén Destino antes de guardar.',
          'warning',
        );
        return;
      }
    }
    if (!this.clasificacionSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar una clasificación antes de guardar.',
        'warning',
      );
      return;
    }
    if (!this.glosa) {
      this.alertService.showAlert(
        'Atención',
        'Debes ingresar una glosa antes de guardar.',
        'warning',
      );
      return;
    }
    try {
      // 🔹 Mostrar modal de carga
      this.alertService.mostrarModalCarga();
      // 🔹 Preparar objetos de almacén
      const almacenOrigenObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenOrigen,
      );
      const almacenDestinoObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenDestino,
      );
      const almacenNormalObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenSeleccionado,
      );
      const idAlmacenFinal =
        this.TipoSelecionado === 'TRANSFERENCIA'
          ? this.almacenOrigen
          : this.almacenSeleccionado;
      // 🔹 Función ultra-segura para generar ID único
      // const generarIdUnico = () => {
      //   const timestamp = Date.now(); // milisegundos
      //   this.contadorReq++; // contador incremental por sesión
      //   const random3 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      //   return `${this.usuario.sociedad}${this.usuario.documentoidentidad}${timestamp}${this.contadorReq}${random3}`;
      // };
      const generarIdUnico = () => {
        return (
          this.usuario.sociedad +
          this.usuario.documentoidentidad +
          this.utilsService.formatoAnioMesDiaHoraMinSec() //+
          // String(Math.floor(Math.random() * 1000)).padStart(3, '0')
        );
      };
      // 🔹 Crear nuevo objeto de requerimiento
      const idReq = generarIdUnico();
      const nuevoReq: Requerimiento = {
        idrequerimiento: idReq,
        ruc: this.usuario.ruc,
        idfundo: this.fundoSeleccionado,
        idarea: this.areaSeleccionada || '',
        idclasificacion: this.clasificacionSeleccionado,
        nrodocumento: this.usuario.documentoidentidad,
        idalmacen: String(idAlmacenFinal),
        idalmacendestino:
          this.TipoSelecionado === 'TRANSFERENCIA'
            ? String(this.almacenDestino)
            : '',
        idproyecto: this.proyectoSeleccionado
          ? String(this.proyectoSeleccionado)
          : '',
        fecha: new Date().toISOString(),
        almacen:
          this.TipoSelecionado === 'TRANSFERENCIA'
            ? `${almacenOrigenObj?.almacen} → ${almacenDestinoObj?.almacen}`
            : `${almacenNormalObj?.almacen}`,
        glosa: this.glosa,
        detalle: this.detalles,
        prioridad: this.SeleccionaPrioridadITEM,
        tipo: 'ITEM',
        itemtipo: this.TipoSelecionado,
        referenciaGasto: this.SeleccionaTipoGasto || '',
        estado: 0,
        estados: 'PENDIENTE',
        disabled: false,
        checked: false,
        eliminado: 0,
        despachado: false,
      };
      // 🔹 Guardar requerimiento en Dexie
      await this.dexieService.requerimientos.put(nuevoReq);
      // 🔹 Guardar detalle con FK correcta
      for (const d of this.detalles) {
        await this.dexieService.detalles.put({
          ...d,
          idrequerimiento: idReq,
        });
      }
      // 🔹 Integración con Sistema de Aprobaciones por Área
      try {
        // Solo registrar aprobaciones si tiene área asignada y es tipo COMPRA o CONSUMO
        if (
          nuevoReq.idarea &&
          (nuevoReq.itemtipo === 'COMPRA' || nuevoReq.itemtipo === 'CONSUMO')
        ) {
          // 1. Registrar el requerimiento en el sistema de aprobaciones
          const dataRegistro = {
            ruc: nuevoReq.ruc,
            idrequerimiento: nuevoReq.idrequerimiento,
            idarea: Number(nuevoReq.idarea),
            tipoRequerimiento: nuevoReq.itemtipo,
            descripcion: nuevoReq.glosa,
            usuarioSolicitud: this.usuario.documentoidentidad,
            glosa: nuevoReq.glosa,
            monto: 0, // El monto se puede calcular luego si se necesita
          };
          await this.aprobacionesAreaService
            .registrarRequerimiento(dataRegistro)
            .toPromise();
          // 2. Asignar aprobadores automáticamente
          const dataAsignacion = {
            ruc: nuevoReq.ruc,
            idrequerimiento: nuevoReq.idrequerimiento,
            idarea: Number(nuevoReq.idarea),
            tipoRequerimiento: nuevoReq.itemtipo,
            usuarioSolicitud: this.usuario.documentoidentidad,
          };
          await this.aprobacionesAreaService
            .asignarAprobadoresRequerimiento(dataAsignacion)
            .toPromise();
          console.log(
            '✅ Requerimiento registrado en sistema de aprobaciones por área',
          );
        }
      } catch (error) {
        console.error(
          '⚠️ Error al registrar en sistema de aprobaciones:',
          error,
        );
        // No fallamos el guardado principal, solo lo registramos en consola
      }
      // 🔹 Agregar a la lista en memoria
      this.requerimientos.push({ ...nuevoReq });
      this.ordenarRequerimientos();
      this.actualizarContadores();
      // 🔹 Limpiar formulario
      this.detalles = [];
      this.almacenSeleccionado = '';
      this.areaSeleccionada = '';
      this.clasificacionSeleccionado = '';
      this.glosa = '';
      this.mostrarFormulario = false;
      // 🔹 Mostrar éxito
      const reqShort = idReq.slice(-12);
      this.alertService.showAlert(
        'Éxito',
        `Requerimiento #${reqShort} guardado correctamente.`,
        'success',
      );
      console.log('Requerimiento guardado:', nuevoReq);
    } catch (err) {
      console.error('❌ Error al guardar:', err);
      this.alertService.cerrarModalCarga();
      this.modoEdicion = false;
      this.mostrarFormulario = false;
      this.modalAbierto = false;
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar los parámetros.',
        'error',
      );
    } finally {
      this.alertService.cerrarModalCarga();
    }
  }

  // Obtiene los últimos 12 caracteres del ID de requerimiento para mostrar
  obtenerIdReq(idReq: string): string {
    if (!idReq) return '';
    return idReq.slice(-12); // YYMMDDhhmmss
  }

  // Guarda la edición de un requerimiento ITEM existente en Dexie
  async guardarEdicion() {
    try {
      // solo actualizamos los campos editables
      const index = this.requerimientos.findIndex(
        (r) => r.idrequerimiento === this.requerimiento.idrequerimiento,
      );
      if (index === -1) {
        console.error('No se encontró el requerimiento a editar');
        return;
      }
      // Actualizar valores que sí pueden cambiar
      this.requerimientos[index].idfundo = this.fundoSeleccionado;
      this.requerimientos[index].idarea = this.areaSeleccionada;
      this.requerimientos[index].idalmacen = this.almacenSeleccionado;
      this.requerimientos[index].glosa = this.glosa;
      this.requerimientos[index].prioridad = this.SeleccionaPrioridadITEM;
      this.requerimientos[index].itemtipo = this.TipoSelecionado;
      this.requerimientos[index].referenciaGasto = this.SeleccionaTipoGasto;
      if (this.TipoSelecionado === 'TRANSFERENCIA') {
        this.requerimientos[index].idalmacen = String(this.almacenOrigen);
        this.requerimientos[index].idalmacendestino = String(
          this.almacenDestino,
        );
        this.requerimientos[index].almacen = `${this.getAlmacenNombre(
          this.almacenOrigen,
        )} → ${this.getAlmacenNombre(this.almacenDestino)}`;
      } else {
        this.requerimientos[index].idalmacen = String(this.almacenSeleccionado);
        this.requerimientos[index].idalmacendestino = '';
        this.requerimientos[index].almacen = this.getAlmacenNombre(
          this.almacenSeleccionado,
        );
      }
      this.requerimientos[index].detalle = [...this.detalles];
      // ============================
      // 🔥 MARCAR COMO MODIFICADO
      // ============================
      this.requerimientos[index].modificado = 1;
      // (opcional pero recomendado)
      // Si ya estaba enviado, permitir reenvío
      if (this.requerimientos[index].estado === 1) {
        this.requerimientos[index].estado = 0;
      }
      // GUARDAR EN DEXIE
      await this.dexieService.saveRequerimiento(this.requerimientos[index]);
      this.actualizarContadores();
      this.alertService.showAlert(
        'Actualizado',
        'Requerimiento actualizado correctamente',
        'success',
      );
      this.modoEdicion = false;
      this.mostrarFormulario = false;
    } catch (error) {
      console.error('Error al actualizar', error);
      this.alertService.showAlert('Error', 'No se pudo actualizar', 'error');
    }
  }

  // Obtiene el nombre del almacén por su ID
  getAlmacenNombre(id: string) {
    return this.almacenes.find((a) => a.idalmacen == id)?.almacen || '';
  }

  // Cancela la edición/creación del requerimiento y reinicia el formulario
  cancelar(): void {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.',
    );
    if (!confirmar) return;
    this.cultivoSeleccionado = '';
    this.SeleccionaPrioridadITEM = '';
    this.SeleccionaTipoGasto = '';
    console.log('Formulario de parámetros reiniciado');
    this.alertService.mostrarInfo('Los cambios han sido cancelados.');
  }

  // Edita un requerimiento ITEM existente cargándolo en el formulario
  editarRequerimiento(index: number) {
    const req: any = this.requerimientos[index]; // 👈 cast local SOLO aquí
    this.requerimiento = { ...req };
    this.requerimiento.id = req.id;
    // 🔥 puente sin romper interfaces
    this.requerimiento.detalle = req.detalle ?? req.detalles ?? [];
    // this.requerimiento = { ...this.requerimientos[index] };
    // this.requerimiento.id = this.requerimientos[index].id; // 🔥 Necesario para update()
    this.detalles = this.requerimiento.detalle;
    // this.detalles = this.requerimiento.detalles || [];
    // Cargar los campos en los selects principales
    this.fundoSeleccionado = this.requerimiento.idfundo;
    this.areaSeleccionada = this.requerimiento.idarea;
    this.SeleccionaPrioridadITEM = this.requerimiento.prioridad as
      | PrioridadSpring
      | '';
    this.almacenSeleccionado = this.requerimiento.idalmacen;
    this.clasificacionSeleccionado = this.requerimiento.idclasificacion;
    this.glosa = this.requerimiento.glosa;
    this.SeleccionaTipoGasto = this.requerimiento.referenciaGasto;
    this.TipoSelecionado = this.requerimiento.itemtipo as
      | TipoRequerimiento
      | '';
    this.almacenOrigen = this.requerimiento.idalmacen;
    this.almacenDestino = this.requerimiento.idalmacendestino;
    // Mostrar el formulario principal
    this.modoEdicion = true; // 🔹 Activamos modo edición
    this.mostrarFormulario = true;
    this.modalAbierto = false; // aseguramos que el modal detalle no esté abierto
    // 👉 Vuelve a asignar almacén cuando cargue lista (por si idalmacen viene vacío)
    this.reasignarAlmacenDesdeDescripcion();
  }

  // Reasigna el almacén basándose en la descripción cuando se edita un requerimiento
  reasignarAlmacenDesdeDescripcion() {
    if (!this.almacenes || this.almacenes.length === 0) return;
    // Si ya hay ID, no se hace nada
    if (this.requerimiento.idalmacen && this.requerimiento.idalmacen !== '') {
      this.almacenSeleccionado = this.requerimiento.idalmacen;
      return;
    }
    // Buscar por texto del almacén
    const alm = this.almacenes.find(
      (a) => a.almacen === this.requerimiento.almacen,
    );
    if (alm) {
      this.almacenSeleccionado = alm.idalmacen;
    }
    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      const partes = this.requerimiento.almacen.split('→').map((p) => p.trim());
      if (partes.length === 2) {
        const origen = this.almacenes.find((a) => a.almacen === partes[0]);
        const destino = this.alamcenesDestino.find(
          (a) => a.almacen === partes[1],
        );
        if (origen) {
          this.almacenOrigen = origen.idalmacen;
        }
        if (destino) {
          this.almacenDestino = destino.idalmacen;
        }
      }
    }
  }

  // Elimina un requerimiento ITEM de Dexie y del array local
  async eliminarRequerimiento(index: number) {
    // debugger;
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning',
    );
    if (!confirmacion) return;
    try {
      const req = this.requerimientos[index];
      // 1️⃣ Eliminar solo ese requerimiento en Dexie
      await this.dexieService.deleteRequerimiento(req.idrequerimiento);
      // 2️⃣ Eliminar del array local sin recargar toda la BD
      this.requerimientos.splice(index, 1);
      // 3️⃣ Notificar
      this.alertService.showAlert(
        'Éxito',
        'Requerimiento eliminado correctamente.',
        'success',
      );
    } catch (error) {
      console.error('Error al eliminar requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar el requerimiento.',
        'error',
      );
    }
  }

  // Copia un requerimiento ITEM existente para crear uno nuevo basado en él
  copiarRequerimiento(index: number) {
    const reqOriginal: any = this.requerimientos[index];
    // Generar nuevo ID único para el requerimiento copiado
    const nuevoId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    // Copiar cabecera del requerimiento (sin id para que sea nuevo)
    this.requerimiento = {
      ...reqOriginal,
      id: undefined,
      idrequerimiento: nuevoId,
      fecha: new Date(),
      estados: 'PENDIENTE',
      estado: 0,
      checked: false,
      eliminado: 0,
      despachado: false,
    };
    // Copiar detalles (sin ids para que sean nuevos)
    const detallesOriginales =
      reqOriginal.detalle ?? reqOriginal.detalles ?? [];
    this.detalles = detallesOriginales.map((det: any) => ({
      ...det,
      id: undefined,
      idrequerimiento: nuevoId,
      estado: 0,
    }));
    this.requerimiento.detalle = this.detalles;
    // Cargar los campos en los selects principales
    this.fundoSeleccionado = this.requerimiento.idfundo;
    this.areaSeleccionada = this.requerimiento.idarea;
    this.SeleccionaPrioridadITEM = this.requerimiento.prioridad as
      | PrioridadSpring
      | '';
    this.almacenSeleccionado = this.requerimiento.idalmacen;
    this.clasificacionSeleccionado = this.requerimiento.idclasificacion;
    this.glosa = this.requerimiento.glosa + ' (Copia)';
    this.SeleccionaTipoGasto = this.requerimiento.referenciaGasto;
    this.TipoSelecionado = this.requerimiento.itemtipo as
      | TipoRequerimiento
      | '';
    this.almacenOrigen = this.requerimiento.idalmacen;
    this.almacenDestino = this.requerimiento.idalmacendestino;
    // Mostrar el formulario en modo NUEVO (no edición)
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.modalAbierto = false;
    this.alertService.mostrarInfo(
      'Requerimiento copiado. Modifica los campos y guarda como nuevo.',
    );
  }

  // Copia un requerimiento seleccionado desde la tabla (cuando se usa selección múltiple)
  copiarRequerimientoSelect(dataSelected: any[]) {
    if (!dataSelected || dataSelected.length === 0) {
      this.alertService.showAlert(
        'Advertencia',
        'Seleccione un requerimiento para copiar.',
        'warning',
      );
      return;
    }
    if (dataSelected.length > 1) {
      this.alertService.showAlert(
        'Advertencia',
        'Solo puede copiar un requerimiento a la vez.',
        'warning',
      );
      return;
    }
    // Buscar el índice del requerimiento seleccionado
    const reqSeleccionado = dataSelected[0];
    const index = this.requerimientos.findIndex(
      (r) => r.idrequerimiento === reqSeleccionado.idrequerimiento,
    );
    if (index >= 0) {
      this.copiarRequerimiento(index);
    }
  }

  // ============================================
  // VALIDACIÓN DE STOCK ANTES DE SINCRONIZAR
  // ============================================
  // Valida el stock disponible para un requerimiento de tipo CONSUMO antes de sincronizar
  async validarStockRequerimiento(requerimiento: any): Promise<boolean> {
    // Solo validar para tipo CONSUMO (los que consumen stock del almacén)
    if (requerimiento.itemtipo !== 'CONSUMO') {
      return true; // No requiere validación de stock
    }
    // Si el usuario ya eligió continuar con cantidad solicitada, omitir validación
    if (
      this.requerimientosOmitirValidacion.has(requerimiento.idrequerimiento)
    ) {
      return true;
    }
    const idalmacen = requerimiento.idalmacen;
    const detalles = requerimiento.detalle || [];
    if (!idalmacen || detalles.length === 0) {
      return true;
    }
    // Preparar items para validar
    const itemsParaValidar = detalles.map((d: any) => ({
      codigo: d.codigo,
      producto: d.producto || d.idproducto,
      cantidad: d.cantidad,
    }));
    this.validandoStock = true;
    return new Promise((resolve) => {
      this.requerimientosService
        .validarStockItems(idalmacen, itemsParaValidar)
        .subscribe({
          next: (resp) => {
            this.validandoStock = false;
            const resultado = resp || [];
            // Verificar si hay items con stock insuficiente
            const itemsSinStock = resultado.filter(
              (item: any) =>
                item.estadoStock === 'SIN_STOCK' ||
                item.estadoStock === 'PARCIAL',
            );
            if (itemsSinStock.length > 0) {
              // Hay items con stock insuficiente, mostrar modal
              this.itemsStockValidacion = resultado;
              this.requerimientoValidandoStock = requerimiento;
              this.modalStockAbierto = true;
              resolve(false); // No continuar con sincronización automática
            } else {
              resolve(true); // Todo OK, continuar
            }
          },
          error: (err) => {
            this.validandoStock = false;
            console.error('Error al validar stock:', err);
            // En caso de error, permitir continuar (el backend validará)
            resolve(true);
          },
        });
    });
  }

  // Confirma el ajuste de stock y muestra opciones al usuario cuando hay stock insuficiente
  async confirmarAjusteStock() {
    if (!this.requerimientoValidandoStock) return;
    // Verificar si TODOS los items tienen stock 0
    const todosConStockCero = this.itemsStockValidacion.every(
      (item: any) =>
        item.cantidadAjustada === 0 || item.estadoStock === 'SIN_STOCK',
    );
    if (todosConStockCero) {
      // Construir mensaje con detalle de stock
      let mensajeStock =
        'Todos los items del requerimiento no tienen stock disponible:<br><br>';
      mensajeStock +=
        '<table style="width:100%; font-size:0.85rem; border-collapse:collapse;">';
      mensajeStock +=
        '<tr style="background:#f8f9fa;"><th style="padding:4px; border:1px solid #dee2e6;">Producto</th><th style="padding:4px; border:1px solid #dee2e6; text-align:center;">Solicitado</th><th style="padding:4px; border:1px solid #dee2e6; text-align:center;">Stock</th></tr>';
      for (const item of this.itemsStockValidacion) {
        mensajeStock += `<tr><td style="padding:4px; border:1px solid #dee2e6;">${item.producto}</td><td style="padding:4px; border:1px solid #dee2e6; text-align:center;">${item.cantidadSolicitada}</td><td style="padding:4px; border:1px solid #dee2e6; text-align:center; color:red;">${item.stockDisponible}</td></tr>`;
      }
      mensajeStock += '</table><br>¿Qué desea hacer?';
      // Mostrar opciones: continuar, editar, eliminar o cancelar
      const resultado = await this.alertService.showFourButtons(
        'Sin Stock Disponible',
        mensajeStock,
        'warning',
        'Continuar con Cantidad Solicitada',
        'Editar Productos',
        'Eliminar Requerimiento',
        'Cancelar',
      );
      if (resultado === 'button1') {
        // Usuario quiere continuar con la cantidad solicitada sin ajustar
        const idReq = this.requerimientoValidandoStock.idrequerimiento;
        this.requerimientosOmitirValidacion.add(idReq);
        this.cerrarModalStock();
        await this.sincronizarPendientes();
        return;
      } else if (resultado === 'button2') {
        // Usuario quiere editar productos - abrir el requerimiento y modal de edición de línea
        const idReqEditar = this.requerimientoValidandoStock.idrequerimiento;
        this.cerrarModalStock();
        const idx = this.requerimientos.findIndex(
          (r) => r.idrequerimiento === idReqEditar,
        );
        if (idx >= 0) {
          this.editarRequerimiento(idx);
          // Abrir modal de edición de la primera línea después de que el formulario cargue
          setTimeout(() => {
            if (this.detalles && this.detalles.length > 0) {
              this.editIndex = 0;
              const detalleSeleccionado = this.detalles[0];
              const producto = this.items.find(
                (it) => it.descripcion === detalleSeleccionado.producto,
              );
              this.lineaTemp = {
                ...detalleSeleccionado,
                producto: producto ? { ...producto } : null,
              };
              this.modalAbierto = true;
            } else {
              // Si no hay detalles, abrir modal para agregar nueva línea
              this.modalAbierto = true;
            }
          }, 500);
        }
        return;
      } else if (resultado === 'button3') {
        // Usuario quiere eliminar el requerimiento
        try {
          const idReq = this.requerimientoValidandoStock.idrequerimiento;
          // Si el requerimiento ya fue sincronizado al backend, marcarlo como eliminado
          if (idReq && idReq.length > 10) {
            // Tiene un ID válido del backend, eliminar también del servidor
            const bodyEliminar = {
              idrequerimiento: idReq,
              eliminado: 1,
              dnielimina: this.usuario?.documentoidentidad || '',
            };
            this.requerimientosService
              .eliminarRequerimiento(bodyEliminar)
              .subscribe({
                next: async () => {
                  // Éxito al eliminar en backend, ahora eliminar de Dexie
                  await this.dexieService.requerimientos.delete(
                    this.requerimientoValidandoStock.id,
                  );
                  // Eliminar de lista local
                  const idx = this.requerimientos.findIndex(
                    (r) => r.idrequerimiento === idReq,
                  );
                  if (idx >= 0) {
                    this.requerimientos.splice(idx, 1);
                  }
                  this.actualizarContadores();
                  await this.cargarPendientes();
                  this.alertService.mostrarInfo(
                    'Requerimiento eliminado por falta de stock.',
                  );
                  this.cerrarModalStock();
                },
                error: (err: any) => {
                  console.error('Error al eliminar en backend:', err);
                  this.alertService.showAlert(
                    'Error',
                    'No se pudo eliminar el requerimiento del servidor',
                    'error',
                  );
                  this.cerrarModalStock();
                },
              });
            return;
          }
          // Solo eliminar de Dexie (no fue sincronizado aún)
          await this.dexieService.requerimientos.delete(
            this.requerimientoValidandoStock.id,
          );
          // Eliminar de lista local
          const idx = this.requerimientos.findIndex(
            (r) =>
              r.idrequerimiento ===
              this.requerimientoValidandoStock.idrequerimiento,
          );
          if (idx >= 0) {
            this.requerimientos.splice(idx, 1);
          }
          // Actualizar contadores después de eliminar
          this.actualizarContadores();
          await this.cargarPendientes();
          this.alertService.mostrarInfo(
            'Requerimiento eliminado por falta de stock.',
          );
          this.cerrarModalStock();
          return;
        } catch (error) {
          console.error('Error al eliminar requerimiento:', error);
          this.alertService.showAlert(
            'Error',
            'No se pudo eliminar el requerimiento',
            'error',
          );
          this.cerrarModalStock();
          return;
        }
      } else {
        // Usuario canceló
        this.cerrarModalStock();
        return;
      }
    }
    // Ajustar las cantidades del requerimiento según el stock disponible
    const detalles = [...(this.requerimientoValidandoStock.detalle || [])];
    for (const itemStock of this.itemsStockValidacion) {
      const detalleIndex = detalles.findIndex(
        (d: any) => d.codigo === itemStock.codigo,
      );
      if (detalleIndex >= 0) {
        // Actualizar cantidad con la cantidad ajustada (stock disponible)
        detalles[detalleIndex].cantidad = itemStock.cantidadAjustada;
      }
    }
    // Filtrar items con cantidad 0 (sin stock)
    const detallesFiltrados = detalles.filter((d: any) => d.cantidad > 0);
    // Verificar si quedaron items después de filtrar
    if (detallesFiltrados.length === 0) {
      this.alertService.showAlert(
        'Sin Items',
        'No quedan items con stock disponible. El requerimiento no puede continuar.',
        'error',
      );
      this.cerrarModalStock();
      return;
    }
    // Actualizar requerimiento
    this.requerimientoValidandoStock.detalle = detallesFiltrados;
    const idReq = this.requerimientoValidandoStock.idrequerimiento;
    // Actualizar en DexieDB
    try {
      // 1. Actualizar el requerimiento con el detalle embebido
      await this.dexieService.requerimientos.update(
        this.requerimientoValidandoStock.id,
        {
          detalle: detallesFiltrados,
          modificado: 1,
        },
      );
      // 2. Sincronizar tabla separada de detalles
      const detallesExistentes = await this.dexieService.detalles
        .where('idrequerimiento')
        .equals(idReq)
        .toArray();
      if (detallesExistentes.length > 0) {
        // Si existen registros, actualizar/eliminar
        for (const detExistente of detallesExistentes) {
          if (!detExistente.id) continue; // Saltar si no tiene id
          const detalleActualizado = detallesFiltrados.find(
            (df: any) => df.codigo === detExistente.codigo,
          );
          if (detalleActualizado) {
            await this.dexieService.detalles.update(detExistente.id, {
              cantidad: detalleActualizado.cantidad,
            });
          } else {
            await this.dexieService.detalles.delete(detExistente.id);
          }
        }
      } else {
        // Si la tabla separada está vacía, agregar los detalles filtrados
        for (const det of detallesFiltrados) {
          await this.dexieService.detalles.add({
            ...det,
            idrequerimiento: idReq,
          });
        }
      }
      // Actualizar lista local
      const idx = this.requerimientos.findIndex(
        (r) => r.idrequerimiento === idReq,
      );
      if (idx >= 0) {
        this.requerimientos[idx].detalle = detallesFiltrados;
      }
      const itemsEliminados = detalles.length - detallesFiltrados.length;
      if (itemsEliminados > 0) {
        this.alertService.mostrarInfo(
          `Cantidades ajustadas. ${itemsEliminados} item(s) eliminado(s) por falta de stock.`,
        );
      } else {
        this.alertService.mostrarInfo(
          'Cantidades ajustadas según stock disponible.',
        );
      }
    } catch (error) {
      console.error('Error al actualizar requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudieron ajustar las cantidades',
        'error',
      );
      this.cerrarModalStock();
      return;
    }
    this.cerrarModalStock();
    // Continuar con sincronización
    await this.sincronizarPendientes();
  }

  // Cierra el modal de validación de stock y limpia las variables temporales
  cerrarModalStock() {
    this.modalStockAbierto = false;
    this.itemsStockValidacion = [];
    this.requerimientoValidandoStock = null;
  }

  // Obtiene la clase CSS para el badge de estado de stock
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

  // Obtiene el texto descriptivo para el estado de stock
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
  // ============================================
  // FIN VALIDACIÓN DE STOCK
  // ============================================

  // Abre el modal de consolidación para agrupar varios requerimientos
  abrirModalConsolidacion() {
    // tomamos todos los ATENDIDO_PARCIAL y GENERADO que tengan saldo > 0
    const pendientes = this.requerimientosItems.filter(
      (r) => r.estado === 'ATENDIDO_PARCIAL' || r.estado === 'GENERADO',
    );
    if (pendientes.length === 0) {
      alert('No hay requerimientos pendientes para consolidar');
      return;
    }
    // consolidamos en uno (puedes mostrar UI para seleccionar)
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

  // Marca/desmarca todos los requerimientos de la tabla para selección múltiple
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
  // simpleSelected(row: any) {
  //   if (row.checked) {
  //     if (!this.dataSelected.some((item: any) => item.idrequerimiento === row.idrequerimiento)) {
  //       // this.dataSelected.push(row);
  //       this.dataSelected = [row];
  //       // 🔥 CARGAR DETALLES DEL SELECCIONADO
  //       this.detalles = row.detalle
  //         ? row.detalle.map((d: any) => ({ ...d }))
  //         : [];
  //     }
  //   } else {
  //     this.dataSelected = this.dataSelected.filter((item: any) => item.idrequerimiento !== row.idrequerimiento);
  //     this.detalles = [];
  //   }
  //   this.allSelected = this.requerimientos.every((row: any) => row.checked);
  //   if (this.dataSelected.length === 0) {
  //     this.verBotones = false
  //   } else {
  //     this.verBotones = true;
  //   }
  // }
  // simpleSelected(row: any) {
  //   // Desmarcar todos
  //   // this.requerimientos.forEach(r => r.checked = false);
  //   // 🔁 Si ya estaba marcado → desmarcar todo
  //   if (row.checked) {
  //     this.requerimientos.forEach(r => r.checked = false);
  //     this.requerimientoActivo = null;
  //     this.detalles = [];
  //     this.dataSelected = [];
  //     this.verBotones = false;
  //     return;
  //   }
  //   this.requerimientos.forEach(r => r.checked = false);
  //   // Marcar el actual
  //   row.checked = true;
  //   // 🔥 ACTIVO (el que se muestra)
  //   this.requerimientoActivo = row;
  //   // 🔥 CARGAR DETALLES DEL ACTIVO
  //   this.detalles = row.detalle
  //     ? row.detalle.map((d: any) => ({ ...d }))
  //     : [];
  //   // Para botones
  //   this.dataSelected = [row];
  //   this.verBotones = true;
  // }

  // Maneja la selección única de un requerimiento ITEM
  simpleSelected(row: any) {
    // 🔁 Si se desmarca
    if (!row.checked) {
      this.requerimientos.forEach((r) => (r.checked = false));
      this.requerimientoActivo = null;
      this.detalles = [];
      this.dataSelected = [];
      this.verBotones = false;
      return;
    }
    // 🔒 Selección única
    this.requerimientos.forEach((r) => (r.checked = false));
    row.checked = true;
    // 🔥 Activo
    this.requerimientoActivo = row;
    // 🔥 Detalles
    this.detalles = row.detalle ? row.detalle.map((d: any) => ({ ...d })) : [];
    // 🔥 Botones
    this.dataSelected = [row];
    this.verBotones = true;
  }

  // Maneja el evento de cambio de checkbox para requerimientos ITEM (selección única)
  onCheckChange(event: Event, row: any) {
    const checked = (event.target as HTMLInputElement).checked;
    // 🔁 Siempre limpiar primero
    this.requerimientos.forEach((r) => (r.checked = false));
    if (!checked) {
      // ❌ Ninguno seleccionado
      this.requerimientoActivo = null;
      this.detalles = [];
      this.dataSelected = [];
      this.verBotones = false;
      return;
    }
    // ✅ Selección única
    row.checked = true;
    // 🔥 Activo
    this.requerimientoActivo = row;
    // 🔥 Detalles
    this.detalles = row.detalle ? row.detalle.map((d: any) => ({ ...d })) : [];
    // 🔥 Botones
    this.dataSelected = [row];
    this.verBotones = true;
  }

  // Maneja el evento de cambio de checkbox para requerimientos COMMODITY (selección única)
  onCheckChangeCommodity(event: Event, row: any) {
    const checked = (event.target as HTMLInputElement).checked;
    // 🔁 Siempre limpiar primero
    this.requerimientosCommodity.forEach((r) => (r.checked = false));
    if (!checked) {
      // ❌ Ninguno seleccionado
      this.requerimientoCommodityActivo = null;
      this.detalles = [];
      this.dataSelectedCommodity = [];
      this.verBotones = false;
      return;
    }
    // ✅ Selección única
    row.checked = true;
    // 🔥 Activo
    this.requerimientoCommodityActivo = row;
    // 🔥 Detalles
    this.detalles = row.detalle ? row.detalle.map((d: any) => ({ ...d })) : [];
    // 🔥 Botones
    this.dataSelectedCommodity = [row];
    this.verBotones = true;
  }

  // Maneja el evento de cambio de checkbox para requerimientos ACTIVO FIJO (selección única)
  onCheckChangeActivoFIjo(event: Event, row: any) {
    const checked = (event.target as HTMLInputElement).checked;
    // 🔁 Siempre limpiar primero
    this.requerimientosActivoFijo.forEach((r) => (r.checked = false));
    if (!checked) {
      // ❌ Ninguno seleccionado
      this.requerimientoActivoFijoActivo = null;
      this.detallesActivoFijo = [];
      this.dataSelectedActivoFijo = [];
      this.verBotones = false;
      return;
    }
    // ✅ Selección única
    row.checked = true;
    // 🔥 Activo
    this.requerimientoActivoFijoActivo = row;
    // 🔥 Detalles
    this.detallesActivoFijo = row.detalleActivoFijo
      ? row.detalleActivoFijo.map((d: any) => ({ ...d }))
      : [];
    // 🔥 Botones
    this.dataSelectedActivoFijo = [row];
    this.verBotones = true;
  }

  // Maneja el evento de cambio de checkbox para requerimientos ACTIVO FIJO MENOR (selección única)
  onCheckChangeActivoFIjoMenor(event: Event, row: any) {
    const checked = (event.target as HTMLInputElement).checked;
    // 🔁 Siempre limpiar primero
    this.requerimientosActivoFijoMenor.forEach((r) => (r.checked = false));
    if (!checked) {
      // ❌ Ninguno seleccionado
      this.requerimientoActivoFijoMenorActivo = null;
      this.detallesActivoFijoMenor = [];
      this.dataSelectedActivoFijoMenor = [];
      this.verBotonesActivoFijoMenor = false;
      return;
    }
    // ✅ Selección única
    row.checked = true;
    // 🔥 Activo
    this.requerimientoActivoFijoMenorActivo = row;
    // 🔥 Detalles
    this.detallesActivoFijoMenor = row.detalleActivoFijoMenor
      ? row.detalleActivoFijoMenor.map((d: any) => ({ ...d }))
      : [];
    // 🔥 Botones
    this.dataSelectedActivoFijoMenor = [row];
    this.verBotonesActivoFijoMenor = true;
  }

  // Formatea una fecha para mostrar en la tabla
  formatoFecha(date: any) {
    return this.utilsService.formatDate1(date);
  }

  // Desplaza el contenedor de botones hacia la izquierda
  scrollLeft() {
    const buttonsContainer = document.querySelector('.buttons') as HTMLElement;
    if (buttonsContainer) {
      buttonsContainer.scrollLeft -= 200; // Desplaza 200 píxeles hacia la izquierda
    }
  }

  // Desplaza el contenedor de botones hacia la derecha
  scrollRight() {
    const buttonsContainer = document.querySelector('.buttons') as HTMLElement;
    if (buttonsContainer) {
      buttonsContainer.scrollLeft += 200; // Desplaza 200 píxeles hacia la derecha
    }
  }

  // Edita un requerimiento ITEM seleccionado desde la tabla (cuando se usa selección múltiple)
  editarRequerimientoSelect(dataSelected: any[]) {
    if (!dataSelected || dataSelected.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar un requerimiento para editar',
        'warning',
      );
      return;
    }
    if (dataSelected.length > 1) {
      this.alertService.showAlert(
        'Atención',
        'Solo puede editar un requerimiento a la vez',
        'warning',
      );
      return;
    }
    const item = this.requerimientoActivo;
    this.requerimiento = { ...item };
    this.requerimiento.id = item.id; // necesario para update
    // this.detalles = item.detalle || [];
    // 🔥 Detalle (COPIA PROFUNDA)
    this.detalles = item.detalles
      ? item.detalles.map((d: any) => ({ ...d }))
      : [];
    console.log('Detalle del requerimiento a editar:', this.detalles);
    // Selects
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
    // UI
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.modalAbierto = false;
    this.reasignarAlmacenDesdeDescripcion();
  }

  // Edita un requerimiento COMMODITY seleccionado desde la tabla (cuando se usa selección múltiple)
  editarRequerimientoCommoditySelect(dataSelectedCommodity: any[]) {
    if (!dataSelectedCommodity || dataSelectedCommodity.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar un requerimiento para editar',
        'warning',
      );
      return;
    }
    if (dataSelectedCommodity.length > 1) {
      this.alertService.showAlert(
        'Atención',
        'Solo puede editar un requerimiento a la vez',
        'warning',
      );
      return;
    }
    const commodity = this.requerimientoCommodityActivo;
    this.requerimientoCommodity = { ...commodity };
    this.requerimiento.id = commodity.id; // necesario para update
    // this.detalles = item.detalle || [];
    // 🔥 Detalle (COPIA PROFUNDA)
    this.detallesCommodity = commodity.detalles
      ? commodity.detalles.map((d: any) => ({ ...d }))
      : [];
    console.log('Detalle del requerimiento a editar:', this.detallesCommodity);
    // Selects
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
    // UI
    this.modoEdicionCommodity = true;
    this.mostrarFormularioCommodity = true;
    this.modalAbiertoCommodity = false;
    // 🔥 Cargar opciones de prioridad para COMMODITY (usa las mismas que COMPRA)
    this.opcionesPrioridadCOMMODITY =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.reasignarAlmacenDesdeDescripcion();
  }

  // Edita un requerimiento ACTIVO FIJO seleccionado desde la tabla (cuando se usa selección múltiple)
  editarRequerimientoActivoFijoSelect(dataSelectedActivoFijo: any[]) {
    debugger;
    if (!dataSelectedActivoFijo || dataSelectedActivoFijo.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar un requerimiento para editar',
        'warning',
      );
      return;
    }
    if (dataSelectedActivoFijo.length > 1) {
      this.alertService.showAlert(
        'Atención',
        'Solo puede editar un requerimiento a la vez',
        'warning',
      );
      return;
    }
    const activofijo = this.requerimientoActivoFijoActivo;
    this.requerimientoActivoFijo = { ...activofijo };
    this.requerimiento.id = activofijo.id; // necesario para update
    // this.detalles = item.detalle || [];
    // 🔥 Detalle (COPIA PROFUNDA)
    this.detallesActivoFijo = activofijo.detalles
      ? activofijo.detalles.map((d: any) => ({ ...d }))
      : [];
    console.log('Detalle del requerimiento a editar:', this.detallesActivoFijo);
    // Selects
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
    // UI
    this.modoEdicionActivoFijo = true;
    this.mostrarFormularioActivoFijo = true;
    this.modalAbiertoActivoFijo = false;
    // 🔥 Cargar opciones de prioridad para ACTIVOFIJO (usa las mismas que COMPRA)
    this.opcionesPrioridadACTIVOFIJO =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.reasignarAlmacenDesdeDescripcion();
  }

  // Edita un requerimiento ACTIVO FIJO MENOR seleccionado desde la tabla (cuando se usa selección múltiple)
  editarRequerimientoActivoFijoMenorSelect(dataSelected: any[]) {
    if (!dataSelected || dataSelected.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar un requerimiento para editar',
        'warning',
      );
      return;
    }
    if (dataSelected.length > 1) {
      this.alertService.showAlert(
        'Atención',
        'Solo puede editar un requerimiento a la vez',
        'warning',
      );
      return;
    }
    const activofijomenor = this.requerimientoActivoFijoMenorActivo;
    this.requerimientoActivoFijoMenor = { ...activofijomenor };
    this.requerimiento.id = activofijomenor.id;
    // 🔥 Detalle (COPIA PROFUNDA)
    this.detallesActivoFijoMenor = activofijomenor.detalles
      ? activofijomenor.detalles.map((d: any) => ({ ...d }))
      : [];
    console.log(
      'Detalle del requerimiento a editar:',
      this.detallesActivoFijoMenor,
    );
    // Selects
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
    // UI
    this.modoEdicionActivoFijoMenor = true;
    this.mostrarFormularioActivoFijoMenor = true;
    this.modalAbiertoActivoFijoMenor = false;
    // 🔥 Cargar opciones de prioridad para ACTIVOFIJOMENOR (usa las mismas que COMPRA)
    this.opcionesPrioridadACTIVOFIJOMENOR =
      this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.reasignarAlmacenDesdeDescripcion();
  }

  // Elimina requerimientos ITEM seleccionados de Dexie y del array local
  async eliminarRequerimientoSelect(dataSelected: any[]) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning',
    );
    if (!confirmacion) return;
    dataSelected.forEach(async (item) => {
      try {
        await this.dexieService.deleteRequerimiento(item.idrequerimiento);
        const index = this.requerimientos.findIndex(
          (r) => r.idrequerimiento === item.idrequerimiento,
        );
        if (index !== -1) {
          this.requerimientos.splice(index, 1);
        }
        this.alertService.showAlert(
          'Éxito',
          'Requerimiento eliminado correctamente.',
          'success',
        );
        this.contarSinEnviar();
      } catch (error) {
        console.error('Error al eliminar requerimiento:', error);
        this.alertService.showAlert(
          'Error',
          'Ocurrió un error al eliminar el requerimiento.',
          'error',
        );
      }
    });
  }

  // Elimina requerimientos COMMODITY seleccionados de Dexie y del array local
  async eliminarRequerimientoCommoditySelect(dataSelected: any[]) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning',
    );
    if (!confirmacion) return;
    dataSelected.forEach(async (item) => {
      try {
        await this.dexieService.deleteRequerimiento(item.idrequerimiento);
        const index = this.requerimientosCommodity.findIndex(
          (r) => r.idrequerimiento === item.idrequerimiento,
        );
        if (index !== -1) {
          this.requerimientosCommodity.splice(index, 1);
        }
        this.alertService.showAlert(
          'Éxito',
          'Requerimiento eliminado correctamente.',
          'success',
        );
        this.contarSinEnviar();
      } catch (error) {
        console.error('Error al eliminar requerimiento:', error);
        this.alertService.showAlert(
          'Error',
          'Ocurrió un error al eliminar el requerimiento.',
          'error',
        );
      }
    });
  }

  // Elimina requerimientos ACTIVO FIJO seleccionados de Dexie y del array local
  async eliminarRequerimientoActivoFijoSelect(dataSelected: any[]) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning',
    );
    if (!confirmacion) return;
    dataSelected.forEach(async (item) => {
      try {
        await this.dexieService.deleteRequerimiento(item.idrequerimiento);
        const index = this.requerimientosActivoFijo.findIndex(
          (r) => r.idrequerimiento === item.idrequerimiento,
        );
        if (index !== -1) {
          this.requerimientosActivoFijo.splice(index, 1);
        }
        this.alertService.showAlert(
          'Éxito',
          'Requerimiento eliminado correctamente.',
          'success',
        );
        this.contarSinEnviar();
      } catch (error) {
        console.error('Error al eliminar requerimiento:', error);
        this.alertService.showAlert(
          'Error',
          'Ocurrió un error al eliminar el requerimiento.',
          'error',
        );
      }
    });
  }

  // Elimina requerimientos ACTIVO FIJO MENOR seleccionados de Dexie y del array local
  async eliminarRequerimientoActivoFijoMenorSelect(dataSelected: any[]) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning',
    );
    if (!confirmacion) return;
    dataSelected.forEach(async (item) => {
      try {
        await this.dexieService.deleteRequerimiento(item.idrequerimiento);
        const index = this.requerimientosActivoFijoMenor.findIndex(
          (r) => r.idrequerimiento === item.idrequerimiento,
        );
        if (index !== -1) {
          this.requerimientosActivoFijoMenor.splice(index, 1);
        }
        this.alertService.showAlert(
          'Éxito',
          'Requerimiento eliminado correctamente.',
          'success',
        );
        this.contarSinEnviar();
      } catch (error) {
        console.error('Error al eliminar requerimiento:', error);
        this.alertService.showAlert(
          'Error',
          'Ocurrió un error al eliminar el requerimiento.',
          'error',
        );
      }
    });
  }

  // Maneja la carga de un archivo Excel para importación masiva de detalles
  onExcelUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    // Limpia input para volver a subir el mismo archivo si hay error
    event.target.value = '';
    this.cargarExcel(file);
  }

  // Lee un archivo Excel y convierte las filas en objetos de detalle para previsualización
  async cargarExcel(file: File) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    this.lineasPreview = [];
    for (const r of rows) {
      const fila: DetalleExcelPreview = {
        codigo: r['Cod. Item'],
        descripcion: r['Descripcion Item'],
        cantidad: Number(r['Cantidad']),
        unidadMedida: r['Unidad Medida'] || 'UND', // Unidad de medida del producto
        turno: r['Turno'],
        activofijo: r['ActivoFijo'],
        proyecto: this.proyectoSeleccionado?.proyectoio ?? '',
        ceco: this.cecoSeleccionado?.localname ?? '',
        errores: [],
        error: false,
      };
      this.validarFila(fila);
      this.lineasPreview.push(fila);
    }
    // this.modalVisible = true;
    // 🔥 AQUÍ SE ABRE EL MODAL
    this.abrirModalCargaMasiva();
  }
  // ===============================
  // VALIDACIÓN POR FILA
  // ===============================
  // Valida una fila del Excel importado verificando código, cantidad, turno y activo fijo
  validarFila(row: DetalleExcelPreview) {
    row.errores = [];
    // CODIGO
    if (!row.codigo) {
      row.errores.push({ columna: 'Código', mensaje: 'Requerido' });
    } else {
      // const item = await this.dexieService.getItemByCodigo(row.codigo);
      const item = this.items.find((i) => i.codigo === row.codigo);
      if (!item) {
        row.errores.push({
          columna: 'Código',
          mensaje: 'No existe en almacén',
        });
      }
    }
    // CANTIDAD
    if (!row.cantidad || row.cantidad <= 0) {
      row.errores.push({ columna: 'Cantidad', mensaje: 'Debe ser mayor a 0' });
    }
    // TURNO
    if (!row.turno) {
      row.errores.push({ columna: 'Turno', mensaje: 'Requerido' });
    }
    // ACTIVO FIJO
    if (row.activofijo && row.activofijo.toString().trim() !== '') {
      const activoExiste = this.activosFijos.some(
        (af) => af.activo === row.activofijo,
      );
      if (!activoExiste) {
        row.errores.push({
          columna: 'ActivoFijo',
          mensaje: 'No existe el activo fijo',
        });
      }
    }
    row.error = row.errores.length > 0;
    // validar todas al cargar
    // this.lineasPreview.forEach(row => this.validarFila(row));
    this.tieneErroresExcel = this.lineasPreview.some(
      (r) => r.errores.length > 0,
    );
    this.actualizarEstadoGuardar();
  }

  // Actualiza el estado del botón guardar según si hay errores en las filas del Excel
  actualizarEstadoGuardar() {
    this.puedeGuardar = !this.lineasPreview.some((l) => l.error);
  }
  // ===============================
  // GUARDAR
  // ===============================
  // Guarda los detalles importados del Excel en el array de detalles del requerimiento
  guardarDetalleMasivo() {
    if (!this.puedeGuardar) {
      this.alertService.showAlertError(
        'Error',
        'Existen errores, corríjalos antes de guardar',
      );
      return;
    }
    // Aquí armas el DetalleRequerimiento real
    const detalleFinal = this.lineasPreview.map((l) => ({
      codigo: l.codigo,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      unidadMedida: l.unidadMedida || 'UND', // Unidad de medida del producto
      turno: l.turno,
      proyecto: l.proyecto,
      ceco: l.ceco,
      estado: 0,
    }));
    console.log('DETALLE A GUARDAR', detalleFinal);
    const nuevosDetalles: DetalleRequerimiento[] = this.lineasPreview.map(
      (l) => ({
        idrequerimiento: '', // se asignará al guardar cabecera
        codigo: l.codigo,
        producto: l.descripcion, // o el objeto producto si ya lo manejas
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        unidadMedida: l.unidadMedida || 'UND', // Unidad de medida del producto
        proyecto: l.proyecto,
        ceco: l.ceco,
        turno: l.turno,
        labor: this.laborSeleccionado?.labor ?? '',
        esActivoFijo: false,
        activoFijo: l.activofijo,
        estado: 0,
      }),
    );
    // 🔥 AGREGA A LA TABLA EXISTENTE
    this.detalles.push(...nuevosDetalles);
    // Limpieza
    this.lineasPreview = [];
    this.modalVisible = false;
    this.alertService.mostrarInfo('Carga masiva guardada correctamente');
    // this.modalVisible = false;
    this.cerrarModalCargaMasiva();
  }

  // Verifica si una fila del Excel tiene un error en una columna específica
  tieneError(row: any, columna: string): boolean {
    if (!row || !row.errores) return false;
    return row.errores.some((e: any) => e.columna === columna);
  }

  // Verifica si una fila del Excel tiene algún error
  filaConError(row: any): boolean {
    return row?.errores?.length > 0;
  }

  // Abre el modal de carga masiva de detalles desde Excel
  abrirModalCargaMasiva() {
    this.modalVisible = true;
    document.body.classList.add('modal-open');
  }

  // Cierra el modal de carga masiva de detalles desde Excel
  cerrarModalCargaMasiva() {
    this.modalVisible = false;
    document.body.classList.remove('modal-open');
  }

  // Cuenta las filas del Excel que tienen errores
  contarLineasConError(): number {
    return this.lineasPreview.filter((l) => l.error).length;
  }

  // Cuenta las filas del Excel que no tienen errores
  contarLineasSinError(): number {
    return this.lineasPreview.filter((l) => !l.error).length;
  }

  // Métodos para obtener información de productos
  // Obtiene la descripción de un producto ya sea desde el objeto o buscando por código
  obtenerDescripcionProducto(producto: any): string {
    if (!producto) return '';
    // Si es un objeto con descripción directa
    if (producto.descripcion) {
      return producto.descripcion;
    }
    // Si es solo el código, buscar en el array de items
    if (typeof producto === 'string' || producto.codigo) {
      const codigo = typeof producto === 'string' ? producto : producto.codigo;
      const itemEncontrado = this.items?.find(
        (item: any) => item.codigo === codigo,
      );
      return itemEncontrado ? itemEncontrado.descripcion : '';
    }
    return '';
  }
}
