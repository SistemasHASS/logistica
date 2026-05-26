import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Injectable({
  providedIn: 'root'
})
export class AdminLogisticaGuard implements CanActivate {

  constructor(
    private dexieService: DexieService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.dexieService.showUsuario();
    const rol = user?.idrol || '';
    
    // Permitir acceso a TILOGIST, ADLOGIST y JLOLOGIST
    if (rol.includes('TILOGIST') || rol.includes('ADLOGIST') || rol.includes('JLOLOGIST')) {
      return true;
    }
    
    // Redirigir a dashboard si no tiene permiso
    this.router.navigate(['/main/dashboard-oplogist']);
    return false;
  }
}
