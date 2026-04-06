import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AprobacionSCService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar solicitudes pendientes de aprobación
   */
  async listarSolicitudesPendientes(filtros: any = {}): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/listar-pendientes`;
      const response = await firstValueFrom(this.http.post<any>(url, filtros));
      return response;
    } catch (error) {
      console.error('Error al listar solicitudes pendientes:', error);
      throw error;
    }
  }

  /**
   * Aprobar solicitud de compra
   */
  async aprobarSolicitud(idAprobacion: number, usuarioAprobacion: string, observaciones?: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/aprobar`;
      const response = await firstValueFrom(this.http.post<any>(url, {
        idAprobacion,
        usuarioAprobacion,
        observaciones
      }));
      return response;
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      throw error;
    }
  }

  /**
   * Rechazar solicitud de compra
   */
  async rechazarSolicitud(idAprobacion: number, usuarioAprobacion: string, motivoRechazo: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/rechazar`;
      const response = await firstValueFrom(this.http.post<any>(url, {
        idAprobacion,
        usuarioAprobacion,
        motivoRechazo
      }));
      return response;
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      throw error;
    }
  }

  /**
   * Asignar aprobadores a una solicitud
   */
  async asignarAprobadores(solicitud: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/asignar-aprobadores`;
      const response = await firstValueFrom(this.http.post<any>(url, solicitud));
      return response;
    } catch (error) {
      console.error('Error al asignar aprobadores:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de aprobaciones de una solicitud
   */
  async obtenerHistorial(idSolicitud?: number, numeroSolicitud?: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/historial`;
      const response = await firstValueFrom(this.http.post<any>(url, {
        idSolicitud,
        numeroSolicitud
      }));
      return response;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  }

  /**
   * Obtener contadores de aprobaciones
   */
  async obtenerContadores(usuarioAprobador?: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/contadores`;
      const response = await firstValueFrom(this.http.post<any>(url, {
        usuarioAprobador
      }));
      return response;
    } catch (error) {
      console.error('Error al obtener contadores:', error);
      throw error;
    }
  }

  /**
   * Listar flujos de aprobación configurados
   */
  async listarFlujos(filtros: any = {}): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/flujos/listar`;
      const response = await firstValueFrom(this.http.post<any>(url, filtros));
      return response;
    } catch (error) {
      console.error('Error al listar flujos:', error);
      throw error;
    }
  }

  /**
   * Guardar flujo de aprobación
   */
  async guardarFlujo(flujo: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/flujos/guardar`;
      const response = await firstValueFrom(this.http.post<any>(url, flujo));
      return response;
    } catch (error) {
      console.error('Error al guardar flujo:', error);
      throw error;
    }
  }

  /**
   * Eliminar flujo de aprobación
   */
  async eliminarFlujo(idFlujo: number): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/flujos/eliminar`;
      const response = await firstValueFrom(this.http.post<any>(url, { idFlujo }));
      return response;
    } catch (error) {
      console.error('Error al eliminar flujo:', error);
      throw error;
    }
  }

  /**
   * Listar usuarios aprobadores
   */
  async listarUsuariosAprobadores(filtros: any = {}): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/usuarios/listar`;
      const response = await firstValueFrom(this.http.post<any>(url, filtros));
      return response;
    } catch (error) {
      console.error('Error al listar usuarios aprobadores:', error);
      throw error;
    }
  }

  /**
   * Guardar usuario aprobador
   */
  async guardarUsuarioAprobador(usuario: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/usuarios/guardar`;
      const response = await firstValueFrom(this.http.post<any>(url, usuario));
      return response;
    } catch (error) {
      console.error('Error al guardar usuario aprobador:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario aprobador
   */
  async eliminarUsuarioAprobador(idUsuarioAprobador: number): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/usuarios/eliminar`;
      const response = await firstValueFrom(this.http.post<any>(url, { idUsuarioAprobador }));
      return response;
    } catch (error) {
      console.error('Error al eliminar usuario aprobador:', error);
      throw error;
    }
  }

  /**
   * Obtener roles de aprobación disponibles
   */
  async obtenerRoles(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/roles`;
      const response = await firstValueFrom(this.http.get<any>(url));
      return response;
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  }

  /**
   * Verificar conectividad con el backend
   */
  async verificarConexion(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/logistica/aprobacion-sc/contadores`;
      await firstValueFrom(this.http.post<any>(url, {}));
      return true;
    } catch (error) {
      console.warn('Sin conexión con el backend de aprobaciones');
      return false;
    }
  }
}
