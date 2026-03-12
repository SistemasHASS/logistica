import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DevolucionProveedorService {
  private baseUrl = `${environment.baseUrl}/api/logistica/devolucion-proveedor`;

  constructor(private http: HttpClient) {}

  // Registrar una devolución
  async registrarDevolucion(devolucion: any): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/registrar`, devolucion).toPromise();
      return response;
    } catch (error) {
      console.error('Error al registrar devolución:', error);
      throw error;
    }
  }

  // Listar devoluciones
  async listarDevoluciones(filtros?: any): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/listar`, filtros || {}).toPromise();
      return response;
    } catch (error) {
      console.error('Error al listar devoluciones:', error);
      throw error;
    }
  }

  // Obtener devolución por ID
  async obtenerDevolucionPorId(id: number): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/obtener-por-id`, { id }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al obtener devolución:', error);
      throw error;
    }
  }

  // Cambiar estado de devolución
  async cambiarEstado(id: number, estado: string, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/cambiar-estado`, {
        id,
        estado,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      throw error;
    }
  }

  // Resolver devolución
  async resolverDevolucion(id: number, resolucion: string, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/resolver`, {
        id,
        resolucion,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al resolver devolución:', error);
      throw error;
    }
  }

  // Anular devolución
  async anularDevolucion(id: number, motivo: string, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/anular`, {
        id,
        motivo,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al anular devolución:', error);
      throw error;
    }
  }

  // Listar recepciones no conformes
  async listarRecepcionesNoConformes(filtros?: any): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/listar-recepciones-no-conformes`, filtros || {}).toPromise();
      return response;
    } catch (error) {
      console.error('Error al listar recepciones no conformes:', error);
      throw error;
    }
  }

  // Generar devolución desde recepción
  async generarDevolucionDesdeRecepcion(recepcionId: number, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/generar-desde-recepcion`, {
        recepcionId,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al generar devolución desde recepción:', error);
      throw error;
    }
  }
}
