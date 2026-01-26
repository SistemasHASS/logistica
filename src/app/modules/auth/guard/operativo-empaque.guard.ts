import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class OperativoEmpaqueGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    if (
      await this.auth.isUsuario() ||
      await this.auth.isEmpaque() ||
      await this.auth.isLogistico()
    ) {
      return true;
    }

    this.router.navigate(['/main/reporte_logistico']);
    return false;
  }
}
