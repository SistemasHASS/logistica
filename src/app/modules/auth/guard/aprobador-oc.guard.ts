import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Injectable({
  providedIn: 'root'
})
export class AprobadorOCGuard implements CanActivate {

  constructor(
    private dexieService: DexieService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.dexieService.showUsuario();
    const rol = user?.idrol || '';
    
    // Permitir acceso a aprobadores de OC/OS
    if (rol.includes('TILOGIST') || rol.includes('ADLOGIST') || rol.includes('JLOLOGIST') || rol.includes('JEMLOGIST') || rol.includes('FINANZAS') || rol.includes('GERENTE')) {
      return true;
    }
    
    // Redirigir a dashboard si no tiene permiso
    this.router.navigate(['/main/dashboard-logistica']);
    return false;
  }
}
