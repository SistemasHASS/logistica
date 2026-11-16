import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

/**
 * Módulo de reporte (tabla LOGISTICA_ConfigReporteMenu) → id del ítem
 * de menú definido en ACCORDION_DEFAULT (layout-config.service).
 */
export const MODULO_MENU_ITEM: Record<string, string> = {
  ANALISIS_REQ_COMPRA: 'analisis-req-compra',
  SEGUIMIENTO_REQ_COMPRA: 'seguimiento-req-compra',
};

/**
 * Resuelve qué ítems de menú de reportes restringidos debe ocultar el
 * layout para el usuario logueado, según LOGISTICA_ConfigReporteMenu:
 *   menuVisible = 0    → oculto para todos
 *   soloConAcceso = 1  → visible solo si el DNI tiene acceso activo
 */
@Injectable({ providedIn: 'root' })
export class ReporteMenuService {
  private http = inject(HttpClient);
  private dexieService = inject(DexieService);
  private baseUrl = `${environment.baseUrl}/api/logistica`;

  private _itemsOcultos = signal<Set<string>>(new Set());
  readonly itemsOcultos = this._itemsOcultos.asReadonly();

  async verificar(): Promise<void> {
    const identidad = await this.resolverIdentidad();
    try {
      const res = await lastValueFrom(
        this.http.post<any>(`${this.baseUrl}/verificar-menu-reporte`, [{ dni: identidad ?? '' }])
      );
      const filas: any[] = Array.isArray(res) ? res : this.parseResultado(res) ?? [];
      const ocultos = new Set<string>();
      for (const f of filas) {
        const itemId = MODULO_MENU_ITEM[f?.modulo];
        const mostrar = f?.mostrar === true || f?.mostrar === 1;
        if (itemId && !mostrar) ocultos.add(itemId);
      }
      this._itemsOcultos.set(ocultos);
    } catch {
      // Fail-open: ante error de red no ocultamos nada
      this._itemsOcultos.set(new Set());
    }
  }

  invalidar(): void {
    this._itemsOcultos.set(new Set());
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

  /** El API puede devolver el array directo o {resultado: string|object} */
  private parseResultado(res: any): any[] | null {
    if (!res) return null;
    let data = res?.resultado !== undefined ? res.resultado : res;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return null; }
    }
    return Array.isArray(data) ? data : null;
  }
}
