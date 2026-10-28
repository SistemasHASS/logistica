import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AprobadorNivel2Service } from '@/app/modules/main/services/aprobador-nivel2.service';

/**
 * Guard de la bandeja Aprobación Gerencia (nivel 2).
 * Permite acceso a roles aprobadores existentes y a cualquier usuario
 * cuyo DNI esté en la cadena nivel 2, sin importar su idrol.
 */
@Injectable({ providedIn: 'root' })
export class AprobadorNivel2Guard implements CanActivate {
  constructor(
    private auth: AuthService,
    private nivel2: AprobadorNivel2Service
  ) {}

  async canActivate(): Promise<boolean> {
    if (await this.auth.isAprobador()) return true;
    return this.nivel2.esAprobadorNivel2();
  }
}
