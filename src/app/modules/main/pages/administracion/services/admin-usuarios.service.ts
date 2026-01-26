import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminUsuariosService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar todos los usuarios (desde tabla maestra + config local)
   */
  listarUsuarios(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-usuarios-logistica`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar usuarios');
    }
  }

  /**
   * Configurar usuario en logística (crear/actualizar config local)
   * NOTA: El usuario debe existir en la tabla maestra
   */
  async configurarUsuario(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/configurar-usuario-logistica`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al configurar usuario');
    }
  }

  /**
   * Asignar roles adicionales a usuario
   */
  async asignarRolesAdicionales(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/asignar-roles-usuario`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al asignar roles adicionales');
    }
  }

  /**
   * Obtener configuración de usuario
   */
  obtenerConfiguracionUsuario(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/obtener-config-usuario`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener configuración');
    }
  }

  /**
   * Listar usuarios maestros (sin configuración local)
   * Para seleccionar usuarios a configurar
   */
  listarUsuariosMaestros(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-usuarios-maestros`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar usuarios maestros');
    }
  }
}
