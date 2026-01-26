import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ConnectivityService } from '@/app/modules/main/services/connectivity.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthAdminService } from '@/app/modules/admin-login/auth-admin.service';
import { APP_VERSION, APP_INFO } from 'src/environments/version';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,      // ✅ OBLIGATORIO
    RouterOutlet
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {

  isSidebarCollapsed = false;
  appVersion = APP_VERSION;
  appInfo = APP_INFO;
  isOnline: boolean = true;
  currentPath: string = '';
  fechaHoy: string = '';

  adminUser = JSON.parse(
    localStorage.getItem('ADMIN_USER') || '{}'
  );

  constructor(
    private router: Router,
    private authAdmin: AuthAdminService,
    private connectivityService: ConnectivityService
  ) { }

  toggleSidebar() {
    const mainWrapper = document.getElementById('main-wrapper');
    if (window.matchMedia('(max-width: 1200px)').matches) {
      if (mainWrapper) {
        if (mainWrapper.classList.contains('show-sidebar')) {
          mainWrapper.setAttribute('data-sidebartype', 'mini-sidebar');
          mainWrapper.classList.remove('show-sidebar');
        } else {
          mainWrapper.setAttribute('data-sidebartype', 'full');
          mainWrapper.classList.toggle('show-sidebar');
        }
      }
    } else {
      if (mainWrapper) {
        mainWrapper.setAttribute('data-sidebartype', 'full');
        mainWrapper.classList.remove('show-sidebar');
      }
    }
  }

  logout() {
    this.authAdmin.logout();
    this.router.navigate(['/admin-login']);
  }
  async ngOnInit() {
    this.fechaHoy = this.getDate();
    this.connectivityService.isOnline.subscribe((status: boolean) => {
      this.isOnline = status;
    });
    // Ejecutar al cargar
    this.updateCurrentPath();

    // Ejecutar en cada cambio de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateCurrentPath();
      });
  }

  formatNombre(nombre: string): string {
    if (!nombre) return ''; // Verifica si el nombre está vacío

    // Divide el nombre completo por espacios
    const partes = nombre.split(' ');

    // Asegúrate de que haya al menos un nombre y un apellido
    if (partes.length < 2) return ''; // Si no hay apellido, no hace nada

    // El primer nombre y el primer apellido
    const primerNombre = partes[0];
    const primerApellido = partes[1];

    // Devuelve el primer nombre y el primer apellido con la primera letra en mayúscula y el resto en minúscula
    return (
      primerNombre.charAt(0).toUpperCase() +
      primerNombre.slice(1).toLowerCase() +
      ' ' +
      primerApellido.charAt(0).toUpperCase() +
      primerApellido.slice(1).toLowerCase()
    );
  }

  getDate() {
    return moment(new Date()).format('YYYY-MM-DD');
  }

  updateCurrentPath() {
    const url = this.router.url;

    const currentUrl = this.router.url.split('/').filter(Boolean);
    const pathMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'admin-usuarios': 'Gestión de Usuarios',
      'admin-areas': 'Gestión de Areas',
      'admin-aprobadores': "Gestión de Aprobadores",
      'admin-perfiles': 'Gestión de Perfiles',
      'admin-roles': 'Gestión de Roles',
      'admin-flujos': 'Gestión de Flujos de Aprobación',
      'reportes': 'Lista de requerimientos',
    };

    this.currentPath = pathMap[currentUrl[currentUrl.length - 1]] || '';
  }
}