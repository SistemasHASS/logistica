import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmpaqueGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    if (await this.auth.isEmpaque()) return true;
    this.router.navigate(['/main/parametros']);
    return false;
  }
}
