import { Injectable } from '@angular/core';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import {
  Usuario,
  Configuracion,
  Ceco,
  Labor,
  Proyecto,
  ActivoFijo,
} from '@/app/shared/interfaces/Tables';

@Injectable({ providedIn: 'root' })
export class RequerimientosMaestrasService {

  // ── Usuario ────────────────────────────────────────────────────────────────
  usuario: Usuario = {
    id: '', sociedad: 0, idempresa: '', ruc: '', razonSocial: '',
    idProyecto: '', proyecto: '', documentoidentidad: '', usuario: '',
    clave: '', nombre: '', idrol: '', rol: '',
  };

  // ── Configuración ──────────────────────────────────────────────────────────
  configuracion: Configuracion = {
    id: '', idempresa: '', idfundo: '', idcultivo: '', idarea: '',
    idalmacen: '', idproyecto: '', idacopio: 0, idceco: '', idlabor: '',
    iditem: '', idturno: '', idclasificacion: '', idgrupolabor: '',
    idproveedor: '', idtipoGasto: '', idactivoFijo: '', idTipoItem: '',
  };

  // ── Maestras ───────────────────────────────────────────────────────────────
  fundos: any[] = [];
  cultivos: any[] = [];
  areas: any[] = [];
  proyectos: any[] = [];
  items: any[] = [];
  itemsFiltrados: any[] = [];
  turnos: any[] = [];
  labores: any[] = [];
  cecos: any[] = [];
  almacenes: any[] = [];
  alamcenesDestino: any[] = [];
  clasificaciones: any[] = [];
  clasificacionesFiltrados: any[] = [];
  proveedoresServicios: any[] = [];
  proveedoresActivoFijo: any[] = [];
  tipoGastos: any[] = [];
  servicios: any[] = [];
  servicioAF: any[] = [];
  servicioAFMenor: any[] = [];
  subservicios: any[] = [];
  subserviciosAF: any[] = [];
  subserviciosAFMenor: any[] = [];
  subservicioFiltrados: any[] = [];
  subservicioFiltradosAF: any[] = [];
  subservicioFiltradosAFMenor: any[] = [];
  commodityFiltrados: any[] = [];
  commodityFiltradosAF: any[] = [];
  commodityFiltradosAFMenor: any[] = [];
  activosFijos: any[] = [];
  activosFijosFiltrados: any[] = [];
  activosFijosServicioFiltrados: any[] = [];
  unidadesMedidaFiltradas: any[] = [];

  // ── Selecciones compartidas ────────────────────────────────────────────────
  fundoSeleccionado = '';
  cultivoSeleccionado = '';
  areaSeleccionada = '';
  almacenSeleccionado: any = '';
  almacenOrigen = '';
  almacenDestino = '';
  clasificacionSeleccionado = '';
  turnoSeleccionado = '';
  cecoSeleccionado: Ceco | null = null;
  proyectoSeleccionado: Proyecto | null = null;
  laborSeleccionado: Labor | null = null;

  // ── Estado global ──────────────────────────────────────────────────────────
  loading = false;
  sincronizando = false;
  progreso = 0;
  pendientes = 0;
  modoItemPrincipal = false;

  constructor(
    private dexieService: DexieService,
    private utilsService: UtilsService,
  ) {}

  // ── Usuario ────────────────────────────────────────────────────────────────
  async cargarUsuario() {
    try {
      const usuarioActual = await this.dexieService.showUsuario();
      if (usuarioActual) {
        this.usuario = usuarioActual;
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario:', error);
    }
  }

  // ── Maestras ───────────────────────────────────────────────────────────────
  async cargarMaestras() {
    await this.ListarFundos();
    await this.ListarCultivos();
    await this.ListarAreas();
    await this.ListarAlmacenes();
    await this.ListarAlmacenDestino();
    await this.ListarProyectos();
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

  async cargarConfiguracion() {
    const config = await this.dexieService.obtenerPrimeraConfiguracion();
    if (config) {
      this.configuracion = config;
      this.fundoSeleccionado = config.idfundo;
      this.areaSeleccionada = this.usuario.idarea || config.idarea;
      this.cultivoSeleccionado = config.idcultivo;
      this.almacenSeleccionado = config.idalmacen;
      this.clasificacionSeleccionado = config.idclasificacion;
      this.turnoSeleccionado = config.idturno;
      if (config.idceco) {
        this.cecoSeleccionado = (await this.dexieService.getCecoById(config.idceco)) as Ceco | null;
        if (!this.cecoSeleccionado) {
          this.cecoSeleccionado = this.cecos.find(
            (c) => c.localname === config.idceco || c.costcenter === config.idceco,
          ) || null;
        }
      }
      if (config.idproyecto) {
        this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(config.idproyecto)) as Proyecto | null;
      }
      if (config.idlabor) {
        this.laborSeleccionado = (await this.dexieService.getLaborById(config.idlabor)) as Labor | null;
      }
    }
  }

  async ListarFundos() { this.fundos = await this.dexieService.showFundos(); }
  async ListarCultivos() { this.cultivos = await this.dexieService.showCultivos(); }
  async ListarAreas() { this.areas = await this.dexieService.showAreas(); }
  async ListarAlmacenes() { this.almacenes = await this.dexieService.showAlmacenes(); }
  async ListarAlmacenDestino() { this.alamcenesDestino = await this.dexieService.showAlmacenesDestino(); }
  async ListarProyectos() { this.proyectos = await this.dexieService.showProyectos(); }
  async ListarTurnos() { this.turnos = await this.dexieService.showTurnos(); }
  async ListarLabores() { this.labores = await this.dexieService.showLabores(); }
  async ListarCecos() { this.cecos = await this.dexieService.showCecos(); }
  async ListarClasificaciones() { this.clasificaciones = await this.dexieService.showClasificaciones(); }
  async ListarProveedores() {
    this.proveedoresServicios = await this.dexieService.showProveedores();
    this.proveedoresActivoFijo = await this.dexieService.showProveedores();
  }
  async ListarTipoGastos() { this.tipoGastos = await this.dexieService.showTipoGastos(); }

  async ListarItems() {
    this.items = await this.dexieService.showItemComoditys();
    if (this.configuracion?.idalmacen) {
      this.itemsFiltrados = this.items.filter(
        (it) => it.tipoclasificacion === 'I' && it.almacen === this.configuracion.idalmacen,
      );
    } else {
      this.itemsFiltrados = this.items.filter((it) => it.tipoclasificacion === 'I');
    }
  }

  async ListarServicios() {
    this.servicios = await this.dexieService.showMaestroCommodity();
    this.commodityFiltrados = this.servicios.filter((serv) => serv.clasificacion === 'SER');
  }

  async ListarServiciosAF() {
    this.servicioAF = await this.dexieService.showMaestroCommodity();
    this.commodityFiltradosAF = this.servicioAF.filter((servaf) => servaf.clasificacion === 'ACT');
  }

  async ListarServiciosAFMenor() {
    this.servicioAFMenor = await this.dexieService.showMaestroCommodity();
    this.commodityFiltradosAFMenor = this.servicioAFMenor.filter((s) => s.clasificacion === 'ACM');
  }

  async ListarActivosFijos() {
    this.activosFijos = await this.dexieService.showActivosFijos();
    const activosMapeados: ActivoFijo[] = this.activosFijos.map((act) => ({
      ...act,
      activo_descripcion: `${act.activo} - ${act.descripcion}`,
    }));
    this.activosFijosFiltrados = activosMapeados.filter((act) => act.tipoActivo === 'I');
    this.activosFijosServicioFiltrados = activosMapeados.filter((act) => act.tipoActivo === 'C');
  }

  async onServicioChange(SeleccionaServicio: string): Promise<string[]> {
    if (!SeleccionaServicio) { this.subservicioFiltrados = []; return []; }
    this.subservicios = await this.dexieService.showMaestroSubCommodity();
    this.subservicioFiltrados = this.subservicios.filter((sub) => sub.commodity01 === SeleccionaServicio);
    return this.subservicioFiltrados;
  }

  async onServicioAFChange(SeleccionaServicioAF: string): Promise<string[]> {
    if (!SeleccionaServicioAF) { this.subservicioFiltradosAF = []; return []; }
    this.subserviciosAF = await this.dexieService.showMaestroSubCommodity();
    this.subservicioFiltradosAF = this.subserviciosAF.filter((sub) => sub.commodity01 === SeleccionaServicioAF);
    return this.subservicioFiltradosAF;
  }

  async onServicioAFMenorChange(SeleccionaServicioAFMenor: string): Promise<string[]> {
    if (!SeleccionaServicioAFMenor) { this.subservicioFiltradosAFMenor = []; return []; }
    this.subserviciosAFMenor = await this.dexieService.showMaestroSubCommodity();
    this.subservicioFiltradosAFMenor = this.subserviciosAFMenor.filter((sub) => sub.commodity01 === SeleccionaServicioAFMenor);
    return this.subservicioFiltradosAFMenor;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getDescripcionFundo(idfundo: any): string {
    const f = this.fundos.find((x) => x.codigoFundo == idfundo);
    return f ? f.nombreFundo : idfundo;
  }

  resolverAreaDesdeTexto(textoArea: string): string {
    if (!textoArea) return '';
    const texto = textoArea.trim().toUpperCase();
    const encontrada = this.areas.find((a: any) =>
      (a.descripcion ?? '').toString().toUpperCase().trim() === texto ||
      (a.nombre ?? '').toString().toUpperCase().trim() === texto
    );
    return encontrada ? String(encontrada.idarea) : '';
  }

  getDescripcionArea(idarea: any): string {
    const usuarioArea = (this.usuario as any)?.nombreArea;
    const usuarioIdArea = (this.usuario as any)?.idarea;
    // Prioridad 1: si el idarea coincide con el del usuario actual, usar su nombreArea (viene de obtener-area-usuario)
    if (usuarioArea && usuarioIdArea != null && String(usuarioIdArea) === String(idarea ?? usuarioIdArea)) {
      return usuarioArea;
    }
    if (idarea === null || idarea === undefined || idarea === '') {
      return usuarioArea || '';
    }
    const a = this.areas.find((x: any) => x.idarea == idarea);
    if (a) return a.descripcion ?? a.nombre ?? String(idarea);
    return usuarioArea || String(idarea);
  }

  formatoFecha(date: any): string {
    return this.utilsService.formatDate1(date);
  }

  obtenerIdReq(id: string): string {
    if (!id) return '';
    return id.slice(-12);
  }

  getNombreAlmacen(id: string): string {
    const almacen = this.almacenes.find((a: any) => a.idalmacen == id);
    return almacen?.almacen ?? '---';
  }

  mostrarAlmacenDestino(c: any): string {
    const destino = this.alamcenesDestino.find((a: any) => a.idalmacen == c?.idalmacendestino);
    return destino?.almacen ?? '---';
  }

  esEnviado(r: any): boolean {
    return r?.estado === 1;
  }

  async generarGlosaAutomatica(): Promise<string> {
    try {
      const nombreArea = (this.usuario as any).nombreArea || (this.usuario as any).idarea || 'Sin Área';
      const fechaActual = new Date();
      const primerDiaDelMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const diasTranscurridos = Math.floor((fechaActual.getTime() - primerDiaDelMes.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const numeroSemanaDelMes = Math.ceil(diasTranscurridos / 7);
      const ahora = new Date();
      const correlativo = String(ahora.getHours()).padStart(2, '0') + String(ahora.getMinutes()).padStart(2, '0');
      return `Requerimiento ${correlativo} para el área de ${nombreArea} - Semana ${numeroSemanaDelMes}`;
    } catch {
      return `Requerimiento para el área de ${(this.usuario as any).nombreArea || 'Sin Área'} - ${new Date().toLocaleDateString()}`;
    }
  }

  filtroClasificaciones(RequerimientoSelecionado: string) {
    this.clasificacionesFiltrados = this.clasificaciones.filter(
      (it) => it.tipoClasificacion === RequerimientoSelecionado,
    );
  }

  obtenerDescripcionServicio(codigo: string): string {
    const serv = this.commodityFiltrados.find((s) => s.commodity01 === codigo);
    return serv ? serv.descripcionLocal : codigo;
  }

  obtenerDescripcionServicioAF(codigo: string): string {
    if (!codigo) return '';
    let serv = this.commodityFiltradosAF.find((s) => s.commodity01 === codigo);
    if (!serv) serv = this.servicioAF.find((s) => s.commodity01 === codigo);
    if (!serv) serv = this.commodityFiltradosAF.find((s) => s.commodity === codigo) || this.servicioAF.find((s) => s.commodity === codigo);
    return serv ? serv.descripcionLocal : codigo;
  }

  obtenerDescripcionServicioAFM(codigo: string): string {
    if (!codigo) return '';
    let serv = this.commodityFiltradosAFMenor.find((s) => s.commodity01 === codigo);
    if (!serv) serv = this.servicioAFMenor.find((s) => s.commodity01 === codigo);
    if (!serv) serv = this.commodityFiltradosAFMenor.find((s) => s.commodity === codigo) || this.servicioAFMenor.find((s) => s.commodity === codigo);
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
    const sub = this.subservicioFiltradosAFMenor.find((x) => x.commodity === codigo);
    return sub ? sub.descripcionLocal : codigo;
  }

  obtenerDescripcionActivoFijo(codigo: string): string {
    const af = this.activosFijosFiltrados.find((a) => a.activoFijo01 === codigo);
    return af ? af.descripcionLocal : codigo;
  }

  obtenerUnidadMedidaProducto(producto: any): string {
    if (typeof producto === 'string') {
      const item = this.items?.find((i: any) => i.codigo === producto);
      return item?.unidadMedida || 'UN';
    }
    return producto?.unidadMedida || 'UN';
  }

  async cargarDatosParaConsumo() {
    try {
      const config = await this.dexieService.obtenerPrimeraConfiguracion();
      if (config) {
        if (config.idturno) this.turnoSeleccionado = config.idturno;
        if (config.idceco) this.cecoSeleccionado = (await this.dexieService.getCecoById(config.idceco)) as any;
        if (config.idlabor) this.laborSeleccionado = (await this.dexieService.getLaborById(config.idlabor)) as any;
        if (config.idproyecto) this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(config.idproyecto)) as any;
      }
      if (!this.cecos?.length) await this.ListarCecos();
      if (!this.labores?.length) await this.ListarLabores();
      if (!this.proyectos?.length) await this.ListarProyectos();
    } catch (error) {
      console.error('Error al cargar datos para CONSUMO:', error);
    }
  }

  async cargarDatosParaCompra() {
    try {
      if (!this.cecos?.length) await this.ListarCecos();
      if (!this.labores?.length) await this.ListarLabores();
      if (!this.proyectos?.length) await this.ListarProyectos();
    } catch (error) {
      console.error('Error al cargar datos para COMPRA:', error);
    }
  }

  reasignarAlmacenDesdeDescripcion(requerimiento: any, TipoSelecionado: string) {
    if (!this.almacenes || this.almacenes.length === 0) return;
    if (requerimiento.idalmacen && requerimiento.idalmacen !== '') {
      this.almacenSeleccionado = requerimiento.idalmacen;
      return;
    }
    const alm = this.almacenes.find((a: any) => a.almacen === requerimiento.almacen);
    if (alm) this.almacenSeleccionado = alm.idalmacen;
    if (TipoSelecionado === 'TRANSFERENCIA') {
      const partes = (requerimiento.almacen || '').split('?').map((p: string) => p.trim());
      if (partes.length === 2) {
        const origen = this.almacenes.find((a: any) => a.almacen === partes[0]);
        const destino = this.alamcenesDestino.find((a: any) => a.almacen === partes[1]);
        if (origen) this.almacenOrigen = origen.idalmacen;
        if (destino) this.almacenDestino = destino.idalmacen;
      }
    }
  }

  async recargarValoresDesdeConfiguracion(TipoSelecionado: string) {
    try {
      if (!this.cecos || this.cecos.length === 0) await this.ListarCecos();
      if (!this.labores || this.labores.length === 0) await this.ListarLabores();
      if (!this.proyectos || this.proyectos.length === 0) await this.ListarProyectos();
      const config = await this.dexieService.obtenerPrimeraConfiguracion();
      if (config && TipoSelecionado === 'COMPRA') {
        if (config.idceco) {
          this.cecoSeleccionado = (await this.dexieService.getCecoById(config.idceco)) as any;
        }
        if (config.idlabor) {
          this.laborSeleccionado = (await this.dexieService.getLaborById(config.idlabor)) as any;
        }
        if (config.idproyecto) {
          this.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(config.idproyecto)) as any;
        }
      }
    } catch (error) {
      console.error('Error al recargar valores desde configuración:', error);
    }
  }
}
