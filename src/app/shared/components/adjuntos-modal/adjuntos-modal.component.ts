import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudCompraAdjunto, SolicitudServicioAdjunto } from '@/app/shared/interfaces/Tables';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import Swal from 'sweetalert2';

type AdjuntoGenerico = SolicitudCompraAdjunto | SolicitudServicioAdjunto;

@Component({
  selector: 'app-adjuntos-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TableModule,
    TooltipModule,
    ButtonModule
  ],
  templateUrl: './adjuntos-modal.component.html',
  styleUrls: ['./adjuntos-modal.component.scss']
})
export class AdjuntosModalComponent {
  @Input() visible: boolean = false;
  @Input() titulo: string = 'Gestión de Archivos Adjuntos';
  @Input() tipoSolicitud: 'compra' | 'servicio' = 'compra';
  @Input() adjuntos: AdjuntoGenerico[] = [];
  @Input() maxFileSizeMB: number = 10;
  @Input() soloLectura: boolean = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() adjuntosChange = new EventEmitter<AdjuntoGenerico[]>();
  @Output() onConfirmClick = new EventEmitter<AdjuntoGenerico[]>();
  @Output() onCancelClick = new EventEmitter<void>();

  // Vista previa
  showPreview: boolean = false;
  previewUrl: string = '';
  previewFileName: string = '';

  // Configuración de formatos permitidos
  private formatosCompra = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  private formatosServicio = [
    ...this.formatosCompra,
    'application/zip',
    'application/x-rar-compressed',
    'application/x-zip-compressed'
  ];

  get allowedTypes(): string[] {
    return this.tipoSolicitud === 'servicio' ? this.formatosServicio : this.formatosCompra;
  }

  get acceptedFormats(): string {
    if (this.tipoSolicitud === 'servicio') {
      return '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar';
    }
    return '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
  }

  get formatosPermitidos(): string {
    if (this.tipoSolicitud === 'servicio') {
      return 'PDF, Word, Excel, Imágenes, ZIP, RAR';
    }
    return 'PDF, Word, Excel, Imágenes';
  }

  get maxFileSize(): number {
    return this.maxFileSizeMB * 1024 * 1024;
  }

  /**
   * Maneja la selección de archivos
   */
  onFileSelected(event: any): void {
    if (this.soloLectura) {
      Swal.fire({
        icon: 'warning',
        title: 'Modo solo lectura',
        text: 'No se pueden agregar archivos en modo solo lectura',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    const files: FileList = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }

    let archivosAgregados = 0;
    let archivosRechazados = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar tipo de archivo
      if (!this.allowedTypes.includes(file.type)) {
        archivosRechazados++;
        Swal.fire({
          icon: 'warning',
          title: 'Tipo no permitido',
          text: `${file.name}: tipo de archivo no permitido`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        continue;
      }

      // Validar tamaño
      if (file.size > this.maxFileSize) {
        archivosRechazados++;
        Swal.fire({
          icon: 'warning',
          title: 'Archivo muy grande',
          text: `${file.name}: excede ${this.maxFileSizeMB}MB`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        continue;
      }

      // Validar duplicados
      const existe = this.adjuntos.find(a => a.nombreArchivo === file.name);
      if (existe) {
        archivosRechazados++;
        Swal.fire({
          icon: 'info',
          title: 'Archivo duplicado',
          text: `${file.name} ya está en la lista`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        continue;
      }

      // Crear objeto adjunto
      const adjunto: any = {
        nombreArchivo: file.name,
        rutaArchivo: '',
        tipoArchivo: file.type,
        tamanoArchivo: file.size,
        descripcion: '',
        file: file,
        activo: true
      };

      this.adjuntos.push(adjunto);
      archivosAgregados++;
    }

    // Limpiar input
    event.target.value = '';

    // Emitir cambios
    this.adjuntosChange.emit(this.adjuntos);

    // Mostrar resumen
    if (archivosAgregados > 0) {
      Swal.fire({
        icon: 'success',
        title: 'Archivos agregados',
        text: `Se agregaron ${archivosAgregados} archivo(s)`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    }
  }

  /**
   * Elimina un adjunto de la lista
   */
  eliminarAdjunto(index: number): void {
    if (this.soloLectura) {
      return;
    }

    const adjunto = this.adjuntos[index];
    
    Swal.fire({
      title: '¿Eliminar archivo?',
      text: `¿Está seguro de eliminar "${adjunto.nombreArchivo}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adjuntos.splice(index, 1);
        this.adjuntosChange.emit(this.adjuntos);
        
        Swal.fire({
          icon: 'success',
          title: 'Archivo eliminado',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  }

  /**
   * Limpia todos los adjuntos
   */
  limpiarTodos(): void {
    if (this.soloLectura) {
      return;
    }

    Swal.fire({
      title: '¿Limpiar todos los archivos?',
      text: `Se eliminarán ${this.adjuntos.length} archivo(s)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adjuntos = [];
        this.adjuntosChange.emit(this.adjuntos);
        
        Swal.fire({
          icon: 'success',
          title: 'Archivos eliminados',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  }

  /**
   * Descarga un archivo adjunto
   */
  descargarAdjunto(adjunto: AdjuntoGenerico): void {
    if (!adjunto.rutaArchivo) {
      return;
    }

    const link = document.createElement('a');
    link.href = adjunto.rutaArchivo;
    link.download = adjunto.nombreArchivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Descargando...',
      text: adjunto.nombreArchivo,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
  }

  /**
   * Previsualiza un archivo (solo imágenes)
   */
  previsualizarArchivo(adjunto: AdjuntoGenerico): void {
    if (!adjunto.file) {
      return;
    }

    const file = adjunto.file;
    
    // Solo previsualizar imágenes
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'info',
        title: 'Vista previa no disponible',
        text: 'Solo se pueden previsualizar imágenes',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
      this.previewFileName = adjunto.nombreArchivo;
      this.showPreview = true;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Obtiene el ícono según el tipo de archivo
   */
  getFileIcon(tipoArchivo?: string): string {
    if (!tipoArchivo) return 'pi pi-file text-secondary';
    
    if (tipoArchivo.includes('pdf')) return 'pi pi-file-pdf text-danger';
    if (tipoArchivo.includes('word')) return 'pi pi-file-word text-primary';
    if (tipoArchivo.includes('excel') || tipoArchivo.includes('sheet')) 
      return 'pi pi-file-excel text-success';
    if (tipoArchivo.includes('image')) return 'pi pi-image text-info';
    if (tipoArchivo.includes('zip') || tipoArchivo.includes('rar')) 
      return 'pi pi-folder text-warning';
    
    return 'pi pi-file text-secondary';
  }

  /**
   * Obtiene la extensión del archivo
   */
  getFileExtension(nombreArchivo: string): string {
    const parts = nombreArchivo.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'N/A';
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtiene el tamaño total de todos los archivos
   */
  getTotalSize(): string {
    const total = this.adjuntos.reduce((sum, adj) => sum + (adj.tamanoArchivo || 0), 0);
    return this.formatFileSize(total);
  }

  /**
   * Confirma y cierra el modal
   */
  onConfirm(): void {
    this.onConfirmClick.emit(this.adjuntos);
    this.visible = false;
    this.visibleChange.emit(false);
  }

  /**
   * Cancela y cierra el modal
   */
  onCancel(): void {
    this.onCancelClick.emit();
    this.visible = false;
    this.visibleChange.emit(false);
  }

  /**
   * Cierra el modal
   */
  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
