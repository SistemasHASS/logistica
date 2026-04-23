import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownComponent } from '../../../../components/dropdown/dropdown.component';
import { ModalDetalleActivoFijoComponent } from '../modal-detalle-activo-fijo/modal-detalle-activo-fijo.component';
import { RequerimientosActivoFijoService } from '../../services/requerimientos-activo-fijo.service';
import { RequerimientosMaestrasService } from '../../services/requerimientos-maestras.service';

@Component({
  selector: 'app-tab-activo-fijo',
  standalone: true,
  styleUrls: ['../../requerimientos.component.scss'],
  imports: [CommonModule, FormsModule, DatePipe, TableModule, DropdownComponent, ModalDetalleActivoFijoComponent],
  templateUrl: './tab-activo-fijo.component.html',
})
export class TabActivoFijoComponent {
  readonly activoFijoSvc = inject(RequerimientosActivoFijoService);
  readonly maestrasSvc = inject(RequerimientosMaestrasService);

  @Output() prioridadChange = new EventEmitter<string>();
  @Output() glosaChange = new EventEmitter<string>();
  @Output() servicioChange = new EventEmitter<any>();

  @Output() editarEvt = new EventEmitter<number>();
  @Output() eliminarEvt = new EventEmitter<number>();
  @Output() nuevoEvt = new EventEmitter<void>();
  @Output() sincronizarEvt = new EventEmitter<void>();
  @Output() editarSelectEvt = new EventEmitter<any[]>();
  @Output() eliminarSelectEvt = new EventEmitter<any[]>();
  @Output() checkChangeEvt = new EventEmitter<{event: any; row: any}>();
  @Output() guardarEvt = new EventEmitter<void>();
  @Output() cancelarEvt = new EventEmitter<void>();

  onPrioridadChange(val: string) { this.prioridadChange.emit(val); }
  onGlosaChange(val: string) { this.glosaChange.emit(val); }

  // Datos de requerimientos del tab ACTIVO FIJO
  @Input() requerimientosActivoFijo: any[] = [];
  @Input() loading = false;
  @Input() sinenviarActivoFijo = 0;
  @Input() enviadosActivoFijo = 0;
  @Input() modoItemPrincipal = false;
  @Input() verBotones = false;
  @Input() dataSelectedActivoFijo: any[] = [];
  get sincronizando() { return this.maestrasSvc.sincronizando; }
  get progreso() { return this.maestrasSvc.progreso; }

  // Formulario cabecera ACTIVO FIJO (leídos del servicio)
  @Input() TipoSelecionado = '';
  get mostrarFormularioActivoFijo() { return this.activoFijoSvc.mostrarFormularioActivoFijo; }
  get modoEdicionActivoFijo() { return this.activoFijoSvc.modoEdicionActivoFijo; }
  get requerimientoActivoFijo() { return this.activoFijoSvc.requerimientoActivoFijo; }
  @Input() SeleccionaPrioridadActivoFijo = '';
  get opcionesPrioridadActivoFijo() { return this.activoFijoSvc.opcionesPrioridadACTIVOFIJO; }
  private _servicioActivoFijo: any = null;
  @Input() set servicioActivoFijo(v: any) { 
    this._servicioActivoFijo = v; 
    this.activoFijoSvc.SeleccionaServicioAF = v;
  }
  get servicioActivoFijo(): any { return this._servicioActivoFijo; }
  @Input() serviciosActivoFijo: any[] = [];
  @Input() subservicioFiltradosAF: any[] = [];
  get glosaActivoFijo() { return this.activoFijoSvc.glosaActivoFijo; }
  get detallesActivoFijo() { return this.activoFijoSvc.detallesActivoFijo; }
  @Input() activosFijosServicioFiltrados: any[] = [];

  // Datos del modal detalle ACTIVO FIJO (leídos del servicio)
  get modalAbiertoActivoFijo() { return this.activoFijoSvc.modalAbiertoActivoFijo; }
  get lineaTempActivoFijo() { return this.activoFijoSvc.lineaTempActivoFijo; }
  @Input() turnos: any[] = [];
  @Input() modalCecoData: any[] = [];
  @Input() modalLaborData: any[] = [];
  @Input() modalProyectoData: any[] = [];
  // Valores del modal leídos desde lineaTempActivoFijo del servicio
  get modalTurnoValue() { return this.activoFijoSvc.lineaTempActivoFijo?.turno || ''; }
  @Input() modalTurnoEditable = false;
  @Input() modalTurnoDisabled = false;
  get modalCecoValue() { return this.activoFijoSvc.lineaTempActivoFijo?.ceco || ''; }
  @Input() modalCecoEditable = false;
  @Input() modalCecoDisabled = false;
  get modalLaborValue() { return this.activoFijoSvc.lineaTempActivoFijo?.labor || ''; }
  @Input() modalLaborEditable = false;
  @Input() modalLaborDisabled = false;
  get modalProyectoValue() { return this.activoFijoSvc.lineaTempActivoFijo?.proyecto || ''; }
  @Input() modalProyectoEditable = false;
  @Input() modalProyectoDisabled = false;

  // ─── Grupo B: acciones que notifican al padre ─────────────────────────────
  editarActivoFijo(i: number) { this.editarEvt.emit(i); }
  eliminarActivoFijo(i: number) { this.eliminarEvt.emit(i); }
  nuevoActivoFijo() { this.activoFijoSvc.mostrarFormularioActivoFijo = true; this.nuevoEvt.emit(); }
  sincronizarActivoFijo() { this.sincronizarEvt.emit(); }
  editarActivoFijoSelect(data: any[]) { this.editarSelectEvt.emit(data); }
  eliminarActivoFijoSelect(data: any[]) { this.eliminarSelectEvt.emit(data); }
  onCheckChangeActivoFijo(e: any, item: any) { this.checkChangeEvt.emit({event: e, row: item}); }
  onServicioAFChange(val: any) { this._servicioActivoFijo = val; this.activoFijoSvc.SeleccionaServicioAF = val; this.servicioChange.emit(val); this.activoFijoSvc.onServicioChange(); }
  guardarActivoFijo() { this.guardarEvt.emit(); }
  cancelarActivoFijo() { this.activoFijoSvc.mostrarFormularioActivoFijo = false; this.cancelarEvt.emit(); }

  // ─── Grupo A: llaman directo al servicio ─────────────────────────────────
  abrirModalActivoFijo() { this.activoFijoSvc.abrirModal(); }
  cerrarModalActivoFijo() { this.activoFijoSvc.cerrarModal(); }
  guardarLineaActivoFijo() { this.activoFijoSvc.guardarLinea(); }
  editarLineaActivoFijo(i: number) { this.activoFijoSvc.editarLinea(i); }
  eliminarLineaActivoFijo(i: number) { this.activoFijoSvc.eliminarLinea(i); }
  onTurnoChangeAF() { this.activoFijoSvc.onTurnoChangeModal(); }
  onCecoChangeAF() { this.activoFijoSvc.onCecoChangeModal(); }
  onLaborChangeAF() { this.activoFijoSvc.onLaborChangeModal(); }
  scrollLeft() { this.activoFijoSvc.scrollLeft?.(); }
  scrollRight() { this.activoFijoSvc.scrollRight?.(); }

  // ─── Helpers de display (via maestrasSvc) ────────────────────────────────
  getDescripcionFundo(id: any): string { return this.maestrasSvc.getDescripcionFundo(id); }
  getDescripcionArea(id: any): string { return this.maestrasSvc.getDescripcionArea(id); }
  obtenerDescripcionServicio(s: any): string { return this.maestrasSvc.obtenerDescripcionServicioAF(typeof s === 'string' ? s : s?.servicio ?? s); }
  obtenerIdReq(id: any): string { return this.maestrasSvc.obtenerIdReq(id); }
  formatoFecha(fecha: any): string { return this.maestrasSvc.formatoFecha(fecha); }
}
