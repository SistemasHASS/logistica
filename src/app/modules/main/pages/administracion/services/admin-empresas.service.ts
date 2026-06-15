import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface Empresa {
  id?: number;
  ruc: string;
  razonSocial: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logoBase64?: string;
  correoEnvio?: string;
  correoNombre?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSeguro?: boolean;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AdminEmpresasService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar todas las empresas
   */
  listarEmpresas(): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-empresas`;
    return this.http.post<any>(url, {}).pipe(
      tap(response => {
        console.log('Empresas response:', response);
      }),
      catchError(error => {
        console.error('Error listando empresas:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener configuración de empresa por ID
   */
  obtenerEmpresa(id: number): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/obtener-config-empresa`;
    return this.http.post<any>(url, { id }).pipe(
      catchError(error => {
        console.error('Error obteniendo empresa:', error);
        throw error;
      })
    );
  }

  /**
   * Guardar empresa (crear o actualizar)
   */
  async guardarEmpresa(empresa: Empresa): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/guardar-config-empresa`;
    try {
      return await lastValueFrom(this.http.post<any>(url, empresa));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al guardar empresa');
    }
  }

  /**
   * Eliminar empresa (desactivar)
   */
  async eliminarEmpresa(id: number): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/guardar-config-empresa`;
    try {
      return await lastValueFrom(this.http.post<any>(url, { id, activo: false }));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al eliminar empresa');
    }
  }
}
