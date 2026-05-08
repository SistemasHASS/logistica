import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownComponent } from '../../../../components/dropdown/dropdown.component';
import { ModalDetalleCommodityComponent } from '../modal-detalle-commodity/modal-detalle-commodity.component';
import { RequerimientosCommodityService } from '../../services/requerimientos-commodity.service';
import { RequerimientosMaestrasService } from '../../services/requerimientos-maestras.service';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

@Component({
  selector: 'app-tab-commodity',
  standalone: true,
  styleUrls: ['../../requerimientos.component.scss'],
  imports: [CommonModule, FormsModule, DatePipe, TableModule, DropdownComponent, ModalDetalleCommodityComponent, NumeroRequerimientoPipe],
  templateUrl: './tab-commodity.component.html',
})
export class TabCommodityComponent {
  readonly commoditySvc = inject(RequerimientosCommodityService);
  readonly maestrasSvc = inject(RequerimientosMaestrasService);

  @Output() prioridadChange = new EventEmitter<string>();
  @Output() glosaChange = new EventEmitter<string>();
  @Output() servicioChange = new EventEmitter<any>();

  @Output() editarEvt = new EventEmitter<number>();
  @Output() eliminarEvt = new EventEmitter<number>();
  @Output() checkChangeEvt = new EventEmitter<{event: any; row: any}>();
  @Output() sincronizarEvt = new EventEmitter<void>();
  @Output() nuevoEvt = new EventEmitter<void>();
  @Output() editarSelectEvt = new EventEmitter<any[]>();
  @Output() eliminarSelectEvt = new EventEmitter<any[]>();
  @Output() guardarEvt = new EventEmitter<void>();
  @Output() guardarEdicionEvt = new EventEmitter<void>();
  @Output() cancelarEvt = new EventEmitter<void>();

  onPrioridadChange(val: string) { this.prioridadChange.emit(val); }
  onGlosaChange(val: string) { this.glosaChange.emit(val); }
  get itemTipoSeleccionado() { return this.commoditySvc.itemTipoSeleccionado; }
  onItemTipoChange(val: 'CONSUMO' | 'COMPRA') { this.commoditySvc.itemTipoSeleccionado = val; }

  // Datos de requerimientos del tab COMMODITY
  @Input() requerimientosCommodity: any[] = [];
  @Input() loading = false;
  @Input() sinenviarCommodity = 0;
  @Input() enviadosCommodity = 0;
  @Input() modoItemPrincipal = false;
  @Input() verBotones = false;
  @Input() dataSelectedCommodity: any[] = [];
  get sincronizando() { return this.maestrasSvc.sincronizando; }
  get progreso() { return this.maestrasSvc.progreso; }

  // Formulario cabecera COMMODITY (leídos del servicio)
  get mostrarFormularioCommodity() { return this.commoditySvc.mostrarFormularioCommodity; }
  @Input() TipoSelecionado = '';
  get modoEdicionCommodity() { return this.commoditySvc.modoEdicionCommodity; }
  get requerimientoCommodity() { return this.commoditySvc.requerimientoCommodity; }
  @Input() SeleccionaPrioridadCommodity = '';
  get opcionesPrioridadCommodity() { return this.commoditySvc.opcionesPrioridadCOMMODITY; }
  private _servicioSeleccionado: any = null;
  @Input() set servicioSeleccionado(v: any) { 
    this._servicioSeleccionado = v; 
    this.commoditySvc.SeleccionaServicio = v;
  }
  get servicioSeleccionado(): any { return this._servicioSeleccionado; }
  @Input() servicios: any[] = [];
  @Input() subservicioFiltrados: any[] = [];
  get glosaCommodity() { return this.commoditySvc.glosaCommodity; }
  get detallesCommodity() { return this.commoditySvc.detallesCommodity; }

  // Datos del modal detalle COMMODITY
  get modalAbiertoCommodity() { return this.commoditySvc.modalAbiertoCommodity; }
  get lineaTempCommodity() { return this.commoditySvc.lineaTempCommodity; }
  @Input() turnos: any[] = [];
  @Input() modalCecoData: any[] = [];
  @Input() modalLaborData: any[] = [];
  @Input() modalProyectoData: any[] = [];
  // Valores del modal leídos desde lineaTempCommodity del servicio
  get modalTurnoValue() { return this.commoditySvc.lineaTempCommodity?.turno || ''; }
  @Input() modalTurnoEditable = false;
  @Input() modalTurnoDisabled = false;
  get modalCecoValue() { return this.commoditySvc.lineaTempCommodity?.ceco || ''; }
  @Input() modalCecoEditable = false;
  @Input() modalCecoDisabled = false;
  get modalLaborValue() { return this.commoditySvc.lineaTempCommodity?.labor || ''; }
  @Input() modalLaborEditable = false;
  @Input() modalLaborDisabled = false;
  get modalProyectoValue() { return this.commoditySvc.lineaTempCommodity?.proyecto || ''; }
  @Input() modalProyectoEditable = false;
  @Input() modalProyectoDisabled = false;

  // ─── Grupo B: acciones que notifican al padre ─────────────────────────────
  editarCommodity(i: number) { this.editarEvt.emit(i); }
  eliminarCommodity(i: number) { this.eliminarEvt.emit(i); }
  onCheckChangeCommodity(e: any, item: any) { this.checkChangeEvt.emit({event: e, row: item}); }
  sincronizarCommodity() { this.sincronizarEvt.emit(); }
  nuevoCommodity() { this.commoditySvc.mostrarFormularioCommodity = true; this.nuevoEvt.emit(); }
  editarCommoditySelect(data: any[]) { this.editarSelectEvt.emit(data); }
  eliminarCommoditySelect(data: any[]) { this.eliminarSelectEvt.emit(data); }
  onServicioChange(val: any) { this._servicioSeleccionado = val; this.commoditySvc.SeleccionaServicio = val; this.servicioChange.emit(val); this.commoditySvc.onServicioChange(); }
  guardarCommodity() { this.guardarEvt.emit(); }
  guardarEdicionCommodity() { this.guardarEdicionEvt.emit(); }
  cancelarCommodity() { this.commoditySvc.mostrarFormularioCommodity = false; this.cancelarEvt.emit(); }

  // ─── Grupo A: llaman directo al servicio ─────────────────────────────────
  abrirModalCommodity() { this.commoditySvc.abrirModal(); }
  cerrarModalCommodity() { this.commoditySvc.cerrarModal(); }
  guardarLineaCommodity() { this.commoditySvc.guardarLinea(); }
  editarLineaCommodity(i: number) { this.commoditySvc.editarLinea(i); }
  eliminarLineaCommodity(i: number) { this.commoditySvc.eliminarLinea(i); }
  copiarLineaCommodity(i: number) { this.commoditySvc.copiarLinea(i); }
  onTurnoChangeCommodity() { this.commoditySvc.onTurnoChangeModal(); }
  onCecoChangeCommodity() { this.commoditySvc.onCecoChangeModal(); }
  onLaborChangeCommodity() { this.commoditySvc.onLaborChangeModal(); }
  scrollLeft() { this.commoditySvc.scrollLeft?.(); }
  scrollRight() { this.commoditySvc.scrollRight?.(); }

  // ─── Helpers de display (via maestrasSvc) ────────────────────────────────
  getDescripcionFundo(id: any): string { return this.maestrasSvc.getDescripcionFundo(id); }
  getDescripcionArea(id: any): string { return this.maestrasSvc.getDescripcionArea(id); }
  obtenerDescripcionServicio(s: any): string { return this.maestrasSvc.obtenerDescripcionServicio(typeof s === 'string' ? s : s?.servicio ?? s); }
  obtenerIdReq(id: any): string { return this.maestrasSvc.obtenerIdReq(id); }
  formatoFecha(fecha: any): string { return this.maestrasSvc.formatoFecha(fecha); }
}
