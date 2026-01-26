import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@/app/modules/auth/services/auth.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { APP_VERSION, APP_INFO } from 'src/environments/version';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

  appVersion = APP_VERSION;
  appInfo = APP_INFO;

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
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],  // Campo requerido
      clave: ['', Validators.required]
    });
  }

  async ngOnInit() {
    this.usuario = await this.dexieService.showUsuario()
    if (!!this.usuario) {
      this.login()
    }
  }

  async login() {
    const user = await this.dexieService.showUsuario();
    // if (!user) return;
    if (user) {
      this.redireccionarPorRol(user.idrol);
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
    //   this.router.navigate(['/main/despachos']);
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

  // 🔐 REDIRECCIÓN CENTRALIZADA POR ROL
  private redireccionarPorRol(rol: string) {
    switch (rol) {
      case 'TILOGIST':
        this.router.navigate(['/main/parametros']);
        break;

      case 'ADLOGIST':
        this.router.navigate(['/main/maestros']);
        break;

      case 'APLOGIST':
        this.router.navigate(['/main/aprobaciones']);
        break;

      case 'ALLOGIST':
        this.router.navigate(['/main/despachos']);
        break;

      case 'OPLOGIST':
        this.router.navigate(['/main/parametros']);
        break;
        
      case 'EMLOGIST': // 👈 rol empaque
        this.router.navigate(['/main/parametros']);
        break;

      case 'LOLOGIST': // 👈 rol logistico
        this.router.navigate(['/main/parametros']);
        break;

      default:
        this.router.navigate(['/main/reporte_logistico']);
        break;
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