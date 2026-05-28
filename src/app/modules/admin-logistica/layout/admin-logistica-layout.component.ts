import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminLogisticaAuthService } from '../auth/services/admin-logistica-auth.service';
import moment from 'moment';

@Component({
  selector: 'app-admin-logistica-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-logistica-layout.component.html',
  styleUrls: ['./admin-logistica-layout.component.scss'],
})
export class AdminLogisticaLayoutComponent implements OnInit {
  private authService = inject(AdminLogisticaAuthService);
  private router = inject(Router);

  user = this.authService.currentUser;
  sidebarCollapsed = signal(false);
  currentRoute = signal('dashboard');
  fechaHoy = '';
  isOnline = true;

  ngOnInit() {
    this.fechaHoy = moment().format('YYYY-MM-DD');
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        const segments = url.split('/');
        const lastSegment = segments[segments.length - 1] || 'dashboard';
        this.currentRoute.set(lastSegment);
      }
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin-logistica/login']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isJefeLogistica(): boolean {
    return this.authService.isJefeLogistica();
  }

  menuItems = [
    { route: 'dashboard', label: 'Dashboard', icon: 'bx bxs-dashboard', visible: () => true },
    { route: 'bandeja', label: 'Bandeja Aprobaciones', icon: 'bx bx-inbox', visible: () => true },
    { route: 'aprobar-consumo', label: 'Aprobar Consumo', icon: 'bx bx-check-circle', visible: () => true },
    { route: 'aprobar-sc', label: 'Aprobar Solicitud Compra', icon: 'bx bx-shopping-bag', visible: () => true },
    { route: 'aprobar-ss', label: 'Aprobar Solicitud Servicio', icon: 'bx bx-file-find', visible: () => true },
    { route: 'maestros', label: 'Maestros', icon: 'bx bx-equalizer', visible: () => true },
    { route: 'proveedores', label: 'Gestión Proveedores', icon: 'bx bx-store', visible: () => true },
    { route: 'usuarios', label: 'Usuarios', icon: 'bx bx-user', visible: () => this.authService.canCreateUsers() },
    { route: 'areas', label: 'Áreas', icon: 'bx bx-buildings', visible: () => this.isAdmin() },
    { route: 'usuario-area', label: 'Usuarios por Área', icon: 'bx bx-user-check', visible: () => this.isAdmin() },
    { route: 'flujo-aprobacion-area', label: 'Flujo Aprobación Área', icon: 'bx bx-git-branch', visible: () => this.isAdmin() },
    { route: 'pdf', label: 'Formato PDF', icon: 'bx bxs-file-pdf', visible: () => true },
    { route: 'empresa', label: 'Empresa', icon: 'bx bx-buildings', visible: () => this.isAdmin() },
    { route: 'parametros', label: 'Parámetros', icon: 'bx bx-cog', visible: () => this.isAdmin() },
    { route: 'aprobadores', label: 'Aprobadores', icon: 'bx bx-user-check', visible: () => this.isAdmin() },
    { route: 'auditoria', label: 'Auditoría', icon: 'bx bx-history', visible: () => this.isAdmin() },
  ];
}
