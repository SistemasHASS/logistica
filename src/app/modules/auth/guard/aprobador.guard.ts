import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AprobacionesAmbitosService } from '@/app/modules/main/services/aprobaciones-ambitos.service';

@Injectable({ providedIn: 'root' })
export class AprobadorGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private ambitos: AprobacionesAmbitosService,
  ) {}

  async canActivate(): Promise<boolean> {
    if (await this.auth.isAprobador()) return true;
    if (await this.tienePermisoAmbito()) return true;
    this.router.navigate(['/main/aprobaciones']);
    return false;
  }

  /**
   * Permite el acceso a usuarios con permisos de aprobación N1/N2 vigentes
   * en el flujo por ámbitos, aunque no tengan un rol aprobador legado.
   */
  private async tienePermisoAmbito(): Promise<boolean> {
    try {
      const user = await this.auth.getUser();
      if (!user?.ruc || !user?.documentoidentidad) return false;
      const contexto = await this.ambitos
        .contexto(user.ruc, user.documentoidentidad)
        .toPromise();
      return !!contexto?.habilitado && (contexto.permisosAprobacion?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }
}
