import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminRolesService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar todos los roles (desde tabla maestra + config local)
   */
  listarRoles(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-roles-logistica`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar roles');
    }
  }

  /**
   * Configurar rol en logística (crear/actualizar config local)
   * NOTA: El rol debe existir en la tabla maestra
   */
  async configurarRol(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/configurar-rol-logistica`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al configurar rol');
    }
  }

  /**
   * Obtener configuración de rol
   */
  obtenerConfiguracionRol(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/obtener-config-rol`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener configuración');
    }
  }

  /**
   * Listar roles maestros (sin configuración local)
   * Para seleccionar roles a configurar
   */
  listarRolesMaestros(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-roles-maestros`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar roles maestros');
    }
  }
}
