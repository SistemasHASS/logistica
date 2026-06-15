import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent } from '../../../../components/dropdown/dropdown.component';
import { ProductSearchCardsComponent } from '../../../../components/product-search-cards/product-search-cards.component';
import { ModalSolicitudItemComponent } from '../modal-solicitud-item/modal-solicitud-item.component';

@Component({
  selector: 'app-modal-detalle-item',
  standalone: true,
  styleUrls: ['../../requerimientos.component.scss'],
  imports: [CommonModule, FormsModule, DropdownComponent, ProductSearchCardsComponent, ModalSolicitudItemComponent],
  templateUrl: './modal-detalle-item.component.html',
})
export class ModalDetalleItemComponent {
  // Visibilidad del modal
  @Input() visible = false;
  // Índice de edición: -1 = nuevo, >= 0 = editando línea existente
  @Input() editIndex = -1;
  // Índice de edición temporal dentro del modal
  @Input() editingTempIndex = -1;
  // Tipo de requerimiento activo (CONSUMO, COMPRA, TRANSFERENCIA)
  @Input() tipoSelecionado = '';
  // Datos del formulario de línea temporal
  @Input() lineaTemp: any = {};
  // Líneas agregadas temporalmente en el modal
  @Input() lineasTemporales: any[] = [];
  // Datos para dropdowns
  @Input() itemsFiltrados: any[] = [];
  @Input() unidadesMedidaFiltradas: any[] = [];
  @Input() turnos: any[] = [];
  @Input() modalCecoData: any[] = [];
  @Input() modalLaborData: any[] = [];
  @Input() modalProyectoData: any[] = [];
  @Input() activosFijosFiltrados: any[] = [];
  @Input() items: any[] = [];
  @Input() stockActualLineaTemp: number | null = null;
  @Input() consultandoStock = false;
  // Estados de campos del modal
  @Input() modalTurnoValue = '';
  @Input() modalTurnoEditable = false;
  @Input() modalTurnoDisabled = false;
  @Input() modalCecoValue = '';
  @Input() modalCecoEditable = false;
  @Input() modalCecoDisabled = false;
  @Input() modalLaborValue = '';
  @Input() modalLaborEditable = false;
  @Input() modalLaborDisabled = false;
  @Input() modalProyectoValue = '';
  @Input() modalProyectoEditable = false;
  @Input() modalProyectoDisabled = false;
  @Input() permitirEditarParametros = false;

  // Eventos emitidos al padre
  @Output() cerrarEvt = new EventEmitter<void>();
  @Output() guardarEdicionEvt = new EventEmitter<void>();
  @Output() registrarTodasEvt = new EventEmitter<void>();
  @Output() insertarLineaEvt = new EventEmitter<void>();
  @Output() editarLineaTemporalEvt = new EventEmitter<number>();
  @Output() eliminarLineaTemporalEvt = new EventEmitter<number>();
  @Output() limpiarFormularioEvt = new EventEmitter<void>();
  @Output() turnoChangeEvt = new EventEmitter<void>();
  @Output() cecoChangeEvt = new EventEmitter<void>();
  @Output() laborChangeEvt = new EventEmitter<void>();
  @Output() productoSelectEvt = new EventEmitter<any>();
  @Output() permitirEditarParametrosChange = new EventEmitter<boolean>();

  modalSolicitudVisible = false;
  textoBusquedaItem = '';

  get itemsEncontrados(): boolean {
    if (!this.textoBusquedaItem || this.textoBusquedaItem.trim().length < 2) return true;
    const q = this.textoBusquedaItem.trim().toLowerCase();
    return this.itemsFiltrados.some(
      (i: any) =>
        i.descripcion?.toLowerCase().includes(q) ||
        i.codigo?.toLowerCase().includes(q)
    );
  }

  abrirSolicitudItem(): void {
    this.modalSolicitudVisible = true;
  }

  cerrarSolicitudItem(): void {
    this.modalSolicitudVisible = false;
  }

  // Cierra el modal
  cerrar() {
    this.cerrarEvt.emit();
  }

  // Guarda la edición de una línea existente
  guardarEdicion() {
    this.guardarEdicionEvt.emit();
  }

  // Registra todas las líneas temporales como detalles
  registrarTodas() {
    this.registrarTodasEvt.emit();
  }

  // Inserta una línea en la tabla temporal del modal
  insertarLineaEnTabla() {
    this.insertarLineaEvt.emit();
  }

  // Edita una línea temporal por índice
  editarLineaTemporal(i: number) {
    this.editarLineaTemporalEvt.emit(i);
  }

  // Elimina una línea temporal por índice
  eliminarLineaTemporal(i: number) {
    this.eliminarLineaTemporalEvt.emit(i);
  }

  // Limpia el formulario del modal
  limpiarFormulario() {
    this.limpiarFormularioEvt.emit();
  }

  // Notifica cambio de turno
  onTurnoChange() {
    this.turnoChangeEvt.emit();
  }

  // Notifica cambio de CECO
  onCecoChange() {
    this.cecoChangeEvt.emit();
  }

  // Notifica cambio de labor
  onLaborChange() {
    this.laborChangeEvt.emit();
  }

  // Notifica selección de producto
  onProductoSelect(event: any) {
    this.productoSelectEvt.emit(event);
  }

  // Obtiene la descripción de un producto dado su objeto o código
  obtenerDescripcionProducto(producto: any): string {
    if (!producto) return '';
    if (producto.descripcion) return producto.descripcion;
    if (typeof producto === 'string' || producto.codigo) {
      const codigo = typeof producto === 'string' ? producto : producto.codigo;
      const encontrado = this.items?.find((item: any) => item.codigo === codigo);
      return encontrado ? encontrado.descripcion : '';
    }
    return '';
  }
}
