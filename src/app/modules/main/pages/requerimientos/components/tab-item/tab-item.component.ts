import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownComponent } from '../../../../components/dropdown/dropdown.component';
import { ModalDetalleItemComponent } from '../modal-detalle-item/modal-detalle-item.component';
import { ModalCargaMasivaComponent } from '../modal-carga-masiva/modal-carga-masiva.component';
import { RequerimientosItemService } from '../../services/requerimientos-item.service';
import { RequerimientosMaestrasService } from '../../services/requerimientos-maestras.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

@Component({
  selector: 'app-tab-item',
  standalone: true,
  styleUrls: ['../../requerimientos.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    TableModule,
    DropdownComponent,
    ModalDetalleItemComponent,
    ModalCargaMasivaComponent,
    NumeroRequerimientoPipe,
  ],
  templateUrl: './tab-item.component.html',
})
export class TabItemComponent {
  readonly itemSvc = inject(RequerimientosItemService);
  readonly maestrasSvc = inject(RequerimientosMaestrasService);
  private readonly utils = inject(UtilsService);

  // ─── @Input únicamente para datos que el padre gestiona centralmente ─────
  @Input() requerimientos: any[] = [];
  @Input() loading = false;
  @Input() sinenviar = 0;
  @Input() enviados = 0;
  @Input() modoItemPrincipal = false;
  @Input() verBotones = false;
  @Input() dataSelected: any[] = [];
  get sincronizando() { return this.maestrasSvc.sincronizando; }
  get progreso() { return this.maestrasSvc.progreso; }
  get mostrarFormulario() { return this.itemSvc.mostrarFormulario; }
  get modoEdicion() { return this.itemSvc.modoEdicion; }
  @Input() TipoSelecionado = '';
  get requerimiento() { return this.itemSvc.requerimiento; }
  @Input() SeleccionaPrioridadITEM = '';
  get opcionesPrioridadITEM() { return this.itemSvc.opcionesPrioridadITEM; }
  @Input() almacenSeleccionado: any = null;
  @Input() almacenes: any[] = [];
  @Input() almacenOrigen: any = null;
  @Input() almacenDestino: any = null;
  @Input() alamcenesDestino: any[] = [];
  get glosa() { return this.itemSvc.glosa; }
  get detalles() { return this.itemSvc.detalles; }
  get modalAbierto() { return this.itemSvc.modalAbierto; }
  get editIndex() { return this.itemSvc.editIndex; }
  get editingTempIndex() { return this.itemSvc.editingTempIndex; }
  get lineaTemp() { return this.itemSvc.lineaTemp; }
  get lineasTemporales() { return this.itemSvc.lineasTemporales; }
  @Input() itemsFiltrados: any[] = [];
  // unidadesMedidaFiltradas viene del maestrasSvc para reflejar cambios al seleccionar producto
  get unidadesMedidaFiltradas() { return this.maestrasSvc.unidadesMedidaFiltradas; }
  @Input() turnos: any[] = [];
  // modalCecoData/LaborData/ProyectoData: en edición usan los filtrados del service; si vacíos, todo
  get modalCecoData() {
    if (this.itemSvc.enModoEdicion)
      return this.itemSvc.filteredCecosModal.length > 0 ? this.itemSvc.filteredCecosModal : this.maestrasSvc.cecos;
    return this.itemSvc.permitirEditarParametros ? this.itemSvc.filteredCecosModal : this.maestrasSvc.cecos;
  }
  get modalLaborData() {
    if (this.itemSvc.enModoEdicion)
      return this.itemSvc.filteredLaboresModal.length > 0 ? this.itemSvc.filteredLaboresModal : this.maestrasSvc.labores;
    return this.itemSvc.permitirEditarParametros
      ? (this.itemSvc.filteredLaboresModal.length > 0 ? this.itemSvc.filteredLaboresModal : this.maestrasSvc.labores)
      : this.maestrasSvc.labores;
  }
  get modalProyectoData() {
    if (this.itemSvc.enModoEdicion)
      return this.itemSvc.filteredProyectosModal.length > 0 ? this.itemSvc.filteredProyectosModal : this.maestrasSvc.proyectos;
    return this.itemSvc.permitirEditarParametros ? this.itemSvc.filteredProyectosModal : this.maestrasSvc.proyectos;
  }
  @Input() activosFijosFiltrados: any[] = [];
  @Input() items: any[] = [];
  // Valores del modal leídos desde lineaTemp del servicio
  get modalTurnoValue() { return this.itemSvc.lineaTemp?.turno || ''; }
  get modalTurnoEditable() { return this.itemSvc.enModoEdicion ? true : this.itemSvc.permitirEditarParametros; }
  get modalTurnoDisabled() { return this.itemSvc.enModoEdicion ? false : !this.itemSvc.permitirEditarParametros; }
  get modalCecoValue() { return this.itemSvc.lineaTemp?.ceco || ''; }
  get modalCecoEditable() { return this.itemSvc.enModoEdicion ? true : this.itemSvc.permitirEditarParametros; }
  get modalCecoDisabled() { return this.itemSvc.enModoEdicion ? false : !this.itemSvc.permitirEditarParametros; }
  get modalLaborValue() { return this.itemSvc.lineaTemp?.labor || ''; }
  get modalLaborEditable() { return this.itemSvc.enModoEdicion ? true : this.itemSvc.permitirEditarParametros; }
  get modalLaborDisabled() { return this.itemSvc.enModoEdicion ? false : !this.itemSvc.permitirEditarParametros; }
  get modalProyectoValue() { return this.itemSvc.lineaTemp?.proyecto || ''; }
  get modalProyectoEditable() { return this.itemSvc.enModoEdicion ? true : this.itemSvc.permitirEditarParametros; }
  get modalProyectoDisabled() { return this.itemSvc.enModoEdicion ? false : !this.itemSvc.permitirEditarParametros; }
  get permitirEditarParametros() { return this.itemSvc.permitirEditarParametros; }
  @Input() modalVisible = false;
  @Input() lineasPreview: any[] = [];
  @Input() tieneErroresExcel = false;
  @Input() puedeGuardar = false;
  @Input() turnosParaCarga: any[] = [];

  // ─── @Output: acciones que necesitan sincronizar estado en el padre ─────
  @Output() tipoChange = new EventEmitter<string>();
  @Output() prioridadChange = new EventEmitter<string>();
  @Output() almacenChange = new EventEmitter<string>();
  @Output() almacenOrigenChange = new EventEmitter<string>();
  @Output() almacenDestinoChange = new EventEmitter<string>();
  @Output() glosaChange = new EventEmitter<string>();
  @Output() guardarEvt = new EventEmitter<void>();
  @Output() guardarEdicionEvt = new EventEmitter<void>();
  @Output() cancelarEvt = new EventEmitter<void>();
  @Output() nuevoEvt = new EventEmitter<void>();
  @Output() tipoChangeEvt = new EventEmitter<void>();
  @Output() excelUploadEvt = new EventEmitter<Event>();
  @Output() editarEvt = new EventEmitter<number>();
  @Output() copiarEvt = new EventEmitter<number>();
  @Output() eliminarEvt = new EventEmitter<number>();
  @Output() editarSelectEvt = new EventEmitter<any[]>();
  @Output() copiarSelectEvt = new EventEmitter<any[]>();
  @Output() eliminarSelectEvt = new EventEmitter<any[]>();
  @Output() checkChangeEvt = new EventEmitter<{event: any; row: any}>();
  @Output() sincronizarEvt = new EventEmitter<void>();

  // ─── Grupo B: acciones que notifican al padre ─────────────────────────────
  guardar() { this.guardarEvt.emit(); }
  guardarEdicion() { this.guardarEdicionEvt.emit(); }
  cancelar() { this.itemSvc.mostrarFormulario = false; this.cancelarEvt.emit(); }
  nuevoRequerimiento() { this.itemSvc.mostrarFormulario = true; this.nuevoEvt.emit(); }
  onTipoChange() { this.tipoChangeEvt.emit(); }
  onExcelUpload(event: any) { this.excelUploadEvt.emit(event); }
  editarRequerimiento(i: number) { this.editarEvt.emit(i); }
  copiarRequerimiento(i: number) { this.copiarEvt.emit(i); }
  eliminarRequerimiento(i: number) { this.eliminarEvt.emit(i); }
  editarRequerimientoSelect(data: any[]) { this.editarSelectEvt.emit(data); }
  copiarRequerimientoSelect(data: any[]) { this.copiarSelectEvt.emit(data); }
  eliminarRequerimientoSelect(data: any[]) { this.eliminarSelectEvt.emit(data); }
  onCheckChange(e: any, item: any) { this.checkChangeEvt.emit({event: e, row: item}); }
  sincronizarPendientes() { this.sincronizarEvt.emit(); }

  // ─── Grupo A: llaman directo al servicio ─────────────────────────────────
  abrirModal() { this.itemSvc.abrirModal(); }
  cerrarModal() { this.itemSvc.cerrarModal(); }
  guardarEdicionLinea() { this.itemSvc.guardarEdicionLinea(); }
  registrarTodasLasLineas() { this.itemSvc.registrarTodasLasLineas(); }
  insertarLineaEnTabla() { this.itemSvc.insertarLineaEnTabla(); }
  editarLineaTemporal(i: number) { this.itemSvc.editarLineaTemporal(i); }
  eliminarLineaTemporal(i: number) { this.itemSvc.eliminarLineaTemporal(i); }
  limpiarFormularioModal() { this.itemSvc.limpiarFormularioModal(); }
  onTurnoChangeModal() { this.itemSvc.onTurnoChangeModal(); }
  onCecoChangeModal() { this.itemSvc.onCecoChangeModal(); }
  onLaborChangeModal() { this.itemSvc.onLaborChangeModal(); }
  actualizarUnidadMedidaDesdeProducto() { this.itemSvc.actualizarUnidadMedidaDesdeProducto(); }
  editarLinea(i: number) { this.itemSvc.editarLinea(i); }
  copiarLinea(i: number) { this.itemSvc.copiarLinea(i); }
  eliminarLinea(i: number) { this.itemSvc.eliminarLinea(i); }
  guardarDetalleMasivo() { this.itemSvc.guardarDetalleMasivo(this.lineasPreview, this.puedeGuardar); }
  validarFila(row: any) { this.itemSvc.validarFilaSimple(row, this.lineasPreview, this.activosFijosFiltrados); }
  scrollLeft() { this.itemSvc.scrollLeft?.(); }
  scrollRight() { this.itemSvc.scrollRight?.(); }

  // ─── Handlers ngModelChange ───────────────────────────────────────────────
  onItemtipoChange(val: string) { if (this.requerimiento) this.requerimiento.itemtipo = val; this.tipoChange.emit(val); this.onTipoChange(); }
  onPrioridadChange(val: string) { this.prioridadChange.emit(val); }
  onAlmacenChange(val: string) { this.almacenChange.emit(val); }
  onAlmacenOrigenChange(val: string) { this.almacenOrigenChange.emit(val); }
  onAlmacenDestinoChange(val: string) { this.almacenDestinoChange.emit(val); }
  onGlosaChange(val: string) { this.glosaChange.emit(val); }

  // ─── Helpers de display (via maestrasSvc) ────────────────────────────────
  obtenerIdReq(id: any): string { return this.maestrasSvc.obtenerIdReq(id); }
  getDescripcionFundo(id: any): string { return this.maestrasSvc.getDescripcionFundo(id); }
  getDescripcionArea(id: any): string { return this.maestrasSvc.getDescripcionArea(id); }
  getNombreAlmacen(id: any): string { return this.maestrasSvc.getNombreAlmacen(id); }
  mostrarAlmacenDestino(c: any): string { return this.maestrasSvc.mostrarAlmacenDestino(c); }
  esEnviado(c: any): boolean { return this.maestrasSvc.esEnviado(c); }
  formatoFecha(fecha: any): string { return this.maestrasSvc.formatoFecha(fecha); }
}
