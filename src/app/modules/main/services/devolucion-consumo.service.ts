import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DevolucionConsumoService {
  private baseUrl = `${environment.baseUrl}/api/logistica/devolucion-consumo`;

  constructor(private http: HttpClient) {}

  // Registrar una devolución de consumo
  async registrarDevolucion(devolucion: any): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/registrar`, devolucion).toPromise();
      return response;
    } catch (error) {
      console.error('Error al registrar devolución de consumo:', error);
      throw error;
    }
  }

  // Listar devoluciones de consumo
  async listarDevoluciones(filtros?: any): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/listar`, filtros || {}).toPromise();
      return response;
    } catch (error) {
      console.error('Error al listar devoluciones de consumo:', error);
      throw error;
    }
  }

  // Obtener devolución por ID
  async obtenerDevolucionPorId(id: number): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/obtener-por-id`, { id }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al obtener devolución de consumo:', error);
      throw error;
    }
  }

  // Aprobar devolución
  async aprobarDevolucion(id: number, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/aprobar`, {
        id,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al aprobar devolución:', error);
      throw error;
    }
  }

  // Rechazar devolución
  async rechazarDevolucion(id: number, motivo: string, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/rechazar`, {
        id,
        motivo,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al rechazar devolución:', error);
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

  // Listar despachos de consumo
  async listarDespachosConsumo(filtros?: any): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/listar-despachos-consumo`, filtros || {}).toPromise();
      return response;
    } catch (error) {
      console.error('Error al listar despachos de consumo:', error);
      throw error;
    }
  }
}
