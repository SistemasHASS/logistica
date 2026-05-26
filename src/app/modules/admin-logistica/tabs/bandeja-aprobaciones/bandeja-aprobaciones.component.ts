import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import { BandejaService } from './services/bandeja.service';

export interface PendienteAprobacion {
  id: number;
  numero: string;
  tipo: 'CONSUMO' | 'COMPRA';
  solicitante: string;
  area: string;
  fecha: string;
  monto: number;
  estado: string;
  prioridad: string;
}

@Component({
  selector: 'app-bandeja-aprobaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule, CardModule],
  templateUrl: './bandeja-aprobaciones.component.html',
  styleUrls: ['./bandeja-aprobaciones.component.scss'],
})
export class BandejaAprobacionesComponent implements OnInit {
  private authService = inject(AdminLogisticaAuthService);
  private bandejaService = inject(BandejaService);
  private router = inject(Router);

  user = this.authService.currentUser;
  loading = signal(true);
  error = signal('');

  pendientes = signal<PendienteAprobacion[]>([]);
  kpis = signal({
    totalPendientes: 0,
    consumoPendientes: 0,
    compraPendientes: 0,
    urgentes: 0,
  });

  ngOnInit() {
    this.cargarDatos();
  }

  private cargarDatos() {
    this.loading.set(true);
    
    this.bandejaService.getPendientes().subscribe({
      next: (data) => {
        this.pendientes.set(data.items);
        this.kpis.set(data.kpis);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar pendientes');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  getSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'APROBADO': return 'success';
      case 'PENDIENTE': return 'warn';
      case 'RECHAZADO': return 'danger';
      default: return 'info';
    }
  }

  getTipoSeverity(tipo: string): 'info' | 'success' | 'secondary' {
    return tipo === 'CONSUMO' ? 'info' : 'success';
  }

  verDetalle(item: PendienteAprobacion) {
    if (item.tipo === 'CONSUMO') {
      this.router.navigate(['/admin-logistica/aprobar-consumo']);
    } else {
      this.router.navigate(['/admin-logistica/aprobar-sc']);
    }
  }

  refresh() {
    this.cargarDatos();
  }
}
