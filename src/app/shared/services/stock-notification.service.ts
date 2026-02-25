import { Injectable } from '@angular/core';
import { DexieService } from '../dixiedb/dexie-db.service';
import { NotificationService } from './notification.service';
import { interval, switchMap, startWith } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockNotificationService {
  private readonly API_URL = `${environment.baseUrl}/api/logistica`;
  private readonly CHECK_INTERVAL = 60000; // Verificar cada minuto
  private usuarioActual: any = null;
  private ultimaVerificacion: Date = new Date();

  constructor(
    private dexieService: DexieService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) {
    // Iniciar monitoreo periódico
    this.iniciarMonitoreo();
  }

  /**
   * Inicia el monitoreo periódico de notificaciones de stock
   */
  private async iniciarMonitoreo() {
    // Cargar usuario actual
    await this.cargarUsuario();

    if (!this.usuarioActual) {
      console.warn('No hay usuario logueado, no se puede monitorear notificaciones');
      return;
    }

    // Verificar notificaciones cada minuto
    interval(this.CHECK_INTERVAL).pipe(
      startWith(0),
      switchMap(async () => {
        await this.verificarNotificacionesStock();
        return true;
      })
    ).subscribe();
  }

  /**
   * Carga el usuario actual desde Dexie
   */
  private async cargarUsuario() {
    try {
      this.usuarioActual = await this.dexieService.showUsuario();
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  }

  /**
   * Verifica si hay nuevas notificaciones de stock disponibles
   */
  private async verificarNotificacionesStock() {
    // Recargar usuario actual por si ha cambiado
    await this.cargarUsuario();
    
    if (!this.usuarioActual) {
      console.warn('No hay usuario logueado, no se pueden verificar notificaciones');
      return;
    }

    try {
      // Llamar al API para obtener notificaciones no leídas
      const response = await this.http.post<any>(
        `${this.API_URL}/listar-mis-notificaciones`,
        { dni: this.usuarioActual.documentoidentidad }
      ).toPromise();

      console.log('🔔 Verificando notificaciones para usuario:', this.usuarioActual.documentoidentidad);

      if (response?.resultado) {
        const notificaciones = JSON.parse(response.resultado);
        console.log('🔔 Notificaciones recibidas:', notificaciones);
        
        // Filtrar notificaciones que ya fueron notificadas (stock disponible)
        const notificacionesNuevas = notificaciones.filter((n: any) => 
          n.notificado && 
          new Date(n.fecha_notificacion) > this.ultimaVerificacion
        );

        console.log('🔔 Notificaciones nuevas:', notificacionesNuevas);

        // Mostrar notificaciones flotantes
        for (const notif of notificacionesNuevas) {
          this.notificationService.stockDisponible(
            notif.iditem,
            notif.itemDescripcion
          );
        }

        // Actualizar última verificación
        if (notificacionesNuevas.length > 0) {
          this.ultimaVerificacion = new Date();
        }
      }
    } catch (error) {
      console.error('Error verificando notificaciones de stock:', error);
    }
  }

  /**
   * Notifica manualmente que hay stock disponible para ciertos items
   * Este método se llama cuando se actualiza el stock en el sistema
   */
  async notificarStockDisponible(itemsActualizados: { codigo: string; descripcion: string }[]) {
    if (!this.usuarioActual || itemsActualizados.length === 0) return;

    try {
      // Llamar al API para notificar stock disponible
      await this.http.post(`${this.API_URL}/notificar-stock-disponible`, {
        items: itemsActualizados.map(item => item.codigo)
      }).toPromise();

      // Mostrar notificaciones flotantes para cada item
      itemsActualizados.forEach(item => {
        this.notificationService.stockDisponible(
          item.codigo,
          item.descripcion
        );
      });
    } catch (error) {
      console.error('Error notificando stock disponible:', error);
    }
  }

  /**
   * Fuerza una verificación inmediata de notificaciones
   */
  async verificarAhora() {
    await this.verificarNotificacionesStock();
  }

  /**
   * Recarga el usuario actual (llamar cuando se cambia de usuario)
   */
  async recargarUsuario() {
    const usuarioAnterior = this.usuarioActual?.documentoidentidad;
    await this.cargarUsuario();
    const usuarioNuevo = this.usuarioActual?.documentoidentidad;
    
    if (usuarioAnterior !== usuarioNuevo) {
      console.log(`🔄 Cambio de usuario detectado: ${usuarioAnterior} → ${usuarioNuevo}`);
      this.ultimaVerificacion = new Date(); // Resetear última verificación
      await this.verificarAhora(); // Verificar notificaciones del nuevo usuario
    }
  }
}
