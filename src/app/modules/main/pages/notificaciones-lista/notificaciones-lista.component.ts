import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { NotificacionApiService, NotificacionDB } from '@/app/shared/services/notificacion-api.service';
import { NotificationService } from '@/app/shared/services/notification.service';
import { RouterModule } from '@angular/router';
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
    private dexieService: DexieService
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
      case 'STOCK_DISPONIBLE':
        return 'bx bx-check-circle text-success';
      case 'SALDO_PENDIENTE':
        return 'bx bx-error text-warning';
      default:
        return 'bx bx-info-circle text-info';
    }
  }

  getTipoNotificacionLabel(tipo: string): string {
    switch (tipo) {
      case 'STOCK_DISPONIBLE':
        return 'Stock Disponible';
      case 'SALDO_PENDIENTE':
        return 'Saldo Pendiente';
      default:
        return tipo;
    }
  }
}
