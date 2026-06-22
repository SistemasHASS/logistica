import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConformidadServiciosGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.auth.getUser();
    const rol = user?.idrol ?? '';

    const permitido =
      rol.includes('LOLOGIST')  ||
      rol.includes('TILOGIST')  ||
      rol.includes('ADLOGIST')  ||
      rol.includes('OPLOGIST')  ||
      rol.includes('EMLOGIST')  ||
      rol.includes('JEMLOGIST') ||
      rol.includes('JLOLOGIST');

    if (permitido) return true;

    this.router.navigate(['/main/dashboard-logistica']);
    return false;
  }
}
