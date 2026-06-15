import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { NotificacionApiService, NotificacionDB } from '@/app/shared/services/notificacion-api.service';
import { NotificationService } from '@/app/shared/services/notification.service';
import { Router, RouterModule } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Component({
  selector: 'app-notificaciones-lista',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, RouterModule],
  templateUrl: './notificaciones-lista.component.html',
  styleUrls: ['./notificaciones-lista.component.scss']
})
export class NotificacionesListaComponent implements OnInit {
  notificaciones: NotificacionDB[] = [];
  loading = false;
  totalNoLeidas = 0;
  usuario: any = null;

  constructor(
    private notificacionApi: NotificacionApiService,
    private notificationService: NotificationService,
    private dexieService: DexieService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarNotificaciones();
  }

  async cargarUsuario() {
    this.usuario = await this.dexieService.showUsuario();
  }

  async cargarNotificaciones() {
    this.loading = true;
    try {
      // Si el usuario es OPLOGIST, mostrar ambas tablas de notificaciones
      if (this.usuario?.idrol === 'OPLOGIST') {
        console.log('🔔 Usuario OPLOGIST - Cargando notificaciones de ambas tablas');
        this.notificaciones = await this.notificacionApi.listarTodasMisNotificaciones(false);
      } else {
        // Para otros roles, mostrar solo notificaciones directas
        console.log('🔔 Usuario normal - Cargando notificaciones directas');
        this.notificaciones = await this.notificacionApi.listarMisNotificaciones();
      }
      
      this.totalNoLeidas = this.notificaciones.filter(n => !n.leida).length;
      console.log(`📊 Total notificaciones: ${this.notificaciones.length}, No leídas: ${this.totalNoLeidas}`);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      this.loading = false;
    }
  }

  async marcarComoLeida(notificacion: NotificacionDB) {
    if (notificacion.leida) return;

    const exito = await this.notificacionApi.marcarComoLeida(notificacion.id_notificacion);
    if (exito) {
      notificacion.leida = true;
      notificacion.fecha_lectura = new Date().toISOString();
      this.totalNoLeidas--;
      this.notificationService.info('Notificación leída', 'La notificación ha sido marcada como leída');
    }
  }

  async marcarTodasComoLeidas() {
    const noLeidas = this.notificaciones.filter(n => !n.leida);
    
    for (const notificacion of noLeidas) {
      await this.marcarComoLeida(notificacion);
    }
  }

  getTipoNotificacionIcon(tipo: string): string {
    switch (tipo) {
      case 'STOCK_DISPONIBLE':    return 'bx bx-check-circle icono-exito';
      case 'SALDO_PENDIENTE':     return 'bx bx-error icono-advertencia';
      case 'SOLICITUD_ITEM_NUEVO': return 'bx bx-plus-circle icono-informativo';
      default:                    return 'bx bx-info-circle icono-informativo';
    }
  }

  getClaseTipoNotificacion(tipo: string): string {
    switch (tipo) {
      case 'STOCK_DISPONIBLE':    return 'estado-confirmado';
      case 'SALDO_PENDIENTE':     return 'estado-pendiente';
      case 'SOLICITUD_ITEM_NUEVO': return 'estado-solicitud';
      default:                    return 'estado-informativo';
    }
  }

  getTipoNotificacionLabel(tipo: string): string {
    switch (tipo) {
      case 'STOCK_DISPONIBLE':    return 'Stock Disponible';
      case 'SALDO_PENDIENTE':     return 'Saldo Pendiente';
      case 'SOLICITUD_ITEM_NUEVO': return 'Solicitud Nuevo Ítem';
      default:                    return tipo;
    }
  }

  esSolicitudItem(notificacion: NotificacionDB): boolean {
    return notificacion.tipo_notificacion === 'SOLICITUD_ITEM_NUEVO';
  }

  irAMaestroItems(notificacion: NotificacionDB): void {
    const nombre = notificacion.itemDescripcion ?? '';
    this.router.navigate(['/main/maestros/items'], {
      queryParams: { precargar: nombre }
    });
  }
}
