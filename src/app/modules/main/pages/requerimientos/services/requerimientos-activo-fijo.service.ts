import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { PrioridadRequerimientoService } from '@/app/shared/services/prioridad-requerimiento.service';
import { RequerimientoActivoFijo, DetalleRequerimientoActivoFijo } from '@/app/shared/interfaces/Tables';
import { PrioridadSpring } from '@/app/shared/interfaces/PrioridadRequerimiento';
import { RequerimientosMaestrasService } from './requerimientos-maestras.service';

@Injectable({ providedIn: 'root' })
export class RequerimientosActivoFijoService {

  requerimientosActivoFijo: RequerimientoActivoFijo[] = [];
  requerimientoActivoFijo: RequerimientoActivoFijo = this.emptyReq();
  detallesActivoFijo: DetalleRequerimientoActivoFijo[] = [];
  lineaTempActivoFijo: DetalleRequerimientoActivoFijo = this.emptyDetalle();

  mostrarFormularioActivoFijo = false;
  modoEdicionActivoFijo = false;
  activoFijoEditIndex = -1;
  modalAbiertoActivoFijo = false;

  sinenviarActivoFijo = 0;
  enviadosActivoFijo = 0;

  glosaActivoFijo = '';
  SeleccionaServicioAF = '';
  SeleccionaSubServicioAF = '';
  SeleccionaPrioridadACTIVOFIJO: PrioridadSpring | '' = '';
  opcionesPrioridadACTIVOFIJO: { value: PrioridadSpring; label: string; descripcion: string }[] = [];

  verBotones = false;
  dataSelectedActivoFijo: any[] = [];

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private utilsService: UtilsService,
    private requerimientosService: RequerimientosService,
    private aprobacionesAreaService: AprobacionesAreaService,
    public prioridadService: PrioridadRequerimientoService,
    private maestras: RequerimientosMaestrasService,
  ) {}

  itemTipoSeleccionado: 'CONSUMO' | 'COMPRA' = 'COMPRA';

  private emptyReq(): RequerimientoActivoFijo {
    return {
      idrequerimiento: '', fecha: '', proveedor: '', servicio: '', descripcion: '',
      almacen: '', glosa: '', tipo: '', itemtipo: '', ruc: '', estados: 'PENDIENTE', idfundo: '',
      idarea: '', idclasificacion: '', prioridad: '', nrodocumento: '', idalmacen: '',
      idalmacendestino: '', idproyecto: '', estado: 0, disabled: false, checked: false,
      eliminado: 0, detalleActivoFijo: [],
    };
  }

  private emptyDetalle(): DetalleRequerimientoActivoFijo {
    return {
      idrequerimiento: '', codigo: '', descripcion: '', proveedor: '', cantidad: 0,
      proyecto: '', ceco: '', turno: '', labor: '', esActivoFijo: false, activoFijo: '', estado: 0,
    };
  }

  async cargar() {
    const todos = await this.dexieService.showRequerimientoActivoFijo();
    this.requerimientosActivoFijo = todos.filter(
      (r: any) => r.nrodocumento === this.maestras.usuario?.documentoidentidad,
    );
    // Inferir servicio para filas con servicio vacío usando el primer detalle
    const faltan = this.requerimientosActivoFijo.some((r: any) => !r.servicio && (r.detalle?.length || r.detalleActivoFijo?.length));
    if (faltan) {
      const subs = await this.dexieService.showMaestroSubCommodity();
      this.requerimientosActivoFijo.forEach((r: any) => {
        if (!r.servicio) {
          const dets = (r.detalle?.length ? r.detalle : r.detalleActivoFijo) || [];
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
    this.requerimientosActivoFijo.sort((a, b) => {
      if (a.estado !== b.estado) return a.estado - b.estado;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  contarContadores() {
    this.sinenviarActivoFijo = this.requerimientosActivoFijo.filter((r) => r.estado === 0).length;
    this.enviadosActivoFijo = this.requerimientosActivoFijo.filter((r) => r.estado === 1).length;
  }

  async nuevo() {
    this.requerimientoActivoFijo = this.emptyReq();
    this.mostrarFormularioActivoFijo = true;
    this.detallesActivoFijo = [];
    this.glosaActivoFijo = await this.maestras.generarGlosaAutomatica();
    this.modoEdicionActivoFijo = false;
    this.opcionesPrioridadACTIVOFIJO = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.SeleccionaPrioridadACTIVOFIJO = '1';
    this.itemTipoSeleccionado = 'COMPRA';
    this.maestras.clasificacionSeleccionado = 'ACT';
    if (this.maestras.configuracion?.idalmacen) {
      this.maestras.almacenSeleccionado = this.maestras.configuracion.idalmacen;
    }
  }

  async editar(index: number) {
    const req = this.requerimientosActivoFijo[index];
    if (!req) return;
    this.mostrarFormularioActivoFijo = true;
    this.modoEdicionActivoFijo = true;
    this.activoFijoEditIndex = index;
    this.opcionesPrioridadACTIVOFIJO = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.requerimientoActivoFijo = { ...req };
    this.detallesActivoFijo = (req.detalleActivoFijo && req.detalleActivoFijo.length) ? req.detalleActivoFijo : ((req as any).detalle || []);
    this.maestras.fundoSeleccionado = req.idfundo;
    this.maestras.areaSeleccionada = req.idarea;
    this.maestras.almacenSeleccionado = req.idalmacen;
    this.itemTipoSeleccionado = (req.itemtipo as 'CONSUMO' | 'COMPRA') || 'COMPRA';
    this.maestras.clasificacionSeleccionado = req.idclasificacion;
    this.SeleccionaPrioridadACTIVOFIJO = req.prioridad as PrioridadSpring | '';
    const proyectoObj = this.maestras.proyectos.find((p) => p.id === req.idproyecto);
    this.maestras.proyectoSeleccionado = proyectoObj || null;
    // Inferir servicio desde el primer detalle si el cabecera no lo trae
    let servicioInferido = req.servicio;
    if (!servicioInferido && this.detallesActivoFijo.length) {
      const subs = await this.dexieService.showMaestroSubCommodity();
      const primerCodigo = (this.detallesActivoFijo[0] as any).codigo;
      const match = subs.find((s: any) => s.commodity === primerCodigo);
      if (match) servicioInferido = match.commodity01;
    }
    this.SeleccionaServicioAF = servicioInferido;
    if (servicioInferido && !this.maestras.commodityFiltradosAF.find((s: any) => s.commodity01 === servicioInferido)) {
      const todos = this.maestras.servicioAF.length ? this.maestras.servicioAF : await this.dexieService.showMaestroCommodity();
      const faltante = todos.find((s: any) => s.commodity01 === servicioInferido);
      if (faltante) this.maestras.commodityFiltradosAF = [...this.maestras.commodityFiltradosAF, faltante];
    }
    await this.maestras.onServicioAFChange(this.SeleccionaServicioAF);
    this.glosaActivoFijo = req.glosa;
    this.modalAbiertoActivoFijo = false;
  }

  async eliminar(index: number) {
    const confirmacion = await this.alertService.showConfirm('Confirmación', '¿Desea eliminar este requerimiento?', 'warning');
    if (!confirmacion) return;
    try {
      const req = this.requerimientosActivoFijo[index];
      await this.dexieService.deleteRequerimiento(req.idrequerimiento);
      this.requerimientosActivoFijo.splice(index, 1);
      this.contarContadores();
      this.alertService.showAlert('Éxito', 'Requerimiento eliminado correctamente.', 'success');
    } catch {
      this.alertService.showAlert('Error', 'Ocurrió un error al eliminar el requerimiento.', 'error');
    }
  }

  editarDetalle(index: number) {
    this.activoFijoEditIndex = index;
    const detalle = this.detallesActivoFijo[index];
    this.lineaTempActivoFijo = { ...detalle, subservicio: detalle.codigo } as any;
    this.SeleccionaSubServicioAF = detalle.codigo;
    this.modoEdicionActivoFijo = true;
    this.modalAbiertoActivoFijo = true;
  }

  async eliminarDetalle(index: number) {
    const detalle = this.detallesActivoFijo[index];
    if (detalle.id) await this.dexieService.deleteDetalleRequerimiento(detalle.id);
    this.detallesActivoFijo.splice(index, 1);
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  async guardar() {
    if (!this.maestras.fundoSeleccionado) {
      this.alertService.showAlert('Atención', 'Debes seleccionar un Fundo antes de guardar.', 'warning');
      return;
    }
    if (!this.glosaActivoFijo) {
      this.alertService.showAlert('Atención', 'Debes ingresar una glosa antes de guardar.', 'warning');
      return;
    }
    try {
      this.alertService.mostrarModalCarga();
      const almacenObj = this.maestras.almacenes.find((a) => a.idalmacen == this.maestras.almacenSeleccionado);
      const idAlmacenSync = almacenObj ? almacenObj.idalmacen : '';
      const idreq = this.maestras.usuario.ruc + idAlmacenSync + this.maestras.usuario.documentoidentidad + this.utilsService.formatoAnioMesDiaHoraMinSec();
      const reqAF: RequerimientoActivoFijo = {
        idrequerimiento: this.modoEdicionActivoFijo ? this.requerimientoActivoFijo.idrequerimiento : idreq,
        fecha: new Date().toISOString(),
        proveedor: '',
        servicio: this.SeleccionaServicioAF,
        descripcion: this.SeleccionaSubServicioAF,
        almacen: almacenObj?.almacen || '',
        glosa: this.glosaActivoFijo,
        tipo: 'ACTIVOFIJO',
        itemtipo: this.itemTipoSeleccionado,
        ruc: this.maestras.usuario.ruc,
        estados: 'PENDIENTE',
        prioridad: this.SeleccionaPrioridadACTIVOFIJO ?? '1',
        idfundo: this.maestras.fundoSeleccionado,
        idarea: this.maestras.areaSeleccionada,
        idclasificacion: this.maestras.clasificacionSeleccionado || 'ACT',
        nrodocumento: this.maestras.usuario.documentoidentidad,
        idalmacen: idAlmacenSync,
        idalmacendestino: '',
        idproyecto: this.maestras.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,
        disabled: false,
        checked: false,
        eliminado: 0,
        detalleActivoFijo: [...this.detallesActivoFijo],
      };
      if (this.modoEdicionActivoFijo) {
        await this.dexieService.detallesActivoFijo.where('idrequerimiento').equals(reqAF.idrequerimiento).delete();
        await this.dexieService.requerimientosActivoFijo.where('idrequerimiento').equals(reqAF.idrequerimiento).delete();
        await this.dexieService.requerimientosActivoFijo.put({ ...reqAF, modificado: 1 } as any);
        const idx = this.requerimientosActivoFijo.findIndex((r) => r.idrequerimiento === reqAF.idrequerimiento);
        if (idx !== -1) this.requerimientosActivoFijo[idx] = { ...reqAF };
        this.modoEdicionActivoFijo = false;
      } else {
        await this.dexieService.requerimientosActivoFijo.put(reqAF);
        this.requerimientosActivoFijo.push({ ...reqAF });
      }
      for (const d of this.detallesActivoFijo) {
        await this.dexieService.detallesActivoFijo.put({ ...d, idrequerimiento: reqAF.idrequerimiento });
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
      this.alertService.showAlert('Éxito', 'Requerimiento Activo Fijo guardado correctamente.', 'success');
      this.detallesActivoFijo = [];
      this.mostrarFormularioActivoFijo = false;
      this.SeleccionaServicioAF = '';
      this.activoFijoEditIndex = -1;
    } catch (e) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Hubo un problema al guardar el Requerimiento de Activo Fijo.', 'error');
    }
  }

  cancelar() {
    const confirmar = confirm('¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.');
    if (!confirmar) return;
    this.mostrarFormularioActivoFijo = false;
  }

  async sincronizarPendientes() {
    const pendientes = await this.dexieService.requerimientosActivoFijo
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
      idarea: req.idarea, idclasificacion: req.idclasificacion || 'ACT', prioridad: req.prioridad || '1',
      nrodocumento: this.maestras.usuario.documentoidentidad, idalmacen: req.idalmacen,
      idalmacendestino: '', glosa: req.glosa || '', referenciaGasto: '', eliminado: 0,
      tipo: req.tipo, itemtipo: req.itemtipo, estados: 'PENDIENTE',
      detalle: (req.detalleActivoFijo || []).map((d: any) => ({
        codigo: d.codigo, tipoclasificacion: 'A', cantidad: d.cantidad,
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
        await this.dexieService.requerimientosActivoFijo.where('idrequerimiento').anyOf(idsOk).modify({ estado: 1 });
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

  nuevaLineaActivoFijo(): DetalleRequerimientoActivoFijo {
    return this.emptyDetalle();
  }

  async abrirModal() {
    if (this.activoFijoEditIndex === -1) {
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
      this.lineaTempActivoFijo = {
        ...this.emptyDetalle(),
        proyecto: this.maestras.proyectoSeleccionado ? String((this.maestras.proyectoSeleccionado as any).proyectoio) : '',
        ceco: (this.maestras.cecoSeleccionado as any)?.localname ?? '',
        turno: this.maestras.turnoSeleccionado ?? '',
        labor: (this.maestras.laborSeleccionado as any)?.labor ?? '',
      };
    }
    this.modalAbiertoActivoFijo = true;
  }

  cerrarModal() {
    this.modalAbiertoActivoFijo = false;
    this.activoFijoEditIndex = -1;
  }

  async guardarLinea() {
    const linea = this.lineaTempActivoFijo;
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
    const codigoSub = (linea as any).subservicio || this.SeleccionaSubServicioAF;
    const sub = this.maestras.subservicioFiltradosAF.find((s) => s.commodity === codigoSub);
    if (!sub) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar un subservicio válido.', 'warning'); return;
    }
    const nuevaLinea = {
      idrequerimiento: '', codigo: sub.commodity, descripcion: sub.descripcionLocal,
      proveedor: linea.proveedor, cantidad: linea.cantidad,
      proyecto: linea.proyecto, ceco: linea.ceco, turno: linea.turno, labor: linea.labor,
      esActivoFijo: linea.esActivoFijo, activoFijo: linea.activoFijo, estado: 0,
    };
    if (this.activoFijoEditIndex >= 0) {
      const idExistente = this.detallesActivoFijo[this.activoFijoEditIndex].id!;
      await this.dexieService.detallesActivoFijo.put({ id: idExistente, ...nuevaLinea });
      this.detallesActivoFijo[this.activoFijoEditIndex] = { id: idExistente, ...nuevaLinea };
    } else {
      const idNuevo = await this.dexieService.detallesActivoFijo.add({ ...nuevaLinea });
      this.detallesActivoFijo.push({ id: idNuevo, ...nuevaLinea });
    }
    this.cerrarModal();
    this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
  }

  onCheckChange(item: any, checked: boolean) {
    item.checked = checked;
    this.dataSelectedActivoFijo = this.requerimientosActivoFijo.filter((r) => r.checked);
    this.verBotones = this.dataSelectedActivoFijo.length > 0;
  }

  async sincronizarRequerimiento() {
    const pendientes = await this.dexieService.requerimientosActivoFijo
      .filter((r) => (r.estado === 0 || (r as any).modificado === 1) && r.estado !== 1).toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert('Información', 'No hay requerimientos pendientes por sincronizar', 'info');
      return;
    }
    const confirmacion = await this.alertService.showConfirm('Confirmación', `¿Desea enviar ${pendientes.length} requerimiento(s) pendiente(s)?`, 'warning');
    if (!confirmacion) return;
    const payload = pendientes.map((req) => ({
      idrequerimiento: req.idrequerimiento, ruc: req.ruc, idfundo: req.idfundo,
      idarea: req.idarea, idclasificacion: 'ACT', servicio: req.servicio,
      nrodocumento: req.nrodocumento, idalmacen: req.idalmacen,
      idalmacendestino: req.idalmacendestino || '', glosa: req.glosa || '',
      eliminado: 0, tipo: req.tipo, estados: 'PENDIENTE', prioridad: req.prioridad || '1',
      detalle: req.detalleActivoFijo?.map((d: any) => ({
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
          await Promise.all(ids.map((id) => this.dexieService.requerimientosActivoFijo.update(id, { estado: 1, modificado: 0 })));
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
    await this.maestras.onServicioAFChange(this.SeleccionaServicioAF);
    this.SeleccionaSubServicioAF = '';
  }

  onTurnoChangeModal(): void {
    this.maestras.turnoSeleccionado = this.lineaTempActivoFijo.turno;
  }

  onCecoChangeModal(): void {
    this.maestras.cecoSeleccionado = this.maestras.cecos.find((c: any) => c.localname === this.lineaTempActivoFijo.ceco) || null;
  }

  onLaborChangeModal(): void {
    this.maestras.laborSeleccionado = this.maestras.labores.find((l: any) => l.labor === this.lineaTempActivoFijo.labor) || null;
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
