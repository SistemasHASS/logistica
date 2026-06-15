import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificacionApiService } from '@/app/shared/services/notificacion-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-solicitud-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-solicitud-item.component.html',
  styleUrls: ['./modal-solicitud-item.component.scss'],
})
export class ModalSolicitudItemComponent {
  @Input() visible = false;
  @Input() nombreSugerido = '';

  @Output() cerrarEvt = new EventEmitter<void>();
  @Output() enviadoEvt = new EventEmitter<void>();

  private notificacionApi = inject(NotificacionApiService);

  nombre = '';
  descripcion = '';
  unidadMedida = '';
  imagenFile: File | null = null;
  imagenPreview: string | null = null;
  enviando = false;

  unidades = ['UND', 'KG', 'LT', 'MT', 'GL', 'CJA', 'BOL', 'PAR', 'JGO', 'RLL', 'TON', 'M2', 'M3'];

  ngOnChanges(): void {
    if (this.visible) {
      this.nombre = this.nombreSugerido ?? '';
      this.descripcion = '';
      this.unidadMedida = '';
      this.imagenFile = null;
      this.imagenPreview = null;
      this.enviando = false;
    }
  }

  onImagenSeleccionada(event: any): void {
    const file: File = event.target.files?.[0];
    if (!file) return;
    const permitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!permitidos.includes(file.type)) {
      Swal.fire({ icon: 'warning', title: 'Formato no permitido', text: 'Solo JPG, PNG, GIF o WEBP', timer: 2500, showConfirmButton: false });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'Imagen muy grande', text: 'Máximo 5 MB', timer: 2500, showConfirmButton: false });
      return;
    }
    this.imagenFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => { this.imagenPreview = e.target.result; };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  quitarImagen(): void {
    this.imagenFile = null;
    this.imagenPreview = null;
  }

  async enviar(): Promise<void> {
    if (!this.nombre.trim()) {
      Swal.fire({ icon: 'warning', title: 'Nombre requerido', text: 'Ingresa el nombre del ítem', timer: 2500, showConfirmButton: false });
      return;
    }
    if (!this.descripcion.trim()) {
      Swal.fire({ icon: 'warning', title: 'Descripción requerida', text: 'Describe el uso o especificación técnica', timer: 2500, showConfirmButton: false });
      return;
    }

    this.enviando = true;
    try {
      const result = await this.notificacionApi.enviarSolicitudCreacionItem({
        nombreItem:    this.nombre.trim(),
        descripcion:   this.descripcion.trim(),
        unidadMedida:  this.unidadMedida,
        imagen:        this.imagenFile,
      });

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Solicitud enviada!',
          text: 'Se notificó al Jefe de Logística para crear el ítem.',
          timer: 3000,
          showConfirmButton: false,
        });
        this.enviadoEvt.emit();
        this.cerrar();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: result.mensaje });
      }
    } finally {
      this.enviando = false;
    }
  }

  cerrar(): void {
    this.cerrarEvt.emit();
  }
}
