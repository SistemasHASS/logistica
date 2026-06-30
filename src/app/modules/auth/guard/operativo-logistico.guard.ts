import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OperativoLogisticoGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.auth.getUser();
    
    // Roles permitidos para dashboard operativo/logístico
    const rolesPermitidos = ['OPLOGIST', 'LOLOGIST', 'EMLOGIST', 'JEMLOGIST', 'JLOLOGIST', 'APLOGIST', 'ADLOGIST', 'ALLOGIST'];
    const rol = user?.idrol ?? '';
    
    if (user && rolesPermitidos.some(r => rol.includes(r))) {
      return true;
    }
    
    // Redirigir al dashboard principal si no tiene permiso
    this.router.navigate(['/main/dashboard-logistica']);
    return false;
  }
}
