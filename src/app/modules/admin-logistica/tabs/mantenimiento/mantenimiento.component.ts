import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { environment } from '@/environments/environment';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';

export interface DetalleLimpieza {
  tabla: string;
  filas: number;
}

export interface BackupLimpieza {
  id: number;
  backupFile: string;
  usuario: string;
  totalFilas: number;
  fechaEjecucion: string;
}

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    CardModule,
    DialogModule
  ],
  templateUrl: './mantenimiento.component.html'
})
export class MantenimientoComponent {
  private http = inject(HttpClient);
  private auth = inject(AdminLogisticaAuthService);
  private baseUrl = environment.baseUrl;

  preview = signal<DetalleLimpieza[]>([]);
  resultado = signal<DetalleLimpieza[]>([]);
  confirmacion = signal<string>('');
  resetearCorrelativos = signal<boolean>(true);
  loading = signal(false);
  loadingPreview = signal(false);
  error = signal<string>('');
  exito = signal<string>('');
  backupFile = signal<string>('');
  ejecutado = signal(false);

  // Detalle de registros por tabla
  detalleVisible = signal(false);
  detalleTabla = signal<string>('');
  detalleRegistros = signal<any[]>([]);
  detalleColumnas = signal<string[]>([]);
  loadingDetalle = signal(false);

  // Restauración
  backups = signal<BackupLimpieza[]>([]);
  backupSeleccionado = signal<string>('');
  confirmacionRestaurar = signal<string>('');
  loadingBackups = signal(false);
  loadingRestaurar = signal(false);
  exitoRestaurar = signal<string>('');
  errorRestaurar = signal<string>('');

  totalFilas = computed(() => this.preview().reduce((acc, r) => acc + (r.filas || 0), 0));
  puedeLimpiar = computed(() => this.confirmacion().trim().toUpperCase() === 'LIMPIAR' && !this.loading());
  puedeRestaurar = computed(() =>
    this.confirmacionRestaurar().trim().toUpperCase() === 'RESTAURAR'
    && this.backupSeleccionado() !== ''
    && !this.loadingRestaurar());

  nombreArchivo(path: string): string {
    return path?.split('\\').pop() || path;
  }

  cargarPreview() {
    this.loadingPreview.set(true);
    this.error.set('');
    this.exito.set('');
    this.ejecutado.set(false);

    this.http.post<any>(`${this.baseUrl}/api/logistica/admin-logistica/mantenimiento/limpiar-data`, {
      confirmacion: null,
      soloSimular: true
    }).subscribe({
      next: (res) => {
        this.loadingPreview.set(false);
        this.preview.set((res?.detalle || []).filter((d: DetalleLimpieza) => d.filas > 0));
      },
      error: (err) => {
        this.loadingPreview.set(false);
        this.error.set(err?.error?.mensaje || 'Error al obtener el resumen');
      }
    });
  }

  verDetalle(tabla: string) {
    this.detalleTabla.set(tabla);
    this.detalleVisible.set(true);
    this.loadingDetalle.set(true);
    this.detalleRegistros.set([]);
    this.detalleColumnas.set([]);

    this.http.get<any>(`${this.baseUrl}/api/logistica/admin-logistica/mantenimiento/detalle-tabla`, {
      params: { tabla, top: 50 }
    }).subscribe({
      next: (res) => {
        this.loadingDetalle.set(false);
        const registros: any[] = res?.registros || [];
        this.detalleRegistros.set(registros);
        this.detalleColumnas.set(registros.length > 0 ? Object.keys(registros[0]) : []);
      },
      error: (err) => {
        this.loadingDetalle.set(false);
        this.detalleVisible.set(false);
        this.error.set(err?.error?.mensaje || 'Error al obtener el detalle');
      }
    });
  }

  ejecutar() {
    if (!this.puedeLimpiar()) return;

    this.loading.set(true);
    this.error.set('');
    this.exito.set('');
    this.backupFile.set('');
    this.resultado.set([]);

    this.http.post<any>(`${this.baseUrl}/api/logistica/admin-logistica/mantenimiento/limpiar-data`, {
      confirmacion: this.confirmacion().trim().toUpperCase(),
      soloSimular: false,
      resetearCorrelativos: this.resetearCorrelativos(),
      usuario: this.auth.currentUser()?.usuario || 'admin'
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.success === 1 && res?.ejecutado) {
          this.ejecutado.set(true);
          this.resultado.set((res.detalle || []).filter((d: DetalleLimpieza) => d.filas > 0));
          this.backupFile.set(res.backupFile || '');
          this.exito.set(res.mensaje || 'Limpieza completada correctamente');
          this.confirmacion.set('');
          this.preview.set([]);
        } else {
          this.error.set(res?.mensaje || 'La limpieza no se ejecutó');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.mensaje || 'Error del servidor');
      }
    });
  }

  cargarBackups() {
    this.loadingBackups.set(true);
    this.errorRestaurar.set('');
    this.exitoRestaurar.set('');

    this.http.get<any>(`${this.baseUrl}/api/logistica/admin-logistica/mantenimiento/backups`)
      .subscribe({
        next: (res) => {
          this.loadingBackups.set(false);
          this.backups.set(res?.backups || []);
        },
        error: (err) => {
          this.loadingBackups.set(false);
          this.errorRestaurar.set(err?.error?.mensaje || 'Error al listar backups');
        }
      });
  }

  restaurar() {
    if (!this.puedeRestaurar()) return;

    this.loadingRestaurar.set(true);
    this.errorRestaurar.set('');
    this.exitoRestaurar.set('');

    this.http.post<any>(`${this.baseUrl}/api/logistica/admin-logistica/mantenimiento/restaurar-data`, {
      backupFile: this.backupSeleccionado(),
      confirmacion: this.confirmacionRestaurar().trim().toUpperCase(),
      usuario: this.auth.currentUser()?.usuario || 'admin'
    }).subscribe({
      next: (res) => {
        this.loadingRestaurar.set(false);
        if (res?.success === 1 && res?.ejecutado) {
          this.exitoRestaurar.set(res.mensaje || 'Restauración completada correctamente');
          this.confirmacionRestaurar.set('');
          this.backupSeleccionado.set('');
        } else {
          this.errorRestaurar.set(res?.mensaje || 'La restauración no se ejecutó');
        }
      },
      error: (err) => {
        this.loadingRestaurar.set(false);
        this.errorRestaurar.set(err?.error?.mensaje || 'Error del servidor');
      }
    });
  }
}
