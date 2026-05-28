import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-carga-masiva',
  standalone: true,
  styleUrls: ['../../requerimientos.component.scss'],
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-carga-masiva.component.html',
})
export class ModalCargaMasivaComponent {
  // Visibilidad del modal
  @Input() visible = false;
  // Líneas del Excel procesadas para preview
  @Input() lineasPreview: any[] = [];
  // Indica si hay errores de validación en el Excel cargado (controlado por padre)
  @Input() tieneErroresExcel = false;
  // Habilita el botón de guardar si todas las filas son válidas (controlado por padre)
  @Input() puedeGuardar = false;
  // Lista de turnos disponibles para corrección en tabla
  @Input() turnos: any[] = [];
  // Lista de activos fijos para corrección en tabla
  @Input() activosFijosFiltrados: any[] = [];
  // Tipo de requerimiento (COMPRA/CONSUMO/TRANSFERENCIA) para determinar campos requeridos
  @Input() tipoRequerimiento: string = '';

  // Eventos emitidos al padre
  @Output() cerrarEvt = new EventEmitter<void>();
  @Output() guardarEvt = new EventEmitter<void>();
  @Output() validarFilaEvt = new EventEmitter<any>();
  @Output() lineasCambiadasEvt = new EventEmitter<any[]>();

  // Cierra el modal sin guardar
  cerrar() {
    this.cerrarEvt.emit();
  }

  // Guarda los detalles cargados masivamente
  guardar() {
    this.guardarEvt.emit();
  }

  // Emite la fila al padre para que la revalide
  onValidarFila(row: any) {
    this.validarFilaEvt.emit(row);
  }

  // Retorna true si la fila tiene error en el campo indicado
  tieneError(row: any, campo: string): boolean {
    return row.error && Array.isArray(row.errores) && row.errores.some((e: any) => e.columna === campo);
  }

  // Retorna el mensaje de error para la columna indicada
  getMensajeError(row: any, campo: string): string {
    if (!Array.isArray(row.errores)) return '';
    const err = row.errores.find((e: any) => e.columna === campo);
    return err?.mensaje ?? '';
  }

  // Retorna true si la fila tiene algún error
  filaConError(row: any): boolean {
    return !!row.error;
  }

  // Cuenta las filas sin errores
  contarSinError(): number {
    return this.lineasPreview.filter(r => !r.error).length;
  }

  // Cuenta las filas con errores
  contarConError(): number {
    return this.lineasPreview.filter(r => r.error).length;
  }

  // Retorna true si debe mostrar columna Turno (solo para CONSUMO)
  mostrarColumnaTurno(): boolean {
    return this.tipoRequerimiento === 'CONSUMO';
  }

  // Elimina una fila por índice y emite líneas modificadas al padre
  eliminarFila(index: number) {
    const nuevasLineas = [...this.lineasPreview];
    nuevasLineas.splice(index, 1);
    this.lineasCambiadasEvt.emit(nuevasLineas);
  }

  // Elimina todas las filas con error y emite líneas modificadas al padre
  eliminarFilasConError() {
    const nuevasLineas = this.lineasPreview.filter(r => !r.error);
    this.lineasCambiadasEvt.emit(nuevasLineas);
  }
}
