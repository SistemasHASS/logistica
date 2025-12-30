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
} from 'src/app/shared/interfaces/Tables';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
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
import { DropdownComponent } from '../../components/dropdown/dropdown.component';
import { ProductSearchCardsComponent } from '../../components/product-search-cards/product-search-cards.component';
import { TableModule } from 'primeng/table';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-requerimientos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownComponent,
    ProductSearchCardsComponent,
    TableModule,
  ],
  templateUrl: './requerimientos.component.html',
  styleUrls: ['./requerimientos.component.scss'],
})
export class RequerimientosComponent implements OnInit {
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

  // modal (reutilizado)
  //-----MODAL ITEMS----------
  modalAbierto: boolean = false;
  editIndex: number = -1;
  //-----MODAL COMMODITY----------
  modalAbiertoCommodity: boolean = false;
  commodityEditIndex: number = -1;
  //-----MODAL ACTIVO FIJO----------
  modalAbiertoActivoFijo: boolean = false;
  activoFijoEditIndex: number = -1;
  //-----MODAL ACTIVO FIJO MENOR----------
  modalAbiertoActivoFijoMenor: boolean = false;
  activoFijoMenorEditIndex: number = -1;

  cambiarTab(tab: 'ITEM' | 'COMMODITY' | 'ACTIVOFIJO' | 'ACTIVOFIJOMENOR') {
    this.tabActiva = tab;
    // cerrar cualquier formulario abierto para evitar confusión
    this.mostrarFormulario = false;
    this.mostrarFormularioCommodity = false;
    this.mostrarFormularioActivoFijo = false;
    this.mostrarFormularioActivoFijoMenor = false;
  }

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
    // producto: '',
    producto: null,
    descripcion: '',
    cantidad: 0,
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

  SeleccionaPrioridadITEM = '';
  SeleccionaPrioridadCOMMODITY = '';
  SeleccionaPrioridadACTIVOFIJO = '';
  SeleccionaPrioridadACTIVOFIJOMENOR = '';
  fundoSeleccionado = '';
  cultivoSeleccionado = '';
  areaSeleccionada = '';
  almacenSeleccionado = '';
  itemSeleccionado = '';
  clasificacionSeleccionado = '';
  turnoSeleccionado = '';
  TipoSelecionado = '';
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
    private requerimientosService: RequerimientosService
  ) { }

  async ngOnInit() {
    await this.cargarUsuario(); // 👈 carga el usuario primero
    await this.cargarMaestras();
    await this.cargarConfiguracion(); // 👈 REUTILIZA LO GUARDADO EN PARÁMETROSs
    // await this.ListarItems(); // 👈 carga items filtrados por almacén
    await this.cargarRequerimientos(); // 👈 Esto llena la tabla al inicio
    await this.cargarPendientes(); // 👈 carga el número de pendientes
    this.actualizarContadores();
    // await this.cargarDetalles(); // 🔹 cargar detalles guardados
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
      this.esSinEnviar(r)
    ).length;

    this.sinenviarCommodity = this.requerimientosCommodity.filter((r) =>
      this.esSinEnviar(r)
    ).length;

    this.sinenviarActivoFijo = this.requerimientosActivoFijo.filter((r) =>
      this.esSinEnviar(r)
    ).length;

    this.sienvinarActivoFijoMenor = this.requerimientosActivoFijoMenor.filter(
      (r) => this.esSinEnviar(r)
    ).length;

    // const sc = this.requerimientos.filter((e: any) => e.estado === 0)
    // console.log('sin enviar', sc);
    // this.sinenviar = sc.length

    // const scc = this.requerimientosCommodity.filter((e: any) => e.estado === 0)
    // console.log('sin enviar commodity', scc);
    // this.sinenviarCommodity = scc.length

    // const scaf = this.requerimientosActivoFijo.filter((e: any) => e.estado === 0)
    // console.log('sin enviar activo fijo', scaf);
    // this.sinenviarActivoFijo = scaf.length

    // const scafm = this.requerimientosActivoFijoMenor.filter((e: any) => e.estado === 0)
    // console.log('sin enviar activo fijo menor', scafm);
    // this.sienvinarActivoFijoMenor = scafm.length
  }

  contarEnviados() {
    this.enviados = this.requerimientos.filter((r) => this.esEnviado(r)).length;

    this.enviadosCommodity = this.requerimientosCommodity.filter((r) =>
      this.esEnviado(r)
    ).length;

    this.enviadosActivoFijo = this.requerimientosActivoFijo.filter((r) =>
      this.esEnviado(r)
    ).length;

    this.enviadosActivoFijoMenor = this.requerimientosActivoFijoMenor.filter(
      (r) => this.esEnviado(r)
    ).length;

    // const c = this.requerimientos.filter((e: any) => e.estado === 1)
    // console.log('enviados', c);
    // this.enviados = c.length

    // const cc = this.requerimientosCommodity.filter((e: any) => e.estado === 1)
    // console.log('enviados commodity', cc);
    // this.enviadosCommodity = cc.length

    // const caf = this.requerimientosActivoFijo.filter((e: any) => e.estado === 1)
    // console.log('enviados activo fijo', caf);
    // this.enviadosActivoFijo = caf.length

    // const cafm = this.requerimientosActivoFijoMenor.filter((e: any) => e.estado === 1)
    // console.log('enviados activo fijo menor', cafm);
    // this.enviadosActivoFijoMenor = cafm.length
  }

  async cargarConfiguracion() {
    const config = await this.dexieService.obtenerPrimeraConfiguracion();
    if (config) {
      this.configuracion = config;

      console.log(
        '⚙️ Configuración cargada en Requerimientos:',
        this.configuracion
      );

      // Opcional: precargar selects con esta configuración
      this.fundoSeleccionado = config.idfundo;
      this.areaSeleccionada = config.idarea;
      this.cultivoSeleccionado = config.idcultivo;
      this.almacenSeleccionado = config.idalmacen;
      // this.proyectoSeleccionado = config.idproyecto;
      this.clasificacionSeleccionado = config.idclasificacion;
      // this.cecoSeleccionado = config.idceco;
      this.turnoSeleccionado = config.idturno;
      // this.laborSeleccionado = config.idlabor;
      this.itemSeleccionado = config.iditem;

      if (!this.requerimiento.idalmacen) {
        this.requerimiento.idalmacen = config.idalmacen;
      }

      // 🌟 1. BUSCAR EL CECO COMPLETO
      this.cecoSeleccionado = (await this.dexieService.getCecoById(
        config.idceco
      )) as Ceco | null;
      console.log('ceco seleccionado: ', this.cecoSeleccionado);
      // 🌟 2. BUSCAR EL PROYECTO COMPLETO
      if (config.idproyecto) {
        this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(
          config.idproyecto
        )) as Proyecto | null;
      }
      console.log('proyecto seleccionado: ', this.proyectoSeleccionado);
      // 🌟 3. BUSCAR LA LABOR COMPLETA
      this.laborSeleccionado = (await this.dexieService.getLaborById(
        config.idlabor
      )) as Labor | null;
      console.log('labor seleccionado: ', this.laborSeleccionado);
    } else {
      console.warn('⚠️ No existe configuración guardada.');
    }
  }

  nuevoCommodity() {
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
      idproyecto: this.proyectoSeleccionado?.proyectoio || '',
      estado: 0,
      detalleCommodity: [],
    };
    this.detallesCommodity = [];
    this.glosaCommodity = '';
    this.mostrarFormularioCommodity = true;
    this.modoEdicionCommodity = false;
  }

  editarCommodity(index: number) {
    const req = this.requerimientosCommodity[index];
    // this.requerimientoCommodity = { ...this.requerimientosCommodity[index] };
    req.id = this.requerimientosCommodity[index].id; // 🔥 Necesario para update()
    if (!req) return;

    this.mostrarFormularioCommodity = true;
    this.modoEdicionCommodity = true;
    this.commodityEditIndex = index;

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
    this.SeleccionaPrioridadCOMMODITY = req.prioridad;
    // Find the proyecto object that matches the ID
    const proyectoObj = this.proyectos.find(
      (p) => p.idproyecto === req.idproyecto
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

  async eliminarCommodity(index: number) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning'
    );
    if (!confirmacion) return;
    try {
      const req = this.requerimientosCommodity[index];
      // 1️⃣ Eliminar solo ese requerimiento en Dexie
      await this.dexieService.deleteRequerimiento(req.idrequerimiento);

      // 2️⃣ Eliminar del array local sin recargar toda la BD
      this.requerimientosCommodity.splice(index, 1);

      // 3️⃣ Notificar
      this.alertService.showAlert(
        'Éxito',
        'Requerimiento eliminado correctamente.',
        'success'
      );
      // await this.dexieService.deleteRequerimiento(req.idrequerimiento);
      // await this.cargarRequerimientos();
      // this.alertService.showAlert(
      //   'Éxito',
      //   'Requerimiento eliminado correctamente.',
      //   'success'
      // );
    } catch (error) {
      console.error('Error al eliminar requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar el requerimiento.',
        'error'
      );
    }
    // this.requerimientosCommodity.splice(index, 1);
  }

  async guardarCommodity() {
    if (!this.fundoSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Fundo antes de guardar.',
        'warning'
      );
      return;
    }

    // if (!this.clasificacionSeleccionado) {
    //   this.alertService.showAlert(
    //     'Atención',
    //     'Debes seleccionar una Clasificación antes de guardar.',
    //     'warning'
    //   );
    //   return;
    // }

    if (!this.glosaCommodity) {
      this.alertService.showAlert(
        'Atención',
        'Debes ingresar una glosa antes de guardar.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      // Obtener datos de almacén
      const almacenObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenSeleccionado
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
        // idproyecto: this.proyectoSeleccionado,
        idproyecto: this.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,
        detalleCommodity: [...this.detallesCommodity]
      };

      let idGuardado;

      // =============== EDITAR ==================
      if (this.modoEdicionCommodity) {
        await this.dexieService.requerimientosCommodity.put(reqCommodity);

        const index = this.requerimientosCommodity.findIndex(
          (r) => r.idrequerimiento === reqCommodity.idrequerimiento
        );

        if (index !== -1) {
          this.requerimientosCommodity[index] = { ...reqCommodity };
        }

        idGuardado = reqCommodity.idrequerimiento;
        this.modoEdicionCommodity = false;
      } else {
        // =============== NUEVO ==================
        idGuardado = await this.dexieService.requerimientosCommodity.put(
          reqCommodity
        );

        this.requerimientosCommodity.push({ ...reqCommodity });
      }

      // 🔥 GUARDAR DETALLE (AQUÍ ES DONDE DEBE IR)
      for (const d of this.detallesCommodity) {
        await this.dexieService.detallesCommodity.put({
          ...d,
          idrequerimiento: idreq
        });
      }

      this.alertService.cerrarModalCarga();
      this.actualizarContadores();
      this.alertService.showAlert(
        'Éxito',
        `Requerimiento de Servicio #${idGuardado} guardado correctamente.`,
        'success'
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
        'error'
      );
    }
  }

  cancelarCommodity() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormularioCommodity = false;
  }

  nuevoActivoFijoMenor() {
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
      detalleActivoFijoMenor: [],
    };
    this.mostrarFormularioActivoFijoMenor = true;
    this.detallesActivoFijoMenor = [];
    this.glosaActivoFijoMenor = '';
    this.modoEdicionActivoFijoMenor = false;
  }

  editarActivoFijoMenor(index: number) {
    const req = this.requerimientosActivoFijoMenor[index];
    if (!req) return;

    this.mostrarFormularioActivoFijoMenor = true;
    this.modoEdicionActivoFijoMenor = true;
    this.activoFijoMenorEditIndex = index;

    // Copia del registro
    this.requerimientoActivoFijoMenor = { ...req };

    // Cargar detalles
    this.detallesActivoFijoMenor = req.detalleActivoFijoMenor || [];

    // Cargar selects principales
    this.fundoSeleccionado = req.idfundo;
    this.areaSeleccionada = req.idarea;
    this.almacenSeleccionado = req.idalmacen;
    this.clasificacionSeleccionado = req.idclasificacion;
    this.SeleccionaPrioridadACTIVOFIJOMENOR = req.prioridad;
    // this.proyectoSeleccionado = req.idproyecto;
    const proyectoEncontrado = this.proyectos.find(
      (p) => p.id === req.idproyecto
    );
    this.proyectoSeleccionado = proyectoEncontrado || null;

    // Campos propios del activo fijo
    this.selecccionaActivoFijoMenor = req.servicio;
    this.onServicioAFMenorChange();
    this.glosaActivoFijoMenor = req.glosa;

    this.modalAbiertoActivoFijoMenor = false;
  }

  async eliminarActivoFijoMenor(index: number) {
    // this.requerimientosActivoFijoMenor.splice(index, 1);
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning'
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
        'success'
      );
    } catch (error) {
      console.error('Error al eliminar requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar el requerimiento.',
        'error'
      );
    }
  }

  editarDetalleActivoFijoMenor(index: number): void {
    this.activoFijoMenorEditIndex = index;
    this.lineaTempActivoFijoMenor = { ...this.detallesActivoFijoMenor[index] };
    this.modoEdicionActivoFijoMenor = true;

    this.modalAbiertoActivoFijoMenor = true;
  }

  async eliminarDetalleActivoFijoMenor(index: number) {
    // 1. ID del detalle a eliminar
    const detalle = this.detallesActivoFijoMenor[index];
    const id = detalle.id;

    // 2. Eliminar solo ese registro de Dexie
    if (id) {
      await this.dexieService.deleteDetalleRequerimiento(id);
    }

    // 3. Eliminar del array local que alimenta la tabla (solo este requerimiento)
    this.detallesActivoFijoMenor.splice(index, 1);

    // 4. Notificación
    this.alertService.mostrarInfo('Línea eliminada.');
    // const id = this.detallesActivoFijoMenor[index].id!;
    // await this.dexieService.deleteDetalleActivoFijoMenor(id);
    // await this.cargarDetalles();
    // this.alertService.mostrarInfo('Línea eliminada.');
  }

  async guardarActivoFijoMenor() {
    if (!this.fundoSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Fundo antes de guardar.',
        'warning'
      );
      return;
    }

    if (!this.glosaActivoFijoMenor) {
      this.alertService.showAlert(
        'Atención',
        'Debes ingresar una glosa antes de guardar.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const almacenObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenSeleccionado
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
        // idproyecto: this.proyectoSeleccionado,
        idproyecto: this.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,

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
      this.alertService.showAlert(
        'Éxito',
        `Requerimiento Activo Fijo #${idGuardado} guardado correctamente.`,
        'success'
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
        'error'
      );
    }
  }

  cancelarActivoFijoMenor() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormularioActivoFijoMenor = false;
  }

  nuevoActivoFijo() {
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
      detalleActivoFijo: [],
    };
    this.mostrarFormularioActivoFijo = true;
    this.detallesActivoFijo = [];
    this.glosaActivoFijo = '';
    this.modoEdicionActivoFijo = false;
  }

  editarActivoFijo(index: number) {
    const req = this.requerimientosActivoFijo[index];
    if (!req) return;

    this.mostrarFormularioActivoFijo = true;
    this.modoEdicionActivoFijo = true;
    this.activoFijoEditIndex = index;

    // Copia del registro
    this.requerimientoActivoFijo = { ...req };

    // Cargar detalles
    // this.detallesActivoFijo = req.detalleActivoFijo || [];
    // ⭐ CARGA CORRECTA DE DETALLES
    this.detallesActivoFijo = req.detalleActivoFijo?.length
      ? req.detalleActivoFijo
      : req.detalle || [];

    // Cargar selects principales
    this.fundoSeleccionado = req.idfundo;
    this.areaSeleccionada = req.idarea;
    this.almacenSeleccionado = req.idalmacen;
    this.clasificacionSeleccionado = req.idclasificacion;
    this.SeleccionaPrioridadACTIVOFIJO = req.prioridad;
    // this.proyectoSeleccionado = req.idproyecto;
    this.proyectoSeleccionado =
      this.proyectos.find((p) => p.proyectoio === req.idproyecto) ?? null;

    // Campos propios del activo fijo
    this.SeleccionaServicioAF = req.servicio;
    this.onServicioAFChange();
    this.glosaActivoFijo = req.glosa;

    this.modalAbiertoActivoFijo = false;
  }

  async eliminarActivoFijo(index: number) {
    // this.requerimientosActivoFijo.splice(index, 1);
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning'
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
        'success'
      );
    } catch (error) {
      console.error('Error al eliminar requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar el requerimiento.',
        'error'
      );
    }
  }

  editarDetalleActivoFijo(index: number): void {
    this.activoFijoEditIndex = index;
    this.lineaTempActivoFijo = { ...this.detallesActivoFijo[index] };
    this.SeleccionaSubServicioAF = this.lineaTempActivoFijo.codigo;
    this.modoEdicionActivoFijo = true;
    this.modalAbiertoActivoFijo = true;
  }

  async eliminarDetalleActivoFijo(index: number) {
    // 1. ID del detalle a eliminar
    const detalle = this.detallesActivoFijo[index];
    const id = detalle.id;

    // 2. Eliminar solo ese registro de Dexie
    if (id) {
      await this.dexieService.deleteDetalleRequerimiento(id);
    }

    // 3. Eliminar del array local que alimenta la tabla (solo este requerimiento)
    this.detallesActivoFijo.splice(index, 1);

    // 4. Notificación
    this.alertService.mostrarInfo('Línea eliminada.');
    // const id = this.detalles[index].id!;
    // await this.dexieService.deleteDetalleRequerimiento(id);
    // await this.cargarDetalles();
    // this.alertService.mostrarInfo('Línea eliminada.');
  }

  async guardarActivoFijo() {
    if (!this.fundoSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Fundo antes de guardar.',
        'warning'
      );
      return;
    }

    if (!this.glosaActivoFijo) {
      this.alertService.showAlert(
        'Atención',
        'Debes ingresar una glosa antes de guardar.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const almacenObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenSeleccionado
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
        // idproyecto: this.proyectoSeleccionado,
        idproyecto: this.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,

        detalleActivoFijo: [...this.detallesActivoFijo],
      };

      // ================================
      // GUARDAR EN DEXIE
      // ================================
      const idGuardado = await this.dexieService.requerimientosActivoFijo.put(
        reqAF
      );

      // ================================
      // GUARDAR EN MEMORIA
      // ================================
      this.requerimientosActivoFijo.push(reqAF);

      this.alertService.cerrarModalCarga();
      this.actualizarContadores();
      this.alertService.showAlert(
        'Éxito',
        `Requerimiento Activo Fijo #${idGuardado} guardado correctamente.`,
        'success'
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
        'error'
      );
    }
  }

  cancelarActivoFijo() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormularioActivoFijo = false;
  }

  async onClasificacionChange(limpiar = false) {
    if (limpiar) {
      this.configuracion.idturno = '';
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto;
    }
    await this.filtrarClasificaciones();
  }

  filtroClasificaciones() {
    this.clasificacionesFiltrados = this.clasificaciones.filter(
      (it) => it.tipoClasificacion === this.configuracion.idclasificacion
    );
    console.log(this.clasificacionesFiltrados);
  }

  onTipoChange() {
    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      this.almacenSeleccionado = ''; // limpia almacén normal
      this.clasificacionSeleccionado = 'TRA';
      this.clasificacionesFiltrados = this.clasificaciones.filter(
        (c) => c.id === 'TRA'
      );
    } else if (this.TipoSelecionado === 'CONSUMO') {
      this.almacenOrigen = ''; // limpia origen
      this.almacenDestino = ''; // limpia destino
      this.clasificacionSeleccionado = 'STO';
      this.clasificacionesFiltrados = this.clasificaciones.filter(
        (c) => c.id === 'STO'
      );
    } else if (this.TipoSelecionado === 'COMPRA') {
      this.clasificacionSeleccionado = 'CMP';
      this.clasificacionesFiltrados = this.clasificaciones.filter(
        (c) => c.id === 'CMP'
      );
    }
  }

  async filtrarClasificaciones() {
    this.clasificacionesFiltrados = this.clasificaciones.filter(
      (it) => it.tipoClasificacion === this.RequerimientoSelecionado
    );
    console.log(this.clasificacionesFiltrados);
  }

  obtenerDescripcionServicio(codigo: string): string {
    const serv = this.commodityFiltrados.find((s) => s.commodity01 === codigo);
    return serv ? serv.descripcionLocal : codigo;
  }

  obtenerDescripcionServicioAF(codigo: string): string {
    const serv = this.commodityFiltradosAF.find(
      (s) => s.commodity01 === codigo
    );
    return serv ? serv.descripcionLocal : codigo;
  }

  obtenerDescripcionServicioAFM(codigo: string): string {
    const serv = this.commodityFiltradosAFMenor.find(
      (s) => s.commodity01 === codigo
    );
    return serv ? serv.descripcionLocal : codigo;
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
      (x) => x.commodity === codigo
    );
    return sub ? sub.descripcionLocal : codigo;
  }

  nuevoRequerimiento(): void {
    this.requerimiento = {
      idrequerimiento: '',
      fecha: new Date().toISOString(),
      almacen: this.almacenSeleccionado || '',
      glosa: '',
      tipo: '',
      itemtipo: '',
      referenciaGasto: '',
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
      estados: 'PENDIENTE',
      despachado: false,
      detalle: [],
    };

    this.detalles = [];
    this.glosa = '';
    this.modalAbierto = false;
    this.modoEdicion = false; // 🔹 Desactivamos modo edición
    this.filtroClasificaciones();
  }

  async sincronizarRequerimiento() {
    // 1️⃣ Validación de detalles
    if (this.requerimiento.detalle.length === 0) {
      this.alertService.showAlert(
        'Alerta',
        'Debe ingresar al menos un requerimiento',
        'warning'
      );
      return;
    }

    // 2️⃣ Confirmación
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar los datos?',
      'warning'
    );

    if (!confirmacion) return;
    console.log(this.requerimiento);
    console.log(this.requerimiento.idalmacen);

    // 3️⃣ Inicializar progreso
    this.sincronizando = true;
    this.progreso = 0;

    const prioridadFinal =
      this.SeleccionaPrioridadITEM && this.SeleccionaPrioridadITEM !== ''
        ? this.SeleccionaPrioridadITEM
        : this.requerimiento.prioridad ?? '1';

    // 👇 Aquí formamos el objeto según el SP
    const requerimiento = {
      idrequerimiento: `${this.usuario.ruc}${this.requerimiento.idalmacen}${this.usuario.documentoidentidad
        }${new Date().toISOString().replace(/[-:TZ.]/g, '')}`,
      ruc: this.usuario.ruc,
      idfundo: this.requerimiento.idfundo,
      // idarea: this.areaSeleccionada,
      idarea: this.requerimiento.idarea,
      idclasificacion: this.requerimiento.idclasificacion,
      // prioridad: this.SeleccionaPrioridadITEM ?? '1',
      prioridad: prioridadFinal,
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: this.requerimiento.idalmacen,
      // idalmacendestino: this.requerimiento.idalmacendestino || '',
      idalmacendestino:
        this.TipoSelecionado === 'TRANSFERENCIA' ? this.almacenDestino : '',
      glosa: this.requerimiento.glosa || '',
      eliminado: 0,
      tipo: this.requerimiento.tipo,
      itemtipo: this.requerimiento.itemtipo,
      estados: 'PENDIENTE',
      // usuario: this.usuario.usuario,
      detalle: this.requerimiento.detalle.map((d: any) => ({
        codigo: d.codigo,
        // tipoclasificacion: d.tipoclasificacion,
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
          this.alertService.showAlert(
            'Éxito',
            'Requerimiento sincronizado correctamente',
            'success'
          );
          // ---- 5️⃣ GUARDO EN DEXIE ----
          this.dexieService.requerimientos
            .update(this.requerimiento.id!, { estado: 1 })
            .then(() => {
              this.cargarRequerimientos();
            });
          this.actualizarContadores();
          // this.cargarRequerimientos();
        } else {
          this.alertService.showAlertError(
            'Error',
            'Hubo un problema al sincronizar el requerimiento'
          );
          console.error('Detalles del error:', resp);
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP:', err);
        this.alertService.showAlertError(
          'Error',
          'No se pudo conectar con el servidor'
        );
      },
    });
  }

  async cargarPendientes() {
    this.pendientes = await this.dexieService.requerimientos
      .where('estado')
      .equals(0)
      .count();
  }

  async sincronizarPendientes() {

    // 1️⃣ Obtener pendientes reales desde Dexie
    const pendientes = await this.dexieService.requerimientos
      .where('estado')
      .equals(0)
      .toArray();

    if (pendientes.length === 0) {
      this.alertService.showAlert(
        'Información',
        'No hay requerimientos pendientes por sincronizar',
        'info'
      );
      return;
    }

    // 2️⃣ Confirmación
    const confirmar = await this.alertService.showConfirm(
      'Confirmación',
      `Se sincronizarán ${pendientes.length} requerimientos ¿Desea continuar?`,
      'warning'
    );

    if (!confirmar) return;

    // 3️⃣ Inicializar progreso
    this.sincronizando = true;
    this.progreso = 0;

    const idReq =
      this.usuario.ruc +
      this.usuario.documentoidentidad +
      this.utilsService.formatoAnioMesDiaHoraMinSec();

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
        eliminado: 0
      }))
    }));

    // 5️⃣ Enviar al backend
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: async (resp) => {
        const resultado = resp?.[0];

        // 6️⃣ IDs con error (idrequerimiento)
        const idsConError: string[] = (resultado?.detalle || [])
          .map((d: any) => d.id.split('-')[0]);

        // 7️⃣ IDs enviados
        const idsEnviados: string[] = pendientes.map(
          r => r.idrequerimiento
        );

        // 8️⃣ IDs sincronizados correctamente
        const idsOk: string[] = idsEnviados.filter(
          idreq => !idsConError.includes(idreq)
        );

        // 6️⃣ ACTUALIZAR DEXIE (TU LÍNEA CORREGIDA)
        if (idsOk.length) {
          await this.dexieService.requerimientos
            .where('idrequerimiento')
            .anyOf(idsOk)
            .modify({
              estado: 1
            });
        }

        // 7️⃣ Mensajes al usuario
        if (idsConError.length) {
          this.alertService.showAlert(
            'Sincronización parcial',
            `Se sincronizaron ${idsOk.length} requerimientos.\n${idsConError.length} con error.`,
            'warning'
          );
        } else {
          this.alertService.showAlert(
            'Éxito',
            'Todos los requerimientos se sincronizaron correctamente',
            'success'
          );
        }

        // 6️⃣ Manejo de respuesta parcial
        // const exitosos = resp.filter((r: any) => r.errorgeneral === 0);
        // const fallidos = resp.filter((r: any) => r.errorgeneral !== 0);

        // // 7️⃣ Actualizar progreso
        // this.progreso = 100;

        // // 8️⃣ Marcar SOLO los exitosos como enviados
        // if (exitosos.length > 0) {
        //   const idsOk = pendientes
        //     .slice(0, exitosos.length)
        //     .map(p => p.id);

        //   await this.dexieService.requerimientos
        //     .where('id')
        //     .anyOf(idsOk)
        //     .modify({ estado: 1 });
        // }

        // 🔟 Actualizar progreso
        this.progreso = 100;

        // 1️⃣ Recargar DESDE DEXIE
        await this.cargarRequerimientos();

        // 2️⃣ Recalcular contadores
        this.actualizarContadores();

        // 3️⃣ Opcional: refrescar pendientes
        await this.cargarPendientes();

        // 9️⃣ Refrescar contadores y vista
        // await this.cargarPendientes();
        // this.cargarRequerimientos();
        // this.actualizarContadores();
        // 🔟 Mensajes finales
        // if (fallidos.length > 0) {
        //   this.alertService.showAlert(
        //     'Advertencia',
        //     `${fallidos.length} requerimientos no se sincronizaron`,
        //     'warning'
        //   );
        //   console.table(fallidos);
        // } else {
        //   this.alertService.showAlert(
        //     'Éxito',
        //     'Todos los requerimientos fueron sincronizados correctamente',
        //     'success'
        //   );
        // }

        this.sincronizando = false;
      },

      error: (err) => {
        console.error(err);
        this.sincronizando = false;
        this.alertService.showAlertError(
          'Error',
          'No se pudo conectar con el servidor'
        );
      }
    });
  }


  async sincronizarRequerimientoCommodity() {
    if (this.requerimientoCommodity.detalleCommodity.length === 0) {
      this.alertService.showAlert(
        'Alerta',
        'Debe ingresar al menos un requerimiento de commodity',
        'warning'
      );
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar los datos?',
      'warning'
    );

    if (!confirmacion) return;

    const prioridadFinal =
      this.SeleccionaPrioridadCOMMODITY &&
        this.SeleccionaPrioridadCOMMODITY !== ''
        ? this.SeleccionaPrioridadCOMMODITY
        : this.requerimientoCommodity.prioridad ?? '1';

    // 👇 Aquí formamos el objeto según el SP
    const requerimiento = {
      idrequerimiento: `${this.usuario.ruc}${this.requerimientoCommodity.idalmacen
        }${this.usuario.documentoidentidad}${new Date()
          .toISOString()
          .replace(/[-:TZ.]/g, '')}`,
      ruc: this.usuario.ruc,
      idfundo: this.requerimientoCommodity.idfundo,
      // idarea: this.areaSeleccionada,
      idarea: this.requerimientoCommodity.idarea,
      // idclasificacion: this.requerimientoCommodity.idclasificacion,
      idclasificacion: 'SER',
      servicio: this.requerimientoCommodity.servicio,
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: this.requerimientoCommodity.idalmacen,
      idalmacendestino: this.requerimientoCommodity.idalmacendestino || '',
      glosa: this.requerimientoCommodity.glosa || '',
      eliminado: 0,
      tipo: this.requerimientoCommodity.tipo,
      estados: 'PENDIENTE',
      prioridad: prioridadFinal,
      // usuario: this.usuario.usuario,
      detalle: this.requerimientoCommodity.detalleCommodity.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: 'C',
        cantidad: d.cantidad,
        // iddescripcion: d.descripcion || '',
        iddescripcion: d.descripcion,
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
      next: (resp) => {
        console.log('✅ Respuesta del backend:', resp);

        // Manejo del resultado del SP
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert(
            'Éxito',
            'Requerimiento sincronizado correctamente',
            'success'
          );
          // ---- 5️⃣ GUARDO EN DEXIE ----
          this.dexieService.requerimientos
            .update(this.requerimientoCommodity.id!, { estado: 1 })
            .then(() => {
              this.cargarRequerimientos();
            });
        } else {
          this.alertService.showAlert(
            'Error',
            'Hubo un problema al sincronizar el requerimiento',
            'error'
          );
          console.error('Detalles del error:', resp);
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP:', err);
        this.alertService.showAlert(
          'Error',
          'No se pudo conectar con el servidor',
          'error'
        );
      },
    });
  }

  async sincronizarRequerimientoActivoFijo() {
    if (this.requerimientoActivoFijo.detalleActivoFijo.length === 0) {
      this.alertService.showAlert(
        'Alerta',
        'Debe ingresar al menos un requerimiento de activo fijo',
        'warning'
      );
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar los datos?',
      'warning'
    );

    if (!confirmacion) return;

    const prioridadFinal =
      this.SeleccionaPrioridadACTIVOFIJO &&
        this.SeleccionaPrioridadACTIVOFIJO !== ''
        ? this.SeleccionaPrioridadACTIVOFIJO
        : this.requerimientoActivoFijo.prioridad ?? '1';

    // 👇 Aquí formamos el objeto según el SP
    const requerimiento = {
      idrequerimiento: `${this.usuario.ruc}${this.requerimientoActivoFijo.idalmacen
        }${this.usuario.documentoidentidad}${new Date()
          .toISOString()
          .replace(/[-:TZ.]/g, '')}`,
      ruc: this.usuario.ruc,
      idfundo: this.requerimientoActivoFijo.idfundo,
      // idarea: this.areaSeleccionada,
      idarea: this.requerimientoActivoFijo.idarea,
      // idclasificacion: this.requerimientoActivoFijo.idclasificacion,
      idclasificacion: 'ACT',
      servicio: this.requerimientoActivoFijo.servicio,
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: this.requerimientoActivoFijo.idalmacen,
      idalmacendestino: this.requerimientoActivoFijo.idalmacendestino || '',
      glosa: this.requerimientoActivoFijo.glosa || '',
      eliminado: 0,
      tipo: this.requerimientoActivoFijo.tipo,
      estados: 'PENDIENTE',
      prioridad: prioridadFinal,
      // usuario: this.usuario.usuario,
      detalle: this.requerimientoActivoFijo.detalleActivoFijo.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: d.tipoclasificacion,
        cantidad: d.cantidad,
        iddescripcion: d.descripcion,
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
      next: (resp) => {
        console.log('✅ Respuesta del backend:', resp);

        // Manejo del resultado del SP
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert(
            'Éxito',
            'Requerimiento sincronizado correctamente',
            'success'
          );
        } else {
          this.alertService.showAlert(
            'Error',
            'Hubo un problema al sincronizar el requerimiento',
            'error'
          );
          console.error('Detalles del error:', resp);
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP:', err);
        this.alertService.showAlert(
          'Error',
          'No se pudo conectar con el servidor',
          'error'
        );
      },
    });
  }

  async sincronizarRequerimientoActivoFijoMenor() {
    if (this.requerimientoActivoFijoMenor.detalleActivoFijoMenor.length === 0) {
      this.alertService.showAlert(
        'Alerta',
        'Debe ingresar al menos un requerimiento de activo fijo menor',
        'warning'
      );
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar los datos?',
      'warning'
    );

    if (!confirmacion) return;

    const prioridadFinal =
      this.SeleccionaPrioridadACTIVOFIJOMENOR &&
        this.SeleccionaPrioridadACTIVOFIJOMENOR !== ''
        ? this.SeleccionaPrioridadACTIVOFIJOMENOR
        : this.requerimientoActivoFijoMenor.prioridad ?? '1';

    // 👇 Aquí formamos el objeto según el SP
    const requerimiento = {
      idrequerimiento: `${this.usuario.ruc}${this.configuracion.idalmacen}${this.usuario.documentoidentidad
        }${new Date().toISOString().replace(/[-:TZ.]/g, '')}`,
      ruc: this.usuario.ruc,
      idfundo: this.requerimientoActivoFijoMenor.idfundo,
      // idarea: this.areaSeleccionada,
      idarea: this.requerimientoActivoFijoMenor.idarea,
      // idclasificacion: this.requerimientoActivoFijo.idclasificacion,
      idclasificacion: 'ACM',
      servicio: this.requerimientoActivoFijoMenor.servicio,
      // prioridad: this.SeleccionaPrioridadACTIVOFIJOMENOR ?? '1',
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: this.requerimientoActivoFijoMenor.idalmacen,
      idalmacendestino:
        this.requerimientoActivoFijoMenor.idalmacendestino || '',
      glosa: this.requerimientoActivoFijoMenor.glosa || '',
      eliminado: 0,
      tipo: this.requerimientoActivoFijoMenor.tipo,
      estados: 'PENDIENTE',
      prioridad: prioridadFinal,
      // usuario: this.usuario.usuario,
      detalle: this.requerimientoActivoFijoMenor.detalleActivoFijoMenor.map(
        (d: any) => ({
          codigo: d.codigo,
          tipoclasificacion: d.tipoclasificacion,
          cantidad: d.cantidad,
          iddescripcion: d.descripcion,
          idproyecto: d.proyecto || '',
          idcentrocosto: d.ceco || '',
          idturno: d.turno || '',
          idlabor: d.labor || '',
          eliminado: 0,
        })
      ),
    };

    // 👇 Mandamos directamente el array (NO dentro de { json: ... })
    const payload = [requerimiento];

    console.log('📤 Enviando al backend:', payload);

    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta del backend:', resp);

        // Manejo del resultado del SP
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert(
            'Éxito',
            'Requerimiento sincronizado correctamente',
            'success'
          );
        } else {
          this.alertService.showAlert(
            'Error',
            'Hubo un problema al sincronizar el requerimiento',
            'error'
          );
          console.error('Detalles del error:', resp);
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP:', err);
        this.alertService.showAlert(
          'Error',
          'No se pudo conectar con el servidor',
          'error'
        );
      },
    });
  }

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

  async cargarMaestras() {
    await this.ListarFundos();
    await this.ListarCultivos();
    await this.ListarAreas();
    await this.ListarAlmacenes();
    await this.ListarAlmacenDestino();
    await this.ListarProyectos();
    await this.ListarItems();
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

  async cargarDetalles() {
    this.detalles = await this.dexieService.showDetallesRequerimiento();
  }

  async cargarRequerimientos() {
    this.requerimientos = await this.dexieService.showRequerimiento();

    this.requerimientosCommodity =
      await this.dexieService.showRequerimientoCommodity();

    this.requerimientosActivoFijo =
      await this.dexieService.showRequerimientoActivoFijo();

    this.requerimientosActivoFijoMenor =
      await this.dexieService.showRequerimientoActivoFijoMenor();

    console.log('📌 ITEM:', this.requerimientos);
    console.log('📌 COMMODITY:', this.requerimientosCommodity);
    console.log('📌 ACTIVO FIJO:', this.requerimientosActivoFijo);
    console.log('📌 AF MENOR:', this.requerimientosActivoFijoMenor);
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
    // Si estamos editando, reasignar almacén correctamente
    if (this.modoEdicion) {
      this.reasignarAlmacenDesdeDescripcion();
    }
  }

  async ListarAlmacenDestino() {
    this.alamcenesDestino = await this.dexieService.showAlmacenesDestino();
    // Si estamos editando, reasignar almacén correctamente
    if (this.modoEdicion) {
      this.reasignarAlmacenDesdeDescripcion();
    }
  }

  async ListarProyectos() {
    this.proyectos = await this.dexieService.showProyectos();
  }

  async ListarItems() {
    this.items = await this.dexieService.showItemComoditys();
    this.itemsFiltrados = this.items.filter(
      (it) => it.tipoclasificacion === 'I'
    );
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

  async ListarProveedores() {
    this.proveedoresServicios = await this.dexieService.showProveedores();
    this.proveedoresActivoFijo = await this.dexieService.showProveedores();
  }

  async ListarTipoGastos() {
    this.tipoGastos = await this.dexieService.showTipoGastos();
  }

  async ListarServicios() {
    this.servicios = await this.dexieService.showMaestroCommodity();
    this.commodityFiltrados = this.servicios.filter(
      (serv) => serv.clasificacion === 'SER'
    );
  }

  async ListarServiciosAF() {
    this.servicioAF = await this.dexieService.showMaestroCommodity();
    this.commodityFiltradosAF = this.servicioAF.filter(
      (servaf) => servaf.clasificacion === 'ACT'
    );
  }

  async ListarServiciosAFMenor() {
    this.servicioAFMenor = await this.dexieService.showMaestroCommodity();
    this.commodityFiltradosAFMenor = this.servicioAFMenor.filter(
      (servafmenor) => servafmenor.clasificacion === 'ACM'
    );
  }

  getDescripcionFundo(idfundo: any) {
    const f = this.fundos.find((x) => x.codigoFundo == idfundo);
    return f ? f.nombreFundo : idfundo;
  }

  async onServicioChange() {
    if (!this.SeleccionaServicio) {
      this.subservicioFiltrados = [];
      this.SeleccionaSubServicio = '';
      return;
    }
    this.subservicios = await this.dexieService.showMaestroSubCommodity();
    // SeleccionaServicio YA ES el Commodity01
    this.subservicioFiltrados = this.subservicios.filter(
      (sub) => sub.commodity01 === this.SeleccionaServicio
    );

    this.SeleccionaSubServicio = '';
  }

  async onServicioAFChange() {
    if (!this.SeleccionaServicioAF) {
      this.subservicioFiltradosAF = [];
      this.SeleccionaSubServicioAF = '';
      return;
    }
    this.subserviciosAF = await this.dexieService.showMaestroSubCommodity();
    this.subservicioFiltradosAF = this.subserviciosAF.filter(
      (sub) => sub.commodity01 === this.SeleccionaServicioAF
    );
    this.SeleccionaSubServicioAF = '';
  }

  async onServicioAFMenorChange() {
    if (!this.SeleccionaServicioAFMenor) {
      this.subservicioFiltradosAFMenor = [];
      this.SeleccionaSubServicioAFMenor = '';
      return;
    }
    this.subserviciosAFMenor =
      await this.dexieService.showMaestroSubCommodity();
    this.subservicioFiltradosAFMenor = this.subserviciosAFMenor.filter(
      (sub) => sub.commodity01 === this.SeleccionaServicioAFMenor
    );
    this.SeleccionaSubServicioAFMenor = '';
  }

  async ListarActivosFijos() {
    this.activosFijos = await this.dexieService.showActivosFijos();
    // 1. Mapea y concatena
    const activosMapeados: ActivoFijo[] = this.activosFijos.map((act) => ({
      ...act,
      activo_descripcion: `${act.activo} - ${act.descripcion}`, // <-- ¡AQUÍ ESTÁ LA CLAVE!
    }));
    // console.log(activosMapeados);

    // 2. Aplica los filtros usando los arrays mapeados
    this.activosFijosFiltrados = activosMapeados.filter(
      (act) => act.tipoActivo === 'I' // Nota: La interfaz dice TipoActivo con 'T' mayúscula.
    );

    this.activosFijosServicioFiltrados = activosMapeados.filter(
      (act) => act.tipoActivo === 'C'
    );
  }

  nuevaLinea(): DetalleRequerimiento {
    return {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
      codigo: '',
      // producto: '',
      producto: null,
      descripcion: '',
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

  async abrirModal() {
    if (this.editIndex === -1) {
      // const nuevoCodigo = (this.detalles.length + 1).toString().padStart(6, '0');
      this.lineaTemp = {
        idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
        // codigo: nuevoCodigo,
        codigo: '',
        // producto: '',
        producto: null,
        descripcion: '',
        estado: 0,
        cantidad: 0,
        proyecto: this.proyectoSeleccionado
          ? String(this.proyectoSeleccionado.proyectoio)
          : '',
        ceco: this.cecoSeleccionado?.localname ?? '',
        turno: this.turnoSeleccionado ?? '',
        labor: this.laborSeleccionado?.labor ?? '',
        esActivoFijo: false,
        activoFijo: '',
      };
    }
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.editIndex = -1;
  }

  // Commodity
  abrirModalCommodity() {
    if (this.commodityEditIndex === -1) {
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

  cerrarModalCommodity() {
    this.modalAbiertoCommodity = false;
  }

  async guardarLineaCommodity() {
    //Validaciones de Commodity
    if (
      !this.lineaTempCommodity.cantidad ||
      this.lineaTempCommodity.cantidad <= 0
    ) {
      this.alertService.showAlert(
        'Campo inválido',
        'La cantidad debe ser mayor a 0.',
        'warning'
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
        'warning'
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
        'warning'
      );
      return;
    }

    if (
      !this.lineaTempCommodity.turno ||
      this.lineaTempCommodity.turno.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un turno.',
        'warning'
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
        'warning'
      );
      return;
    }

    // console.log('Subservicio seleccionado:', this.SeleccionaSubServicio);

    const subservicioSeleccionado = this.subservicioFiltrados.find(
      (subs) => subs.commodity === this.SeleccionaSubServicio
    );

    if (!subservicioSeleccionado) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un subservicio válido.',
        'warning'
      );
      return;
    }

    console.log('Servicio seleccionado:', subservicioSeleccionado);
    console.log(
      'descripcion subservicio:',
      subservicioSeleccionado.descripcionLocal
    );
    const nuevaLineaDetalle = {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
      // codigo: this.lineaTempCommodity.codigo,
      // descripcion: this.SeleccionaSubServicio,
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
      this.detallesCommodity[this.commodityEditIndex] = { ...nuevaLineaDetalle };
    } else {
      // ➕ agregar SOLO en memoria
      this.detallesCommodity.push({ ...nuevaLineaDetalle });
    }
    // ✅ Si pasa todas las validaciones
    // if (this.commodityEditIndex >= 0) {
    //   // Editar línea existente
    //   const idExistente = this.detallesCommodity[this.commodityEditIndex].id!;
    //   await this.dexieService.detallesCommodity.put({
    //     id: idExistente,
    //     ...nuevaLineaDetalle,
    //   });
    //   // ✅ Actualizar en memoria también
    //   this.detallesCommodity[this.commodityEditIndex] = {
    //     id: idExistente,
    //     ...nuevaLineaDetalle,
    //   };
    // } else {
    //   // Agregar nueva línea
    //   delete this.lineaTempCommodity.id;
    //   // Agregar nueva línea
    //   const idNuevo = await this.dexieService.detallesCommodity.add({
    //     ...nuevaLineaDetalle,
    //   });
    //   // ✅ Añadir al arreglo en memoria
    //   this.detallesCommodity.push({ id: idNuevo, ...nuevaLineaDetalle });
    // }

    // await this.cargarDetalles();
    this.cerrarModalCommodity();
    this.alertService.showAlert(
      'Éxito',
      'Línea guardada correctamente.',
      'success'
    );
  }

  editarDetalleCommodity(index: number): void {
    this.commodityEditIndex = index;
    const linea = this.detallesCommodity[index];

    // Cargar la línea temporal
    this.lineaTempCommodity = { ...linea };
    // console.log('Línea a editar:', linea);
    console.log('Descripción de la línea:', linea.descripcion);
    console.log('Código de la línea:', linea.codigo);
    // 👇 ESTE ES EL CAMBIO IMPORTANTE
    // 'descripcion' contiene el commodity01 (el código), se lo devolvemos al dropdown
    // this.SeleccionaSubServicio = linea.descripcion;
    this.SeleccionaSubServicio = linea.codigo;
    // this.lineaTempCommodity = { ...this.detallesCommodity[index] };
    this.modoEdicionCommodity = true;
    this.modalAbiertoCommodity = true;
  }

  async eliminarDetalleCommodity(index: number) {
    // 1. ID del detalle a eliminar
    const detalle = this.detallesCommodity[index];
    const id = detalle.id;

    // 2. Eliminar solo ese registro de Dexie
    if (id) {
      await this.dexieService.deleteDetalleRequerimiento(id);
    }

    // 3. Eliminar del array local que alimenta la tabla (solo este requerimiento)
    this.detallesCommodity.splice(index, 1);

    // 4. Notificación
    this.alertService.mostrarInfo('Línea eliminada.');
    // const id = this.detalles[index].id!;
    // await this.dexieService.deleteDetalleRequerimiento(id);
    // await this.cargarDetalles();
    // this.alertService.mostrarInfo('Línea eliminada.');
  }

  // Activo Fijo
  abrirModalActivoFijoMenor() {
    if (this.activoFijoMenorEditIndex === -1) {
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

  cerrarModalActivoFijoMenor() {
    this.modalAbiertoActivoFijoMenor = false;
  }

  async guardarLineaActivoFijoMenor() {
    // ✅ Validaciones previas
    if (
      !this.lineaTempActivoFijoMenor.cantidad ||
      this.lineaTempActivoFijoMenor.cantidad <= 0
    ) {
      this.alertService.showAlert(
        'Campo inválido',
        'La cantidad debe ser mayor a 0.',
        'warning'
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
        'warning'
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
        'warning'
      );
      return;
    }

    if (
      !this.lineaTempActivoFijoMenor.turno ||
      this.lineaTempActivoFijoMenor.turno.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un turno.',
        'warning'
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
        'warning'
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
        'warning'
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
      // await this.dexieService.detalles.put({ id: idExistente, ...this.lineaTemp });
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
      'success'
    );
  }

  abrirModalActivoFijo() {
    if (this.activoFijoEditIndex === -1) {
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
    // const confirmar = confirm(
    //   '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.'
    // );
    // if (!confirmar) return;
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
        'warning'
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
        'warning'
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
        'warning'
      );
      return;
    }

    if (
      !this.lineaTempActivoFijo.turno ||
      this.lineaTempActivoFijo.turno.trim() === ''
    ) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un turno.',
        'warning'
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
        'warning'
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
        'warning'
      );
      return;
    }
    console.log('Subservicio seleccionado:', this.SeleccionaSubServicioAF);
    const subservicioSeleccionadoAF = this.subservicioFiltradosAF.find(
      (subs) => subs.commodity === this.SeleccionaSubServicioAF
    );

    console.log('Servicio seleccionado:', subservicioSeleccionadoAF);

    if (!subservicioSeleccionadoAF) {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un subservicio válido.',
        'warning'
      );
      return;
    }

    const nuevaLineaDetalle = {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
      // codigo: this.lineaTempActivoFijo.codigo,
      // descripcion: this.SeleccionaSubServicioAF,
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
      // await this.dexieService.detalles.put({ id: idExistente, ...this.lineaTemp });
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
      'success'
    );
  }

  async guardarLinea() {
    // Buscar producto seleccionado
    const productoSeleccionado = this.items.find(
      (it) => it.codigo === this.lineaTemp.producto?.codigo
    );
    console.log('Producto seleccionado:', productoSeleccionado);
    console.log('Producto en lineaTemp:', this.lineaTemp.producto);
    // ✅ Validaciones previas
    if (!this.lineaTemp.producto || !this.lineaTemp.producto.codigo) {
      //this.lineaTemp.producto.trim() === '') {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un producto.',
        'warning'
      );
      return;
    }

    if (!this.lineaTemp.cantidad || this.lineaTemp.cantidad <= 0) {
      this.alertService.showAlert(
        'Campo inválido',
        'La cantidad debe ser mayor a 0.',
        'warning'
      );
      return;
    }

    if (!this.lineaTemp.proyecto || this.lineaTemp.proyecto.trim() === '') {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un proyecto.',
        'warning'
      );
      return;
    }

    if (!this.lineaTemp.ceco || this.lineaTemp.ceco.trim() === '') {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un CECO.',
        'warning'
      );
      return;
    }

    if (!this.lineaTemp.turno || this.lineaTemp.turno.trim() === '') {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar un turno.',
        'warning'
      );
      return;
    }

    if (!this.lineaTemp.labor || this.lineaTemp.labor.trim() === '') {
      this.alertService.showAlert(
        'Campo requerido',
        'Debes seleccionar una labor.',
        'warning'
      );
      return;
    }

    if (this.lineaTemp.esActivoFijo && !this.lineaTemp.activoFijo) {
      this.alertService.showAlert(
        'Advertencia',
        'Debe ingresar el código de activo fijo.',
        'warning'
      );
      return;
    }

    const nuevaLineaDetalle = {
      idrequerimiento: '', // ⚠️ SE ASIGNA AL GUARDAR CABECERA
      codigo: productoSeleccionado.codigo,
      producto: productoSeleccionado.descripcion, // 👈 Guardamos la descripción visible
      descripcion: '',
      cantidad: this.lineaTemp.cantidad,
      proyecto: this.lineaTemp.proyecto,
      ceco: this.lineaTemp.ceco,
      turno: this.lineaTemp.turno,
      labor: this.lineaTemp.labor,
      esActivoFijo: this.lineaTemp.esActivoFijo,
      activoFijo: this.lineaTemp.activoFijo,
      estado: 0, // 👈 agrega cualquier campo adicional que tu tabla Dexie requiera
    };

    // ✅ Si pasa todas las validaciones
    if (this.editIndex >= 0) {
      // Editar línea existente
      const idExistente = this.detalles[this.editIndex].id!;
      // await this.dexieService.detalles.put({ id: idExistente, ...this.lineaTemp });
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
      'success'
    );
  }

  editarLinea(index: number): void {
    this.editIndex = index;
    const detalleSeleccionado = this.detalles[index];

    // Buscar el producto en la lista de items por descripción
    const producto = this.items.find(
      (it) => it.descripcion === detalleSeleccionado.producto
    );

    // Cargar en lineaTemp el código real para que el select lo reconozca
    this.lineaTemp = {
      ...detalleSeleccionado,
      // producto: producto ? producto.codigo : detalleSeleccionado.codigo,
      // producto: producto ? { codigo: producto.codigo } : null
      producto: producto ? { ...producto } : null,
    };

    // this.lineaTemp = { ...this.detalles[index] };
    this.modalAbierto = true;
  }

  async eliminarLinea(index: number) {
    // 1. ID del detalle a eliminar
    const detalle = this.detalles[index];
    const id = detalle.id;

    // 2. Eliminar solo ese registro de Dexie
    if (id) {
      await this.dexieService.deleteDetalleRequerimiento(id);
    }

    // 3. Eliminar del array local que alimenta la tabla (solo este requerimiento)
    this.detalles.splice(index, 1);

    // 4. Notificación
    this.alertService.mostrarInfo('Línea eliminada.');
    // const id = this.detalles[index].id!;
    // await this.dexieService.deleteDetalleRequerimiento(id);
    // await this.cargarDetalles();
    // this.alertService.mostrarInfo('Línea eliminada.');
  }

  mostrarAlmacen(c: any): string {
    // TRANSFERENCIA → Origen - Destino
    if (c.itemtipo === 'TRANSFERENCIA') {
      const origen = this.almacenes.find(
        a => a.idalmacen == c.idalmacen
      );
      const destino = this.alamcenesDestino.find(
        a => a.idalmacen == c.idalmacendestino
      );

      return `${origen?.almacen ?? '---'} - ${destino?.almacen ?? '---'}`;
    }

    // CONSUMO / COMPRA
    const almacen = this.almacenes.find(
      a => a.idalmacen == c.idalmacen
    );

    return almacen?.almacen ?? '---';
  }

  mostrarAlmacenDestino(c: any): string {
    const destino = this.alamcenesDestino.find(
      a => a.idalmacen == c.idalmacendestino
    );
    return destino?.almacen ?? '---';
  }

  getNombreAlmacen(id: string): string {
    const almacen = this.almacenes.find(
      a => a.idalmacen == id
    );
    return almacen?.almacen ?? '---';
  }

  async guardar() {
    if (!this.fundoSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Fundo antes de guardar.',
        'warning'
      );
      return;
    }

    // 2️⃣ Validación según tipo:

    // ✔ Para CONSUMO y COMPRA → almacenSeleccionado es obligatorio
    if (
      (this.TipoSelecionado === 'CONSUMO' ||
        this.TipoSelecionado === 'COMPRA') &&
      !this.almacenSeleccionado
    ) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar un Almacén antes de guardar.',
        'warning'
      );
      return;
    }

    // ✔ Para TRANSFERENCIA → validar Origen y Destino
    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      if (!this.almacenOrigen) {
        this.alertService.showAlert(
          'Atención',
          'Debes seleccionar un Almacén Origen antes de guardar.',
          'warning'
        );
        return;
      }

      if (!this.almacenDestino) {
        this.alertService.showAlert(
          'Atención',
          'Debes seleccionar un Almacén Destino antes de guardar.',
          'warning'
        );
        return;
      }
    }
    if (!this.clasificacionSeleccionado) {
      this.alertService.showAlert(
        'Atención',
        'Debes seleccionar una clasificación antes de guardar.',
        'warning'
      );
      return;
    }

    if (!this.glosa) {
      this.alertService.showAlert(
        'Atención',
        'Debes ingresar una glosa antes de guardar.',
        'warning'
      );
      return;
    }

    try {
      // 🔹 Mostrar modal de carga
      this.alertService.mostrarModalCarga();

      // Fecha actual
      // const fechaActual = new Date().toISOString();

      // 🔹 Simulación del guardado (aquí reemplaza por tu lógica real)
      await new Promise((resolve) => setTimeout(resolve, 1500)); // simulación de espera

      // 🔹 Cerrar modal de carga
      this.alertService.cerrarModalCarga();

      const almacenOrigenObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenOrigen
      );
      const almacenDestinoObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenDestino
      );
      const almacenNormalObj = this.almacenes.find(
        (a) => a.idalmacen == this.almacenSeleccionado
      );

      // 🔎 Convertir la descripción almacen → ID solo para sincronizar
      const almacenEncontrado = this.almacenes.find(
        (a) => a.almacen === this.requerimiento.almacen
      );

      const idAlmacenSincronizado = almacenEncontrado
        ? almacenEncontrado.idalmacen
        : this.requerimiento.idalmacen;

      // =========================
      // ID ALMACÉN FINAL (CLAVE)
      // =========================
      const idAlmacenFinal =
        this.TipoSelecionado === 'TRANSFERENCIA'
          ? this.almacenOrigen
          : this.almacenSeleccionado;

      // =========================
      // 3️⃣ GENERAR ID ÚNICO
      // =========================
      const idReq =
        this.usuario.ruc +
        this.usuario.documentoidentidad +
        this.utilsService.formatoAnioMesDiaHoraMinSec();

      // 3️⃣ Crear requerimiento
      this.requerimiento.idrequerimiento =
        this.usuario.ruc +
        idAlmacenSincronizado +
        // this.almacenSeleccionado +
        this.usuario.documentoidentidad +
        this.utilsService.formatoAnioMesDiaHoraMinSec();
      this.requerimiento.ruc = this.usuario.ruc;
      this.requerimiento.idfundo = this.fundoSeleccionado;
      this.requerimiento.idarea = this.areaSeleccionada;
      this.requerimiento.idclasificacion = this.clasificacionSeleccionado;
      this.requerimiento.nrodocumento = this.usuario.documentoidentidad;
      // this.requerimiento.idalmacen = this.almacenSeleccionado;
      // campos de almacén según tipo
      // campos de almacén según tipo
      // this.requerimiento.idalmacen =
      //   this.TipoSelecionado === 'TRANSFERENCIA'
      //     ? String(this.almacenOrigen)
      //     : String(idAlmacenSincronizado);
      this.requerimiento.idalmacen = String(idAlmacenFinal);
      this.requerimiento.idalmacendestino =
        this.TipoSelecionado === 'TRANSFERENCIA'
          ? String(this.almacenDestino)
          : '';
      // (this.requerimiento.idalmacen =
      //   this.TipoSelecionado === 'TRANSFERENCIA'
      //     ? String(this.almacenOrigen)
      //     : String(idAlmacenSincronizado)),
      //   (this.requerimiento.idalmacendestino =
      //     this.TipoSelecionado === 'TRANSFERENCIA'
      //       ? String(this.almacenDestino)
      //       : ''),
      // (this.requerimiento.idalmacendestino = '');
      // this.requerimiento.idproyecto = this.proyectoSeleccionado;
      this.requerimiento.idproyecto = this.proyectoSeleccionado
        ? String(this.proyectoSeleccionado)
        : '';
      this.requerimiento.fecha = new Date().toISOString();
      //   this.requerimiento.almacen = this.almacenSeleccionado;
      // mostrar en la tabla tal como pediste
      this.requerimiento.almacen =
        this.TipoSelecionado === 'TRANSFERENCIA'
          ? `${almacenOrigenObj?.almacen} → ${almacenDestinoObj?.almacen}`
          : `${almacenNormalObj?.almacen}`;
      this.requerimiento.glosa = this.glosa;
      this.requerimiento.detalle = this.detalles;
      this.requerimiento.prioridad = this.SeleccionaPrioridadITEM;
      this.requerimiento.tipo = 'ITEM';
      this.requerimiento.itemtipo = this.TipoSelecionado;
      this.requerimiento.referenciaGasto = this.SeleccionaTipoGasto;
      console.log('Requerimiento', this.requerimiento);
      // 4️⃣ Guardar requerimiento en Dexie
      this.requerimiento.estado = 0; // 👈 CLAVE
      // 4️⃣ Guardar requerimiento en Dexie
      const requerimientoId = await this.dexieService.requerimientos.put(
        this.requerimiento
      );

      // =========================
      // 6️⃣ GUARDAR DETALLE (ESTO ES LO QUE FALTABA)
      // =========================
      for (const d of this.detalles) {
        await this.dexieService.detalles.put({
          ...d,
          idrequerimiento: idReq, // 🔥 FK REAL
        });
      }

      console.log('Guardando parámetros:', {
        fundo: this.fundoSeleccionado,
        almacen: this.almacenSeleccionado,
        idalmacen: idAlmacenSincronizado,
        ceco: this.cecoSeleccionado,
        proyecto: this.proyectoSeleccionado,
        clasificacion: this.clasificacionSeleccionado,
        area: this.areaSeleccionada,
        usuario: this.usuario?.nombre || 'Desconocido',
      });

      // this.requerimientos.push(this.requerimiento);
      // await this.cargarRequerimientos();

      // ✅ Si estás editando, actualiza la lista en memoria
      if (this.modoEdicion) {
        const index = this.requerimientos.findIndex(
          (r) => r.idrequerimiento === this.requerimiento.idrequerimiento
        );
        if (index !== -1) {
          this.requerimientos[index] = { ...this.requerimiento };
        }
        this.modoEdicion = false;
      } else {
        // ✅ Si es nuevo, agrégalo normalmente
        this.requerimientos.push({ ...this.requerimiento });
      }

      this.actualizarContadores();
      this.mostrarFormulario = false;
      await this.cargarPendientes();
      // 🔹 Mostrar éxito
      // this.alertService.showAlert('Éxito', 'Los parámetros se guardaron correctamente.', 'success');
      this.alertService.showAlert(
        'Éxito',
        `Requerimiento #${requerimientoId} guardado correctamente.`,
        'success'
      );
      // this.alertService.showAlert('Éxito', `Requerimiento #${this.requerimiento.id} guardado correctamente.`, 'success');
      // 5️⃣ Limpiar formulario
      this.detalles = [];
      //   this.fundoSeleccionado = '';
      this.almacenSeleccionado = '';
      this.areaSeleccionada = '';
      this.clasificacionSeleccionado = '';
      this.glosa = '';
    } catch (err) {
      console.error('❌ Error al guardar parámetros:', err);

      // Cerrar modal y mostrar error
      this.alertService.cerrarModalCarga();
      this.modoEdicion = false;
      this.mostrarFormulario = false;
      this.modalAbierto = false;

      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar los parámetros.',
        'error'
      );
    }
  }

  async guardarEdicion() {
    try {
      // solo actualizamos los campos editables
      const index = this.requerimientos.findIndex(
        (r) => r.idrequerimiento === this.requerimiento.idrequerimiento
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
      // this.requerimientos[index].clasificacion = this.clasificacionSeleccionado;
      if (this.TipoSelecionado === 'TRANSFERENCIA') {
        this.requerimientos[index].idalmacen = String(this.almacenOrigen);
        this.requerimientos[index].idalmacendestino = String(
          this.almacenDestino
        );
        this.requerimientos[index].almacen = `${this.getAlmacenNombre(
          this.almacenOrigen
        )} → ${this.getAlmacenNombre(this.almacenDestino)}`;
      } else {
        this.requerimientos[index].idalmacen = String(this.almacenSeleccionado);
        this.requerimientos[index].idalmacendestino = '';
        this.requerimientos[index].almacen = this.getAlmacenNombre(
          this.almacenSeleccionado
        );
      }
      this.requerimientos[index].detalle = [...this.detalles];

      // si actualizarás estado
      // this.requerimientos[index].estado = this.estadoSeleccionado;

      // GUARDAR EN DEXIE
      await this.dexieService.saveRequerimiento(this.requerimientos[index]);
      this.actualizarContadores();
      this.alertService.showAlert(
        'Actualizado',
        'Requerimiento actualizado correctamente',
        'success'
      );

      this.modoEdicion = false;
      this.mostrarFormulario = false;
    } catch (error) {
      console.error('Error al actualizar', error);
      this.alertService.showAlert('Error', 'No se pudo actualizar', 'error');
    }
  }

  getAlmacenNombre(id: string) {
    return this.almacenes.find((a) => a.idalmacen == id)?.almacen || '';
  }

  cancelar(): void {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.'
    );
    if (!confirmar) return;

    // this.fundoSeleccionado = '';
    this.cultivoSeleccionado = '';
    // this.almacenSeleccionado = '';
    this.SeleccionaPrioridadITEM = '';
    this.SeleccionaTipoGasto = '';
    console.log('Formulario de parámetros reiniciado');
    this.alertService.mostrarInfo('Los cambios han sido cancelados.');
  }

  editarRequerimiento(index: number) {
    this.requerimiento = { ...this.requerimientos[index] };
    this.requerimiento.id = this.requerimientos[index].id; // 🔥 Necesario para update()
    this.detalles = this.requerimiento.detalle || [];

    // Cargar los campos en los selects principales
    this.fundoSeleccionado = this.requerimiento.idfundo;
    this.areaSeleccionada = this.requerimiento.idarea;
    this.SeleccionaPrioridadITEM = this.requerimiento.prioridad;

    this.almacenSeleccionado = this.requerimiento.idalmacen;
    this.clasificacionSeleccionado = this.requerimiento.idclasificacion;
    this.glosa = this.requerimiento.glosa;
    this.SeleccionaTipoGasto = this.requerimiento.referenciaGasto;
    this.TipoSelecionado = this.requerimiento.itemtipo;
    this.almacenOrigen = this.requerimiento.idalmacen;
    this.almacenDestino = this.requerimiento.idalmacendestino;

    // Mostrar el formulario principal
    this.modoEdicion = true; // 🔹 Activamos modo edición
    this.mostrarFormulario = true;
    this.modalAbierto = false; // aseguramos que el modal detalle no esté abierto
    // 👉 Vuelve a asignar almacén cuando cargue lista (por si idalmacen viene vacío)
    this.reasignarAlmacenDesdeDescripcion();
  }

  reasignarAlmacenDesdeDescripcion() {
    if (!this.almacenes || this.almacenes.length === 0) return;

    // Si ya hay ID, no se hace nada
    if (this.requerimiento.idalmacen && this.requerimiento.idalmacen !== '') {
      this.almacenSeleccionado = this.requerimiento.idalmacen;
      return;
    }

    // Buscar por texto del almacén
    const alm = this.almacenes.find(
      (a) => a.almacen === this.requerimiento.almacen
    );

    if (alm) {
      this.almacenSeleccionado = alm.idalmacen;
    }

    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      const partes = this.requerimiento.almacen.split('→').map(p => p.trim());
      if (partes.length === 2) {
        const origen = this.almacenes.find(a => a.almacen === partes[0]);
        const destino = this.alamcenesDestino.find(a => a.almacen === partes[1]);
        if (origen) {
          this.almacenOrigen = origen.idalmacen;
        }
        if (destino) {
          this.almacenDestino = destino.idalmacen;
        }
      }
    }
  }

  async eliminarRequerimiento(index: number) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea eliminar este requerimiento?',
      'warning'
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
        'success'
      );
      // await this.dexieService.deleteRequerimiento(req.idrequerimiento);
      // await this.cargarRequerimientos();
      // this.alertService.showAlert(
      //   'Éxito',
      //   'Requerimiento eliminado correctamente.',
      //   'success'
      // );
    } catch (error) {
      console.error('Error al eliminar requerimiento:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar el requerimiento.',
        'error'
      );
    }
  }

  // Abrir modal consolidacion (agrupa varios)
  abrirModalConsolidacion() {
    // tomamos todos los ATENDIDO_PARCIAL y GENERADO que tengan saldo > 0
    const pendientes = this.requerimientosItems.filter(
      (r) => r.estado === 'ATENDIDO_PARCIAL' || r.estado === 'GENERADO'
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
            .map((d: any) => ({ ...d, origenReq: p.id }))
        )
      ),
      origenReqs: pendientes.map((p) => p.id),
    };

    console.log('Consolidado:', consolidado);
  }
}
