import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

export interface EstadoAprobadorNivel2 {
  verificado: boolean;
  /** Pertenece a la cadena activa de al menos una empresa */
  esAprobador: boolean;
  /** Es el aprobador vigente (primer disponible por orden) en al menos una empresa */
  esVigente: boolean;
}

/**
 * Resuelve si el usuario logueado es aprobador nivel 2 por identidad (DNI),
 * independiente de su idrol. Cubre casos atípicos (ej. subgerente con rol
 * FINANZAS) configurados desde "Flujo por Niveles" en admin-logistica.
 */
@Injectable({ providedIn: 'root' })
export class AprobadorNivel2Service {
  private http = inject(HttpClient);
  private dexieService = inject(DexieService);
  private baseUrl = `${environment.baseUrl}/api/logistica`;

  private _estado = signal<EstadoAprobadorNivel2>({
    verificado: false,
    esAprobador: false,
    esVigente: false,
  });
  readonly estado = this._estado.asReadonly();

  /** Consulta cacheada; llama a verificar() la primera vez */
  async esAprobadorNivel2(): Promise<boolean> {
    if (this._estado().verificado) return this._estado().esAprobador;
    return this.verificar();
  }

  async verificar(): Promise<boolean> {
    const identidad = await this.resolverIdentidad();
    if (!identidad) {
      this._estado.set({ verificado: true, esAprobador: false, esVigente: false });
      return false;
    }
    try {
      const res = await lastValueFrom(
        this.http.post<any>(`${this.baseUrl}/es-aprobador-nivel2`, { documentoidentidad: identidad })
      );
      const data = this.parseResultado(res);
      const esAprobador = data?.esAprobador === 1 || data?.esAprobador === true;
      const esVigente = data?.esVigente === 1 || data?.esVigente === true;
      this._estado.set({ verificado: true, esAprobador, esVigente });
      return esAprobador;
    } catch {
      this._estado.set({ verificado: true, esAprobador: false, esVigente: false });
      return false;
    }
  }

  invalidar(): void {
    this._estado.set({ verificado: false, esAprobador: false, esVigente: false });
  }

  /** DNI del usuario logueado; fallback al username de la sesión admin-logistica */
  private async resolverIdentidad(): Promise<string | null> {
    const usuario = await this.dexieService.showUsuario();
    if (usuario?.documentoidentidad) return usuario.documentoidentidad;
    try {
      const adminUser = JSON.parse(localStorage.getItem('admin_logistica_user') || 'null');
      if (adminUser?.usuario) return adminUser.usuario;
    } catch { /* sin sesión admin-logistica */ }
    return null;
  }

  /** El API puede devolver el objeto directo o {resultado: string|object} */
  private parseResultado(res: any): any {
    if (!res) return null;
    let data = res?.resultado !== undefined ? res.resultado : res;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return null; }
    }
    if (Array.isArray(data)) data = data[0];
    return data ?? null;
  }
}
