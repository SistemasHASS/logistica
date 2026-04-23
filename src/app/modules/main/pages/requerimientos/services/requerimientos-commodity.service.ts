import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { PrioridadRequerimientoService } from '@/app/shared/services/prioridad-requerimiento.service';
import { RequerimientoCommodity, DetalleRequerimientoCommodity } from '@/app/shared/interfaces/Tables';
import { PrioridadSpring } from '@/app/shared/interfaces/PrioridadRequerimiento';
import { RequerimientosMaestrasService } from './requerimientos-maestras.service';

@Injectable({ providedIn: 'root' })
export class RequerimientosCommodityService {

  requerimientosCommodity: RequerimientoCommodity[] = [];
  requerimientoCommodity: RequerimientoCommodity = this.emptyReq();
  detallesCommodity: DetalleRequerimientoCommodity[] = [];
  lineaTempCommodity: DetalleRequerimientoCommodity = this.emptyDetalle();

  mostrarFormularioCommodity = false;
  modoEdicionCommodity = false;
  commodityEditIndex = -1;
  modalAbiertoCommodity = false;

  sinenviarCommodity = 0;
  enviadosCommodity = 0;

  glosaCommodity = '';
  seleccionaProveedor = '';
  SeleccionaServicio = '';
  SeleccionaSubServicio = '';
  SeleccionaPrioridadCOMMODITY: PrioridadSpring | '' = '';
  opcionesPrioridadCOMMODITY: { value: PrioridadSpring; label: string; descripcion: string }[] = [];

  verBotones = false;
  dataSelectedCommodity: any[] = [];

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private utilsService: UtilsService,
    private requerimientosService: RequerimientosService,
    private aprobacionesAreaService: AprobacionesAreaService,
    public prioridadService: PrioridadRequerimientoService,
    private maestras: RequerimientosMaestrasService,
  ) {}

  private emptyReq(): RequerimientoCommodity {
    return {
      idrequerimiento: '', fecha: '', proveedor: '', servicio: '', descripcion: '',
      almacen: '', glosa: '', tipo: '', ruc: '', estados: 'PENDIENTE', idfundo: '',
      idarea: '', idclasificacion: '', prioridad: '', nrodocumento: '', idalmacen: '',
      idalmacendestino: '', idproyecto: '', estado: 0, disabled: false, checked: false,
      eliminado: 0, detalleCommodity: [],
    };
  }

  private emptyDetalle(): DetalleRequerimientoCommodity {
    return {
      idrequerimiento: '', codigo: '', descripcion: '', proveedor: '', cantidad: 0,
      proyecto: '', ceco: '', turno: '', labor: '', esActivoFijo: false, activoFijo: '', estado: 0,
    };
  }

  async cargar() {
    const todos = await this.dexieService.showRequerimientoCommodity();
    this.requerimientosCommodity = todos.filter(
      (r: any) => r.nrodocumento === this.maestras.usuario?.documentoidentidad,
    );
    this.ordenar();
    this.contarContadores();
  }

  ordenar() {
    this.requerimientosCommodity.sort((a, b) => {
      if (a.estado !== b.estado) return a.estado - b.estado;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  contarContadores() {
    this.sinenviarCommodity = this.requerimientosCommodity.filter((r) => r.estado === 0).length;
    this.enviadosCommodity = this.requerimientosCommodity.filter((r) => r.estado === 1).length;
  }

  async nuevo() {
    this.requerimientoCommodity = this.emptyReq();
    this.detallesCommodity = [];
    this.glosaCommodity = await this.maestras.generarGlosaAutomatica();
    this.mostrarFormularioCommodity = true;
    this.modoEdicionCommodity = false;
    this.opcionesPrioridadCOMMODITY = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.SeleccionaPrioridadCOMMODITY = '1';
    if (this.maestras.configuracion?.idalmacen) {
      this.maestras.almacenSeleccionado = this.maestras.configuracion.idalmacen;
    }
  }

  editar(index: number) {
    const req = this.requerimientosCommodity[index];
    if (!req) return;
    this.mostrarFormularioCommodity = true;
    this.modoEdicionCommodity = true;
    this.commodityEditIndex = index;
    this.opcionesPrioridadCOMMODITY = this.prioridadService.obtenerOpcionesPrioridad('COMPRA');
    this.requerimientoCommodity = { ...req };
    this.detallesCommodity = req.detalleCommodity?.length ? req.detalleCommodity : (req as any).detalle || [];
    this.maestras.fundoSeleccionado = req.idfundo;
    this.maestras.areaSeleccionada = req.idarea;
    this.maestras.almacenSeleccionado = req.idalmacen;
    this.maestras.clasificacionSeleccionado = req.idclasificacion;
    this.SeleccionaPrioridadCOMMODITY = req.prioridad as PrioridadSpring | '';
    const proyectoObj = this.maestras.proyectos.find((p) => p.idproyecto === req.idproyecto);
    this.maestras.proyectoSeleccionado = proyectoObj || null;
    this.seleccionaProveedor = req.proveedor;
    this.SeleccionaServicio = req.servicio;
    this.glosaCommodity = req.glosa;
    this.modalAbiertoCommodity = false;
  }

  async eliminar(index: number) {
    const confirmacion = await this.alertService.showConfirm('Confirmación', '¿Desea eliminar este requerimiento?', 'warning');
    if (!confirmacion) return;
    try {
      const req = this.requerimientosCommodity[index];
      await this.dexieService.detallesCommodity.where('idrequerimiento').equals(req.idrequerimiento).delete();
      await this.dexieService.deleteRequerimientoCommodity(req.idrequerimiento);
      this.requerimientosCommodity.splice(index, 1);
      this.contarContadores();
      this.ordenar();
      this.alertService.showAlert('Éxito', 'Requerimiento eliminado correctamente.', 'success');
    } catch (error) {
      this.alertService.showAlert('Error', 'Ocurrió un error al eliminar el requerimiento.', 'error');
    }
  }

  async guardar() {
    if (!this.maestras.fundoSeleccionado) {
      this.alertService.showAlert('Atención', 'Debes seleccionar un Fundo antes de guardar.', 'warning');
      return;
    }
    if (!this.glosaCommodity) {
      this.alertService.showAlert('Atención', 'Debes ingresar una glosa antes de guardar.', 'warning');
      return;
    }
    try {
      this.alertService.mostrarModalCarga();
      const almacenObj = this.maestras.almacenes.find((a) => a.idalmacen == this.maestras.almacenSeleccionado);
      const idAlmacenSync = almacenObj ? almacenObj.idalmacen : '';
      const idreq = this.maestras.usuario.ruc + idAlmacenSync + this.maestras.usuario.documentoidentidad + this.utilsService.formatoAnioMesDiaHoraMinSec();
      const reqCommodity: RequerimientoCommodity = {
        idrequerimiento: this.modoEdicionCommodity ? this.requerimientoCommodity.idrequerimiento : idreq,
        ruc: this.maestras.usuario.ruc,
        idfundo: this.maestras.fundoSeleccionado,
        idarea: this.maestras.areaSeleccionada,
        idclasificacion: this.maestras.clasificacionSeleccionado,
        prioridad: this.SeleccionaPrioridadCOMMODITY ?? '1',
        nrodocumento: this.maestras.usuario.documentoidentidad,
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
        idproyecto: this.maestras.proyectoSeleccionado?.proyectoio ?? '',
        estado: 0,
        checked: false,
        disabled: false,
        eliminado: 0,
        detalleCommodity: [...this.detallesCommodity],
      };
      if (this.modoEdicionCommodity) {
        await this.dexieService.detallesCommodity.where('idrequerimiento').equals(reqCommodity.idrequerimiento).delete();
        await this.dexieService.requerimientosCommodity.where('idrequerimiento').equals(reqCommodity.idrequerimiento).delete();
        await this.dexieService.requerimientosCommodity.put({ ...reqCommodity, modificado: 1 } as any);
        const idx = this.requerimientosCommodity.findIndex((r) => r.idrequerimiento === reqCommodity.idrequerimiento);
        if (idx !== -1) this.requerimientosCommodity[idx] = { ...reqCommodity };
        this.modoEdicionCommodity = false;
      } else {
        await this.dexieService.requerimientosCommodity.put(reqCommodity);
        this.requerimientosCommodity.push({ ...reqCommodity });
      }
      for (const d of this.detallesCommodity) {
        await this.dexieService.detallesCommodity.put({ ...d, idrequerimiento: reqCommodity.idrequerimiento });
      }
      try {
        if (reqCommodity.idarea) {
          await this.aprobacionesAreaService.registrarRequerimiento({
            ruc: reqCommodity.ruc, idrequerimiento: reqCommodity.idrequerimiento,
            idarea: Number(reqCommodity.idarea), tipoRequerimiento: 'SERVICIO',
            descripcion: reqCommodity.glosa, usuarioSolicitud: this.maestras.usuario.documentoidentidad,
            glosa: reqCommodity.glosa, monto: 0,
          }).toPromise();
          await this.aprobacionesAreaService.asignarAprobadoresRequerimiento({
            ruc: reqCommodity.ruc, idrequerimiento: reqCommodity.idrequerimiento,
            idarea: Number(reqCommodity.idarea), tipoRequerimiento: 'SERVICIO',
            usuarioSolicitud: this.maestras.usuario.documentoidentidad,
          }).toPromise();
        }
      } catch { }
      this.alertService.cerrarModalCarga();
      this.contarContadores();
      this.ordenar();
      this.alertService.showAlert('Éxito', `Requerimiento de Servicio guardado correctamente.`, 'success');
      this.detallesCommodity = [];
      this.mostrarFormularioCommodity = false;
      this.seleccionaProveedor = '';
      this.SeleccionaServicio = '';
      this.commodityEditIndex = -1;
    } catch (e) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un problema al guardar el Requerimiento de Servicio.', 'error');
    }
  }

  cancelar() {
    const confirmar = confirm('¿Seguro que deseas cancelar los cambios? Se perderán los datos no guardados.');
    if (!confirmar) return;
    this.mostrarFormularioCommodity = false;
  }

  async sincronizarPendientes() {
    const pendientes = await this.dexieService.requerimientosCommodity
      .filter((r) => (r.estado === 0 || (r as any).modificado === 1) && r.estado !== 1).toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert('Información', 'No hay requerimientos pendientes por sincronizar', 'info');
      return;
    }
    const confirmar = await this.alertService.showConfirm('Confirmación', `¿Desea enviar ${pendientes.length} requerimiento(s) pendiente(s)?`, 'warning');
    if (!confirmar) return;
    this.maestras.sincronizando = true;
    this.maestras.progreso = 0;
    const payload = pendientes.map((req) => ({
      idrequerimiento: req.idrequerimiento, ruc: req.ruc, idfundo: req.idfundo,
      idarea: req.idarea, idclasificacion: 'SER', servicio: req.servicio,
      nrodocumento: req.nrodocumento, idalmacen: req.idalmacen, idalmacendestino: req.idalmacendestino || '',
      glosa: req.glosa || '', eliminado: 0, tipo: req.tipo, estados: 'PENDIENTE',
      prioridad: req.prioridad || '1',
      detalle: req.detalleCommodity?.map((d: any) => ({
        codigo: d.codigo, tipoclasificacion: 'C', cantidad: d.cantidad,
        iddescripcion: d.descripcion, idproyecto: d.proyecto || '',
        idcentrocosto: d.ceco || '', idturno: d.turno || '', idlabor: d.labor || '', eliminado: 0,
      })) || [],
    }));
    try {
      const resp: any = await firstValueFrom(this.requerimientosService.registrarRequerimientos(payload));
      if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
        this.alertService.showAlert('Éxito', `${pendientes.length} requerimiento(s) sincronizado(s) correctamente`, 'success');
        const idsParaActualizar = pendientes.map((p) => p.id!);
        await Promise.all(idsParaActualizar.map((id) => this.dexieService.requerimientosCommodity.update(id, { estado: 1, modificado: 0 })));
        await this.cargar();
      } else {
        this.alertService.showAlertError('Error', 'Hubo un problema al sincronizar');
      }
    } catch {
      this.alertService.showAlertError('Error', 'No se pudo conectar con el servidor');
    } finally {
      this.maestras.sincronizando = false;
      this.maestras.progreso = 100;
    }
  }

  nuevaLineaCommodity(): DetalleRequerimientoCommodity {
    return this.emptyDetalle();
  }

  editarDetalle(index: number) {
    this.commodityEditIndex = index;
    const detalle = this.detallesCommodity[index];
    this.lineaTempCommodity = { ...detalle, subservicio: detalle.codigo } as any;
    this.SeleccionaSubServicio = detalle.codigo;
    this.modoEdicionCommodity = true;
    this.modalAbiertoCommodity = true;
  }

  async eliminarDetalle(index: number) {
    const detalle = this.detallesCommodity[index];
    const id = detalle.id;
    if (id) {
      await this.dexieService.deleteDetalleCommodity(id);
    }
    this.detallesCommodity.splice(index, 1);
    if (this.requerimientoCommodity) {
      this.requerimientoCommodity.detalleCommodity = [...this.detallesCommodity];
      if (this.requerimientoCommodity.id) {
        await this.dexieService.requerimientosCommodity.update(
          this.requerimientoCommodity.id,
          { detalleCommodity: this.detallesCommodity },
        );
      }
    }
    this.alertService.mostrarInfo('Línea eliminada.');
  }

  async abrirModal() {
    if (this.commodityEditIndex === -1) {
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
      this.lineaTempCommodity = {
        ...this.emptyDetalle(),
        proyecto: this.maestras.proyectoSeleccionado ? String((this.maestras.proyectoSeleccionado as any).proyectoio) : '',
        ceco: (this.maestras.cecoSeleccionado as any)?.localname ?? '',
        turno: this.maestras.turnoSeleccionado ?? '',
        labor: (this.maestras.laborSeleccionado as any)?.labor ?? '',
      };
    }
    this.modalAbiertoCommodity = true;
  }

  cerrarModal() {
    this.modalAbiertoCommodity = false;
    this.commodityEditIndex = -1;
  }

  async guardarLinea() {
    const linea = this.lineaTempCommodity;
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
    const codigoSub = (linea as any).subservicio || this.SeleccionaSubServicio;
    const sub = this.maestras.subservicioFiltrados.find((s) => s.commodity === codigoSub);
    if (!sub) {
      this.alertService.showAlert('Campo requerido', 'Debes seleccionar un subservicio válido.', 'warning'); return;
    }
    const nuevaLinea = {
      idrequerimiento: '', codigo: sub.commodity, descripcion: sub.descripcionLocal,
      proveedor: linea.proveedor, cantidad: linea.cantidad,
      proyecto: linea.proyecto, ceco: linea.ceco, turno: linea.turno, labor: linea.labor,
      esActivoFijo: linea.esActivoFijo, activoFijo: linea.activoFijo, estado: 0,
    };
    if (this.commodityEditIndex >= 0) {
      this.detallesCommodity[this.commodityEditIndex] = { ...nuevaLinea };
    } else {
      this.detallesCommodity.push({ ...nuevaLinea });
    }
    this.cerrarModal();
    this.alertService.showAlert('Éxito', 'Línea guardada correctamente.', 'success');
  }

  onCheckChange(item: any, checked: boolean) {
    item.checked = checked;
    this.dataSelectedCommodity = this.requerimientosCommodity.filter((r) => r.checked);
    this.verBotones = this.dataSelectedCommodity.length > 0;
  }

  editarLinea(i: number) { this.editarDetalle(i); }
  eliminarLinea(i: number) { this.eliminarDetalle(i); }

  copiarLinea(index: number): void {
    const detalleOriginal = this.detallesCommodity[index];
    this.lineaTempCommodity = { ...detalleOriginal, id: undefined };
    this.commodityEditIndex = -1;
    this.modalAbiertoCommodity = true;
    this.alertService.mostrarInfo('Línea copiada. Modifica los campos y guarda.');
  }

  async onServicioChange(): Promise<void> {
    await this.maestras.onServicioChange(this.SeleccionaServicio);
    this.SeleccionaSubServicio = '';
  }

  onTurnoChangeModal(): void {
    this.maestras.turnoSeleccionado = this.lineaTempCommodity.turno;
  }

  onCecoChangeModal(): void {
    this.maestras.cecoSeleccionado = this.maestras.cecos.find((c: any) => c.localname === this.lineaTempCommodity.ceco) || null;
  }

  onLaborChangeModal(): void {
    this.maestras.laborSeleccionado = this.maestras.labores.find((l: any) => l.labor === this.lineaTempCommodity.labor) || null;
  }

  scrollLeft(): void {
    const container = document.querySelector('.tab-buttons-container') as HTMLElement;
    if (container) container.scrollLeft -= 200;
  }

  scrollRight(): void {
    const container = document.querySelector('.tab-buttons-container') as HTMLElement;
    if (container) container.scrollLeft += 200;
  }

  async sincronizarRequerimiento() {
    const pendientes = await this.dexieService.requerimientosCommodity
      .filter((r) => (r.estado === 0 || (r as any).modificado === 1) && r.estado !== 1).toArray();
    if (pendientes.length === 0) {
      this.alertService.showAlert('Información', 'No hay requerimientos pendientes por sincronizar', 'info');
      return;
    }
    const confirmacion = await this.alertService.showConfirm('Confirmación', `¿Desea enviar ${pendientes.length} requerimiento(s) pendiente(s)?`, 'warning');
    if (!confirmacion) return;
    const payload = pendientes.map((req) => ({
      idrequerimiento: req.idrequerimiento, ruc: req.ruc, idfundo: req.idfundo,
      idarea: req.idarea, idclasificacion: 'SER', servicio: req.servicio,
      nrodocumento: req.nrodocumento, idalmacen: req.idalmacen,
      idalmacendestino: req.idalmacendestino || '', glosa: req.glosa || '',
      eliminado: 0, tipo: req.tipo, estados: 'PENDIENTE', prioridad: req.prioridad || '1',
      detalle: req.detalleCommodity?.map((d: any) => ({
        codigo: d.codigo, tipoclasificacion: 'C', cantidad: d.cantidad,
        iddescripcion: d.descripcion, idproyecto: d.proyecto || '',
        idcentrocosto: d.ceco || '', idturno: d.turno || '', idlabor: d.labor || '', eliminado: 0,
      })) || [],
    }));
    this.requerimientosService.registrarRequerimientos(payload).subscribe({
      next: async (resp) => {
        if (Array.isArray(resp) && resp[0]?.errorgeneral === 0) {
          this.alertService.showAlert('Éxito', `${pendientes.length} requerimiento(s) sincronizado(s) correctamente`, 'success');
          const ids = pendientes.map((p) => p.id!);
          await Promise.all(ids.map((id) => this.dexieService.requerimientosCommodity.update(id, { estado: 1, modificado: 0 })));
          await this.cargar();
          this.contarContadores();
        } else {
          this.alertService.showAlert('Error', 'Hubo un problema al sincronizar los requerimientos', 'error');
        }
      },
      error: () => this.alertService.showAlert('Error', 'No se pudo conectar con el servidor', 'error'),
    });
  }
}
