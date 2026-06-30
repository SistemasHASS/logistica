import { Component, Input, Output, EventEmitter, inject, ViewChild, ElementRef } from '@angular/core';
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
import { SolicitudCompraAdjunto } from '@/app/shared/interfaces/Tables';

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
  get stockActualLineaTemp() { return this.itemSvc.stockActualLineaTemp; }
  get consultandoStock() { return this.itemSvc.consultandoStock; }
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
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @Input() turnosParaCarga: any[] = [];

  get requerimientosFiltrados(): any[] {
    if (!this.TipoSelecionado) return this.requerimientos;
    return this.requerimientos.filter((r: any) => r.itemtipo === this.TipoSelecionado);
  }

  // ─── Bulk-load state (managed entirely in this component) ────────────────
  modalVisible = false;
  lineasPreview: any[] = [];
  tieneErroresExcel = false;
  puedeGuardar = false;

  // ─── Sub-tab state (Detalles / Adjuntar Archivos) ─────────────────────
  subTabActivo: 'detalles' | 'adjuntos' = 'detalles';
  adjuntosCompra: SolicitudCompraAdjunto[] = [];
  @ViewChild('adjuntoInput') adjuntoInputRef!: ElementRef<HTMLInputElement>;

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
  @Output() cargaMasivaGuardadaEvt = new EventEmitter<void>();
  @Output() editarEvt = new EventEmitter<number>();
  @Output() copiarEvt = new EventEmitter<number>();
  @Output() eliminarEvt = new EventEmitter<number>();
  @Output() editarSelectEvt = new EventEmitter<any[]>();
  @Output() copiarSelectEvt = new EventEmitter<any[]>();
  @Output() eliminarSelectEvt = new EventEmitter<any[]>();
  @Output() checkChangeEvt = new EventEmitter<{event: any; row: any}>();
  @Output() sincronizarEvt = new EventEmitter<void>();
  @Output() areaDetectadaEvt = new EventEmitter<string>();

  // ─── Grupo B: acciones que notifican al padre ─────────────────────────────
  guardar() { this.guardarEvt.emit(); }
  guardarEdicion() { this.guardarEdicionEvt.emit(); }
  cancelar() { this.itemSvc.mostrarFormulario = false; this.cancelarEvt.emit(); }
  nuevoRequerimiento() { this.itemSvc.mostrarFormulario = true; this.nuevoEvt.emit(); }
  onTipoChange() { this.tipoChangeEvt.emit(); }
  resetFileInput() { if (this.fileInputRef?.nativeElement) this.fileInputRef.nativeElement.value = ''; }

  descargarPlantilla() {
    if (this.TipoSelecionado === 'COMPRA') {
      this.itemSvc.descargarPlantillaCompra();
    } else if (this.TipoSelecionado === 'CONSUMO') {
      this.itemSvc.descargarPlantillaConsumo();
    }
  }

  async onExcelUpload(event: any) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    this.resetFileInput();
    if (this.TipoSelecionado === 'COMPRA') {
      const result = await this.itemSvc.cargarExcelCompra(file);
      this.lineasPreview = result.lineasPreview;
      this.tieneErroresExcel = result.tieneErrores;
      this.puedeGuardar = result.puedeGuardar;
      if (result.idAreaDetectada) {
        this.areaDetectadaEvt.emit(result.idAreaDetectada);
      } else if (result.areaDetectada) {
        this.itemSvc.alertarAreaNoEncontrada(result.areaDetectada);
      }
    } else {
      const result = await this.itemSvc.cargarExcel(file, this.activosFijosFiltrados);
      this.lineasPreview = result.lineasPreview;
      this.tieneErroresExcel = result.tieneErrores;
      this.puedeGuardar = result.puedeGuardar;
    }
    this.modalVisible = true;
  }
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
  guardarDetalleMasivo() {
    const result = this.itemSvc.guardarDetalleMasivo(this.lineasPreview, this.puedeGuardar);
    if (result !== null) {
      this.modalVisible = false;
      this.lineasPreview = [];
      this.resetFileInput();
      this.cargaMasivaGuardadaEvt.emit();
    }
  }
  validarFila(row: any) {
    this.itemSvc.validarFilaSimple(row, this.lineasPreview, this.activosFijosFiltrados);
    this.tieneErroresExcel = this.lineasPreview.some((r: any) => r.errores.length > 0);
    this.puedeGuardar = !this.lineasPreview.some((r: any) => r.error);
  }
  onLineasCambiadas(nuevasLineas: any[]) {
    this.lineasPreview = nuevasLineas;
    this.tieneErroresExcel = this.lineasPreview.some((r: any) => r.errores.length > 0);
    this.puedeGuardar = this.lineasPreview.length > 0 && !this.lineasPreview.some((r: any) => r.error);
  }
  cerrarModalCargaMasiva() {
    this.modalVisible = false;
    this.lineasPreview = [];
    this.tieneErroresExcel = false;
    this.puedeGuardar = false;
    this.resetFileInput();
  }
  scrollLeft() { this.itemSvc.scrollLeft?.(); }
  scrollRight() { this.itemSvc.scrollRight?.(); }

  // ─── Adjuntos COMPRA ─────────────────────────────────────────────────────
  onAdjuntoSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;
    const permitidos = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/jpg'];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!permitidos.includes(file.type)) continue;
      if (file.size > 10 * 1024 * 1024) continue;
      if (this.adjuntosCompra.find(a => a.nombreArchivo === file.name)) continue;
      this.adjuntosCompra.push({
        nombreArchivo: file.name,
        rutaArchivo: '',
        tipoArchivo: file.type,
        tamanoArchivo: file.size,
        descripcion: '',
        file: file,
        activo: true,
      });
    }
    event.target.value = '';
  }

  eliminarAdjunto(i: number): void {
    this.adjuntosCompra.splice(i, 1);
  }

  formatAdjuntoSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getAdjuntoIcon(tipo?: string): string {
    if (!tipo) return 'bi bi-file-earmark';
    if (tipo.includes('pdf')) return 'bi bi-file-earmark-pdf text-danger';
    if (tipo.includes('word')) return 'bi bi-file-earmark-word text-primary';
    if (tipo.includes('excel') || tipo.includes('sheet')) return 'bi bi-file-earmark-excel text-success';
    if (tipo.includes('image')) return 'bi bi-file-earmark-image text-info';
    return 'bi bi-file-earmark';
  }

  limpiarAdjuntos(): void {
    this.adjuntosCompra = [];
  }

  // ─── Handlers ngModelChange ───────────────────────────────────────────────
  onItemtipoChange(val: string) { if (this.requerimiento) this.requerimiento.itemtipo = val; this.tipoChange.emit(val); this.onTipoChange(); this.subTabActivo = 'detalles'; this.limpiarAdjuntos(); }
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
