import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdministradorGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const isAdmin = await this.auth.isAdministrador();
    if (isAdmin) return true;

    // ✅ Redirigir a una ruta no protegida por este mismo guard
    this.router.navigate(['/main/maestros']);
    return false;
  }
}
