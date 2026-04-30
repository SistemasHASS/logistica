import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownComponent } from '../../../../components/dropdown/dropdown.component';
import { ModalDetalleActivoMenorComponent } from '../modal-detalle-activo-menor/modal-detalle-activo-menor.component';
import { RequerimientosActivoMenorService } from '../../services/requerimientos-activo-menor.service';
import { RequerimientosMaestrasService } from '../../services/requerimientos-maestras.service';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

@Component({
  selector: 'app-tab-activo-menor',
  standalone: true,
  styleUrls: ['../../requerimientos.component.scss'],
  imports: [CommonModule, FormsModule, DatePipe, TableModule, DropdownComponent, ModalDetalleActivoMenorComponent, NumeroRequerimientoPipe],
  templateUrl: './tab-activo-menor.component.html',
})
export class TabActivoMenorComponent {
  readonly activoMenorSvc = inject(RequerimientosActivoMenorService);
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

  // Datos de requerimientos del tab ACTIVO FIJO MENOR
  @Input() requerimientosActivoFijoMenor: any[] = [];
  @Input() loading = false;
  @Input() sienvinarActivoFijoMenor = 0;
  @Input() enviadosActivoFijoMenor = 0;
  @Input() modoItemPrincipal = false;
  @Input() verBotonesActivoFijoMenor = false;
  @Input() dataSelectedActivoFijoMenor: any[] = [];
  get sincronizando() { return this.maestrasSvc.sincronizando; }
  get progreso() { return this.maestrasSvc.progreso; }

  // Formulario cabecera ACTIVO FIJO MENOR (leídos del servicio)
  @Input() TipoSelecionado = '';
  get mostrarFormularioActivoFijoMenor() { return this.activoMenorSvc.mostrarFormularioActivoFijoMenor; }
  get modoEdicionActivoFijoMenor() { return this.activoMenorSvc.modoEdicionActivoFijoMenor; }
  get requerimientoActivoFijoMenor() { return this.activoMenorSvc.requerimientoActivoFijoMenor; }
  @Input() SeleccionaPrioridadActivoFijoMenor = '';
  get opcionesPrioridadActivoFijoMenor() { return this.activoMenorSvc.opcionesPrioridadACTIVOFIJOMENOR; }
  private _servicioActivoFijoMenor: any = null;
  @Input() set servicioActivoFijoMenor(v: any) { 
    this._servicioActivoFijoMenor = v; 
    this.activoMenorSvc.SeleccionaServicioAFMenor = v;
  }
  get servicioActivoFijoMenor(): any { return this._servicioActivoFijoMenor; }
  @Input() serviciosActivoFijoMenor: any[] = [];
  @Input() subservicioFiltradosAFMenor: any[] = [];
  get glosaActivoFijoMenor() { return this.activoMenorSvc.glosaActivoFijoMenor; }
  get detallesActivoFijoMenor() { return this.activoMenorSvc.detallesActivoFijoMenor; }
  @Input() activosFijosServicioFiltrados: any[] = [];

  // Datos del modal detalle ACTIVO FIJO MENOR (leídos del servicio)
  get modalAbiertoActivoFijoMenor() { return this.activoMenorSvc.modalAbiertoActivoFijoMenor; }
  get lineaTempActivoFijoMenor() { return this.activoMenorSvc.lineaTempActivoFijoMenor; }
  @Input() turnos: any[] = [];
  @Input() modalCecoData: any[] = [];
  @Input() modalLaborData: any[] = [];
  @Input() modalProyectoData: any[] = [];
  // Valores del modal leídos desde lineaTempActivoFijoMenor del servicio
  get modalTurnoValue() { return this.activoMenorSvc.lineaTempActivoFijoMenor?.turno || ''; }
  @Input() modalTurnoEditable = false;
  @Input() modalTurnoDisabled = false;
  get modalCecoValue() { return this.activoMenorSvc.lineaTempActivoFijoMenor?.ceco || ''; }
  @Input() modalCecoEditable = false;
  @Input() modalCecoDisabled = false;
  get modalLaborValue() { return this.activoMenorSvc.lineaTempActivoFijoMenor?.labor || ''; }
  @Input() modalLaborEditable = false;
  @Input() modalLaborDisabled = false;
  get modalProyectoValue() { return this.activoMenorSvc.lineaTempActivoFijoMenor?.proyecto || ''; }
  @Input() modalProyectoEditable = false;
  @Input() modalProyectoDisabled = false;

  // ─── Grupo B: acciones que notifican al padre ─────────────────────────────
  editarActivoFijoMenor(i: number) { this.editarEvt.emit(i); }
  eliminarActivoFijoMenor(i: number) { this.eliminarEvt.emit(i); }
  nuevoActivoFijoMenor() { this.activoMenorSvc.mostrarFormularioActivoFijoMenor = true; this.nuevoEvt.emit(); }
  sincronizarActivoFijoMenor() { this.sincronizarEvt.emit(); }
  editarActivoFijoMenorSelect(data: any[]) { this.editarSelectEvt.emit(data); }
  eliminarActivoFijoMenorSelect(data: any[]) { this.eliminarSelectEvt.emit(data); }
  onCheckChangeActivoFijoMenor(e: any, item: any) { this.checkChangeEvt.emit({event: e, row: item}); }
  onServicioAFMenorChange(val: any) { this._servicioActivoFijoMenor = val; this.activoMenorSvc.SeleccionaServicioAFMenor = val; this.servicioChange.emit(val); this.activoMenorSvc.onServicioChange(); }
  guardarActivoFijoMenor() { this.guardarEvt.emit(); }
  cancelarActivoFijoMenor() { this.activoMenorSvc.mostrarFormularioActivoFijoMenor = false; this.cancelarEvt.emit(); }

  // ─── Grupo A: llaman directo al servicio ─────────────────────────────────
  abrirModalActivoFijoMenor() { this.activoMenorSvc.abrirModal(); }
  cerrarModalActivoFijoMenor() { this.activoMenorSvc.cerrarModal(); }
  guardarLineaActivoFijoMenor() { this.activoMenorSvc.guardarLinea(); }
  editarLineaActivoFijoMenor(i: number) { this.activoMenorSvc.editarLinea(i); }
  eliminarLineaActivoFijoMenor(i: number) { this.activoMenorSvc.eliminarLinea(i); }
  onTurnoChangeAFM() { this.activoMenorSvc.onTurnoChangeModal(); }
  onCecoChangeAFM() { this.activoMenorSvc.onCecoChangeModal(); }
  onLaborChangeAFM() { this.activoMenorSvc.onLaborChangeModal(); }
  scrollLeft() { this.activoMenorSvc.scrollLeft?.(); }
  scrollRight() { this.activoMenorSvc.scrollRight?.(); }

  // ─── Helpers de display (via maestrasSvc) ────────────────────────────────
  getDescripcionFundo(id: any): string { return this.maestrasSvc.getDescripcionFundo(id); }
  getDescripcionArea(id: any): string { return this.maestrasSvc.getDescripcionArea(id); }
  obtenerDescripcionServicio(s: any): string { return this.maestrasSvc.obtenerDescripcionServicioAFM(typeof s === 'string' ? s : s?.servicio ?? s); }
  obtenerIdReq(id: any): string { return this.maestrasSvc.obtenerIdReq(id); }
  formatoFecha(fecha: any): string { return this.maestrasSvc.formatoFecha(fecha); }
}
