import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './services/notification.service';
import { ModalService } from './services/modal.service';
import { NotificacionApiService } from './services/notificacion-api.service';

@Component({
  selector: 'app-test-notifications',
  template: `
    <div style="position: fixed; bottom: 20px; left: 20px; z-index: 9999; background: #f8f9fa; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <h6>Test Notificaciones</h6>
      <button class="btn btn-sm btn-success me-2" (click)="testSuccess()">Success</button>
      <button class="btn btn-sm btn-info me-2" (click)="testInfo()">Info</button>
      <button class="btn btn-sm btn-warning me-2" (click)="testWarning()">Warning</button>
      <button class="btn btn-sm btn-danger me-2" (click)="testError()">Error</button>
      <button class="btn btn-sm btn-primary me-2" (click)="testStock()">Stock</button>
      <button class="btn btn-sm btn-secondary me-2" (click)="testModal()">Modal</button>
      <button class="btn btn-sm btn-outline-primary me-2" (click)="testInsertNotificacion()">Insert BD</button>
      <button class="btn btn-sm btn-outline-info me-2" (click)="testListNotificaciones()">Listar BD</button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule]
})
export class TestNotificationsComponent {
  constructor(
    private notificationService: NotificationService,
    private modalService: ModalService,
    private notificacionApi: NotificacionApiService
  ) {}

  testSuccess() {
    this.notificationService.success('Éxito', 'Esta es una notificación de éxito');
  }

  testInfo() {
    this.notificationService.info('Información', 'Esta es una notificación informativa');
  }

  testWarning() {
    this.notificationService.warning('Advertencia', 'Esta es una notificación de advertencia', 8000);
  }

  testError() {
    this.notificationService.error('Error', 'Esta es una notificación de error');
  }

  testStock() {
    this.notificationService.stockDisponible('000018', '6 SOLENOIDS 12-50 V DC');
  }

  testModal() {
    this.modalService.show({
      titulo: 'Mensaje de Prueba',
      mensaje: 'Este es un modal de prueba para verificar que funciona correctamente.',
      tipo: 'info'
    });
  }

  async testInsertNotificacion() {
    try {
      const exito = await this.notificacionApi.insertarNotificacionStock({
        iditem: '000018',
        itemDescripcion: '6 SOLENOIDS 12-50 V DC',
        mensaje: 'Este item ahora tiene stock disponible y puede ser despachado.',
        idrequerimiento: 12345
      });
      
      if (exito) {
        this.notificationService.success('BD', 'Notificación insertada en la base de datos');
      } else {
        this.notificationService.error('BD', 'Error al insertar notificación');
      }
    } catch (error) {
      console.error('Error:', error);
      this.notificationService.error('BD', 'Error al conectar con la API');
    }
  }

  async testListNotificaciones() {
    try {
      const notificaciones = await this.notificacionApi.listarMisNotificaciones();
      console.log('Notificaciones:', notificaciones);
      
      this.notificationService.info(
        'BD', 
        `Hay ${notificaciones.length} notificaciones en la base de datos`
      );
    } catch (error) {
      console.error('Error:', error);
      this.notificationService.error('BD', 'Error al obtener notificaciones');
    }
  }
}
