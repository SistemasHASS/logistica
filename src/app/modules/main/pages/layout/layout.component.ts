import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import moment from 'moment';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { ConnectivityService } from '../../services/connectivity.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { SyncService } from '@/app/modules/main/services/sync.service';
import { APP_VERSION, APP_INFO } from 'src/environments/version';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {

  appVersion = APP_VERSION;
  appInfo = APP_INFO;

  fechaHoy: string = '';
  currentPath: string = '';
  usuario: any;
  rol: string = '';
  isOnline: boolean = true;

  constructor(
    private router: Router,
    private connectivityService: ConnectivityService,
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private syncService: SyncService,
  ) { }

  async ngOnInit() {
    this.usuario = await this.dexieService.showUsuario();
    this.rol = this.usuario?.idrol;
    this.userService.setUsuario(this.usuario);
    this.connectivityService.isOnline.subscribe((status: boolean) => {
      this.isOnline = status;
    });

    this.updateCurrentPath();
    this.router.events.subscribe(() => {
      this.updateCurrentPath();
    });
    this.fechaHoy = this.getDate();
    this.usuario = await this.dexieService.showUsuario();
  }

  // async logout() {
  //   Swal.fire({
  //     title: '¿Estás seguro?',
  //     text: 'Confirma que desea cerrar sesión',
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonText: 'Sí, deseo salir',
  //     cancelButtonText: 'Cancelar',
  //     customClass: {
  //       confirmButton: 'btn btn-primary',
  //       cancelButton: 'btn btn-warning',
  //     },
  //     buttonsStyling: false, // para aplicar tus propias clases
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       this.router.navigate(['auth/login']);
  //       localStorage.clear();
  //       this.dexieService.clearConfiguracion();
  //       this.dexieService.clearUsuario();
  //       this.dexieService.clearMaestras();
  //     }
  //   });
  // }

  async logout() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Confirma que desea cerrar sesión',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, deseo salir',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-warning',
      },
      buttonsStyling: false,
    }).then(async (result) => {

      // ❌ Si cancela, no hace nada
      if (!result.isConfirmed) {
        return;
      }

      try {
        // 🔴 VALIDAR TODOS LOS REQUERIMIENTOS PENDIENTES
        const [
          pendientesItems,
          pendientesCommodity,
          pendientesActivoFijo,
          pendientesActivoFijoMenor
        ] = await Promise.all([
          this.dexieService.requerimientos.where('estado').equals(0).count(),
          this.dexieService.requerimientosCommodity.where('estado').equals(0).count(),
          this.dexieService.requerimientosActivoFijo.where('estado').equals(0).count(),
          this.dexieService.requerimientosActivoFijoMenor.where('estado').equals(0).count(),
        ]);

        const totalPendientes =
          pendientesItems +
          pendientesCommodity +
          pendientesActivoFijo +
          pendientesActivoFijoMenor;

        if (totalPendientes > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sincronización pendiente',
            html: `
                  <p>Tienes requerimientos sin sincronizar:</p>
                  <ul style="text-align:left">
                    <li>📦 Requerimientos de Ítems: <b>${pendientesItems}</b></li>
                    <li>🧾 Requerimientos de Commodity: <b>${pendientesCommodity}</b></li>
                    <li>🏗 Requerimientos de Activo Fijo: <b>${pendientesActivoFijo}</b></li>
                    <li>🔧 Requerimientos de Activo Menor: <b>${pendientesActivoFijoMenor}</b></li>
                  </ul>
                  <p>Debes sincronizar antes de cerrar sesión.</p>
                `,
            confirmButtonText: 'Entendido',
            customClass: {
              confirmButton: 'btn btn-primary',
            },
            buttonsStyling: false,
          });

          return; // ⛔ NO cerrar sesión
        }

        // 🔴 VALIDACIÓN CLAVE: verificar pendientes
        // const pendientes = await this.dexieService.requerimientos
        //   .where('estado')
        //   .equals(0)
        //   .count();

        // if (pendientes > 0) {
        //   Swal.fire({
        //     icon: 'warning',
        //     title: 'Sincronización pendiente',
        //     text: `Tienes ${pendientes} requerimiento(s) sin sincronizar. Debes sincronizar antes de cerrar sesión.`,
        //     confirmButtonText: 'Entendido',
        //     customClass: {
        //       confirmButton: 'btn btn-primary',
        //     },
        //     buttonsStyling: false,
        //   });
        //   return; // ⛔ NO cerrar sesión
        // }

        // ✅ CIERRE DE SESIÓN SEGURO
        this.router.navigate(['auth/login']);

        localStorage.clear();
        await this.dexieService.clearConfiguracion();
        await this.dexieService.clearUsuario();
        await this.dexieService.clearMaestras();

      } catch (error) {
        console.error('Error validando cierre de sesión', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo validar la sincronización antes de cerrar sesión.',
          confirmButtonText: 'Aceptar',
          customClass: {
            confirmButton: 'btn btn-danger',
          },
          buttonsStyling: false,
        });
      }
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

  formatNombreInicio(nombre: string): string {
    if (!nombre) return '';
    const words = nombre.toLowerCase().split(' ');
    if (words.length === 0) return '';
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return words.join(' ');
  }

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

  getDate() {
    return moment(new Date()).format('YYYY-MM-DD');
  }
  updateCurrentPath() {
    const url = this.router.url;

    // Si la ruta contiene /maestros/... mostrar "Maestros"
    if (url.includes('/maestros')) {
      this.currentPath = 'Maestros';
      return;
    }
    const currentUrl = this.router.url.split('/').filter(Boolean);
    const pathMap: { [key: string]: string } = {
      maestros: 'Maestros',
      'maestros/items': 'Maestros',
      'maestros/comodities': 'Maestros',
      'aprobadores': "Aprobadores",
      'parametros': 'Parámetros',
      'requerimientos': 'Requerimientos',
      'aprobaciones': 'Aprobaciones',
      'despachos': 'Despachos',
      'reportes': 'Lista de requerimientos',
      'reporte-requerimientos': 'Reporte requerimientos',
    };

    this.currentPath = pathMap[currentUrl[currentUrl.length - 1]] || '';
  }
}
