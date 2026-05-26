import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminLogisticaAuthService } from '../services/admin-logistica-auth.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
  selector: 'app-admin-logistica-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AdminLogisticaAuthService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  loginForm: FormGroup = this.fb.group({
    usuario: ['', [Validators.required, Validators.minLength(3)]],
    clave: ['', [Validators.required, Validators.minLength(4)]],
  });

  loading = signal(false);
  errorMessage = signal('');

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const credentials = this.loginForm.value;
      
      this.authService.login(credentials).subscribe({
        next: (user) => {
          this.loading.set(false);
          this.alertService.showAlert('Bienvenido', `Hola ${user.nombre}`, 'success');
          this.router.navigate(['/admin-logistica/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.error?.mensaje || 'Credenciales incorrectas';
          this.errorMessage.set(msg);
          this.alertService.showAlert('Error', msg, 'error');
        }
      });
    } catch (error) {
      this.loading.set(false);
      this.errorMessage.set('Error al iniciar sesión');
    }
  }

  get usuarioControl() {
    return this.loginForm.get('usuario');
  }

  get claveControl() {
    return this.loginForm.get('clave');
  }
}
