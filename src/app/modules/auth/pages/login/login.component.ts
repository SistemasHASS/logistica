import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@/app/modules/auth/services/auth.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { StockNotificationService } from '@/app/shared/services/stock-notification.service';
import { APP_VERSION, APP_INFO } from 'src/environments/version';
import { AdminBrandingService, BRANDING_DEFAULTS } from '@/app/modules/main/pages/administracion/services/admin-branding.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

  appVersion = APP_VERSION;
  appInfo = APP_INFO;

  logoLoginUrl: string = '';
  tituloLogin: string = BRANDING_DEFAULTS.tituloLogin;
  subtituloLogin: string = BRANDING_DEFAULTS.subtituloLogin;

  mostrarClave = false;
  usuario: any;
  clave = '';
  mensajeLogin: String = '';
  isCharge: boolean = false;
  loginForm: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private dexieService: DexieService,
    private alertService: AlertService,
    private authService: AuthService,
    private stockNotificationService: StockNotificationService,
    private brandingService: AdminBrandingService
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],  // Campo requerido
      clave: ['', Validators.required]
    });
  }

  private cargarBranding(): void {
    this.brandingService.obtenerBranding().then((data) => {
      this.logoLoginUrl = data.logoLogin || '';
      this.tituloLogin = data.tituloLogin || BRANDING_DEFAULTS.tituloLogin;
      this.subtituloLogin = data.subtituloLogin || BRANDING_DEFAULTS.subtituloLogin;
    }).catch(() => {});
  }

  async ngOnInit() {
    this.cargarBranding();
    this.usuario = await this.dexieService.showUsuario()
    if (!!this.usuario) {
      // Recargar notificaciones para el usuario existente
      await this.stockNotificationService.recargarUsuario();
      
      // Si es APLOGIST, cargar área antes de redirigir
      if (this.tieneRol(this.usuario.idrol, 'APLOGIST')) {
        await this.authService.cargarAreaUsuario();
      } else {
        this.login();
      }
    }
  }

  async login() {
    const user = await this.dexieService.showUsuario();
    // if (!user) return;
    if (user) {
      // ✅ No redirigir inmediatamente, esperar a cargarAreaUsuario
      // this.redireccionarPorRol(user.idrol, user);
      
      // Si no es APLOGIST, redirigir normalmente
      if (!this.tieneRol(user.idrol, 'APLOGIST')) {
        this.redireccionarPorRol(user.idrol);
      }
      // Si es APLOGIST, la redirección ocurrirá en cargarAreaUsuario
    }

    // const rol = user.idrol;

    // if (rol.includes('TI')) {
    //   this.router.navigate(['/main/parametros']);
    // }
    // else if (rol.includes('ADLOGIST')) {
    //   this.router.navigate(['/main/maestros']);
    // }
    // else if (rol.includes('APLOGIST')) {
    //   this.router.navigate(['/main/aprobaciones']);
    // }
    // else if (rol.includes('ALLOGIST')) {
    //   this.router.navigate(['/main/dashboard-despacho']);
    // }
    // else if (rol.includes('OPLOGIST')) {
    //   this.router.navigate(['/main/parametros']);
    // }
    // else if (rol.includes('EMLOGIST')) {
    //   this.router.navigate(['/main/parametros']);
    // }

    // else {
    //   this.router.navigate(['/main/reporte_logistica']); // fallback
    // }
  }

  /** true si idrol (posiblemente "A,B") contiene el rol exacto */
  private tieneRol(idrol: string | null | undefined, rol: string): boolean {
    return (idrol ?? '').split(',').map(r => r.trim()).includes(rol);
  }

  // 🔐 REDIRECCIÓN CENTRALIZADA POR ROL (soporta roles concatenados "A,B";
  // con varios roles gana el primero en este orden de prioridad)
  private redireccionarPorRol(rol: string) {
    if (this.tieneRol(rol, 'TILOGIST')) {
      this.router.navigate(['/main/parametros']);
    } else if (this.tieneRol(rol, 'ADLOGIST')) {
      this.router.navigate(['/main/maestros']);
    } else if (this.tieneRol(rol, 'APLOGIST')) {
      this.router.navigate(['/main/aprobaciones']);
    } else if (this.tieneRol(rol, 'ALLOGIST')) {
      this.router.navigate(['/main/dashboard-despacho']);
    } else if (this.tieneRol(rol, 'OPLOGIST')) {
      this.router.navigate(['/main/dashboard-oplogist']);
    } else if (this.tieneRol(rol, 'EMLOGIST')) {
      // 👈 rol empaque
      this.router.navigate(['/main/parametros']);
    } else if (this.tieneRol(rol, 'LOLOGIST')) {
      // 👈 rol logistico
      this.router.navigate(['/main/dashboard-logistica']);
    } else if (this.tieneRol(rol, 'JLOLOGIST')) {
      // 👈 jefe de logística
      this.router.navigate(['/main/dashboard-jlologist']);
    } else if (this.tieneRol(rol, 'FINANZAS')) {
      // 👈 rol finanzas
      this.router.navigate(['/main/dashboard-finanzas']);
    } else if (this.tieneRol(rol, 'GERENTE')) {
      // 👈 rol gerencia - aprueba nivel 2 requerimientos y OC/OS
      this.router.navigate(['/main/aprobaciones-gerencia']);
    } else {
      this.router.navigate(['/main/reporte_logistico']);
    }
  }

  // login() {
  //   this.router.navigate(['/main/parametros']);
  // }

  toggleClave(): void {
    this.mostrarClave = !this.mostrarClave; // Cambia entre mostrar y ocultar
  }

  async onSubmit() {
    this.isCharge = true;
    if (this.loginForm.valid) {
      const loginData = this.loginForm.value;
      try {
        const resp = await this.authService.login(loginData.usuario, loginData.clave, loginData.aplicacion);
        if (!!resp && resp.length > 0) {
          if (resp > 1) {
            this.mensajeLogin = 'El usuario cuenta con más de una cuenta, comuníquese con su administrador del servicio.';
          } else {
            await this.dexieService.saveUsuario(resp[0]);
            // Cargar información del área del usuario
            await this.authService.cargarAreaUsuario();
            // Recargar notificaciones para el nuevo usuario
            await this.stockNotificationService.recargarUsuario();
            this.login();
          }

          this.isCharge = false;
        } else {
          this.isCharge = false;
          this.mensajeLogin = 'El usuario no se encuentra registrado.';
        }
      } catch (error) {
        this.isCharge = false;
        this.mensajeLogin = 'Hubo un error en el login, por favor intente nuevamente.';
        this.alertService.showAlert('error', this.mensajeLogin.toString(), 'error')
      }
    }
  }

}