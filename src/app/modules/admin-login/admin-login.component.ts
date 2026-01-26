import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthAdminService } from './auth-admin.service';
import { APP_VERSION, APP_INFO } from 'src/environments/version';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent {

  appVersion = APP_VERSION;
  appInfo = APP_INFO;

  loginForm: FormGroup;
  loading = false;
  error = '';
  mostrarClave = false;
  isCharge: boolean = false;
  clave = '';
  mensajeLogin: String = '';

  constructor(
    private fb: FormBuilder,
    private authAdmin: AuthAdminService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      clave: ['', Validators.required]
    });
  }

  toggleClave(): void {
    this.mostrarClave = !this.mostrarClave;
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const { usuario, clave } = this.loginForm.value;

      const resp = await this.authAdmin.login(usuario, clave);

      // 👇 TU SP DEVUELVE UN ARRAY
      if (!resp || !resp.length) {
        this.error = 'Credenciales inválidas';
        this.mensajeLogin = 'Credenciales inválidas. Por favor, intente de nuevo.';
        return;
      }

      const admin = resp[0];

      // 👇 Validamos token
      if (!admin.token) {
        this.error = 'Error de autenticación';
        this.mensajeLogin = 'Error de autenticación. Por favor, intente de nuevo.';      
        return;
      }

      localStorage.setItem('ADMIN_TOKEN', admin.token);
      localStorage.setItem('ADMIN_USER', JSON.stringify(admin));

      this.router.navigate(['/administracion/dashboard']);

    } catch (err: any) {
      this.error = err?.message || 'Error inesperado';
      this.mensajeLogin = this.error;
    } finally {
      this.loading = false;
    }
  }
}