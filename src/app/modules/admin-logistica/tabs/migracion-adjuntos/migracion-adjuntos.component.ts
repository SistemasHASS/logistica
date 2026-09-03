import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { environment } from '@/environments/environment';

export interface ResultadoReproceso {
  idOrden?: number;
  numeroOrden?: string;
  numeroOrdenSpring?: string;
  totalAdjuntos?: number;
  exitos?: number;
  errores?: number;
  mensaje?: string;
}

@Component({
  selector: 'app-migracion-adjuntos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    CardModule
  ],
  templateUrl: './migracion-adjuntos.component.html'
})
export class MigracionAdjuntosComponent {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  idOrden = signal<string>('');
  tipoOrden = signal<string>('OC');
  usuario = signal<string>('admin');
  loading = signal(false);
  error = signal<string>('');
  exito = signal<string>('');
  resultados = signal<ResultadoReproceso[]>([]);
  totalOCs = signal<number>(0);

  tiposOrden = [
    { label: 'Orden de Compra', value: 'OC' },
    { label: 'Orden de Servicio', value: 'OS' }
  ];

  reprocesar() {
    this.loading.set(true);
    this.error.set('');
    this.exito.set('');
    this.resultados.set([]);

    const payload = {
      idOrden: this.idOrden() ? Number(this.idOrden()) : 0,
      tipoOrden: this.tipoOrden(),
      usuario: this.usuario()
    };

    this.http.post<any>(`${this.baseUrl}/api/logistica/admin-logistica/reprocesar-adjuntos-spring`, payload)
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res?.success) {
            this.resultados.set(res.resultados || []);
            this.totalOCs.set(res.totalOCs || 0);
            const conAdjuntos = (res.resultados || []).filter((r: any) => (r.totalAdjuntos || 0) > 0).length;
            this.exito.set(`Se revisaron ${res.totalOCs || 0} OC(s); ${conAdjuntos} con adjuntos pendientes.`);
          } else {
            this.error.set(res?.mensaje || 'Error desconocido');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.mensaje || 'Error del servidor');
        }
      });
  }
}
