import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent } from '../../../../components/dropdown/dropdown.component';

@Component({
  selector: 'app-modal-detalle-activo-fijo',
  standalone: true,
  styleUrls: ['../../requerimientos.component.scss'],
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './modal-detalle-activo-fijo.component.html',
})
export class ModalDetalleActivoFijoComponent {
  // Visibilidad del modal
  @Input() visible = false;
  @Input() modoEdicion = false;
  // Línea temporal del formulario de detalle ACTIVO FIJO
  @Input() lineaTempActivoFijo: any = {};
  // Datos para dropdowns
  @Input() subservicioFiltradosAF: any[] = [];
  @Input() turnos: any[] = [];
  @Input() modalCecoData: any[] = [];
  @Input() modalLaborData: any[] = [];
  @Input() modalProyectoData: any[] = [];
  @Input() activosFijosServicioFiltrados: any[] = [];
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

  // Eventos emitidos al padre
  @Output() cerrarEvt = new EventEmitter<void>();
  @Output() guardarEvt = new EventEmitter<void>();
  @Output() turnoChangeEvt = new EventEmitter<void>();
  @Output() cecoChangeEvt = new EventEmitter<void>();
  @Output() laborChangeEvt = new EventEmitter<void>();

  // Cierra el modal sin guardar
  cerrar() { this.cerrarEvt.emit(); }

  // Guarda la línea de detalle ACTIVO FIJO
  guardar() { this.guardarEvt.emit(); }

  // Notifica cambio de turno
  onTurnoChange() { this.turnoChangeEvt.emit(); }

  // Notifica cambio de CECO
  onCecoChange() { this.cecoChangeEvt.emit(); }

  // Notifica cambio de labor
  onLaborChange() { this.laborChangeEvt.emit(); }
}
