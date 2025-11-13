import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AlmacenGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    if (await this.auth.isAlmacen()) return true;
    this.router.navigate(['/main/aprobaciones']);
    return false;
  }
}
