import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

export interface BrandingConfig {
  id?: number;
  clave: string;
  valor: string;
  descripcion?: string;
  activo?: boolean;
  fechaModificacion?: string;
  usuarioModifica?: string;
}

export interface BrandingData {
  logoLogin: string;
  iconApp: string;
  tituloLogin: string;
  subtituloLogin: string;
}

export const BRANDING_DEFAULTS: BrandingData = {
  logoLogin: '',
  iconApp: '',
  tituloLogin: 'MODULO LOGISTICA',
  subtituloLogin: 'Ingrese sus credenciales',
};

@Injectable({
  providedIn: 'root',
})
export class AdminBrandingService {
  private readonly baseUrl: string = environment.baseUrl;
  private _cache: BrandingData | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las claves de branding desde el backend y las mapea a BrandingData.
   * Usa caché en memoria para no repetir llamadas dentro de la misma sesión.
   */
  async obtenerBranding(): Promise<BrandingData> {
    if (this._cache) return this._cache;

    try {
      const url = `${this.baseUrl}/api/logistica/obtener-config-branding`;
      const response: any = await lastValueFrom(this.http.post<any>(url, {}));

      let items: BrandingConfig[] = [];
      if (response && response.resultado) {
        try {
          items = JSON.parse(response.resultado);
        } catch {
          items = [];
        }
      } else if (Array.isArray(response)) {
        items = response;
      }

      const data: BrandingData = { ...BRANDING_DEFAULTS };
      items.forEach((item) => {
        switch (item.clave) {
          case 'LOGO_LOGIN':
            data.logoLogin = item.valor || '';
            break;
          case 'ICON_APP':
            data.iconApp = item.valor || '';
            break;
          case 'TITULO_LOGIN':
            data.tituloLogin = item.valor || BRANDING_DEFAULTS.tituloLogin;
            break;
          case 'SUBTITULO_LOGIN':
            data.subtituloLogin = item.valor || BRANDING_DEFAULTS.subtituloLogin;
            break;
        }
      });

      this._cache = data;
      return data;
    } catch {
      return { ...BRANDING_DEFAULTS };
    }
  }

  /**
   * Guarda una clave de branding individual.
   */
  async guardarBranding(
    clave: string,
    valor: string,
    usuarioModifica?: string
  ): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/guardar-config-branding`;
    try {
      const result = await lastValueFrom(
        this.http.post<any>(url, { clave, valor, usuarioModifica: usuarioModifica || 'ADMIN' })
      );
      this._cache = null;
      return result;
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al guardar branding');
    }
  }

  /**
   * Guarda múltiples claves en secuencia.
   */
  async guardarTodoBranding(
    data: Partial<BrandingData>,
    usuarioModifica?: string
  ): Promise<void> {
    const map: Record<string, string> = {
      logoLogin: 'LOGO_LOGIN',
      iconApp: 'ICON_APP',
      tituloLogin: 'TITULO_LOGIN',
      subtituloLogin: 'SUBTITULO_LOGIN',
    };

    for (const [key, clave] of Object.entries(map)) {
      const valor = (data as any)[key];
      if (valor !== undefined) {
        await this.guardarBranding(clave, valor, usuarioModifica);
      }
    }
    this._cache = null;
  }

  /**
   * Invalida el caché para forzar recarga en el próximo acceso.
   */
  invalidarCache(): void {
    this._cache = null;
  }
}
