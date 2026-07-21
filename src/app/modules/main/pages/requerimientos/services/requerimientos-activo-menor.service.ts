import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { PrioridadRequerimientoService } from '@/app/shared/services/prioridad-requerimiento.service';
import { RequerimientoActivoFijoMenor, DetalleRequerimientoActivoFijoMenor } from '@/app/shared/interfaces/Tables';
import { PrioridadSpring } from '@/app/shared/interfaces/PrioridadRequerimiento';
import { RequerimientosMaestrasService } from './requerimientos-maestras.service';
import { RequerimientosSyncService } from './requerimientos-sync.service';

@Injectable({ providedIn: 'root' })
export class RequerimientosActivoMenorService {

  requerimientosActivoFijoMenor: RequerimientoActivoFijoMenor[] = [];
  requerimientoActivoFijoMenor: RequerimientoActivoFijoMenor = this.emptyReq();
  detallesActivoFijoMenor: DetalleRequerimientoActivoFijoMenor[] = [];
  lineaTempActivoFijoMenor: DetalleRequerimientoActivoFijoMenor = this.emptyDetalle();

  mostrarFormularioActivoFijoMenor = false;
  modoEdicionActivoFijoMenor = false;
  activoFijoMenorEditIndex = -1;
  modalAbiertoActivoFijoMenor = false;

  sienvinarActivoFijoMenor = 0;
  enviadosActivoFijoMenor = 0;

  glosaActivoFijoMenor = '';
  selecccionaActivoFijoMenor = '';
  SeleccionaServicioAFMenor = '';
  SeleccionaSubServicioAFMenor = '';
  SeleccionaPrioridadACTIVOFIJOMENOR: PrioridadSpring | '' = '';
  opcionesPrioridadACTIVOFIJOMENOR: { value: PrioridadSpring; label: string; descripcion: string }[] = [];

  verBotonesActivoFijoMenor = false;
  dataSelectedActivoFijoMenor: any[] = [];

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private utilsService: UtilsService,
    private requerimientosService: RequerimientosService,
    private aprobacionesAreaService: AprobacionesAreaService,
    public prioridadService: PrioridadRequerimientoService,
    private maestras: RequerimientosMaestrasService,
    private syncService: RequerimientosSyncService,
  ) {}

  itemTipoSeleccionado: 'CONSUMO' | 'COMPRA' = 'COMPRA';

  private emptyReq(): RequerimientoActivoFijoMenor {
    return {
      idrequerimiento: '', ruc: '', fecha: '', servicio: '', descripcion: '',
      almacen: '', glosa: '', tipo: '', itemtipo: '', estados: 'PENDIENTE', idfundo: '',
      idarea: '', idclasificacion: '', prioridad: '', nrodocumento: '', idalmacen: '',
      idalmacendestino: '', idproyecto: '', estado: 0, disabled: false, checked: false,
      eliminado: 0, detalleActivoFijoMenor: [],
    };
  }

  private emptyDetalle(): DetalleRequerimientoActivoFijoMenor {
    return {
      idrequerimiento: '', codigo: '', descripcion: '', proveedor: '', cantidad: 0,
      proyecto: '', ceco: '', turno: '', labor: '', esActivoFijo: false, activoFijo: '', estado: 0,
    };
  }

  async cargar() {
    const todos = await this.dexieService.showRequerimientoActivoFijoMenor();
    this.requerimientosActivoFijoMenor = todos.filter(
      (r: any) =>
        r.nrodocumento === this.maestras.usuario?.documentoidentidad &&
        !this.syncService.debeOcultar(r.estados),
    );
    const faltan = this.requerimientosActivoFijoMenor.some((r: any) => !r.servicio && (r.detalle?.length || r.detalleActivoFijoMenor?.length));
    if (faltan) {
      const subs = await this.dexieService.showMaestroSubCommodity();
      this.requerimientosActivoFijoMenor.forEach((r: any) => {
        if (!r.servicio) {
          const dets = (r.detalle?.length ? r.detalle : r.detalleActivoFijoMenor) || [];
          if (dets.length) {
            const match = subs.find((s: any) => s.commodity === dets[0].codigo);
            if (match) r.servicio = match.commodity01;
          }
        }
      });
    }
    this.ordenar();
    this.contarContadores();
  }

  ordenar() {
    this.requerimientosActivoFijoMenor.sort((a, b) => {
      if (a.estado !== b.estado) return a.estado - b.estado;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  contarContadores() {
    this.sienvinarActivoFijoMenor = this.requerimientosActivoFijoMenor.filter((r) => r.estado === 0).length;
    this.enviadosActivoFijoMenor = this.requerimientosActivoFijoMenor.filter((r) => r.estado === 1).length;
  }

  async nuevo() {
    this.requerimientoActivoFijoMenor = this.emptyReq();
    this.mostrarFormularioActivoFijoMenor = true;
    this.detallesActivoFijoMenor = [];
    this.glosaActivoFijoMenor = await this.maestras.generarGlosaAutomatica();
    this.modoEdicionActivoFijoMenor = false;
    this.opcionesPrioridadACTIVOFIJOMENOR = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.SeleccionaPrioridadACTIVOFIJOMENOR = '1';
    this.itemTipoSeleccionado = 'COMPRA';
    this.maestras.clasificacionSeleccionado = 'ATM';
    if (this.maestras.configuracion?.idalmacen) {
      this.maestras.almacenSeleccionado = this.maestras.configuracion.idalmacen;
    }
  }

  async editar(index: number) {
    const req = this.requerimientosActivoFijoMenor[index];
    if (!req) return;
    this.mostrarFormularioActivoFijoMenor = true;
    this.modoEdicionActivoFijoMenor = true;
    this.activoFijoMenorEditIndex = index;
    this.opcionesPrioridadACTIVOFIJOMENOR = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.requerimientoActivoFijoMenor = { ...req };
    this.detallesActivoFijoMenor = (req.detalleActivoFijoMenor && req.detalleActivoFijoMenor.length) ? req.detalleActivoFijoMenor : ((req as any).detalle || []);
    this.maestras.fundoSeleccionado = req.idfundo;
    this.maestras.areaSeleccionada = req.idarea;
    this.maestras.almacenSeleccionado = req.idalmacen;
    this.itemTipoSeleccionado = (req.itemtipo as 'CONSUMO' | 'COMPRA') || 'COMPRA';
    this.maestras.clasificacionSeleccionado = req.idclasificacion;
    this.SeleccionaPrioridadACTIVOFIJOMENOR = req.prioridad as PrioridadSpring | '';
    const proyectoObj = this.maestras.proyectos.find((p) => p.id === req.idproyecto);
    this.maestras.proyectoSeleccionado = proyectoObj || null;
    // Inferir servicio desde el primer detalle si el cabecera no lo trae
    let servicioInferido = req.servicio;
    if (!servicioInferido && this.detallesActivoFijoMenor.length) {
      const subs = await this.dexieService.showMaestroSubCommodity();
      const primerCodigo = (this.detallesActivoFijoMenor[0] as any).codigo;
      const match = subs.find((s: any) => s.commodity === primerCodigo);
      if (match) servicioInferido = match.commodity01;
    }
    this.selecccionaActivoFijoMenor = servicioInferido;
    this.SeleccionaServicioAFMenor = servicioInferido;
    // Asegurar que el servicio exista en el dropdown filtrado
    if (servicioInferido && !this.maestras.commodityFiltradosAFMenor.find((s: any) => s.commodity01 === servicioInferido)) {
      const todos = this.maestras.servicioAFMenor.length ? this.maestras.servicioAFMenor : await this.dexieService.showMaestroCommodity();
      const faltante = todos.find((s: any) => s.commodity01 === servicioInferido);
      if (faltante) this.maestras.commodityFiltradosAFMenor = [...this.maestras.commodityFiltradosAFMenor, faltante];
    }
    await this.maestras.onServicioAFMenorChange(servicioInferido);
    this.glosaActivoFijoMenor = req.glosa;
    this.modalAbiertoActivoFijoMenor = false;
  }

  async eliminar(index: number) {
    const confirmacion = await this.alertService.showConfirm('Confirmación', '¿Desea eliminar este requerimiento?', 'warning');
    if (!confirmacion) return;
    try {
      const req = this.requerimientosActivoFijoMenor[index];
      await this.dexieService.deleteRequerimiento(req.idrequerimiento);
      this.requerimientosActivoFijoMenor.splice(index, 1);
      this.contarContadores();
      this.alertService.showAlert('Éxito', 'Requerimiento eliminado correctamente.', 'success');
    } catch {
      this.alertService.showAlert('Error', 'Ocurrió un error al eliminar el requerimiento.', 'error');
    }
  }

  editarDetalle(index: number) {
    this.activoFijoMenorEditIndex = index;
    const detalle = this.detallesActivoFijoMenor[index];
    this.lineaTempActivoFijoMenor = { ...detalle, subservicio: detalle.codigo } as any;
    (this as any).SeleccionaSubServicioAFMenor = detalle.codigo;
    this.modoEdicionActivoFijoMenor = true;
    this.modalAbiertoActivoFijoMenor = true;
  }

  async eliminarDetalle(index: number) {
    const detalle = this.detallesActivoFijoMenor[index];
    if (detalle.id) await this.dexieService.deleteDetalleRequerimiento(detalle.id);
    this.detallesActivoFijoMenor.splice(index, 1);
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  async guardar() {
    if (!this.maestras.fundoSeleccionado) {
      this.alertService.showAlert('Atención', 'Debes seleccionar un Fundo antes de guardar.', 'warning');
      return;
    }
    if (!this.glosaActivoFijoMenor) {
      this.alertService.showAlert('Atención', 'Debes ingresar una glosa antes de guardar.', 'warning');
      return;
    }
    try {
      this.alertService.mostrarModalCarga();
      const almacenObj = this.maestras.almacenes.find((a) => a.idalmacen == this.maestras.almacenSeleccionado);
      const idAlmacenSync = almacenObj ? almacenObj.idalmacen : '';
      const idreq = this.maestras.usuario.ruc + idAlmacenSync + this.maestras.usuario.documentoidentidad + this.utilsService.formatoAnioMesDiaHoraMinSec();
      const reqAF: RequerimientoActivoFijoMenor = {
        idrequerimiento: this.modoEdicionActivoFijoMenor ? this.requerimientoActivoFijoMenor.idrequerimiento : idreq,
        ruc: this.maestras.usuario.ruc,
        fecha: new Date().toISOString(),
        servicio: this.SeleccionaServicioAFMenor,
        descripcion: this.SeleccionaSubServicioAFMenor,
        almacen: almacenObj?.almacen || '',
        glosa: this.glosaActivoFijoMenor,
        tipo: 'ACTIVOFIJOMENOR',
        itemtipo: this.itemTipoSeleccionado,
        estados: 'PENDIENTE',
        prioridad: this.SeleccionaPrioridadACTIVOFIJOMENOR ?? '1',
        idfundo: this.maestras.fundoSeleccionado,
        idarea: this.maestras.areaSeleccionada,
        idclasificacion: this.maestras.clasificacionSeleccionado || 'ATM',
        nrodocumento: this.maestras.usuario.documentoidentidad,
        idalmacen: idAlmacenSync,
        idalmacendestino: '',
        idproyecto: this.maestras.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,
        disabled: false,
        checked: false,
        eliminado: 0,
        detalleActivoFijoMenor: [...this.detallesActivoFijoMenor],
      };
      if (this.modoEdicionActivoFijoMenor) {
        await this.dexieService.detallesActivoFijoMenor.where('idrequerimiento').equals(reqAF.idrequerimiento).delete();
        await this.dexieService.requerimientosActivoFijoMenor.where('idrequerimiento').equals(reqAF.idrequerimiento).delete();
        await this.dexieService.requerimientosActivoFijoMenor.put({ ...reqAF, modificado: 1 } as any);
        const idx = this.requerimientosActivoFijoMenor.findIndex((r) => r.idrequerimiento === reqAF.idrequerimiento);
        if (idx !== -1) this.requerimientosActivoFijoMenor[idx] = { ...reqAF };
        this.modoEdicionActivoFijoMenor = false;
      } else {
        await this.dexieService.requerimientosActivoFijoMenor.put(reqAF);
        this.requerimientosActivoFijoMenor.push({ ...reqAF });
      }
      for (const d of this.detallesActivoFijoMenor) {
        await this.dexieService.detallesActivoFijoMenor.put({ ...d, idrequerimiento: reqAF.idrequerimiento });
      }
      try {
        if (reqAF.idarea) {
          await this.aprobacionesAreaService.registrarRequerimiento({
            ruc: reqAF.ruc, idrequerimiento: reqAF.idrequerimiento,
            idarea: Number(reqAF.idarea), tipoRequerimiento: this.itemTipoSeleccionado,
            descripcion: reqAF.glosa, usuarioSolicitud: this.maestras.usuario.documentoidentidad,
            glosa: reqAF.glosa, monto: 0,
          }).toPromise();
          await this.aprobacionesAreaService.asignarAprobadoresRequerimiento({
            ruc: reqAF.ruc, idrequerimiento: reqAF.idrequerimiento,
            idarea: Number(reqAF.idarea), tipoRequerimiento: this.itemTipoSeleccionado,
            usuarioSolicitud: this.maestras.usuario.documentoidentidad,
          }).toPromise();
        }
      } catch { }
      this.alertService.cerrarModalCarga();
      this.contarContadores();
      this.ordenar();
      this.alertService.showAlert('Éxito', 'Requerimiento Activo Fijo Menor guardado correctamente.', 'success');
      this.detallesActivoFijoMenor = [];
      this.mostrarFormularioActivoFijoMenor = false;
      this.activoFijoMenorEditIndex = -1;
    } catch (e) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Hubo un problema al guardar el Requerimiento de Activo Fijo Menor.', 'error');
    }
  }

  cancelar() {
    const confirmar = confirm('¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.');
    if (!confirmar) return;
    this.mostrarFormularioActivoFijoMenor = false;
  }

  async sincronizarPendientes() {
    const pendientes = await this.dexieService.requerimientosActivoFijoMenor
      .filter((r) => r.estado === 0 || (r as any).modificado === 1).toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert('Información', 'No hay requerimientos pendientes por sincronizar', 'info');
      return;
    }
    const confirmar = await this.alertService.showConfirm('Confirmación', `Se sincronizarán ${pendientes.length} requerimientos ¿Desea continuar?`, 'warning');
    if (!confirmar) return;
    this.maestras.sincronizando = true;
    this.maestras.progreso = 0;
    const payload = pendientes.map((req: any) => ({
      idrequerimiento: req.idrequerimiento, ruc: this.maestras.usuario.ruc, idfundo: req.idfundo,
      idarea: req.idarea, idclasificacion: req.idclasificacion || 'ATM', prioridad: req.prioridad || '1',
      nrodocumento: this.maestras.usuario.documentoidentidad, idalmacen: req.idalmacen,
      idalmacendestino: '', glosa: req.glosa || '', referenciaGasto: '', eliminado: 0,
      tipo: req.tipo, itemtipo: req.itemtipo, estados: 'PENDIENTE',
      detalle: (req.detalleActivoFijoMenor || []).map((d: any) => ({
        codigo: d.codigo, tipoclasificacion: 'M', cantidad: d.cantidad,
        idproducto: d.producto || '', iddescripcion: d.descripcion || '',
        idproyecto: d.proyecto || '', idcentrocosto: d.ceco || '',
        idturno: d.turno || '', idlabor: d.labor || '', eliminado: 0,
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
        await this.dexieService.requerimientosActivoFijoMenor.where('idrequerimiento').anyOf(idsOk).modify({ estado: 1 });
      }
      this.alertService.showAlert(idsConError.length ? 'Sincronización parcial' : 'Éxito',
        idsConError.length ? `Sincronizados ${idsOk.length}, con error ${idsConError.length}` : 'Todos sincronizados', idsConError.length ? 'warning' : 'success');
      await this.cargar();
    } catch {
      this.alertService.showAlertError('Error', 'No se pudo conectar con el servidor');
    } finally {
      this.maestras.progreso = 100;
      this.maestras.sincronizando = false;
    }
  }

  nuevaLineaActivoFijoMenor(): DetalleRequerimientoActivoFijoMenor {
    return this.emptyDetalle();
  }

  async abrirModal() {
    if (this.activoFijoMenorEditIndex === -1) {
      await this.maestras.cargarConfiguracion();
      const cfg = this.maestras.configuracion;
      if (cfg?.idceco) {
        this.maestras.cecoSeleccionado = (await this.dexieService.getCecoById(cfg.idceco)) as any;
        if (!this.maestras.cecoSeleccionado) {
          const byName = this.maestras.cecos.find((c: any) => c.localname === cfg.idceco || c.costcenter === cfg.idceco);
          if (byName) this.maestras.cecoSeleccionado = byName;
        }
      }
      if (cfg?.idproyecto) {
        this.maestras.proyectoSeleccionado = (await this.dexieService.getProyectoByAfe(cfg.idproyecto)) as any;
      }
      if (cfg?.idlabor) {
        this.maestras.laborSeleccionado = (await this.dexieService.getLaborById(cfg.idlabor)) as any;
      }
      if (cfg?.idturno) {
        this.maestras.turnoSeleccionado = cfg.idturno;
      }
      this.lineaTempActivoFijoMenor = {
        ...this.emptyDetalle(),
        proyecto: this.maestras.proyectoSeleccionado ? String((this.maestras.proyectoSeleccionado as any).proyectoio) : '',
        ceco: (this.maestras.cecoSeleccionado as any)?.localname ?? '',
        turno: this.maestras.turnoSeleccionado ?? '',
        labor: (this.maestras.laborSeleccionado as any)?.labor ?? '',
      };
    }
    this.modalAbiertoActivoFijoMenor = true;
  }

  cerrarModal() {
    this.modalAbiertoActivoFijoMenor = false;
    this.activoFijoMenorEditIndex = -1;
  }

  async guardarLinea() {
    const linea = this.lineaTempActivoFijoMenor;
    if (!linea.cantidad || linea.cantidad <= 0) {
      this.alertService.showAlert('Campo inválido', 'La cantidad debe ser mayor a 0.', 'warning'); return;
    }
    if (!linea.proyecto?.trim()) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar un proyecto.', 'warning'); return;
    }
    if (!linea.ceco?.trim()) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar un CECO.', 'warning'); return;
    }
    if (!linea.labor?.trim()) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar una labor.', 'warning'); return;
    }
    if (linea.esActivoFijo && !linea.activoFijo) {
      this.alertService.showAlert('Advertencia', 'Debe ingresar el código de activo fijo.', 'warning'); return;
    }
    const codigoSub = (linea as any).subservicio || this.SeleccionaSubServicioAFMenor;
    const sub = this.maestras.subservicioFiltradosAFMenor.find((s) => s.commodity === codigoSub);
    if (!sub) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar un subservicio válido.', 'warning'); return;
    }
    const nuevaLinea = {
      idrequerimiento: '', codigo: sub.commodity,
      descripcion: sub.descripcionLocal,
      proveedor: linea.proveedor, cantidad: linea.cantidad,
      proyecto: linea.proyecto, ceco: linea.ceco, turno: linea.turno, labor: linea.labor,
      esActivoFijo: linea.esActivoFijo, activoFijo: linea.activoFijo, estado: 0,
    };
    if (this.activoFijoMenorEditIndex >= 0) {
      const idExistente = this.detallesActivoFijoMenor[this.activoFijoMenorEditIndex].id!;
      await this.dexieService.detallesActivoFijoMenor.put({ id: idExistente, ...nuevaLinea });
      this.detallesActivoFijoMenor[this.activoFijoMenorEditIndex] = { id: idExistente, ...nuevaLinea };
    } else {
      const idNuevo = await this.dexieService.detallesActivoFijoMenor.add({ ...nuevaLinea });
      this.detallesActivoFijoMenor.push({ id: idNuevo, ...nuevaLinea });
    }
    this.cerrarModal();
    this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
  }

  onCheckChange(item: any, checked: boolean) {
    item.checked = checked;
    this.dataSelectedActivoFijoMenor = this.requerimientosActivoFijoMenor.filter((r) => r.checked);
    this.verBotonesActivoFijoMenor = this.dataSelectedActivoFijoMenor.length > 0;
  }

  async sincronizarRequerimiento() {
    const pendientes = await this.dexieService.requerimientosActivoFijoMenor
      .filter((r) => (r.estado === 0 || (r as any).modificado === 1) && r.estado !== 1).toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert('Información', 'No hay requerimientos pendientes por sincronizar', 'info');
      return;
    }
    const confirmacion = await this.alertService.showConfirm('Confirmación', `¿Desea enviar ${pendientes.length} requerimiento(s) pendiente(s)?`, 'warning');
    if (!confirmacion) return;
    const payload = pendientes.map((req) => ({
      idrequerimiento: req.idrequerimiento, ruc: req.ruc, idfundo: req.idfundo,
      idarea: req.idarea, idclasificacion: 'ACM', servicio: req.servicio,
      nrodocumento: req.nrodocumento, idalmacen: req.idalmacen,
      idalmacendestino: req.idalmacendestino || '', glosa: req.glosa || '',
      eliminado: 0, tipo: req.tipo, estados: 'PENDIENTE', prioridad: req.prioridad || '1',
      detalle: req.detalleActivoFijoMenor?.map((d: any) => ({
        codigo: d.codigo, tipoclasificacion: d.tipoclasificacion, cantidad: d.cantidad,
        iddescripcion: d.descripcion, idproyecto: d.proyecto || '',
        idcentrocosto: d.ceco || '', idturno: d.turno || '', idlabor: d.labor || '', eliminado: 0,
      })) || [],
    }));
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: async (resp) => {
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert('Éxito', `${pendientes.length} requerimiento(s) sincronizado(s) correctamente`, 'success');
          const ids = pendientes.map((p) => p.id!);
          await Promise.all(ids.map((id) => this.dexieService.requerimientosActivoFijoMenor.update(id, { estado: 1, modificado: 0 })));
          await this.cargar();
          this.contarContadores();
        } else {
          this.alertService.showAlert('Error', 'Hubo un problema al sincronizar los requerimientos', 'error');
        }
      },
      error: () => this.alertService.showAlert('Error', 'No se pudo conectar con el servidor', 'error'),
    });
  }

  editarLinea(i: number) { this.editarDetalle(i); }
  eliminarLinea(i: number) { this.eliminarDetalle(i); }

  async onServicioChange(): Promise<void> {
    await this.maestras.onServicioAFMenorChange(this.SeleccionaServicioAFMenor);
    this.SeleccionaSubServicioAFMenor = '';
  }

  onTurnoChangeModal(): void {
    this.maestras.turnoSeleccionado = this.lineaTempActivoFijoMenor.turno;
  }

  onCecoChangeModal(): void {
    this.maestras.cecoSeleccionado = this.maestras.cecos.find((c: any) => c.localname === this.lineaTempActivoFijoMenor.ceco) || null;
  }

  onLaborChangeModal(): void {
    this.maestras.laborSeleccionado = this.maestras.labores.find((l: any) => l.labor === this.lineaTempActivoFijoMenor.labor) || null;
  }

  scrollLeft(): void {
    const container = document.querySelector('.tab-buttons-container') as HTMLElement;
    if (container) container.scrollLeft -= 200;
  }

  scrollRight(): void {
    const container = document.querySelector('.tab-buttons-container') as HTMLElement;
    if (container) container.scrollLeft += 200;
  }
}
