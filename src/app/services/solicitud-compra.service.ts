import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SolicitudCompraService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar solicitudes de compra desde el backend
   */
  async listarSolicitudes(filtros: any = {}): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/solicitud-compra/listar`;
      const response = await firstValueFrom(this.http.post<any>(url, filtros));
      return response;
    } catch (error) {
      console.error('Error al listar solicitudes desde backend:', error);
      throw error;
    }
  }

  /**
   * Crear solicitud de compra en el backend
   */
  async crearSolicitud(solicitud: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/solicitud-compra/crear`;
      const response = await firstValueFrom(this.http.post<any>(url, solicitud));
      return response;
    } catch (error) {
      console.error('Error al crear solicitud en backend:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de solicitud en el backend
   */
  async actualizarEstado(
    idSolicitud: number, 
    estado: string, 
    usuarioAprueba?: string, 
    motivoRechazo?: string
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/solicitud-compra/actualizar-estado`;
      const response = await firstValueFrom(this.http.post<any>(url, {
        idSolicitud,
        estado,
        usuarioAprueba,
        motivoRechazo
      }));
      return response;
    } catch (error) {
      console.error('Error al actualizar estado en backend:', error);
      throw error;
    }
  }

  /**
   * Eliminar solicitud en el backend
   */
  async eliminarSolicitud(idSolicitud: number): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/solicitud-compra/eliminar`;
      const response = await firstValueFrom(this.http.post<any>(url, { idSolicitud }));
      return response;
    } catch (error) {
      console.error('Error al eliminar solicitud en backend:', error);
      throw error;
    }
  }

  /**
   * Obtener contadores de solicitudes desde el backend
   */
  async obtenerContadores(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/solicitud-compra/contadores`;
      const response = await firstValueFrom(this.http.post<any>(url, {}));
      return response;
    } catch (error) {
      console.error('Error al obtener contadores desde backend:', error);
      throw error;
    }
  }

  /**
   * Verificar conectividad con el backend
   */
  async verificarConexion(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/logistica/solicitud-compra/contadores`;
      await firstValueFrom(this.http.post<any>(url, {}));
      return true;
    } catch (error) {
      console.warn('Sin conexión con el backend');
      return false;
    }
  }

  /**
   * Guardar adjunto de solicitud de compra
   */
  async guardarAdjunto(adjunto: any): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/solicitud-compra/guardar-adjunto`;
      const response = await firstValueFrom(this.http.post<any>(url, adjunto));
      return response;
    } catch (error) {
      console.error('Error al guardar adjunto en backend:', error);
      throw error;
    }
  }

  /**
   * Listar solicitudes procesadas desde el backend (con datos completos de cotizaciones)
   * Usa el SP LOGISTICA_listarSolicitudesCompra
   */
  async listarSolicitudesProcesadas(empresa: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/logistica/solicitud-compra/listar-por-empresa`;
      const response = await firstValueFrom(this.http.post<any>(url, { empresa }));
      return response;
    } catch (error) {
      console.error('Error al listar solicitudes procesadas desde backend:', error);
      throw error;
    }
  }
}
