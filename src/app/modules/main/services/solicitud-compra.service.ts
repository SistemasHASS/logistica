import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SolicitudCompraService {
  private baseUrl = `${environment.baseUrl}/api/logistica/solicitud-compra`;

  constructor(private http: HttpClient) {}

  async listarSolicitudes(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/listar`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al listar solicitudes de compra:', error);
      throw error;
    }
  }

  async crearSolicitud(solicitud: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/crear`, solicitud)
      );
      return response;
    } catch (error) {
      console.error('Error al crear solicitud de compra:', error);
      throw error;
    }
  }

  async actualizarEstado(data: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/actualizar-estado`, data)
      );
      return response;
    } catch (error) {
      console.error('Error al actualizar estado de solicitud:', error);
      throw error;
    }
  }

  async eliminarSolicitud(idSolicitud: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/eliminar`, { idSolicitud })
      );
      return response;
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      throw error;
    }
  }

  async obtenerContadores(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/contadores`, {})
      );
      return response;
    } catch (error) {
      console.error('Error al obtener contadores:', error);
      throw error;
    }
  }
}
