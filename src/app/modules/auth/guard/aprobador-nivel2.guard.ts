import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AprobadorNivel2Service } from '@/app/modules/main/services/aprobador-nivel2.service';
import { AprobacionesAmbitosService } from '@/app/modules/main/services/aprobaciones-ambitos.service';

/**
 * Guard de la bandeja Aprobación Gerencia (nivel 2).
 * Permite acceso a roles aprobadores existentes, a cualquier usuario
 * cuyo DNI esté en la cadena nivel 2 legada, y a aprobadores N2 del
 * flujo por ámbitos.
 */
@Injectable({ providedIn: 'root' })
export class AprobadorNivel2Guard implements CanActivate {
  constructor(
    private auth: AuthService,
    private nivel2: AprobadorNivel2Service,
    private ambitos: AprobacionesAmbitosService,
  ) {}

  async canActivate(): Promise<boolean> {
    if (await this.auth.isAprobador()) return true;
    if (await this.nivel2.esAprobadorNivel2()) return true;
    return this.tienePermisoAmbitoN2();
  }

  private async tienePermisoAmbitoN2(): Promise<boolean> {
    try {
      const user = await this.auth.getUser();
      if (!user?.ruc || !user?.documentoidentidad) return false;
      const contexto = await this.ambitos
        .contexto(user.ruc, user.documentoidentidad)
        .toPromise();
      return !!contexto?.habilitado
        && (contexto.permisosAprobacion ?? []).some(p => p.puedeAprobarN2 === true || p.puedeAprobarN2 as any === 1);
    } catch {
      return false;
    }
  }
}
