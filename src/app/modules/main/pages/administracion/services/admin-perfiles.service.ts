import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminPerfilesService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar todos los perfiles
   */
  listarPerfiles(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-perfiles`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar perfiles');
    }
  }

  /**
   * Crear nuevo perfil
   */
  async crearPerfil(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/crear-perfil`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al crear perfil');
    }
  }

  /**
   * Actualizar perfil existente
   */
  async actualizarPerfil(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/actualizar-perfil`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al actualizar perfil');
    }
  }

  /**
   * Eliminar perfil (cambiar estado)
   */
  async eliminarPerfil(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/eliminar-perfil`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al eliminar perfil');
    }
  }

  /**
   * Obtener perfil por ID
   */
  obtenerPerfilPorId(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/obtener-perfil`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener perfil');
    }
  }

  /**
   * Asignar roles a perfil
   */
  async asignarRolesPerfil(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/asignar-roles-perfil`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al asignar roles al perfil');
    }
  }

  /**
   * Asignar perfil a usuario
   */
  async asignarPerfilUsuario(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/asignar-perfil-usuario`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al asignar perfil al usuario');
    }
  }

  /**
   * Quitar perfil a usuario
   */
  async quitarPerfilUsuario(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/quitar-perfil-usuario`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al quitar perfil al usuario');
    }
  }

  /**
   * Listar perfiles de un usuario
   */
  listarPerfilesUsuario(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-perfiles-usuario`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar perfiles del usuario');
    }
  }

  /**
   * Roles efectivos del usuario (rol directo + roles de perfiles)
   */
  listarRolesEfectivos(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-roles-efectivos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar roles efectivos');
    }
  }
}
