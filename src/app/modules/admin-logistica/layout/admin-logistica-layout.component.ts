import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminLogisticaAuthService } from '../auth/services/admin-logistica-auth.service';
import { PermisosRolService } from '../services/permisos-rol.service';
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
  private permisosService = inject(PermisosRolService);

  user = this.authService.currentUser;
  sidebarCollapsed = signal(false);
  currentRoute = signal('dashboard');
  fechaHoy = '';
  isOnline = true;
  permisosListos = signal(false);

  ngOnInit() {
    this.fechaHoy = moment().format('YYYY-MM-DD');
    const idrol = this.authService.currentUser()?.idrol;
    if (idrol) {
      this.permisosService.cargarPermisosParaRol(idrol).subscribe({
        complete: () => this.permisosListos.set(true),
        error: () => this.permisosListos.set(true),
      });
    } else {
      this.permisosListos.set(true);
    }
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

  private _tienePermiso(clave: string, fallback: boolean): boolean {
    const idrol = this.authService.currentUser()?.idrol;
    if (!idrol) return false;
    if (!this.permisosListos()) return fallback;
    const mapa = this.permisosService.permisosCargados();
    if (!mapa.has(idrol)) return fallback;
    // Si BD respondió OK → confiar 100% en BD (ignorar fallback)
    if (this.permisosService.cargadoDesdeDB(idrol)) {
      return this.permisosService.tienePermiso(idrol, clave);
    }
    // Si solo tenemos cache (BD falló) → usar fallback como seguridad
    return this.permisosService.tienePermiso(idrol, clave) || fallback;
  }

  private readonly _ITEMS_DEF = [
    { route: 'dashboard',             label: 'Dashboard',                  icon: 'bx bxs-dashboard',   clave: 'ADMINLG_MENU_DASHBOARD',      fallback: () => true },
    { route: 'bandeja',               label: 'Bandeja Aprobaciones',       icon: 'bx bx-inbox',        clave: 'ADMINLG_MENU_BANDEJA',         fallback: () => true },
    { route: 'aprobar-consumo',       label: 'Aprobar Consumo',            icon: 'bx bx-check-circle', clave: 'ADMINLG_MENU_APROBAR_CONSUMO', fallback: () => true },
    { route: 'aprobar-sc',            label: 'Aprobar Solicitud Compra',   icon: 'bx bx-shopping-bag', clave: 'ADMINLG_MENU_APROBAR_SC',      fallback: () => !this.isJefeLogistica() },
    { route: 'aprobar-ss',            label: 'Aprobar Solicitud Servicio', icon: 'bx bx-file-find',    clave: 'ADMINLG_MENU_APROBAR_SS',      fallback: () => !this.isJefeLogistica() },
    { route: 'maestros',              label: 'Maestros',                   icon: 'bx bx-equalizer',    clave: 'ADMINLG_MENU_MAESTROS',        fallback: () => true },
    { route: 'proveedores',           label: 'Gestión Proveedores',        icon: 'bx bx-store',        clave: 'ADMINLG_MENU_PROVEEDORES',     fallback: () => true },
    { route: 'usuarios',              label: 'Usuarios',                   icon: 'bx bx-user',         clave: 'ADMINLG_MENU_USUARIOS',        fallback: () => this.authService.canCreateUsers() },
    { route: 'areas',                 label: 'Áreas',                      icon: 'bx bx-buildings',    clave: 'ADMINLG_MENU_AREAS',           fallback: () => this.isAdmin() },
    { route: 'usuario-area',          label: 'Usuarios por Área',          icon: 'bx bx-user-check',   clave: 'ADMINLG_MENU_USUARIO_AREA',    fallback: () => this.isAdmin() },
    { route: 'flujo-aprobacion-area', label: 'Flujo Aprobación Área',      icon: 'bx bx-git-branch',   clave: 'ADMINLG_MENU_FLUJO_AREA',      fallback: () => this.isAdmin() },
    { route: 'pdf',                   label: 'Formato PDF',                icon: 'bx bxs-file-pdf',    clave: 'ADMINLG_MENU_PDF',             fallback: () => true },
    { route: 'empresa',               label: 'Empresa',                    icon: 'bx bx-buildings',    clave: 'ADMINLG_MENU_EMPRESA',         fallback: () => this.isAdmin() },
    { route: 'parametros',            label: 'Parámetros',                 icon: 'bx bx-cog',          clave: 'ADMINLG_MENU_PARAMETROS',      fallback: () => this.isAdmin() },
    { route: 'aprobadores',           label: 'Aprobadores',                icon: 'bx bx-user-check',   clave: 'ADMINLG_MENU_APROBADORES',     fallback: () => this.isAdmin() },
    { route: 'auditoria',             label: 'Auditoría',                  icon: 'bx bx-history',      clave: 'ADMINLG_MENU_AUDITORIA',       fallback: () => this.isAdmin() },
    { route: 'almacen',               label: 'Plantillas Almacén',         icon: 'bx bx-store-alt',    clave: 'ADMINLG_MENU_ALMACEN',         fallback: () => this.isAdmin() },
    { route: 'conformidad-servicio',  label: 'Conformidad Servicio',       icon: 'bx bx-check-shield', clave: 'ADMINLG_MENU_CONFORMIDAD',     fallback: () => this.isAdmin() },
    { route: 'permisos-rol',          label: 'Permisos por Rol',           icon: 'bx bx-shield',       clave: 'ADMINLG_MENU_PERMISOS_ROL',   fallback: () => this.isAdmin() },
  ];

  menuItems = computed(() => {
    const listo = this.permisosListos();
    // Leer el signal para que computed() se suscriba a cambios
    this.permisosService.permisosCargados();
    return this._ITEMS_DEF.map(item => ({
      ...item,
      visible: listo ? this._tienePermiso(item.clave, item.fallback()) : true,
    }));
  });
}
