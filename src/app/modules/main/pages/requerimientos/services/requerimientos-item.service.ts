import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { PrioridadRequerimientoService } from '@/app/shared/services/prioridad-requerimiento.service';
import * as XLSX from 'xlsx';
import {
  Requerimiento, DetalleRequerimiento,
  Ceco, Labor, Proyecto, DetalleExcelPreview,
} from '@/app/shared/interfaces/Tables';
import { PrioridadSpring, TipoRequerimiento } from '@/app/shared/interfaces/PrioridadRequerimiento';
import { RequerimientosMaestrasService } from './requerimientos-maestras.service';
import { TransferenciaService } from '@/app/modules/main/services/transferencia.service';
import { RequerimientosSyncService } from './requerimientos-sync.service';

@Injectable({ providedIn: 'root' })
export class RequerimientosItemService {

  // â”€â”€ Lista y cabecera activa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  requerimientos: Requerimiento[] = [];
  requerimiento: Requerimiento = this.emptyReq();
  detalles: DetalleRequerimiento[] = [];
  lineaTemp: DetalleRequerimiento = this.emptyDetalle();

  // â”€â”€ UI state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;
  editingTempIndex = -1;
  modalAbierto = false;
  enModoEdicion = false;
  permitirEditarParametros = false;
  lineasTemporales: DetalleRequerimiento[] = [];

  // â”€â”€ Contadores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  sinenviar = 0;
  enviados = 0;
  pendientes = 0;

  // â”€â”€ Tipo y prioridad â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  TipoSelecionado: TipoRequerimiento | '' = '';
  RequerimientoSelecionado = 'I';
  SeleccionaPrioridadITEM: PrioridadSpring | '' = '';
  opcionesPrioridadITEM: { value: PrioridadSpring; label: string; descripcion: string }[] = [];
  SeleccionaTipoGasto = '';

  // â”€â”€ Modal filtros cascada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  turnoModal = '';
  cecoModal = '';
  laborModal = '';
  proyectoModal = '';
  filteredCecosModal: any[] = [];
  filteredLaboresModal: any[] = [];
  filteredProyectosModal: any[] = [];

  // â”€â”€ Otros â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  requerimientosOmitirValidacion: Set<string> = new Set();
  glosa = '';
  itemSeleccionado = '';
  verBotones = false;
  dataSelected: any[] = [];

  // â”€â”€ Stock validaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  validandoStock = false;
  itemsStockValidacion: any[] = [];
  requerimientoValidandoStock: any = null;
  modalStockAbierto = false;
  stockActualLineaTemp: number | null = null;
  consultandoStock = false;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private utilsService: UtilsService,
    private requerimientosService: RequerimientosService,
    private aprobacionesAreaService: AprobacionesAreaService,
    public prioridadService: PrioridadRequerimientoService,
    private maestras: RequerimientosMaestrasService,
    private transferenciaService: TransferenciaService,
    private syncService: RequerimientosSyncService,
  ) {}

  get usuario() { return this.maestras.usuario; }

  private emptyReq(): Requerimiento {
    return {
      idrequerimiento: '', fecha: '', almacen: '', glosa: '', tipo: '', itemtipo: '',
      referenciaGasto: '', prioridad: '', ruc: '', estados: 'PENDIENTE', idfundo: '',
      idarea: '', idclasificacion: '', nrodocumento: '', idalmacen: '', idalmacendestino: '',
      idproyecto: '', estado: 0, disabled: false, checked: false, eliminado: 0,
      despachado: false, detalle: [],
    };
  }

  private emptyDetalle(): DetalleRequerimiento {
    return {
      idrequerimiento: '', codigo: '', producto: null, descripcion: '', cantidad: 0,
      unidadMedida: '', proyecto: '', ceco: '', turno: '', labor: '',
      esActivoFijo: false, activoFijo: '', afectoIGV: 'S', estado: 0,
    };
  }

  // â”€â”€ Carga â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async cargar() {
    const todos = await this.dexieService.showRequerimiento();
    this.requerimientos = todos.filter(
      (r: any) =>
        r.nrodocumento === this.maestras.usuario?.documentoidentidad &&
        !this.syncService.debeOcultar(r.estados),
    );
    this.ordenar();
    this.contarContadores();
  }

  ordenar() {
    this.requerimientos.sort((a, b) => {
      if (a.estado !== b.estado) return a.estado - b.estado;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  contarContadores() {
    this.sinenviar = this.requerimientos.filter((r) => r.estado === 0).length;
    this.enviados = this.requerimientos.filter((r) => r.estado === 1).length;
  }

  async cargarPendientes() {
    const arr = await this.dexieService.requerimientos
      .filter((r) => (r.estado === 0 || (r as any).modificado === 1) && r.estado !== 1).toArray();
    this.pendientes = arr.length;
  }

  // â”€â”€ CRUD cabecera â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private ordenarLista(lista: any[]): void {
    lista.sort((a, b) => {
      if (a.estado !== b.estado) return a.estado - b.estado;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  async cargarRequerimientos(nrodocumento: string): Promise<{
    requerimientos: any[];
    requerimientosCommodity: any[];
    requerimientosActivoFijo: any[];
    requerimientosActivoFijoMenor: any[];
  }> {
    const filtrar = (lista: any[]) =>
      lista.filter(
        (r: any) =>
          r.nrodocumento === nrodocumento &&
          !this.syncService.debeOcultar(r.estados),
      );
    const items = filtrar(await this.dexieService.showRequerimiento());
    items.forEach((r: any) => {
      if (r.itemtipo) r.itemtipo = String(r.itemtipo).trim().toUpperCase();
    });
    this.ordenarLista(items);
    const commodity = filtrar(await this.dexieService.showRequerimientoCommodity());
    this.ordenarLista(commodity);
    const activoFijo = filtrar(await this.dexieService.showRequerimientoActivoFijo());
    this.ordenarLista(activoFijo);
    const activoFijoMenor = filtrar(await this.dexieService.showRequerimientoActivoFijoMenor());
    this.ordenarLista(activoFijoMenor);
    await this.inferirServicioDesdeDetalle(activoFijo);
    await this.inferirServicioDesdeDetalle(activoFijoMenor);
    this.requerimientos = items;
    return { requerimientos: items, requerimientosCommodity: commodity, requerimientosActivoFijo: activoFijo, requerimientosActivoFijoMenor: activoFijoMenor };
  }

  private async inferirServicioDesdeDetalle(lista: any[]) {
    if (!lista?.length) return;
    const faltan = lista.some((r: any) => !r.servicio && (r.detalle?.length || r.detalles?.length || r.detalleActivoFijo?.length || r.detalleActivoFijoMenor?.length));
    if (!faltan) return;
    const subs = await this.dexieService.showMaestroSubCommodity();
    lista.forEach((r: any) => {
      if (r.servicio) return;
      const dets = r.detalle?.length ? r.detalle
        : r.detalles?.length ? r.detalles
        : r.detalleActivoFijo?.length ? r.detalleActivoFijo
        : r.detalleActivoFijoMenor || [];
      if (!dets.length) return;
      const match = subs.find((s: any) => s.commodity === dets[0].codigo);
      if (match) r.servicio = match.commodity01;
    });
  }

  async nuevo() {
    this.detalles = [];
    this.lineasTemporales = [];
    this.glosa = await this.maestras.generarGlosaAutomatica();
    this.modalAbierto = false;
    this.modoEdicion = false;
    this.editIndex = -1;
    this.editingTempIndex = -1;
    this.enModoEdicion = false;
    this.permitirEditarParametros = false;
    const cfg = this.maestras.configuracion;
    const rol = this.usuario.idrol;
    const puedeTransferencia = rol === 'LOLOGIST' || rol === 'OPLOGIST' || rol === 'ALLOGIST';

    console.log('🆕 NUEVO REQUERIMIENTO - Configuración:', {
      idTipoItem: cfg?.idTipoItem,
      idalmacen: cfg?.idalmacen,
      idalmacenDestino: (cfg as any)?.idalmacenDestino,
      rol: rol,
      puedeTransferencia: puedeTransferencia,
    });

    if (cfg?.idTipoItem) {
      // Validar que solo LOLOGIST y ALLOGIST puedan hacer TRANSFERENCIAS
      if (cfg.idTipoItem === 'TRANSFERENCIA' && !puedeTransferencia) {
        console.log('🚫 TRANSFERENCIA no permitida para este rol, cambiando a COMPRA');
        this.TipoSelecionado = 'COMPRA';
        this.requerimiento.itemtipo = 'COMPRA';
      } else {
        console.log('✅ Tipo establecido desde configuración:', cfg.idTipoItem);
        this.TipoSelecionado = cfg.idTipoItem as TipoRequerimiento | '';
        this.requerimiento.itemtipo = cfg.idTipoItem;
      }
      await this.onTipoChange();
    } else {
      console.log('⚠️ No hay idTipoItem en configuración, default a CONSUMO');
      this.TipoSelecionado = 'CONSUMO';
      this.requerimiento.itemtipo = 'CONSUMO';
      await this.onTipoChange();
    }
    if (cfg?.idalmacen) {
      this.maestras.almacenSeleccionado = cfg.idalmacen;
      this.requerimiento.idalmacen = cfg.idalmacen;
      if (this.TipoSelecionado === 'TRANSFERENCIA') {
        this.maestras.almacenOrigen = cfg.idalmacen;
      }
    }
    if (this.TipoSelecionado === 'TRANSFERENCIA' && (cfg as any)?.idalmacenDestino) {
      this.maestras.almacenDestino = (cfg as any).idalmacenDestino;
    }
    this.maestras.areaSeleccionada = this.maestras.usuario.idarea || cfg?.idarea || '';
    this.requerimiento.idarea = this.maestras.areaSeleccionada;
    this.SeleccionaPrioridadITEM = '1';
    this.maestras.filtroClasificaciones(this.RequerimientoSelecionado);
    this.mostrarFormulario = true;
  }

  editar(index: number) {
    const req = this.requerimientos[index];
    if (!req) return;
    this.requerimiento = { ...req };
    this.detalles = req.detalle || [];
    this.modoEdicion = true;
    this.editIndex = index;
    this.TipoSelecionado = req.itemtipo as TipoRequerimiento | '';
    this.maestras.fundoSeleccionado = req.idfundo;
    this.maestras.areaSeleccionada = req.idarea;
    this.maestras.almacenSeleccionado = req.idalmacen;
    this.maestras.clasificacionSeleccionado = req.idclasificacion;
    this.SeleccionaPrioridadITEM = req.prioridad as PrioridadSpring | '';
    this.glosa = req.glosa;
    if (req.itemtipo === 'TRANSFERENCIA') {
      this.maestras.almacenOrigen = req.idalmacen || '';
      this.maestras.almacenDestino = req.idalmacendestino || '';
    }
    this.opcionesPrioridadITEM = this.TipoSelecionado
      ? this.prioridadService.obtenerOpcionesPrioridad(this.TipoSelecionado as any)
      : [];
    this.mostrarFormulario = true;
  }

  async eliminar(index: number) {
    const confirmacion = await this.alertService.showConfirm('Confirmación', '¿Desea eliminar este requerimiento?', 'warning');
    if (!confirmacion) return;
    try {
      const req = this.requerimientos[index];
      await this.dexieService.deleteRequerimiento(req.idrequerimiento);
      this.requerimientos.splice(index, 1);
      this.contarContadores();
      this.alertService.showAlert('Éxito', 'Requerimiento eliminado correctamente.', 'success');
    } catch {
      this.alertService.showAlert('Error', 'Ocurriá un error al eliminar el requerimiento.', 'error');
    }
  }

  cancelar() {
    const confirmar = confirm('¿Seguro que deseas cancelar los cambios? Se perderan los datos no guardados.');
    if (!confirmar) return;
    this.mostrarFormulario = false;
    this.modoEdicion = false;
  }

  // â”€â”€ Tipo de requerimiento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async onTipoChange() {
    this.TipoSelecionado = this.requerimiento.itemtipo as TipoRequerimiento | '';
    const clases = this.maestras.clasificaciones;
    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      this.maestras.almacenSeleccionado = '';
      this.maestras.clasificacionSeleccionado = 'TRA';
      this.maestras.clasificacionesFiltrados = clases.filter((c) => c.id === 'TRA');
      this.limpiarCamposCompraConsumo();
      await this.cargarDatosParaTransferencia();
    } else if (this.TipoSelecionado === 'CONSUMO') {
      this.maestras.almacenOrigen = '';
      this.maestras.almacenDestino = '';
      this.maestras.clasificacionSeleccionado = 'STO';
      this.maestras.clasificacionesFiltrados = clases.filter((c) => c.id === 'STO');
      this.limpiarCamposCompraEspecificos();
      await this.cargarDatosParaConsumo();
    } else if (this.TipoSelecionado === 'COMPRA') {
      this.maestras.clasificacionSeleccionado = 'CMP';
      this.maestras.clasificacionesFiltrados = clases.filter((c) => c.id === 'CMP');
      this.limpiarCamposConsumo();
      await this.cargarDatosParaCompra();
      await this.recargarValoresDesdeConfiguracion();
    }
    if (this.TipoSelecionado) {
      this.opcionesPrioridadITEM = this.prioridadService.obtenerOpcionesPrioridad(
        this.TipoSelecionado as 'COMPRA' | 'CONSUMO' | 'TRANSFERENCIA',
      );
      this.SeleccionaPrioridadITEM = '';
    }
  }

  limpiarCamposCompraConsumo() {
    this.maestras.proyectoSeleccionado = null;
    this.maestras.cecoSeleccionado = null;
    this.maestras.laborSeleccionado = null;
    this.maestras.turnoSeleccionado = '';
  }

  limpiarCamposCompraEspecificos() {
    if (this.TipoSelecionado !== 'CONSUMO') {
      this.maestras.proyectoSeleccionado = null;
      this.maestras.cecoSeleccionado = null;
      this.maestras.laborSeleccionado = null;
    }
  }

  limpiarCamposConsumo() {
    if (this.TipoSelecionado !== 'CONSUMO') {
      this.maestras.turnoSeleccionado = '';
      if (this.modalAbierto && this.lineaTemp) this.lineaTemp.turno = '';
    }
  }

  limpiarCamposCompra() {
    if (this.TipoSelecionado !== 'COMPRA') {
      this.maestras.proyectoSeleccionado = null;
      this.maestras.cecoSeleccionado = null;
      this.maestras.laborSeleccionado = null;
    }
  }

  async cargarDatosParaConsumo() {
    try {
      const config = await this.dexieService.obtenerPrimeraConfiguracion();
      if (config) {
        if (config.idturno) this.maestras.turnoSeleccionado = config.idturno;
        if (config.idceco) {
          this.maestras.cecoSeleccionado = (await this.dexieService.getCecoById(config.idceco)) as Ceco | null;
        }
        if (config.idlabor) {
          this.maestras.laborSeleccionado = (await this.dexieService.getLaborById(config.idlabor)) as Labor | null;
        }
        if (config.idproyecto) {
          this.maestras.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(config.idproyecto)) as Proyecto | null;
        }
      }
      if (!this.maestras.cecos?.length) await this.maestras.ListarCecos();
      if (!this.maestras.labores?.length) await this.maestras.ListarLabores();
      if (!this.maestras.proyectos?.length) await this.maestras.ListarProyectos();
    } catch (error) {
      console.error('Error al cargar datos para CONSUMO:', error);
    }
  }

  async cargarDatosParaCompra() {
    if (!this.maestras.almacenes?.length) await this.maestras.ListarAlmacenes();
    if (!this.maestras.cecos?.length) await this.maestras.ListarCecos();
    if (!this.maestras.labores?.length) await this.maestras.ListarLabores();
    if (!this.maestras.proyectos?.length) await this.maestras.ListarProyectos();
  }

  async cargarDatosParaTransferencia() {
    try {
      if (!this.maestras.alamcenesDestino?.length) await this.maestras.ListarAlmacenDestino();
      if (!this.maestras.almacenes?.length) await this.maestras.ListarAlmacenes();
      if (!this.maestras.cecos?.length) await this.maestras.ListarCecos();
      if (!this.maestras.labores?.length) await this.maestras.ListarLabores();
      if (!this.maestras.proyectos?.length) await this.maestras.ListarProyectos();
      const config = await this.dexieService.obtenerPrimeraConfiguracion();
      if (config) {
        if (config.idalmacen) this.maestras.almacenOrigen = config.idalmacen;
        if ((config as any).idalmacenDestino) this.maestras.almacenDestino = (config as any).idalmacenDestino;
        if (config.idceco) {
          this.maestras.cecoSeleccionado = (await this.dexieService.getCecoById(config.idceco)) as any;
        }
        if (config.idlabor) {
          this.maestras.laborSeleccionado = (await this.dexieService.getLaborById(config.idlabor)) as any;
        }
        if (config.idproyecto) {
          this.maestras.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(config.idproyecto)) as any;
        }
      }
    } catch (error) {
      console.error('Error al cargar datos para TRANSFERENCIA:', error);
    }
  }

  async recargarValoresDesdeConfiguracion() {
    try {
      if (!this.maestras.cecos?.length) await this.maestras.ListarCecos();
      if (!this.maestras.labores?.length) await this.maestras.ListarLabores();
      if (!this.maestras.proyectos?.length) await this.maestras.ListarProyectos();
      const config = await this.dexieService.obtenerPrimeraConfiguracion();
      if (config && this.TipoSelecionado === 'COMPRA') {
        if (config.idceco) {
          this.maestras.cecoSeleccionado = (await this.dexieService.getCecoById(config.idceco)) as Ceco | null;
        }
        if (config.idlabor) {
          this.maestras.laborSeleccionado = (await this.dexieService.getLaborById(config.idlabor)) as Labor | null;
        }
        if (config.idproyecto) {
          this.maestras.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(config.idproyecto)) as Proyecto | null;
        }
      }
    } catch (error) {
      console.error('Error al recargar valores desde configuración:', error);
    }
  }

  esCompraConConsumo(): boolean {
    return this.TipoSelecionado === 'COMPRA' || this.TipoSelecionado === 'CONSUMO';
  }

  camposParametrosEditables(): boolean { return false; }

  onClasificacionChange(limpiar = false) {
    if (limpiar) {
      this.maestras.configuracion.idturno = '';
      this.maestras.configuracion.idceco = '';
      this.maestras.configuracion.idlabor = '';
    }
    this.maestras.filtroClasificaciones(this.RequerimientoSelecionado);
  }

  // â”€â”€ Modal de lÃ­neas ITEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async abrirModal() {
    // Forzar modo nuevo detalle y limpiar estado de edición anterior
    this.editIndex = -1;
    this.enModoEdicion = false;
    this.editingTempIndex = -1;
    this.permitirEditarParametros = false;
    this.lineasTemporales = [];
    await this.maestras.cargarConfiguracion();
    if (this.TipoSelecionado === 'CONSUMO' || this.TipoSelecionado === 'COMPRA' || this.TipoSelecionado === 'TRANSFERENCIA') {
      // Mostrar las líneas ya guardadas para poder agregar/editar en el mismo modal
      this.lineasTemporales = (this.detalles || []).map((d) => ({
        ...d,
        descripcion: (d.producto || d.descripcion || '') as string,
      }));
    }
    if (this.maestras.configuracion?.idceco) {
        this.maestras.cecoSeleccionado = (await this.dexieService.getCecoById(this.maestras.configuracion.idceco)) as Ceco | null;
        if (!this.maestras.cecoSeleccionado) {
          this.maestras.cecoSeleccionado = this.maestras.cecos.find(
            (c) => c.localname === this.maestras.configuracion.idceco || c.costcenter === this.maestras.configuracion.idceco,
          ) || null;
        }
      }
      if (this.maestras.configuracion?.idproyecto) {
        this.maestras.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(this.maestras.configuracion.idproyecto)) as Proyecto | null;
      }
      if (this.maestras.configuracion?.idlabor) {
        this.maestras.laborSeleccionado = (await this.dexieService.getLaborById(this.maestras.configuracion.idlabor)) as Labor | null;
      }
      if (this.maestras.configuracion?.idturno && this.TipoSelecionado === 'CONSUMO') {
        this.maestras.turnoSeleccionado = this.maestras.configuracion.idturno;
      }
      this.inicializarVariablesModal();
      this.lineaTemp = {
        idrequerimiento: '', codigo: '', producto: null, descripcion: '', estado: 0,
        cantidad: 0, unidadMedida: '',
        proyecto: this.maestras.proyectoSeleccionado ? String((this.maestras.proyectoSeleccionado as any).proyectoio) : '',
        ceco: this.maestras.cecoSeleccionado?.localname ?? '',
        turno: this.TipoSelecionado === 'COMPRA' ? '' : (this.maestras.turnoSeleccionado ?? ''),
        labor: this.maestras.laborSeleccionado?.labor ?? '',
        esActivoFijo: false, activoFijo: '', afectoIGV: 'S',
      };
    this.modalAbierto = true;
  }

  inicializarVariablesModal() {
    this.enModoEdicion = false;
    this.editingTempIndex = -1;
    this.turnoModal = '';
    this.cecoModal = '';
    this.laborModal = '';
    this.proyectoModal = '';
    this.filteredCecosModal = [];
    this.filteredLaboresModal = [];
    this.filteredProyectosModal = [];
    this.stockActualLineaTemp = null;
    this.consultandoStock = false;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.editIndex = -1;
    this.lineasTemporales = [];
    this.permitirEditarParametros = false;
  }

  // ── Cascada turno → ceco → labor → proyecto en modal ──────────────────────
  onTurnoChangeModal() {
    const turnoActual = this.lineaTemp?.turno || '';
    const turnoObj = this.maestras.turnos.find((t) => t.nombreTurno === turnoActual);
    if (turnoObj && turnoActual) {
      this.filteredCecosModal = this.maestras.cecos.filter((c) => c.conturno?.includes(turnoObj.conturno || ''));
    } else {
      this.filteredCecosModal = [];
    }
    this.lineaTemp.ceco = ''; this.lineaTemp.labor = ''; this.lineaTemp.proyecto = '';
    this.filteredLaboresModal = [];
    this.filteredProyectosModal = [];
    if (this.filteredCecosModal.length === 1) {
      this.lineaTemp.ceco = this.filteredCecosModal[0].localname;
      this.onCecoChangeModal();
    }
  }

  onCecoChangeModal() {
    const cecoActual = this.lineaTemp?.ceco || '';
    if (!cecoActual) return;
    const cecoObj = this.maestras.cecos.find((c) => c.localname === cecoActual);
    this.filteredLaboresModal = this.maestras.labores.filter((l) => l.ceco === (cecoObj?.costcenter || ''));
    this.lineaTemp.labor = ''; this.lineaTemp.proyecto = '';
    this.filteredProyectosModal = [];
    if (this.filteredLaboresModal.length === 1) {
      this.lineaTemp.labor = this.filteredLaboresModal[0].labor;
      this.onLaborChangeModal();
    }
  }

  onLaborChangeModal() {
    const laborActual = this.lineaTemp?.labor || '';
    const cecoActual = this.lineaTemp?.ceco || '';
    if (!laborActual || !cecoActual) return;
    const laborObj = this.maestras.labores.find((l) => l.labor === laborActual);
    const cecoObj = this.maestras.cecos.find((c) => c.localname === cecoActual);
    this.filteredProyectosModal = this.maestras.proyectos.filter(
      (p) =>
        p.ceco?.trim() === (cecoObj?.costcenter || '')?.trim() &&
        p.idlabor?.trim() === (laborObj?.idlabor || '')?.trim() &&
        p.idcultivo?.trim() === this.maestras.cultivoSeleccionado?.trim(),
    );
    if (this.filteredProyectosModal.length === 1) {
      this.lineaTemp.proyecto = String(this.filteredProyectosModal[0].proyectoio);
    }
  }

  editarDetalleItem(index: number) {
    this.editIndex = index;
    this.enModoEdicion = true;
    this.lineaTemp = { ...this.detalles[index] };
    this._inicializarFiltrosCascadaEdicion();
    this.actualizarUnidadMedidaDesdeProducto();
    this.modalAbierto = true;
  }

  private _inicializarFiltrosCascadaEdicion() {
    const turno = this.lineaTemp?.turno || '';
    const ceco = this.lineaTemp?.ceco || '';
    const labor = this.lineaTemp?.labor || '';
    if (turno) {
      const turnoObj = this.maestras.turnos.find((t: any) => t.nombreTurno === turno);
      this.filteredCecosModal = turnoObj
        ? this.maestras.cecos.filter((c: any) => c.conturno?.includes(turnoObj.conturno || ''))
        : [...this.maestras.cecos];
    } else {
      this.filteredCecosModal = [...this.maestras.cecos];
    }
    if (ceco) {
      const cecoObj = this.maestras.cecos.find((c: any) => c.localname === ceco);
      this.filteredLaboresModal = cecoObj
        ? this.maestras.labores.filter((l: any) => l.ceco === (cecoObj.costcenter || ''))
        : [...this.maestras.labores];
    } else {
      this.filteredLaboresModal = [...this.maestras.labores];
    }
    if (ceco && labor) {
      const cecoObj = this.maestras.cecos.find((c: any) => c.localname === ceco);
      const laborObj = this.maestras.labores.find((l: any) => l.labor === labor);
      this.filteredProyectosModal = this.maestras.proyectos.filter(
        (p: any) =>
          p.ceco?.trim() === (cecoObj?.costcenter || '')?.trim() &&
          p.idlabor?.trim() === (laborObj?.idlabor || '')?.trim() &&
          p.idcultivo?.trim() === this.maestras.cultivoSeleccionado?.trim(),
      );
    } else {
      this.filteredProyectosModal = [...this.maestras.proyectos];
    }
  }

  async eliminarDetalleItem(index: number) {
    const detalle = this.detalles[index];
    if (detalle.id) await this.dexieService.deleteDetalleRequerimiento(detalle.id);
    this.detalles.splice(index, 1);
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  obtenerDescripcionProducto(producto: any): string {
    if (typeof producto === 'string') {
      const item = this.maestras.items?.find((i: any) => i.codigo === producto || i.descripcion === producto);
      return item?.descripcion || producto;
    }
    return producto?.descripcion || String(producto || '');
  }

  actualizarUnidadMedidaDesdeProducto() {
    const producto = this.lineaTemp?.producto;
    if (producto) {
      const codigo = typeof producto === 'string' ? producto : (producto?.codigo ?? '');
      const codigoItem = codigo || this.lineaTemp?.codigo || '';
      const item = this.maestras.items.find((i: any) => i.codigo === codigoItem || i.id === producto || i.descripcion === producto);
      const unidadMedida = item?.um || item?.unidadMedida || this.maestras.obtenerUnidadMedidaProducto(producto);
      this.lineaTemp.unidadMedida = unidadMedida;
      this.maestras.unidadesMedidaFiltradas = [{ label: unidadMedida, value: unidadMedida }];
      this.lineaTemp.afectoIGV = item?.afectoIGV === 'N' ? 'N' : 'S';
      this.consultarStockItem(codigoItem || producto);
    }
  }

  consultarStockItem(producto: any) {
    const codigo = typeof producto === 'string' ? producto : (producto?.codigo ?? '');
    const idalmacen = this.maestras.almacenSeleccionado ||
                      this.maestras.configuracion?.idalmacen ||
                      (typeof producto === 'object' ? producto?.almacen : '');
    if (!codigo || !idalmacen) { this.stockActualLineaTemp = null; return; }
    this.consultandoStock = true;
    this.stockActualLineaTemp = null;
    this.requerimientosService.validarStockItems(idalmacen, [{ codigo, producto: codigo, cantidad: 0 }])
      .subscribe({
        next: (resp: any[]) => {
          const item = (resp || []).find((r: any) => r.codigo === codigo || r.iditem === codigo);
          this.stockActualLineaTemp = item?.stockDisponible ?? null;
          this.consultandoStock = false;
        },
        error: () => { this.stockActualLineaTemp = null; this.consultandoStock = false; },
      });
  }

  // â”€â”€ Guardar requerimiento ITEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async guardarRequerimiento() {
    if (!this.maestras.fundoSeleccionado) {
      this.alertService.showAlert('Atención', 'Debes seleccionar un Fundo antes de guardar.', 'warning');
      return;
    }
    if (!this.requerimiento.glosa && !this.glosa) {
      this.alertService.showAlert('Atención', 'Debes ingresar una glosa antes de guardar.', 'warning');
      return;
    }
    try {
      this.alertService.mostrarModalCarga();
      const idAlmacenSync = this.TipoSelecionado === 'TRANSFERENCIA'
        ? this.maestras.almacenOrigen
        : (this.maestras.almacenes.find((a) => a.idalmacen == this.maestras.almacenSeleccionado)?.idalmacen || '');
      const idreq = this.modoEdicion ? this.requerimiento.idrequerimiento
        : this.maestras.usuario.sociedad + this.maestras.usuario.documentoidentidad + this.utilsService.formatoAnioMesDiaHoraMinSec();
      const detallesConIdReq = this.detalles.map((d) => ({ ...d, idrequerimiento: idreq }));
      const req: Requerimiento = {
        idrequerimiento: idreq,
        ruc: this.maestras.usuario.ruc,
        idfundo: this.maestras.fundoSeleccionado,
        idarea: this.maestras.areaSeleccionada,
        idclasificacion: this.TipoSelecionado === 'TRANSFERENCIA' ? 'TRA'
          : (this.maestras.clasificacionSeleccionado || (this.TipoSelecionado === 'COMPRA' ? 'CMP' : 'STO')),
        prioridad: this.SeleccionaPrioridadITEM ?? '1',
        nrodocumento: this.maestras.usuario.documentoidentidad,
        idalmacen: idAlmacenSync,
        idalmacendestino: this.TipoSelecionado === 'TRANSFERENCIA' ? this.maestras.almacenDestino : '',
        glosa: this.requerimiento.glosa || this.glosa,
        referenciaGasto: this.SeleccionaTipoGasto || '',
        eliminado: 0,
        tipo: 'ITEM',
        itemtipo: this.TipoSelecionado || this.requerimiento.itemtipo || 'CONSUMO',
        estados: 'PENDIENTE',
        fecha: new Date().toISOString(),
        almacen: this.maestras.almacenes.find((a) => a.idalmacen == idAlmacenSync)?.almacen || '',
        idproyecto: this.maestras.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,
        disabled: false,
        checked: false,
        despachado: false,
        detalle: detallesConIdReq,
      };
      await this.dexieService.detalles.where('idrequerimiento').equals(idreq).delete();
      await this.dexieService.detalles.bulkPut(detallesConIdReq);
      if (this.modoEdicion) {
        await this.dexieService.requerimientos.where('idrequerimiento').equals(req.idrequerimiento).delete();
        await this.dexieService.requerimientos.put({ ...req, modificado: 1 } as any);
        const idx = this.requerimientos.findIndex((r) => r.idrequerimiento === req.idrequerimiento);
        if (idx !== -1) this.requerimientos[idx] = { ...req };
        this.modoEdicion = false;
      } else {
        await this.dexieService.requerimientos.put(req);
        this.requerimientos.push({ ...req });
      }
      try {
        if (req.idarea) {
          const idrol = this.maestras.usuario?.idrol ?? '';
          const tipoAprobacion = req.itemtipo === 'CONSUMO' ? 'CONSUMO'
            : req.itemtipo === 'TRANSFERENCIA' ? 'TRANSFERENCIA'
            : req.itemtipo === 'COMPRA'
              ? (idrol.includes('APLOGIST') && !idrol.includes('JLOLOGIST') ? 'COMPRA_AREA' : 'COMPRA')
            : 'ITEM';
          await this.aprobacionesAreaService.registrarRequerimiento({
            ruc: req.ruc, idrequerimiento: req.idrequerimiento,
            idarea: Number(req.idarea), tipoRequerimiento: tipoAprobacion,
            descripcion: req.glosa, usuarioSolicitud: this.maestras.usuario.documentoidentidad,
            glosa: req.glosa, monto: 0,
          }).toPromise();
          await this.aprobacionesAreaService.asignarAprobadoresRequerimiento({
            ruc: req.ruc, idrequerimiento: req.idrequerimiento,
            idarea: Number(req.idarea), tipoRequerimiento: tipoAprobacion,
            usuarioSolicitud: this.maestras.usuario.documentoidentidad,
          }).toPromise();
        }
      } catch { }
      this.alertService.cerrarModalCarga();
      this.ordenar();
      this.contarContadores();
      this.alertService.showAlert('Éxito', 'Requerimiento ITEM guardado correctamente.', 'success');
      this.detalles = [];
      this.mostrarFormulario = false;
      this.editIndex = -1;
    } catch (e) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Hubo un problema al guardar el Requerimiento ITEM.', 'error');
    }
  }

  // â”€â”€ SincronizaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async sincronizarRequerimiento() {
    if (this.requerimiento.detalle.length === 0) {
      this.alertService.showAlert('Alerta', 'Debe ingresar al menos un requerimiento', 'warning');
      return;
    }
    const claves = new Set<string>();
    const existeDuplicado = this.requerimiento.detalle.some((d: any) => {
      const key = `${d.codigo}-${d.turno || ''}`;
      if (claves.has(key)) return true;
      claves.add(key);
      return false;
    });
    if (existeDuplicado) {
      this.alertService.showAlert('Validación', 'Existen lineas duplicadas con el mismo codigo y turno', 'warning');
      return;
    }
    const confirmacion = await this.alertService.showConfirm('Confirmación', '¿Desea enviar los datos?', 'warning');
    if (!confirmacion) return;
    this.maestras.sincronizando = true;
    this.maestras.progreso = 0;
    const prioridadFinal: PrioridadSpring = (this.SeleccionaPrioridadITEM || this.requerimiento.prioridad || '1') as PrioridadSpring;
    const idReq = this.modoEdicion && this.requerimiento.idrequerimiento
      ? this.requerimiento.idrequerimiento
      : this.maestras.usuario.sociedad + this.maestras.usuario.documentoidentidad + this.utilsService.formatoAnioMesDiaHoraMinSec();

    // TRANSFERENCIA: flujo especial → crear requerimiento de transferencia + migrar a SPRING automáticamente como APROBADA
    if (this.TipoSelecionado === 'TRANSFERENCIA') {
      try {
        const payloadTransf = {
          idrequerimiento: idReq,
          ruc: this.maestras.usuario.ruc,
          idfundo: this.requerimiento.idfundo,
          idarea: this.maestras.areaSeleccionada,
          idclasificacion: 'TRA',
          prioridad: prioridadFinal,
          nrodocumento: this.maestras.usuario.documentoidentidad,
          idalmacen: this.maestras.almacenOrigen,
          idalmacendestino: this.maestras.almacenDestino,
          glosa: this.requerimiento.glosa || '',
          referenciaGasto: this.SeleccionaTipoGasto || '',
          eliminado: 0, tipo: 'ITEM', itemtipo: 'TRANSFERENCIA', estados: 'APROBADA',
          almacenOrigen: this.maestras.almacenOrigen,
          almacenDestino: this.maestras.almacenDestino,
          usuario: this.maestras.usuario.documentoidentidad,
          cantidadItems: this.requerimiento.detalle.length,
          detalle: this.requerimiento.detalle.map((d: any) => ({
            codigo: d.codigo, tipoclasificacion: 'I', cantidad: d.cantidad,
            idproducto: d.producto || '', iddescripcion: d.descripcion || '',
            idproyecto: d.proyecto || '', idcentrocosto: d.ceco || '',
            idturno: d.turno || '', idlabor: d.labor || '', eliminado: 0,
            afectoIGV: d.afectoIGV === 'N' ? 'N' : 'S',
          })),
        };
        const resp = await this.transferenciaService.crearRequerimientoTransferencia(payloadTransf);
        const parsed = Array.isArray(resp) ? resp[0] : (typeof resp === 'string' ? JSON.parse(resp) : resp);
        if (parsed?.error) {
          this.alertService.showAlertError('Error', parsed.mensaje || parsed.error);
        } else {
          // Migrar a SPRING automáticamente (sin pasar por aprobación)
          await this.migrarTransferenciaASPRING(idReq, prioridadFinal);
          await this.dexieService.requerimientos.update(this.requerimiento.id!, { estado: 1 });
          await this.cargar();
          this.contarContadores();
        }
      } catch (e: any) {
        this.alertService.showAlertError('Error', e.message || 'No se pudo enviar el requerimiento de transferencia');
      } finally {
        this.maestras.sincronizando = false;
      }
      return;
    }

    const payload = [{
      idrequerimiento: idReq, ruc: this.maestras.usuario.ruc, idfundo: this.requerimiento.idfundo,
      idarea: this.maestras.areaSeleccionada, idclasificacion: this.requerimiento.idclasificacion,
      prioridad: prioridadFinal, nrodocumento: this.maestras.usuario.documentoidentidad,
      idalmacen: this.requerimiento.idalmacen,
      idalmacendestino: '',
      glosa: this.requerimiento.glosa || '', referenciaGasto: this.SeleccionaTipoGasto || '',
      eliminado: 0, tipo: this.requerimiento.tipo, itemtipo: this.requerimiento.itemtipo, estados: 'PENDIENTE',
      detalle: this.requerimiento.detalle.map((d: any) => ({
        codigo: d.codigo, tipoclasificacion: 'I', cantidad: d.cantidad,
        idproducto: d.producto || '', iddescripcion: d.descripcion || '',
        idproyecto: d.proyecto || '', idcentrocosto: d.ceco || '',
        idturno: d.turno || '', idlabor: d.labor || '', eliminado: 0,
        afectoIGV: d.afectoIGV === 'N' ? 'N' : 'S',
      })),
    }];
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: async (resp) => {
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert('Éxito', 'Requerimiento sincronizado correctamente', 'success');
          await this.dexieService.requerimientos.update(this.requerimiento.id!, { estado: 1 });
          await this.cargar();
          this.contarContadores();
        } else {
          this.alertService.showAlertError('Error', 'Hubo un problema al sincronizar el requerimiento');
        }
        this.maestras.sincronizando = false;
      },
      error: () => {
        this.maestras.sincronizando = false;
        this.alertService.showAlertError('Error', 'No se pudo conectar con el servidor');
      },
    });
  }

  async sincronizarPendientes() {
    const pendientes = await this.dexieService.requerimientos
      .filter((r) => (r.estado === 0 || (r as any).modificado === 1) && r.estado !== 1).toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert('Información', 'No hay requerimientos pendientes por sincronizar', 'info');
      return;
    }
    const confirmar = await this.alertService.showConfirm('Confirmación', `Se sincronizarón ${pendientes.length} requerimientos ¿Desea continuar?`, 'warning');
    if (!confirmar) return;
    this.maestras.sincronizando = true;
    this.maestras.progreso = 0;
    const payload = pendientes.map((req: any) => ({
      idrequerimiento: req.idrequerimiento, ruc: this.maestras.usuario.ruc,
      idfundo: req.idfundo, idarea: req.idarea, idclasificacion: req.idclasificacion,
      prioridad: req.prioridad || '1', nrodocumento: this.maestras.usuario.documentoidentidad,
      idalmacen: req.idalmacen, idalmacendestino: req.itemtipo === 'TRANSFERENCIA' ? req.idalmacendestino : '',
      glosa: req.glosa || '', referenciaGasto: req.referenciaGasto || '',
      eliminado: 0, tipo: req.tipo, itemtipo: req.itemtipo, estados: 'PENDIENTE',
      detalle: (req.detalle || []).map((d: any) => ({
        codigo: d.codigo, tipoclasificacion: 'I', cantidad: d.cantidad,
        idproducto: d.producto || '', iddescripcion: d.descripcion || '',
        idproyecto: d.proyecto || '', idcentrocosto: d.ceco || '',
        idturno: d.turno || '', idlabor: d.labor || '', eliminado: 0,
        afectoIGV: d.afectoIGV === 'N' ? 'N' : 'S',
      })),
    }));
    try {
      const resp: any = await firstValueFrom(this.requerimientosService.registrarRequerimientos(payload));
      const resultado = resp?.[0];
      if (resultado?.errorgeneral === 1) {
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
        return;
      }
      const idsConError: string[] = (resultado?.detalle || []).map((d: any) => d.id.split('-')[0]);
      const idsOk = pendientes.map((r) => r.idrequerimiento).filter((id) => !idsConError.includes(id));
      if (idsOk.length) {
        await this.dexieService.requerimientos.where('idrequerimiento').anyOf(idsOk).modify({ estado: 1 });
      }
      this.alertService.showAlert(
        idsConError.length ? 'Sincronización parcial' : 'Éxito',
        idsConError.length ? `Sincronizados ${idsOk.length}, con error ${idsConError.length}` : 'Todos los requerimientos se sincronizaron correctamente',
        idsConError.length ? 'warning' : 'success',
      );
      await this.cargar();
      this.contarContadores();
      await this.cargarPendientes();
      this.requerimientosOmitirValidacion.clear();
    } catch {
      this.alertService.showAlertError('Error', 'No se pudo conectar con el servidor');
    } finally {
      this.maestras.progreso = 100;
      this.maestras.sincronizando = false;
    }
  }

  editarLinea(index: number): void {
    this.editIndex = index;
    this.enModoEdicion = true;
    const det = this.detalles[index];
    let producto: any = null;
    const codigoDet = det.codigo || (typeof det.producto === 'object' ? det.producto?.codigo : '');
    const descripcionDet = typeof det.producto === 'string'
      ? det.producto
      : (typeof det.producto === 'object' ? det.producto?.descripcion : '');
    if (codigoDet) producto = this.maestras.items.find((it: any) => it.codigo === codigoDet);
    if (!producto && descripcionDet) producto = this.maestras.items.find((it: any) => it.descripcion === descripcionDet);
    console.log('🔍 editarLinea det:', det, 'producto encontrado:', producto, 'items count:', this.maestras.items.length);
    this.lineaTemp = {
      ...det,
      codigo: producto ? producto.codigo : (det.codigo || ''),
      producto: producto ? { ...producto } : null,
      proyecto: det.proyecto || '',
      ceco: det.ceco || '',
      labor: det.labor || '',
      turno: det.turno || '',
    };
    this.cecoModal = det.ceco || '';
    this.proyectoModal = det.proyecto || '';
    this.laborModal = det.labor || '';
    this.turnoModal = det.turno || '';
    this.filteredCecosModal = this.maestras.cecos.filter((c: any) => c.turno === this.turnoModal);
    const cecoObj = this.maestras.cecos.find((c: any) => c.localname === this.cecoModal);
    this.filteredLaboresModal = this.maestras.labores.filter((l: any) => l.ceco === (cecoObj?.costcenter || ''));
    this.filteredProyectosModal = this.maestras.proyectos;
    const um = (det as any).unidadMedida || (producto ? this.maestras.obtenerUnidadMedidaProducto(producto) : '');
    (this.lineaTemp as any).unidadMedida = um;
    if (um) this.maestras.unidadesMedidaFiltradas = [{ label: um, value: um }];
    this.modalAbierto = true;
  }

  guardarEdicionLinea(): void {
    if (this.editIndex === -1) return;
    this.detalles[this.editIndex] = { ...this.lineaTemp };
    this.cerrarModal();
    this.alertService.showAlert('Éxito', 'Linea actualizada correctamente', 'success');
  }

  async validarStockRequerimiento(requerimiento: any): Promise<boolean> {
    if (requerimiento.itemtipo !== 'CONSUMO') return true;
    if (this.requerimientosOmitirValidacion.has(requerimiento.idrequerimiento)) return true;
    const idalmacen = requerimiento.idalmacen;
    const detalles = requerimiento.detalle || [];
    if (!idalmacen || detalles.length === 0) return true;
    const itemsParaValidar = detalles.map((d: any) => ({
      codigo: d.codigo, producto: d.producto || d.idproducto, cantidad: d.cantidad,
    }));
    this.validandoStock = true;
    return new Promise((resolve) => {
      this.requerimientosService.validarStockItems(idalmacen, itemsParaValidar).subscribe({
        next: (resp) => {
          this.validandoStock = false;
          const resultado = resp || [];
          const itemsSinStock = resultado.filter(
            (item: any) => item.estadoStock === 'SIN_STOCK' || item.estadoStock === 'PARCIAL',
          );
          if (itemsSinStock.length > 0) {
            this.itemsStockValidacion = resultado;
            this.requerimientoValidandoStock = requerimiento;
            this.modalStockAbierto = true;
            resolve(false);
          } else {
            resolve(true);
          }
        },
        error: (err) => {
          this.validandoStock = false;
          console.error('Error al validar stock:', err);
          resolve(true);
        },
      });
    });
  }

  cerrarModalStock() {
    this.modalStockAbierto = false;
    this.itemsStockValidacion = [];
    this.requerimientoValidandoStock = null;
  }

  async confirmarAjusteStock(sincronizarCb: () => Promise<void>, editarCb: (idx: number) => void, cargarPendientesCb: () => Promise<void>) {
    if (!this.requerimientoValidandoStock) return;
    const todosConStockCero = this.itemsStockValidacion.every(
      (item: any) => item.cantidadAjustada === 0 || item.estadoStock === 'SIN_STOCK',
    );
    if (todosConStockCero) {
      let msg = 'Todos los items del requerimiento no tienen stock disponible:<br><br>';
      msg += '<table style="width:100%; font-size:0.85rem; border-collapse:collapse;">';
      msg += '<tr style="background:#f8f9fa;"><th style="padding:4px; border:1px solid #dee2e6;">Producto</th><th style="padding:4px; border:1px solid #dee2e6; text-align:center;">Solicitado</th><th style="padding:4px; border:1px solid #dee2e6; text-align:center;">Stock</th></tr>';
      for (const item of this.itemsStockValidacion) {
        msg += `<tr><td style="padding:4px; border:1px solid #dee2e6;">${item.producto}</td><td style="padding:4px; border:1px solid #dee2e6; text-align:center;">${item.cantidadSolicitada}</td><td style="padding:4px; border:1px solid #dee2e6; text-align:center; color:red;">${item.stockDisponible}</td></tr>`;
      }
      msg += '</table><br>¿Qué desea hacer?';
      const resultado = await this.alertService.showFourButtons(
        'Sin Stock Disponible', msg, 'warning',
        'Continuar con Cantidad Solicitada', 'Editar Productos', 'Eliminar Requerimiento', 'Cancelar',
      );
      if (resultado === 'button1') {
        this.requerimientosOmitirValidacion.add(this.requerimientoValidandoStock.idrequerimiento);
        this.cerrarModalStock();
        await sincronizarCb();
        return;
      } else if (resultado === 'button2') {
        const idReqEditar = this.requerimientoValidandoStock.idrequerimiento;
        this.cerrarModalStock();
        const idx = this.requerimientos.findIndex((r) => r.idrequerimiento === idReqEditar);
        if (idx >= 0) {
          editarCb(idx);
          setTimeout(() => {
            if (this.detalles?.length > 0) {
              this.editIndex = 0;
              const det = this.detalles[0];
              const prod = this.maestras.items.find((it: any) => it.descripcion === det.producto);
              this.lineaTemp = { ...det, producto: prod ? { ...prod } : null };
              this.modalAbierto = true;
            } else {
              this.modalAbierto = true;
            }
          }, 500);
        }
        return;
      } else if (resultado === 'button3') {
        try {
          const idReq = this.requerimientoValidandoStock.idrequerimiento;
          if (idReq && idReq.length > 10) {
            const bodyEliminar = {
              idrequerimiento: idReq, eliminado: 1,
              dnielimina: this.maestras.usuario?.documentoidentidad || '',
            };
            this.requerimientosService.eliminarRequerimiento(bodyEliminar).subscribe({
              next: async () => {
                await this.dexieService.requerimientos.delete(this.requerimientoValidandoStock.id);
                const idx2 = this.requerimientos.findIndex((r) => r.idrequerimiento === idReq);
                if (idx2 >= 0) this.requerimientos.splice(idx2, 1);
                await cargarPendientesCb();
                this.alertService.mostrarInfo('Requerimiento eliminado por falta de stock.');
                this.cerrarModalStock();
              },
              error: () => {
                this.alertService.showAlert('Error', 'No se pudo eliminar el requerimiento del servidor', 'error');
                this.cerrarModalStock();
              },
            });
            return;
          }
          await this.dexieService.requerimientos.delete(this.requerimientoValidandoStock.id);
          const idx3 = this.requerimientos.findIndex(
            (r) => r.idrequerimiento === this.requerimientoValidandoStock.idrequerimiento,
          );
          if (idx3 >= 0) this.requerimientos.splice(idx3, 1);
          await cargarPendientesCb();
          this.alertService.mostrarInfo('Requerimiento eliminado por falta de stock.');
          this.cerrarModalStock();
          return;
        } catch (error) {
          this.alertService.showAlert('Error', 'No se pudo eliminar el requerimiento', 'error');
          this.cerrarModalStock();
          return;
        }
      } else {
        this.cerrarModalStock();
        return;
      }
    }
    const detallesReq = [...(this.requerimientoValidandoStock.detalle || [])];
    for (const itemStock of this.itemsStockValidacion) {
      const di = detallesReq.findIndex((d: any) => d.codigo === itemStock.codigo);
      if (di >= 0) detallesReq[di].cantidad = itemStock.cantidadAjustada;
    }
    const detallesFiltrados = detallesReq.filter((d: any) => d.cantidad > 0);
    if (detallesFiltrados.length === 0) {
      this.alertService.showAlert('Sin Items', 'No quedan items con stock disponible. El requerimiento no puede continuar.', 'error');
      this.cerrarModalStock();
      return;
    }
    this.requerimientoValidandoStock.detalle = detallesFiltrados;
    const idReq = this.requerimientoValidandoStock.idrequerimiento;
    try {
      await this.dexieService.requerimientos.update(this.requerimientoValidandoStock.id, { detalle: detallesFiltrados, modificado: 1 });
      const detallesExistentes = await this.dexieService.detalles.where('idrequerimiento').equals(idReq).toArray();
      if (detallesExistentes.length > 0) {
        for (const detExistente of detallesExistentes) {
          if (!detExistente.id) continue;
          const detAct = detallesFiltrados.find((df: any) => df.codigo === detExistente.codigo);
          if (detAct) await this.dexieService.detalles.update(detExistente.id, { cantidad: detAct.cantidad });
          else await this.dexieService.detalles.delete(detExistente.id);
        }
      } else {
        for (const det of detallesFiltrados) await this.dexieService.detalles.add({ ...det, idrequerimiento: idReq });
      }
      const idx4 = this.requerimientos.findIndex((r) => r.idrequerimiento === idReq);
      if (idx4 >= 0) this.requerimientos[idx4].detalle = detallesFiltrados;
      const eliminados = detallesReq.length - detallesFiltrados.length;
      this.alertService.mostrarInfo(
        eliminados > 0 ? `Cantidades ajustadas. ${eliminados} item(s) eliminado(s) por falta de stock.` : 'Cantidades ajustadas segun stock disponible.',
      );
    } catch (error) {
      this.alertService.showAlert('Error', 'No se pudieron ajustar las cantidades', 'error');
      this.cerrarModalStock();
      return;
    }
    this.cerrarModalStock();
    await sincronizarCb();
  }

  async eliminarDesdeSeleccion(dataSelected: any[], lista: any[], contarCb: () => void): Promise<any[]> {
    const confirmacion = await this.alertService.showConfirm('Confirmación', '¿Desea eliminar este requerimiento?', 'warning');
    if (!confirmacion) return lista;
    for (const item of dataSelected) {
      try {
        await this.dexieService.deleteRequerimiento(item.idrequerimiento);
        const index = lista.findIndex((r) => r.idrequerimiento === item.idrequerimiento);
        if (index !== -1) lista.splice(index, 1);
        this.alertService.showAlert('Éxito', 'Requerimiento eliminado correctamente.', 'success');
        contarCb();
      } catch (error) {
        this.alertService.showAlert('Error', 'Ocurrió un error al eliminar el requerimiento.', 'error');
      }
    }
    return lista;
  }

  validarFila(row: DetalleExcelPreview, lineasPreview: DetalleExcelPreview[], activosFijos: any[]): void {
    row.errores = [];
    if (!row.codigo) {
      row.errores.push({ columna: 'Código', mensaje: 'Requerido' });
    } else {
      const codigoPadded = String(row.codigo).padStart(6, '0');
      row.codigo = codigoPadded;
      const item = this.maestras.items.find((i: any) => i.codigo === codigoPadded);
      if (!item) {
        row.errores.push({ columna: 'Código', mensaje: 'No existe en almacén' });
      } else {
        row.descripcion = item.descripcion;
        row.unidadMedida = item.um || row.unidadMedida;
        row.afectoIGV = item.afectoIGV === 'N' ? 'N' : 'S';
      }
    }
    if (!row.cantidad || row.cantidad <= 0) row.errores.push({ columna: 'Cantidad', mensaje: 'Debe ser mayor a 0' });
    if (this.TipoSelecionado === 'CONSUMO' && !row.turno) {
      row.errores.push({ columna: 'Turno', mensaje: 'Requerido' });
    }
    if (row.activofijo && row.activofijo.toString().trim() !== '') {
      const activoExiste = activosFijos.some((af: any) => af.activo === row.activofijo);
      if (!activoExiste) row.errores.push({ columna: 'ActivoFijo', mensaje: 'No existe el activo fijo' });
    }
    row.error = row.errores.length > 0;
  }

  alertarAreaNoEncontrada(area: string): void {
    this.alertService.mostrarInfo(`Área "${area}" no encontrada en el catálogo. Verifique el área manualmente.`);
  }

  validarFilaCompra(row: DetalleExcelPreview): void {
    row.errores = [];
    if (!row.codigo) {
      row.errores.push({ columna: 'Código', mensaje: 'Requerido' });
    } else {
      const codigoPadded = String(row.codigo).padStart(6, '0');
      row.codigo = codigoPadded;
      const item = this.maestras.items.find((i: any) => i.codigo === codigoPadded);
      if (!item) {
        row.errores.push({ columna: 'Código', mensaje: 'No existe en catálogo' });
      } else {
        row.descripcion = item.descripcion;
        row.unidadMedida = item.um || row.unidadMedida;
        row.afectoIGV = item.afectoIGV === 'N' ? 'N' : 'S';
      }
    }
    if (!row.cantidad || row.cantidad <= 0) {
      row.errores.push({ columna: 'Cantidad', mensaje: 'Debe ser mayor a 0' });
    }
    row.error = row.errores.length > 0;
  }

  async cargarExcelCompra(file: File): Promise<{ lineasPreview: DetalleExcelPreview[]; tieneErrores: boolean; puedeGuardar: boolean; areaDetectada: string; idAreaDetectada: string; responsableDetectado: string }> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const lineasPreview: DetalleExcelPreview[] = [];
    const lineasAgrupadas = new Map<string, DetalleExcelPreview>();
    let areaDetectada = '';
    let idAreaDetectada = '';
    let responsableDetectado = '';
    for (const r of rows) {
      const rawCodigo = r['COD MATERIAL'];
      const codigoPadded = rawCodigo !== undefined && rawCodigo !== ''
        ? String(rawCodigo).padStart(6, '0')
        : '';
      const itemEncontrado = codigoPadded
        ? this.maestras.items.find((i: any) => i.codigo === codigoPadded)
        : undefined;
      if (!areaDetectada && r['AREA']) {
        areaDetectada = String(r['AREA']).trim();
        idAreaDetectada = this.maestras.resolverAreaDesdeTexto(areaDetectada);
      }
      if (!responsableDetectado && r['RESPONSABLE DE PEDIDO']) {
        responsableDetectado = String(r['RESPONSABLE DE PEDIDO']).trim();
      }
      // Búsqueda flexible de CECO (variantes de nombres de columna)
      const cecoRaw = r['CENTRO DE COSTO'] ?? r['CECO'] ?? r['CENTRO_COSTO'] ?? r['COST CENTER'] ?? '';
      // Búsqueda flexible de PROYECTO (variantes de nombres de columna)
      const proyectoRaw = r['PROYECTO'] ?? r['PROJECT'] ?? r['PROY'] ?? '';
      // Búsqueda flexible de ACTIVIDAD/LABOR
      const laborRaw = r['ACTIVIDAD'] ?? r['LABOR'] ?? r['ACTIVITY'] ?? '';

      // Búsqueda mejorada de CECO: localname exacto → localname parcial → costcenter → fallback
      let ceco = cecoRaw;
      if (cecoRaw && this.maestras.cecos) {
        // 1. Coincidencia exacta por localname
        const cecoExacto = this.maestras.cecos.find((c: any) => c.localname === cecoRaw);
        if (cecoExacto) {
          ceco = cecoExacto.localname;
        } else {
          // 2. Coincidencia parcial por localname (case-insensitive)
          const cecoSimilar = this.maestras.cecos.find((c: any) =>
            c.localname.toLowerCase().includes(cecoRaw.toLowerCase()) ||
            cecoRaw.toLowerCase().includes(c.localname.toLowerCase())
          );
          if (cecoSimilar) {
            ceco = cecoSimilar.localname;
          } else {
            // 3. Coincidencia por costcenter (código numérico)
            const cecoPorCodigo = this.maestras.cecos.find((c: any) => c.costcenter === cecoRaw);
            if (cecoPorCodigo) {
              ceco = cecoPorCodigo.localname;
            }
          }
        }
      }

      // Búsqueda aproximada de PROYECTO si no coincide exactamente
      let proyecto = proyectoRaw;
      if (proyectoRaw && this.maestras.proyectos) {
        const proyectoExacto = this.maestras.proyectos.find((p: any) => p.proyectoio === proyectoRaw);
        if (!proyectoExacto) {
          const proyectoSimilar = this.maestras.proyectos.find((p: any) =>
            p.proyectoio.toLowerCase().includes(proyectoRaw.toLowerCase()) ||
            proyectoRaw.toLowerCase().includes(p.proyectoio.toLowerCase())
          );
          proyecto = proyectoSimilar?.proyectoio || proyectoRaw;
        }
      }

      const fila: DetalleExcelPreview = {
        codigo: codigoPadded,
        descripcion: itemEncontrado?.descripcion ?? r['DESCRIPCION'] ?? '',
        cantidad: Number(r['CANT.'] ?? r['CANTIDAD'] ?? 0),
        unidadMedida: itemEncontrado?.um || r['UM'] || 'UND',
        turno: '',
        ceco: ceco || (this.maestras.cecoSeleccionado as any)?.localname || '',
        proyecto: proyecto || (this.maestras.proyectoSeleccionado as any)?.proyectoio || '',
        labor: laborRaw || (this.maestras.laborSeleccionado?.labor ?? ''),
        activofijo: '',
        afectoIGV: itemEncontrado?.afectoIGV === 'N' ? 'N' : 'S',
        errores: [],
        error: false,
      };

      // Agrupar por código: si ya existe, sumar cantidad
      if (lineasAgrupadas.has(codigoPadded)) {
        const filaExistente = lineasAgrupadas.get(codigoPadded)!;
        filaExistente.cantidad += fila.cantidad;
      } else {
        this.validarFilaCompra(fila);
        lineasAgrupadas.set(codigoPadded, fila);
      }
    }

    // Convertir Map a array
    lineasPreview.push(...lineasAgrupadas.values());
    if (idAreaDetectada) {
      this.maestras.areaSeleccionada = idAreaDetectada;
    }
    if (responsableDetectado) {
      const areaTexto = areaDetectada ? ` - ÁREA: ${areaDetectada}` : '';
      this.requerimiento.glosa = `REQUERIMIENTO DE COMPRA - SOLICITANTE: ${responsableDetectado}${areaTexto}`;
      this.glosa = this.requerimiento.glosa;
    }
    const tieneErrores = lineasPreview.some((r) => r.errores.length > 0);
    const puedeGuardar = !lineasPreview.some((l) => l.error);
    return { lineasPreview, tieneErrores, puedeGuardar, areaDetectada, idAreaDetectada, responsableDetectado };
  }

  async cargarExcel(file: File, activosFijos: any[]): Promise<{ lineasPreview: DetalleExcelPreview[]; tieneErrores: boolean; puedeGuardar: boolean }> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const lineasPreview: DetalleExcelPreview[] = [];
    const lineasAgrupadas = new Map<string, DetalleExcelPreview>();
    for (const r of rows) {
      const rawCodigo = r['Cod. Item'];
      const codigoPadded = rawCodigo !== undefined && rawCodigo !== ''
        ? String(rawCodigo).padStart(6, '0')
        : '';
      const itemEncontrado = codigoPadded
        ? this.maestras.items.find((i: any) => i.codigo === codigoPadded)
        : undefined;

      // Búsqueda flexible de CECO (variantes de nombres de columna)
      const cecoRaw = r['CECO'] ?? r['CENTRO DE COSTO'] ?? r['CENTRO_COSTO'] ?? r['COST CENTER'] ?? r['Centro Costo'] ?? r['Centro de costos'] ?? '';
      // Búsqueda flexible de PROYECTO
      const proyectoRaw = r['PROYECTO'] ?? r['PROJECT'] ?? r['PROY'] ?? r['Proyecto'] ?? '';

      // Búsqueda mejorada de CECO: localname exacto → localname parcial → costcenter → fallback
      let ceco = cecoRaw;
      if (cecoRaw && this.maestras.cecos) {
        const cecoExacto = this.maestras.cecos.find((c: any) => c.localname === cecoRaw);
        if (cecoExacto) {
          ceco = cecoExacto.localname;
        } else {
          const cecoSimilar = this.maestras.cecos.find((c: any) =>
            c.localname.toLowerCase().includes(cecoRaw.toLowerCase()) ||
            cecoRaw.toLowerCase().includes(c.localname.toLowerCase())
          );
          if (cecoSimilar) {
            ceco = cecoSimilar.localname;
          } else {
            const cecoPorCodigo = this.maestras.cecos.find((c: any) => c.costcenter === cecoRaw);
            if (cecoPorCodigo) {
              ceco = cecoPorCodigo.localname;
            }
          }
        }
      }

      // Búsqueda mejorada de PROYECTO
      let proyecto = proyectoRaw;
      if (proyectoRaw && this.maestras.proyectos) {
        const proyectoExacto = this.maestras.proyectos.find((p: any) => p.proyectoio === proyectoRaw);
        if (!proyectoExacto) {
          const proyectoSimilar = this.maestras.proyectos.find((p: any) =>
            p.proyectoio.toLowerCase().includes(proyectoRaw.toLowerCase()) ||
            proyectoRaw.toLowerCase().includes(p.proyectoio.toLowerCase())
          );
          proyecto = proyectoSimilar?.proyectoio || proyectoRaw;
        }
      }

      const fila: DetalleExcelPreview = {
        codigo: codigoPadded,
        descripcion: itemEncontrado?.descripcion ?? r['Descripcion Item'] ?? '',
        cantidad: Number(r['Cantidad']),
        unidadMedida: itemEncontrado?.um || r['Unidad Medida'] || 'UND',
        turno: r['Turno'],
        activofijo: r['ActivoFijo'],
        proyecto: proyecto || (this.maestras.proyectoSeleccionado as any)?.proyectoio || '',
        ceco: ceco || (this.maestras.cecoSeleccionado as any)?.localname || '',
        labor: this.maestras.laborSeleccionado?.labor ?? '',
        afectoIGV: itemEncontrado?.afectoIGV === 'N' ? 'N' : 'S',
        errores: [],
        error: false,
      };

      // Agrupar por código: si ya existe, sumar cantidad
      if (lineasAgrupadas.has(codigoPadded)) {
        const filaExistente = lineasAgrupadas.get(codigoPadded)!;
        filaExistente.cantidad += fila.cantidad;
      } else {
        this.validarFila(fila, lineasPreview, activosFijos);
        lineasAgrupadas.set(codigoPadded, fila);
      }
    }

    // Convertir Map a array
    lineasPreview.push(...lineasAgrupadas.values());
    const tieneErrores = lineasPreview.some((r) => r.errores.length > 0);
    const puedeGuardar = !lineasPreview.some((l) => l.error);
    return { lineasPreview, tieneErrores, puedeGuardar };
  }

  guardarDetalleMasivo(lineasPreview: any[], puedeGuardar: boolean): DetalleRequerimiento[] | null {
    if (!puedeGuardar) {
      this.alertService.showAlertError('Error', 'Existen errores, corrijalos antes de guardar');
      return null;
    }
    const idReqActual = this.requerimiento?.idrequerimiento || '';
    const nuevos: DetalleRequerimiento[] = lineasPreview.map((l) => ({
      idrequerimiento: idReqActual,
      codigo: l.codigo,
      producto: l.descripcion,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      unidadMedida: l.unidadMedida || 'UND',
      proyecto: l.proyecto,
      ceco: l.ceco,
      turno: l.turno ?? '',
      labor: l.labor || (this.maestras.laborSeleccionado?.labor ?? ''),
      esActivoFijo: false,
      activoFijo: l.activofijo,
      afectoIGV: l.afectoIGV === 'N' ? 'N' : 'S',
      estado: 0,
    }));
    this.detalles.push(...nuevos);
    this.alertService.mostrarInfo('Carga masiva guardada correctamente');
    return nuevos;
  }

  async guardarLinea() {
    let prod: any = this.lineaTemp.producto;
    const codigoFromTemp = this.lineaTemp.codigo || (typeof prod === 'object' ? prod?.codigo : '');
    const descFromTemp = typeof prod === 'string'
      ? prod
      : (typeof prod === 'object' ? prod?.descripcion : '');
    const productoEncontrado = this.maestras.items.find((it: any) =>
      (codigoFromTemp && it.codigo === codigoFromTemp) ||
      (descFromTemp && it.descripcion === descFromTemp)
    );
    console.log('💾 guardarLinea lineaTemp:', this.lineaTemp, 'prod:', prod, 'encontrado:', productoEncontrado);
    if (!prod || !productoEncontrado) {
      console.warn('❌ guardarLinea rechazado: producto no seleccionado o no encontrado');
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar un producto del listado.', 'warning'); return;
    }
    prod = productoEncontrado;
    if (!this.lineaTemp.cantidad || this.lineaTemp.cantidad <= 0) {
      this.alertService.showAlert('Campo inválido', 'La cantidad debe ser mayor a 0.', 'warning'); return;
    }
    const esCompraConsumo = this.TipoSelecionado === 'COMPRA' || this.TipoSelecionado === 'CONSUMO';
    if (esCompraConsumo && !this.lineaTemp.proyecto?.trim()) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar un proyecto.', 'warning'); return;
    }
    if (esCompraConsumo && !this.lineaTemp.ceco?.trim()) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar un CECO.', 'warning'); return;
    }
    if (this.TipoSelecionado === 'CONSUMO' && !this.lineaTemp.turno?.trim()) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar un turno.', 'warning'); return;
    }
    if (esCompraConsumo && !this.lineaTemp.labor?.trim()) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar una labor.', 'warning'); return;
    }
    if (this.lineaTemp.esActivoFijo && !this.lineaTemp.activoFijo) {
      this.alertService.showAlert('Advertencia', 'Debe ingresar el codigo de activo fijo.', 'warning'); return;
    }
    const productoSeleccionado = this.maestras.items.find((it: any) => it.codigo === prod.codigo);
    const idReqActual = this.requerimiento?.idrequerimiento || '';
    const nuevaLinea: DetalleRequerimiento = {
      idrequerimiento: idReqActual,
      codigo: prod.codigo,
      producto: productoSeleccionado?.descripcion ?? prod.descripcion ?? '',
      descripcion: '',
      cantidad: this.lineaTemp.cantidad,
      unidadMedida: this.lineaTemp.unidadMedida,
      proyecto: this.lineaTemp.proyecto,
      ceco: this.lineaTemp.ceco,
      turno: this.TipoSelecionado === 'COMPRA' ? '' : this.lineaTemp.turno,
      labor: this.lineaTemp.labor,
      esActivoFijo: this.lineaTemp.esActivoFijo,
      activoFijo: this.lineaTemp.activoFijo,
      afectoIGV: this.lineaTemp.afectoIGV === 'N' ? 'N' : 'S',
      estado: 0,
    };
    if (this.editIndex >= 0) {
      const idExistente = this.detalles[this.editIndex].id!;
      await this.dexieService.detalles.put({ id: idExistente, ...nuevaLinea });
      this.detalles[this.editIndex] = { id: idExistente, ...nuevaLinea };
    } else {
      delete (this.lineaTemp as any).id;
      const idNuevo = await this.dexieService.detalles.add({ ...nuevaLinea });
      this.detalles.push({ id: idNuevo, ...nuevaLinea });
    }
    // Sincronizar detalles con la cabecera activa y marcar modificado
    this.requerimiento.detalle = [...this.detalles];
    if (this.requerimiento.id) {
      await this.dexieService.requerimientos.update(this.requerimiento.id, { detalle: this.detalles, modificado: 1 });
    }
    const idxReq = this.requerimientos.findIndex((r) => r.idrequerimiento === this.requerimiento.idrequerimiento);
    if (idxReq >= 0) this.requerimientos[idxReq].detalle = [...this.detalles];
    this.cerrarModal();
    this.alertService.showAlert('Éxito', 'Linea guardada correctamente.', 'success');
    console.log('💾 guardarLinea final - detalles:', this.detalles);
  }

  insertarLineaEnTabla() {
    if (!this.lineaTemp.producto || !this.lineaTemp.cantidad || this.lineaTemp.cantidad <= 0) {
      this.alertService.showAlert('Validación', 'Complete los campos obligatorios: Producto y Cantidad', 'warning');
      return;
    }
    const ceco = this.lineaTemp.ceco || this.maestras.cecoSeleccionado?.localname || '';
    const proyecto = this.lineaTemp.proyecto || (this.maestras.proyectoSeleccionado ? String((this.maestras.proyectoSeleccionado as any).proyectoio) : '');
    const labor = this.lineaTemp.labor || this.maestras.laborSeleccionado?.labor || '';
    const turno = this.TipoSelecionado === 'COMPRA' ? '' : (this.lineaTemp.turno || this.maestras.turnoSeleccionado || '');
    const descripcion = this.obtenerDescripcionProducto(this.lineaTemp.producto) || '';
    const codigoProducto = (typeof this.lineaTemp.producto === 'string' ? this.lineaTemp.producto : this.lineaTemp.producto?.codigo) || this.lineaTemp.codigo || '';
    const nuevaLinea: any = {
      idrequerimiento: this.requerimiento?.idrequerimiento || '',
      codigo: codigoProducto,
      producto: descripcion,
      descripcion,
      cantidad: this.lineaTemp.cantidad,
      unidadMedida: this.lineaTemp.unidadMedida || '',
      proyecto, ceco, turno, labor,
      esActivoFijo: this.lineaTemp.esActivoFijo || false,
      activoFijo: this.lineaTemp.activoFijo || '',
      afectoIGV: this.lineaTemp.afectoIGV === 'N' ? 'N' : 'S',
      estado: 0,
      stockDisponible: this.stockActualLineaTemp,
    };
    if (this.editingTempIndex >= 0) {
      this.lineasTemporales[this.editingTempIndex] = nuevaLinea;
      this.editingTempIndex = -1;
    } else {
      this.lineasTemporales.push(nuevaLinea);
    }
    this.inicializarVariablesModal();
    this.lineaTemp = {
      ...this.lineaTemp,
      codigo: '',
      producto: null,
      descripcion: '',
      cantidad: 0,
      unidadMedida: '',
      esActivoFijo: false,
      activoFijo: '',
      afectoIGV: 'S',
    };
  }

  registrarTodasLasLineas() {
    if (this.lineasTemporales.length === 0) {
      this.alertService.showAlert('Validación', 'Debe agregar al menos una linea', 'warning');
      return;
    }
    // El modal trabaja sobre el listado completo (existentes + nuevas)
    this.detalles = [...this.lineasTemporales];
    this.alertService.showAlert('Éxito', `${this.lineasTemporales.length} linea(s) agregada(s) correctamente`, 'success');
    this.cerrarModal();
  }

  onCheckChange(item: any, checked: boolean) {
    item.checked = checked;
    this.dataSelected = this.requerimientos.filter((r) => r.checked);
    this.verBotones = this.dataSelected.length > 0;
  }

  editarLineaTemporal(index: number): void {
    const linea = this.lineasTemporales[index];
    if (!linea) return;
    this.editingTempIndex = index;
    this.enModoEdicion = true;
    let producto: any = null;
    if ((linea as any).codigo) producto = this.maestras.items.find((it: any) => it.codigo === (linea as any).codigo);
    if (!producto && linea.producto) producto = this.maestras.items.find((it: any) => it.descripcion === linea.producto);
    this.lineaTemp = {
      ...linea,
      producto: producto ? { ...producto } : (linea.producto ?? null),
      proyecto: linea.proyecto || '',
      ceco: linea.ceco || '',
      labor: linea.labor || '',
      turno: linea.turno || '',
    };
    this.turnoModal = linea.turno || '';
    this.cecoModal = linea.ceco || '';
    this.laborModal = linea.labor || '';
    this.proyectoModal = linea.proyecto || '';
    this.filteredCecosModal = this.maestras.cecos.filter((c: any) => c.turno === this.turnoModal);
    const cecoObj = this.maestras.cecos.find((c: any) => c.localname === this.cecoModal);
    this.filteredLaboresModal = this.maestras.labores.filter((l: any) => l.ceco === (cecoObj?.costcenter || ''));
    this.filteredProyectosModal = this.maestras.proyectos;
    this.modalAbierto = true;
  }

  eliminarLineaTemporal(index: number): void {
    if (index < 0 || index >= this.lineasTemporales.length) return;
    this.lineasTemporales.splice(index, 1);
  }

  limpiarFormularioModal(): void {
    this.inicializarVariablesModal();
  }

  async eliminarLinea(index: number): Promise<void> {
    const detalle = this.detalles[index];
    const id = detalle?.id;
    if (id) await this.dexieService.deleteDetalleRequerimiento(id);
    this.detalles.splice(index, 1);
    this.requerimiento.detalle = [...this.detalles];
    if (this.requerimiento.id) {
      await this.dexieService.requerimientos.update(this.requerimiento.id, { detalle: this.detalles, modificado: 1 });
    }
    const idx = this.requerimientos.findIndex((r) => r.idrequerimiento === this.requerimiento.idrequerimiento);
    if (idx >= 0) this.requerimientos[idx].detalle = [...this.detalles];
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  copiarLinea(index: number): void {
    const detalleOriginal = this.detalles[index];
    const producto = this.maestras.items?.find((it: any) => it.descripcion === detalleOriginal.producto);
    this.lineaTemp = { ...detalleOriginal, id: undefined, producto: producto ? { ...producto } : null };
    this.editIndex = -1;
    this.modalAbierto = true;
    this.alertService.mostrarInfo('Línea copiada. Modifica los campos y guarda.');
  }

  validarFilaSimple(row: DetalleExcelPreview, lineasPreview: DetalleExcelPreview[], activosFijos: any[]): void {
    this.validarFila(row, lineasPreview, activosFijos);
  }

  scrollLeft(): void {
    const container = document.querySelector('.tab-buttons-container') as HTMLElement;
    if (container) container.scrollLeft -= 200;
  }

  scrollRight(): void {
    const container = document.querySelector('.tab-buttons-container') as HTMLElement;
    if (container) container.scrollLeft += 200;
  }

  // ── Migración automática TRANSFERENCIA → SPRING ─────────────────────────
  private async migrarTransferenciaASPRING(idReq: string, prioridad: PrioridadSpring): Promise<void> {
    try {
      const usuario = this.maestras.usuario;
      const detalle = this.requerimiento.detalle;
      const first = detalle[0];

      const cecos = this.maestras.cecos || [];
      const proyectos = this.maestras.proyectos || [];
      const almacenes = this.maestras.almacenes || [];

      const cecoFirst = cecos.find((c: any) => c.localname === first?.ceco || c.idceco === first?.ceco);
      const proyectoFirst = proyectos.find((p: any) => p.proyectoio === first?.proyecto);

      const centroCostoDefault = cecoFirst?.costcenter ?? '0001';
      const proyectoAfeDefault = proyectoFirst?.afe ?? 'FUNDO HP';
      const accountDefault = cecoFirst?.ccontable ?? '10411103';

      let almacenCodigo = this.maestras.almacenOrigen || 'H001';
      if (almacenCodigo && almacenCodigo.length <= 3 && !isNaN(Number(almacenCodigo))) {
        const almacenCompleto = almacenes.find((a: any) => a.idalmacen == almacenCodigo || a.almacen == almacenCodigo);
        almacenCodigo = almacenCompleto?.idalmacen ?? ('H' + almacenCodigo.padStart(3, '0'));
      }

      const payloadSpring = [
        {
          CompaniaSocio: (usuario.idempresa ?? '') + '00',
          RequisicionNumero: '',
          Clasificacion: 'TRA',
          ComprasAlmacenFlag: 'A',
          AlmacenCodigo: almacenCodigo,
          MonedaCodigo: 'LO',
          FechaRequerida: new Date().toISOString(),
          FechaPreparacion: new Date().toISOString(),
          FechaAprobacion: new Date().toISOString(),
          PreparadaPor: -1,
          AprobadaPor: -1,
          PrecioTotal: 0,
          PrioridadCodigo: String(prioridad ?? '1'),
          DefaultPrime: centroCostoDefault,
          DefaultAfe: proyectoAfeDefault,
          CuantiaMonetariaPendienteFlag: 'N',
          UnidadNegocio: '0001',
          UnidadReplicacion: 'TRUJ',
          LocalForeignFlag: 'L',
          Comentarios: this.requerimiento.glosa || '',
          Estado: 'AP',
          UltimoUsuario: 'MISESF',
          UltimaFechaModif: new Date().toISOString(),
          UltimoUsuarioNumero: -1,
          TransaccionOperacion: '999',
          DefaultCampoReferencia: this.SeleccionaTipoGasto || '',
          RevisionTecnicaPendienteFlag: 'N',
          ClienteNumeroPedido: '',
          ViaTransporte: 'T',
          OrigenGeneracionFlag: 'L',
          origen: 'app_logistica',
          detalle: detalle.map((d: any, index: number) => {
            const ceco = cecos.find((c: any) => c.localname === d.ceco || c.idceco === d.ceco);
            const labor = this.maestras.labores?.find((l: any) => l.labor === d.labor);
            const itemCcostodestino = labor?.idlabor ?? (ceco?.costcenter || '');
            return {
              Secuencia: index + 1,
              TipoDetalle: 'ITEM',
              Item: d.codigo,
              Commodity: null,
              Condicion: '0',
              UnidadCodigo: d.unidadmedida || 'UND',
              Descripcion: d.producto || d.descripcion || '',
              ComprasAlmacenFlag: 'A',
              RedefinidoFlag: 'N',
              CantidadPedida: d.cantidad,
              CantidadOrdenCompra: 0,
              CantidadRecibida: 0,
              PrecioUnitario: 0,
              PrecioxCantidad: 0,
              CotizacionCantidad: 0,
              CotizacionPrecioUnitario: 0,
              CotizacionPrecioUnitarioconIGV: 0,
              CotizacionProveedor: 0,
              ControlPresupuestalFlag: 'S',
              Comentario: d.descripcion ?? '',
              CentroCosto: ceco?.costcenter ?? '',
              LoteProduccion: itemCcostodestino,
              Estado: 'PE',
              UltimoUsuario: 'MISESF',
              UltimaFechaModif: new Date().toISOString(),
              IGVExoneradoFlag: d.afectoIGV === 'N' ? 'S' : 'N',
              GenerarContratoFlag: 'N',
              origen: 'app_logistica',
            };
          }),
          distribucion: [
            {
              Secuencia: 1,
              Linea: 1,
              Account: accountDefault,
              Afe: proyectoAfeDefault,
              Monto: '100.00',
              CentroCostoDestino: centroCostoDefault,
              Sucursal: '0801',
              CampoReferencia: this.SeleccionaTipoGasto || 'GA',
              ReferenciaFiscal01: '',
              ReferenciaFiscal02: '',
              origen: 'app_logistica',
            },
          ],
        },
      ];

      const respSpring = await firstValueFrom(this.requerimientosService.getRegristroRequerimientoSPRING(payloadSpring));
      const resultadoSpring = Array.isArray(respSpring) ? respSpring[0] : respSpring;

      if (resultadoSpring?.errorgeneral === 0) {
        const correlativoSPRING = resultadoSpring.RequisicionNumero;
        const payloadActualizar = [{ idrequerimiento: idReq, RequisicionNumero: correlativoSPRING }];
        this.requerimientosService.getNumeroRequerimientoPRING(payloadActualizar).subscribe({
          next: () => {},
          error: (err: any) => console.error('Error al guardar número WHRQ:', err),
        });
        this.alertService.showAlert('Éxito', `Requerimiento de transferencia enviado a SPRING (${correlativoSPRING})`, 'success');
      } else {
        console.error('Error SPRING TRANSFERENCIA:', respSpring);
        this.alertService.showAlert('Aviso', 'Requerimiento creado como APROBADA pero no se pudo registrar en SPRING. Contacte a soporte.', 'warning');
      }
    } catch (e: any) {
      console.error('Error migrarTransferenciaASPRING:', e);
      this.alertService.showAlert('Aviso', 'Requerimiento creado como APROBADA pero falló la migración a SPRING. Contacte a soporte.', 'warning');
    }
  }

  // ── Plantillas de carga masiva ─────────────────────────────────────────────
  descargarPlantillaCompra(): void {
    const headers = [
      'COD MATERIAL',
      'DESCRIPCION',
      'CANT.',
      'UM',
      'AREA',
      'RESPONSABLE DE PEDIDO',
      'CENTRO DE COSTO',
      'PROYECTO',
      'ACTIVIDAD',
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Compra');
    XLSX.writeFile(wb, 'plantilla_carga_masiva_compra.xlsx');
  }

  descargarPlantillaConsumo(): void {
    const headers = [
      'Cod. Item',
      'Descripcion Item',
      'Cantidad',
      'Unidad Medida',
      'Turno',
      'ActivoFijo',
      'CECO',
      'PROYECTO',
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Consumo');
    XLSX.writeFile(wb, 'plantilla_carga_masiva_consumo.xlsx');
  }
}
