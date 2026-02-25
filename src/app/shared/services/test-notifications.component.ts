import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionApiService } from './notificacion-api.service';
import { DexieService } from '../dixiedb/dexie-db.service';

@Component({
  selector: 'app-test-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2>Test de Notificaciones</h2>
      <button class="btn btn-primary me-2" (click)="testDirectas()">Notificaciones Directas</button>
      <button class="btn btn-success me-2" (click)="testStock()">Notificaciones Stock</button>
      <button class="btn btn-warning me-2" (click)="testTodas()">Todas las Notificaciones</button>
      <button class="btn btn-info" (click)="testContador()">Contador No Leídas</button>
      
      <div class="mt-4">
        <h3>Resultados:</h3>
        <pre>{{ resultados | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .btn { margin: 0.25rem; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; max-height: 400px; overflow-y: auto; }
  `]
})
export class TestNotificationsComponent implements OnInit {
  usuario: any = null;
  resultados: any = null;

  constructor(
    private notificacionApi: NotificacionApiService,
    private dexieService: DexieService
  ) {}

  async ngOnInit() {
    this.usuario = await this.dexieService.showUsuario();
    console.log('Usuario actual:', this.usuario);
  }

  async testDirectas() {
    try {
      console.log('🔍 Test: Listar notificaciones directas');
      const notificaciones = await this.notificacionApi.listarMisNotificaciones();
      console.log('Notificaciones directas:', notificaciones);
      this.resultados = {
        tipo: 'Notificaciones Directas (logistica_notificaciones)',
        cantidad: notificaciones.length,
        datos: notificaciones
      };
    } catch (error: any) {
      console.error('Error:', error);
      this.resultados = { error: error?.message || 'Error desconocido' };
    }
  }

  async testStock() {
    try {
      console.log('🔍 Test: Listar notificaciones de stock');
      const notificaciones = await this.notificacionApi.listarTodasMisNotificaciones();
      // Filtrar solo las de stock
      const stockNotifications = notificaciones.filter(n => n.tipo_notificacion === 'STOCK_DISPONIBLE');
      console.log('Notificaciones de stock:', stockNotifications);
      this.resultados = {
        tipo: 'Notificaciones Stock (filtradas de LOGISTICA_NotificacionesStock)',
        cantidad: stockNotifications.length,
        datos: stockNotifications
      };
    } catch (error: any) {
      console.error('Error:', error);
      this.resultados = { error: error?.message || 'Error desconocido' };
    }
  }

  async testTodas() {
    try {
      console.log('🔍 Test: Listar todas las notificaciones');
      const notificaciones = await this.notificacionApi.listarTodasMisNotificaciones();
      console.log('Todas las notificaciones:', notificaciones);
      this.resultados = {
        tipo: 'Todas las Notificaciones (Combinadas)',
        cantidad: notificaciones.length,
        datos: notificaciones
      };
    } catch (error: any) {
      console.error('Error:', error);
      this.resultados = { error: error?.message || 'Error desconocido' };
    }
  }

  async testContador() {
    try {
      console.log('🔍 Test: Contador de no leídas');
      const contador = await this.notificacionApi.getContadorNoLeidas();
      console.log('Contador no leídas:', contador);
      this.resultados = {
        tipo: 'Contador de No Leídas',
        valor: contador
      };
    } catch (error: any) {
      console.error('Error:', error);
      this.resultados = { error: error?.message || 'Error desconocido' };
    }
  }
}
