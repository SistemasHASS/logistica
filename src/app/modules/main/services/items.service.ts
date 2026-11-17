
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, firstValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private readonly baseUrl: string = environment.baseUrl;
  private readonly CLAVE_SYNC_ITEMS = 'maestroItems';

  constructor(
    private http: HttpClient,
    private dexieService: DexieService,
  ) {}

  getItem(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-item`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener maestro de item'
      );
    }
  }

  getItemSlim(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-item-slim`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener maestro de item slim'
      );
    }
  }

  getItemVersion(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-item-version`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener versión del maestro de item'
      );
    }
  }

  /**
   * Mantiene el maestro de items en Dexie entre sesiones: consulta el
   * fingerprint del servidor (listar-item-version) y SOLO re-descarga el
   * maestro completo cuando total/ultimaFechaModif/checksum difieren de lo
   * guardado en syncMeta. Falla en silencio para no bloquear el arranque.
   */
  async asegurarMaestroItemsActualizado(): Promise<void> {
    try {
      const remota: any = await firstValueFrom(this.getItemVersion([{}]));
      const v = Array.isArray(remota) ? remota[0] : remota;
      if (!v || typeof v !== 'object') return;

      const total = Number(v.total ?? v.cantidad ?? 0);
      const hash = `${v.ultimaFechaModif ?? ''}|${v.checksum ?? ''}`;

      const meta = await this.dexieService.getSyncMeta(this.CLAVE_SYNC_ITEMS);
      const localCount = await this.dexieService.countMaestroItems();
      if (
        total > 0 &&
        meta?.hash === hash &&
        meta.cantidadRegistros === total &&
        localCount === total
      ) {
        return; // Sin cambios: se usa la copia local
      }

      const resp: any = await firstValueFrom(this.getItem([{}]));
      const items = Array.isArray(resp) ? resp : resp?.resultado || [];
      if (Array.isArray(items) && items.length > 0 && items[0].item !== undefined) {
        await this.dexieService.clearMaestroItem();
        await this.dexieService.saveMaestroItems(items);
        await this.dexieService.saveSyncMeta({
          clave: this.CLAVE_SYNC_ITEMS,
          fechaSync: new Date().toISOString(),
          hash,
          cantidadRegistros: items.length,
        });
        console.log('✅ Maestro de items actualizado:', items.length, 'registros');
      }
    } catch (e) {
      console.warn('⚠️ No se pudo verificar la versión del maestro de items:', e);
    }
  }

  registrarItem(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/registrar-item`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al registrar maestro de item'
      );
    }
  }

  updateItem(body: any) {
    const url = `${this.baseUrl}/api/logistica/update-item`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al actualizar maestro de item'
      );
    }
  }

  ItemCorrelativo(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/item-correlativo`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al consultar correlativo de item'
      );
    }
  }

  NuevoItemCorrelativo(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/item-correlativo-nuevo`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al generar nuevo correlativo de item'
      );
    }
  }
}
