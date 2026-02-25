import { Injectable } from '@angular/core';
import { NotificationService } from './services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class DebugNotificationsService {
  
  constructor(private notificationService: NotificationService) {}
  
  // Método para probar todas las notificaciones
  probarTodas() {
    console.log('🔔 Iniciando prueba de notificaciones...');
    
    // Success
    setTimeout(() => {
      console.log('✅ Enviando notificación success');
      this.notificationService.success('Prueba Éxito', 'Esta es una prueba de notificación de éxito');
    }, 1000);
    
    // Info
    setTimeout(() => {
      console.log('ℹ️ Enviando notificación info');
      this.notificationService.info('Prueba Info', 'Esta es una prueba de notificación informativa');
    }, 2000);
    
    // Warning
    setTimeout(() => {
      console.log('⚠️ Enviando notificación warning');
      this.notificationService.warning('Prueba Advertencia', 'Esta es una prueba de advertencia', 8000);
    }, 3000);
    
    // Error
    setTimeout(() => {
      console.log('❌ Enviando notificación error');
      this.notificationService.error('Prueba Error', 'Esta es una prueba de notificación de error');
    }, 4000);
    
    // Stock
    setTimeout(() => {
      console.log('📦 Enviando notificación stock');
      this.notificationService.stockDisponible('000018', '6 SOLENOIDS 12-50 V DC');
    }, 5000);
  }
  
  // Verificar estado del servicio
  verificarEstado() {
    console.log('🔍 Verificando estado del servicio de notificaciones...');
    console.log('Servicio:', this.notificationService);
    console.log('Observable:', this.notificationService.notificaciones$);
    
    // Suscribirse para ver las notificaciones en consola
    this.notificationService.notificaciones$.subscribe(notificaciones => {
      console.log('📬 Notificaciones actuales:', notificaciones);
    });
  }
}
