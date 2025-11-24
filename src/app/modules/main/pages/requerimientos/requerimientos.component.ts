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
import { LayoutComponent } from '@/app/modules/main/pages/layout/layout.component';

@Component({
  selector: 'app-requerimientos',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
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
  modoEdicionCommodity = false;
  //-------Activo Fijo----------
  mostrarFormularioActivoFijo = false;
  modoEdicionActivoFijo = false;
  //-------Activo Fijo Menor----------
  mostrarFormularioActivoFijoMenor = false;
  modoEdicionActivoFijoMenor = false;

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
    codigo: '',
    producto: '',
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
    nrodocumento: '',
    idalmacen: '',
    idalmacendestino: '',
    idproyecto: '',
    estado: 0,
    detalleActivoFijoMenor: [],
  };

  detalleActivoFijoMenor: DetalleRequerimientoActivoFijoMenor = {
    // servicio: '',
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
    // servicio: '',
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
    // servicio: '',
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

  fundoSeleccionado = '';
  cultivoSeleccionado = '';
  areaSeleccionada = '';
  almacenSeleccionado = '';
  proyectoSeleccionado = '';
  itemSeleccionado = '';
  clasificacionSeleccionado = '';
  cecoSeleccionado = '';
  turnoSeleccionado = '';
  laborSeleccionado = '';
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
    await this.cargarConfiguracion(); // 👈 REUTILIZA LO GUARDADO EN PARÁMETROS
    await this.cargarMaestras();
    await this.cargarRequerimientos(); // 👈 Esto llena la tabla al inicio
    // await this.cargarDetalles(); // 🔹 cargar detalles guardados
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
      this.cecoSeleccionado = config.idceco;
      this.turnoSeleccionado = config.idturno;
      this.laborSeleccionado = config.idlabor;
      this.itemSeleccionado = config.iditem;
    } else {
      console.warn('⚠️ No existe configuración guardada.');
    }
  }

  nuevoCommodity() {
    this.mostrarFormularioCommodity = true;
    this.modoEdicionCommodity = false;
  }

  editarCommodity(index: number) {
    const req = this.requerimientosCommodity[index];
    if (!req) return;

    this.mostrarFormularioCommodity = true;
    this.modoEdicionCommodity = true;
    this.commodityEditIndex = index;

    // Copiar el requerimiento seleccionado
    this.requerimientoCommodity = { ...req };

    // Cargar detalles
    this.detallesCommodity = req.detalleCommodity || [];

    // Cargar selects
    this.fundoSeleccionado = req.idfundo;
    this.areaSeleccionada = req.idarea;
    this.almacenSeleccionado = req.idalmacen;
    this.clasificacionSeleccionado = req.idclasificacion;
    this.proyectoSeleccionado = req.idproyecto;

    // Campos propios del servicio
    this.seleccionaProveedor = req.proveedor;
    this.SeleccionaServicio = req.servicio;
    this.glosaCommodity = req.glosa;

    // Asegurar que no esté abierto algún modal
    this.modalAbiertoCommodity = false;
  }

  eliminarCommodity(index: number) {
    this.requerimientosCommodity.splice(index, 1);
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
        fecha: new Date().toISOString(),
        proveedor: this.seleccionaProveedor,
        servicio: this.SeleccionaServicio,
        descripcion: this.SeleccionaSubServicio,
        almacen: almacenObj?.almacen || '',
        glosa: this.glosaCommodity,
        tipo: 'COMMODITY',
        ruc: this.usuario.ruc,
        estados: 'PENDIENTE',

        idfundo: this.fundoSeleccionado,
        idarea: this.areaSeleccionada,
        idclasificacion: this.clasificacionSeleccionado,
        nrodocumento: this.usuario.documentoidentidad,
        idalmacen: idAlmacenSync,
        idalmacendestino: '',
        idproyecto: this.proyectoSeleccionado,
        estado: 0,

        detalleCommodity: [...this.detallesCommodity],
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

      this.alertService.cerrarModalCarga();

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
    this.mostrarFormularioCommodity = false;
  }

  nuevoActivoFijoMenor() {
    this.mostrarFormularioActivoFijoMenor = true;
    this.detallesActivoFijo = [];
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
    this.proyectoSeleccionado = req.idproyecto;

    // Campos propios del activo fijo
    this.selecccionaActivoFijoMenor = req.servicio;
    this.glosaActivoFijoMenor = req.glosa;

    this.modalAbiertoActivoFijoMenor = false;
  }

  eliminarActivoFijoMenor(index: number) {
    this.requerimientosActivoFijoMenor.splice(index, 1);
  }

  editarDetalleActivoFijoMenor(index: number): void {
    this.activoFijoMenorEditIndex = index;
    this.lineaTempActivoFijoMenor = { ...this.detallesActivoFijoMenor[index] };
    this.modoEdicionActivoFijoMenor = true;

    this.modalAbiertoActivoFijoMenor = true;
  }

  async eliminarDetalleActivoFijoMenor(index: number) {
    const id = this.detallesActivoFijoMenor[index].id!;
    await this.dexieService.deleteDetalleActivoFijoMenor(id);
    await this.cargarDetalles();
    this.alertService.mostrarInfo('Línea eliminada.');
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

    // if (!this.clasificacionSeleccionado) {
    //   this.alertService.showAlert(
    //     'Atención',
    //     'Debes seleccionar una Clasificación antes de guardar.',
    //     'warning'
    //   );
    //   return;
    // }

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
        // proveedor: this.seleccionaProveedor,
        servicio: this.SeleccionaServicioAFMenor,
        descripcion: this.SeleccionaSubServicioAFMenor,
        almacen: almacenObj?.almacen || '',
        glosa: this.glosaActivoFijoMenor,
        tipo: 'ACTIVOFIJOMENOR',
        ruc: this.usuario.ruc,
        estados: 'PENDIENTE',

        idfundo: this.fundoSeleccionado,
        idarea: this.areaSeleccionada,
        idclasificacion: this.clasificacionSeleccionado,
        nrodocumento: this.usuario.documentoidentidad,
        idalmacen: idAlmacenSync,
        idalmacendestino: '',
        idproyecto: this.proyectoSeleccionado,
        estado: 0,

        detalleActivoFijoMenor: [...this.detallesActivoFijoMenor],
      };

      // ================================
      // GUARDAR EN DEXIE
      // ================================
      const idGuardado = await this.dexieService.requerimientosActivoFijoMenor.put(
        reqAF
      );

      // ================================
      // GUARDAR EN MEMORIA
      // ================================
      this.requerimientosActivoFijoMenor.push(reqAF);

      this.alertService.cerrarModalCarga();

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
    this.mostrarFormularioActivoFijoMenor = false;
  }

  nuevoActivoFijo() {
    this.mostrarFormularioActivoFijo = true;
    this.detallesActivoFijo = [];
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
    this.detallesActivoFijo = req.detalleActivoFijo || [];

    // Cargar selects principales
    this.fundoSeleccionado = req.idfundo;
    this.areaSeleccionada = req.idarea;
    this.almacenSeleccionado = req.idalmacen;
    this.clasificacionSeleccionado = req.idclasificacion;
    this.proyectoSeleccionado = req.idproyecto;

    // Campos propios del activo fijo
    this.selecccionaActivoFijo = req.servicio;
    this.glosaActivoFijo = req.glosa;

    this.modalAbiertoActivoFijo = false;
  }

  eliminarActivoFijo(index: number) {
    this.requerimientosActivoFijo.splice(index, 1);
  }

  editarDetalleActivoFijo(index: number): void {
    this.activoFijoEditIndex = index;
    this.lineaTempActivoFijo = { ...this.detallesActivoFijo[index] };
    this.modoEdicionActivoFijo = true;
    this.modalAbiertoActivoFijo = true;
  }

  async eliminarDetalleActivoFijo(index: number) {
    const id = this.detalles[index].id!;
    await this.dexieService.deleteDetalleRequerimiento(id);
    await this.cargarDetalles();
    this.alertService.mostrarInfo('Línea eliminada.');
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

    // if (!this.clasificacionSeleccionado) {
    //   this.alertService.showAlert(
    //     'Atención',
    //     'Debes seleccionar una Clasificación antes de guardar.',
    //     'warning'
    //   );
    //   return;
    // }

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

        idfundo: this.fundoSeleccionado,
        idarea: this.areaSeleccionada,
        idclasificacion: this.clasificacionSeleccionado,
        nrodocumento: this.usuario.documentoidentidad,
        idalmacen: idAlmacenSync,
        idalmacendestino: '',
        idproyecto: this.proyectoSeleccionado,
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

  async onFundoChange(limpiar = false) {
    if (limpiar) {
      this.configuracion.idturno = '';
      this.configuracion.idceco = '';
      this.configuracion.idlabor = '';
      this.configuracion.idproyecto;
    }
    await this.filtraFundo();
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

  async filtraFundo() {
    this.filteredTurnos.length = 0;
    this.configuracion.idturno = '';
    if (this.configuracion.idcultivo) {
      const cultivo = this.cultivos.find(
        (e: any) => e.id == this.configuracion.idcultivo
      );
    }
  }

  async filtraCecoTurnoProyecto() {
    this.filteredTurnos.length = 0;
    this.configuracion.idturno = '';
    if (this.configuracion.idcultivo) {
      const cultivo = this.cultivos.find(
        (e: any) => e.id == this.configuracion.idcultivo
      );
      // const turnos = await this.dexieService.showTurnos()
      this.filteredTurnos = this.turnos.filter(
        (x: Turno) => x.idcultivo?.trim() === cultivo.idcultivo
      );
    }
  }

  async onProyectoChange() {
    this.filteredProyectos.length = 0;
    this.configuracion.iditem = '';
    if (this.configuracion.idproyecto) {
      const proyecto = this.proyectos.find(
        (e: any) => e.id == this.configuracion.idproyecto
      );
    }
  }

  async filtrarClasificaciones() {
    this.clasificacionesFiltrados = this.clasificaciones.filter(
      (it) => it.tipoClasificacion === this.RequerimientoSelecionado
    );
    console.log(this.clasificacionesFiltrados);
  }

  nuevoRequerimiento(): void {
    this.requerimiento = {
      idrequerimiento: '',
      fecha: new Date().toISOString(),
      almacen: '',
      glosa: '',
      tipo: '',
      ruc: this.usuario.ruc,
      idfundo: '',
      idarea: '',
      idclasificacion: '',
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
    if (this.requerimiento.detalle.length === 0) {
      this.alertService.showAlert(
        'Alerta',
        'Debe ingresar al menos un requerimiento',
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

    // 👇 Aquí formamos el objeto según el SP
    const requerimiento = {
      idrequerimiento: `${this.usuario.ruc}${this.requerimiento.idalmacen}${this.usuario.documentoidentidad
        }${new Date().toISOString().replace(/[-:TZ.]/g, '')}`,
      ruc: this.usuario.ruc,
      idfundo: this.requerimiento.idfundo,
      // idarea: this.areaSeleccionada,
      idarea: this.requerimiento.idarea,
      idclasificacion: this.requerimiento.idclasificacion,
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: this.requerimiento.idalmacen,
      idalmacendestino: this.requerimiento.idalmacendestino || '',
      glosa: this.requerimiento.glosa || '',
      eliminado: 0,
      tipo: this.requerimiento.tipo,
      estados: 'PENDIENTE',
      // usuario: this.usuario.usuario,
      detalle: this.requerimiento.detalle.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: d.tipoclasificacion,
        cantidad: d.cantidad,
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
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: this.requerimientoCommodity.idalmacen,
      idalmacendestino: this.requerimientoCommodity.idalmacendestino || '',
      glosa: this.requerimientoCommodity.glosa || '',
      eliminado: 0,
      tipo: this.requerimientoCommodity.tipo,
      estados: 'PENDIENTE',
      // usuario: this.usuario.usuario,
      detalle: this.requerimientoCommodity.detalleCommodity.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: d.tipoclasificacion,
        cantidad: d.cantidad,
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
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: this.requerimientoActivoFijo.idalmacen,
      idalmacendestino: this.requerimientoActivoFijo.idalmacendestino || '',
      glosa: this.requerimientoActivoFijo.glosa || '',
      eliminado: 0,
      tipo: this.requerimientoActivoFijo.tipo,
      estados: 'PENDIENTE',
      // usuario: this.usuario.usuario,
      detalle: this.requerimientoActivoFijo.detalleActivoFijo.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: d.tipoclasificacion,
        cantidad: d.cantidad,
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

    // 👇 Aquí formamos el objeto según el SP
    const requerimiento = {
      idrequerimiento: `${this.usuario.ruc}${this.requerimientoActivoFijoMenor.idalmacen
        }${this.usuario.documentoidentidad}${new Date()
          .toISOString()
          .replace(/[-:TZ.]/g, '')}`,
      ruc: this.usuario.ruc,
      idfundo: this.requerimientoActivoFijoMenor.idfundo,
      // idarea: this.areaSeleccionada,
      idarea: this.requerimientoActivoFijoMenor.idarea,
      // idclasificacion: this.requerimientoActivoFijo.idclasificacion,
      idclasificacion: 'ACM',
      nrodocumento: this.usuario.documentoidentidad,
      idalmacen: this.requerimientoActivoFijoMenor.idalmacen,
      idalmacendestino: this.requerimientoActivoFijoMenor.idalmacendestino || '',
      glosa: this.requerimientoActivoFijoMenor.glosa || '',
      eliminado: 0,
      tipo: this.requerimientoActivoFijoMenor.tipo,
      estados: 'PENDIENTE',
      // usuario: this.usuario.usuario,
      detalle: this.requerimientoActivoFijoMenor.detalleActivoFijoMenor.map((d: any) => ({
        codigo: d.codigo,
        tipoclasificacion: d.tipoclasificacion,
        cantidad: d.cantidad,
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

  formatoRequerimiento() {
    const requerimientos = this.requerimiento.detalle.map((item: any) => {
      return {
        idrequerimiento: item.idrequerimiento,
        ruc: item.ruc,
        idfundo: item.idfundo,
        idarea: item.idarea,
        idclasificacion: item.idclasificacion,
        nrodocumento: item.nrodocumento,
        idalmacen: item.idalmacen,
        idalmacendestino: item.idalmacendestino,
        glosa: item.glosa,
        codigo: item.codigo,
        tipoclasificacion: 'I',
        cantidad: item.cantidad,
        idproyecto: item.proyecto,
        idcentrocosto: item.ceco,
        idturno: item.turno,
        idlabor: item.labor,
        eliminado: 0,
      };
    });
    return requerimientos.filter((item: any) => item.estado == 0);
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

  async onServicioChange() {

    if (!this.SeleccionaServicio) {
      this.subservicioFiltrados = [];
      this.SeleccionaSubServicio = '';
      return;
    }
    this.subservicios = await this.dexieService.showMaestroSubCommodity();
    // SeleccionaServicio YA ES el Commodity01
    this.subservicioFiltrados = this.subservicios.filter(
      sub => sub.commodity01 === this.SeleccionaServicio
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
      sub => sub.commodity01 === this.SeleccionaServicioAF
    );
    this.SeleccionaSubServicioAF = '';
  }

  async onServicioAFMenorChange() {
    if (!this.SeleccionaServicioAFMenor) {
      this.subservicioFiltradosAFMenor = [];
      this.SeleccionaSubServicioAFMenor = '';
      return;
    }
    this.subserviciosAFMenor = await this.dexieService.showMaestroSubCommodity();
    this.subservicioFiltradosAFMenor = this.subserviciosAFMenor.filter(
      sub => sub.commodity01 === this.SeleccionaServicioAFMenor
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
    // this.activosFijosFiltrados = this.activosFijos.filter(
    //   (act) => act.tipoActivo === 'I'
    // );
    // this.activosFijosServicioFiltrados = this.activosFijos.filter(
    //   (act) => act.tipoActivo === 'C'
    // );
  }

  nuevaLinea(): DetalleRequerimiento {
    return {
      codigo: '',
      producto: '',
      descripcion: '',
      cantidad: 0,
      proyecto: '',
      ceco: this.configuracion.idceco,
      turno: this.configuracion.idturno,
      labor: this.configuracion.idlabor,
      // NUEVOS CAMPOS
      esActivoFijo: false,
      activoFijo: '',
      estado: 0,
    };
  }

  nuevaLineaCommodity(): DetalleRequerimientoCommodity {
    return {
      codigo: '',
      descripcion: '',
      proveedor: '',
      cantidad: 0,
      proyecto: '',
      ceco: '',
      turno: '',
      labor: '',
      estado: 0,
      esActivoFijo: false,
      activoFijo: '',
    };
  }

  nuevaLineaActivoFijo(): DetalleRequerimientoActivoFijo {
    return {
      codigo: '',
      descripcion: '',
      proveedor: '',
      cantidad: 0,
      proyecto: '',
      ceco: '',
      turno: '',
      labor: '',
      // NUEVOS CAMPOS
      esActivoFijo: false,
      activoFijo: '',
      estado: 0,
    };
  }

  nuevaLineaActivoFijoMenor(): DetalleRequerimientoActivoFijoMenor {
    return {
      codigo: '',
      descripcion: '',
      proveedor: '',
      cantidad: 0,
      proyecto: '',
      ceco: '',
      turno: '',
      labor: '',
      // NUEVOS CAMPOS
      esActivoFijo: false,
      activoFijo: '',
      estado: 0,
    };
  }

  async abrirModal() {
    if (this.editIndex === -1) {
      // const nuevoCodigo = (this.detalles.length + 1).toString().padStart(6, '0');
      this.lineaTemp = {
        // codigo: nuevoCodigo,
        codigo: '',
        producto: '',
        descripcion: '',
        estado: 0,
        cantidad: 0,
        proyecto: '',
        ceco: '',
        turno: '',
        labor: '',
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
    if ((this.commodityEditIndex === -1)) {
      this.lineaTempCommodity = {
        codigo: '',
        descripcion: '',
        proveedor: '',
        cantidad: 0,
        proyecto: '',
        ceco: '',
        turno: '',
        labor: '',
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
    // Buscar producto seleccionado
    // const productoSeleccionado = this.items.find(
    //   (it) => it.codigo === this.lineaTemp.producto
    // );
    // ✅ Validaciones previas
    // if (!this.lineaTemp.producto || this.lineaTemp.producto.trim() === '') {
    //   this.alertService.showAlert(
    //     'Campo requerido',
    //     'Debes seleccionar un producto.',
    //     'warning'
    //   );
    //   return;
    // }

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

    // if (this.lineaTempCommodity.esActivoFijo && !this.lineaTempCommodity.activoFijo) {
    //   this.alertService.showAlert(
    //     'Advertencia',
    //     'Debe ingresar el código de activo fijo.',
    //     'warning'
    //   );
    //   return;
    // }

    // if (this.tabActiva === 'ITEM') {
    //   this.detalles.push({ ...this.lineaTemp });
    // }

    // if (this.tabActiva === 'COMMODITY') {
    //   this.detallesCommodity.push({ ...this.lineaTempCommodity });
    // }

    // if (this.tabActiva === 'ACTIVOFIJO') {
    //   this.detallesActivoFijo.push({ ...this.lineaTempActivoFijo });
    // }

    const nuevaLineaDetalle = {
      codigo: this.lineaTempCommodity.codigo,
      // producto: productoSeleccionado.descripcion, // 👈 Guardamos la descripción visible
      // descripcion: this.lineaTempCommodity.descripcion,
      descripcion: this.SeleccionaSubServicio,
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

    // ✅ Si pasa todas las validaciones
    if (this.commodityEditIndex >= 0) {
      // Editar línea existente
      const idExistente = this.detallesCommodity[this.commodityEditIndex].id!;
      // await this.dexieService.detalles.put({ id: idExistente, ...this.lineaTemp });
      await this.dexieService.detallesCommodity.put({
        id: idExistente,
        ...nuevaLineaDetalle,
      });
      // this.detalle[this.editIndex] = { ...this.lineaTemp };
      // console.log(this.detalles);
      // ✅ Actualizar en memoria también
      this.detallesCommodity[this.commodityEditIndex] = {
        id: idExistente,
        ...nuevaLineaDetalle,
      };
    } else {
      // Agregar nueva línea
      delete this.lineaTempCommodity.id;
      // Agregar nueva línea
      const idNuevo = await this.dexieService.detallesCommodity.add({
        ...nuevaLineaDetalle,
      });
      // ✅ Añadir al arreglo en memoria
      this.detallesCommodity.push({ id: idNuevo, ...nuevaLineaDetalle });
      // await this.dexieService.detalles.add(this.lineaTemp);
      // await this.dexieService.detalles.add({ ...nuevaLineaDetalle });
      // this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
      // this.detalle.push({ ...this.lineaTemp });
      // console.log(this.detalles);
    }

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
    this.lineaTempCommodity = { ...this.detallesCommodity[index] };
    this.modoEdicionCommodity = true;
    this.modalAbiertoCommodity = true;
  }

  async eliminarDetalleCommodity(index: number) {
    const id = this.detalles[index].id!;
    await this.dexieService.deleteDetalleRequerimiento(id);
    await this.cargarDetalles();
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  // Activo Fijo
  abrirModalActivoFijoMenor() {
    if ((this.activoFijoEditIndex === -1)) {
      this.lineaTempActivoFijo = {
        codigo: '',
        descripcion: '',
        proveedor: '',
        cantidad: 0,
        proyecto: '',
        ceco: '',
        turno: '',
        labor: '',
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
    // Buscar producto seleccionado
    // const productoSeleccionado = this.items.find(
    //   (it) => it.codigo === this.lineaTemp.producto
    // );
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

    // if (this.tabActiva === 'ITEM') {
    //   this.detalles.push({ ...this.lineaTemp });
    // }

    // if (this.tabActiva === 'COMMODITY') {
    //   this.detallesCommodity.push({ ...this.lineaTempCommodity });
    // }

    // if (this.tabActiva === 'ACTIVOFIJO') {
    //   this.detallesActivoFijo.push({ ...this.lineaTempActivoFijo });
    // }

    const nuevaLineaDetalle = {
      codigo: this.lineaTempActivoFijoMenor.codigo,
      // producto: productoSeleccionado.descripcion, // 👈 Guardamos la descripción visible
      // descripcion: this.lineaTempActivoFijo.descripcion,
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
    if (this.editIndex >= 0) {
      // Editar línea existente
      const idExistente = this.detallesActivoFijoMenor[this.editIndex].id!;
      // await this.dexieService.detalles.put({ id: idExistente, ...this.lineaTemp });
      await this.dexieService.detallesActivoFijoMenor.put({
        id: idExistente,
        ...nuevaLineaDetalle,
      });
      // this.detalle[this.editIndex] = { ...this.lineaTemp };
      // console.log(this.detalles);
      // ✅ Actualizar en memoria también
      this.detallesActivoFijoMenor[this.editIndex] = {
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
      // await this.dexieService.detalles.add(this.lineaTemp);
      // await this.dexieService.detalles.add({ ...nuevaLineaDetalle });
      // this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
      // this.detalle.push({ ...this.lineaTemp });
      // console.log(this.detalles);
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
    if ((this.activoFijoEditIndex === -1)) {
      this.lineaTempActivoFijo = {
        codigo: '',
        descripcion: '',
        proveedor: '',
        cantidad: 0,
        proyecto: '',
        ceco: '',
        turno: '',
        labor: '',
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

    // if (this.tabActiva === 'ITEM') {
    //   this.detalles.push({ ...this.lineaTemp });
    // }

    // if (this.tabActiva === 'COMMODITY') {
    //   this.detallesCommodity.push({ ...this.lineaTempCommodity });
    // }

    // if (this.tabActiva === 'ACTIVOFIJO') {
    //   this.detallesActivoFijo.push({ ...this.lineaTempActivoFijo });
    // }

    const nuevaLineaDetalle = {
      codigo: this.lineaTempActivoFijo.codigo,
      // producto: productoSeleccionado.descripcion, // 👈 Guardamos la descripción visible
      // descripcion: this.lineaTempActivoFijo.descripcion,
      descripcion: this.SeleccionaSubServicioAF,
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
    if (this.editIndex >= 0) {
      // Editar línea existente
      const idExistente = this.detallesActivoFijo[this.editIndex].id!;
      // await this.dexieService.detalles.put({ id: idExistente, ...this.lineaTemp });
      await this.dexieService.detallesActivoFijo.put({
        id: idExistente,
        ...nuevaLineaDetalle,
      });
      // this.detalle[this.editIndex] = { ...this.lineaTemp };
      // console.log(this.detalles);
      // ✅ Actualizar en memoria también
      this.detallesActivoFijo[this.editIndex] = {
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
      // await this.dexieService.detalles.add(this.lineaTemp);
      // await this.dexieService.detalles.add({ ...nuevaLineaDetalle });
      // this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
      // this.detalle.push({ ...this.lineaTemp });
      // console.log(this.detalles);
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
      (it) => it.codigo === this.lineaTemp.producto
    );
    // ✅ Validaciones previas
    if (!this.lineaTemp.producto || this.lineaTemp.producto.trim() === '') {
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

    // if (this.tabActiva === 'ITEM') {
    //   this.detalles.push({ ...this.lineaTemp });
    // }

    // if (this.tabActiva === 'COMMODITY') {
    //   this.detallesCommodity.push({ ...this.lineaTempCommodity });
    // }

    // if (this.tabActiva === 'ACTIVOFIJO') {
    //   this.detallesActivoFijo.push({ ...this.lineaTempActivoFijo });
    // }

    const nuevaLineaDetalle = {
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
      // this.detalle[this.editIndex] = { ...this.lineaTemp };
      // console.log(this.detalles);
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
      // await this.dexieService.detalles.add(this.lineaTemp);
      // await this.dexieService.detalles.add({ ...nuevaLineaDetalle });
      // this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
      // this.detalle.push({ ...this.lineaTemp });
      // console.log(this.detalles);
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
      producto: producto ? producto.codigo : detalleSeleccionado.codigo,
    };

    // this.lineaTemp = { ...this.detalles[index] };
    this.modalAbierto = true;
  }

  async eliminarLinea(index: number) {
    const id = this.detalles[index].id!;
    await this.dexieService.deleteDetalleRequerimiento(id);
    await this.cargarDetalles();
    this.alertService.mostrarInfo('Línea eliminada.');
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

    // if (!this.areaSeleccionada) {
    //     this.alertService.showAlert('Atención', 'Debes seleccionar un Area antes de guardar.', 'warning');
    //     return;
    // }

    // if (!this.almacenSeleccionado) {
    //   this.alertService.showAlert(
    //     'Atención',
    //     'Debes seleccionar un Almacén antes de guardar.',
    //     'warning'
    //   );
    //   return;
    // }

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
      //   this.requerimiento.idalmacen = this.almacenSeleccionado;
      // campos de almacén según tipo
      (this.requerimiento.idalmacen =
        this.TipoSelecionado === 'TRANSFERENCIA'
          ? String(this.almacenOrigen)
          : String(idAlmacenSincronizado)),
        (this.requerimiento.idalmacendestino =
          this.TipoSelecionado === 'TRANSFERENCIA'
            ? String(this.almacenDestino)
            : ''),
        (this.requerimiento.idalmacendestino = '');
      this.requerimiento.idproyecto = this.proyectoSeleccionado;
      this.requerimiento.fecha = new Date().toISOString();
      //   this.requerimiento.almacen = this.almacenSeleccionado;
      // mostrar en la tabla tal como pediste
      this.requerimiento.almacen =
        this.TipoSelecionado === 'TRANSFERENCIA'
          ? `${almacenOrigenObj?.almacen} → ${almacenDestinoObj?.almacen}`
          : `${almacenNormalObj?.almacen}`;
      this.requerimiento.glosa = this.glosa;
      this.requerimiento.detalle = this.detalles;
      this.requerimiento.tipo = 'ITEM';
      // this.requerimientos.push(this.requerimiento);
      // await this.dexieService.saveRequerimiento(this.requerimiento);
      // await this.dexieService.saveRequerimientos(this.requerimientos);
      console.log('Requerimiento', this.requerimiento);
      // 4️⃣ Guardar requerimiento en Dexie
      // delete this.requerimiento.id;
      // const requerimientoId = await this.dexieService.requerimientos.add(this.requerimiento);
      const requerimientoId = await this.dexieService.requerimientos.put(
        this.requerimiento
      );

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
      // this.modoEdicion = false;
      // this.mostrarFormulario = false;
      // this.modalAbierto = false;

      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar los parámetros.',
        'error'
      );
    }
  }

  cancelar(): void {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.'
    );
    if (!confirmar) return;

    // this.fundoSeleccionado = '';
    this.cultivoSeleccionado = '';
    this.almacenSeleccionado = '';

    console.log('Formulario de parámetros reiniciado');
    this.alertService.mostrarInfo('Los cambios han sido cancelados.');
  }

  editarRequerimiento(index: number) {
    this.requerimiento = { ...this.requerimientos[index] };
    this.detalles = this.requerimiento.detalle || [];

    // Cargar los campos en los selects principales
    this.fundoSeleccionado = this.requerimiento.idfundo;
    this.areaSeleccionada = this.requerimiento.idarea;
    this.almacenSeleccionado = this.requerimiento.idalmacen;
    this.clasificacionSeleccionado = this.requerimiento.idclasificacion;
    this.glosa = this.requerimiento.glosa;

    // Mostrar el formulario principal
    this.modoEdicion = true; // 🔹 Activamos modo edición
    this.mostrarFormulario = true;
    this.modalAbierto = false; // aseguramos que el modal detalle no esté abierto
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
      await this.dexieService.deleteRequerimiento(req.idrequerimiento);
      await this.cargarRequerimientos();
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
