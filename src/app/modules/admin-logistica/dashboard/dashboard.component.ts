import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminLogisticaAuthService } from '../auth/services/admin-logistica-auth.service';
import { AdminLogisticaDashboardService } from './services/admin-logistica-dashboard.service';

export interface DashboardKPI {
  label: string;
  value: number;
  icon: string;
  color: string;
  route: string;
  change?: number;
}

@Component({
  selector: 'app-admin-logistica-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private authService = inject(AdminLogisticaAuthService);
  private dashboardService = inject(AdminLogisticaDashboardService);

  user = this.authService.currentUser;
  loading = signal(true);
  error = signal('');
  now = new Date();

  kpis = signal<DashboardKPI[]>([
    { label: 'Pendientes Aprobación', value: 0, icon: 'bx bx-time', color: '#ffc107', route: './bandeja' },
    { label: 'OC Emitidas Hoy', value: 0, icon: 'bx bx-cart', color: '#28a745', route: './aprobar-sc' },
    { label: 'OS Emitidas Hoy', value: 0, icon: 'bx bx-wrench', color: '#17a2b8', route: './aprobar-sc' },
    { label: 'Usuarios Activos', value: 0, icon: 'bx bx-user', color: '#6f42c1', route: './usuarios' },
  ]);

  recentActivity = signal<any[]>([]);
  chartData = signal<any>(null);

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.now = new Date();
    this.loading.set(true);
    
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.kpis.set([
          { label: 'Pendientes Aprobación', value: data.pendientesAprobacion, icon: 'bx bx-time', color: '#ffc107', route: './bandeja', change: data.cambioPendientes },
          { label: 'OC Emitidas Hoy', value: data.ocEmitidasHoy, icon: 'bx bx-cart', color: '#28a745', route: './aprobar-sc', change: data.cambioOC },
          { label: 'OS Emitidas Hoy', value: data.osEmitidasHoy, icon: 'bx bx-wrench', color: '#17a2b8', route: './aprobar-sc', change: data.cambioOS },
          { label: 'Usuarios Activos', value: data.usuariosActivos, icon: 'bx bx-user', color: '#6f42c1', route: './usuarios' },
        ]);
        this.recentActivity.set(data.actividadReciente || []);
        this.chartData.set(data.graficos || null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar datos del dashboard');
        this.loading.set(false);
        console.error('Error dashboard:', err);
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isJefeLogistica(): boolean {
    return this.authService.isJefeLogistica();
  }

  refresh() {
    this.loadDashboardData();
  }

  getActivityColor(tipo: string): string {
    switch (tipo) {
      case 'APROBACION': return 'success';
      case 'RECHAZO': return 'danger';
      case 'CREACION': return 'primary';
      case 'ACTUALIZACION': return 'info';
      default: return 'secondary';
    }
  }

  getActivityIcon(tipo: string): string {
    switch (tipo) {
      case 'APROBACION': return 'bx-check';
      case 'RECHAZO': return 'bx-x';
      case 'CREACION': return 'bx-plus';
      case 'ACTUALIZACION': return 'bx-edit';
      default: return 'bx-question-mark';
    }
  }
}
