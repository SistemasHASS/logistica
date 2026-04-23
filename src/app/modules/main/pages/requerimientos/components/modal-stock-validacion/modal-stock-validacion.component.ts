import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-stock-validacion',
  standalone: true,
  styleUrls: ['../../requerimientos.component.scss'],
  imports: [CommonModule],
  templateUrl: './modal-stock-validacion.component.html',
})
export class ModalStockValidacionComponent {
  // Visibilidad del modal
  @Input() visible = false;
  // Lista de items con información de stock para validar
  @Input() itemsStock: any[] = [];

  // Eventos emitidos al padre
  @Output() cerrarEvt = new EventEmitter<void>();
  @Output() confirmarEvt = new EventEmitter<void>();

  // Cierra el modal sin confirmar
  cerrar() {
    this.cerrarEvt.emit();
  }

  // Confirma el ajuste de stock y continúa el guardado
  confirmar() {
    this.confirmarEvt.emit();
  }

  // Retorna la clase CSS según el estado de stock del item
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'SUFICIENTE': return 'badge bg-success';
      case 'PARCIAL':    return 'badge bg-warning text-dark';
      case 'SIN_STOCK':  return 'badge bg-danger';
      default:           return 'badge bg-secondary';
    }
  }

  // Retorna el texto legible según el estado de stock del item
  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'SUFICIENTE': return 'Suficiente';
      case 'PARCIAL':    return 'Parcial';
      case 'SIN_STOCK':  return 'Sin Stock';
      default:           return estado;
    }
  }
}
