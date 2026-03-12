import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReingresoService {
  private baseUrl = `${environment.baseUrl}/api/logistica/reingreso`;

  constructor(private http: HttpClient) {}

  // Registrar un reingreso
  async registrarReingreso(reingreso: any): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/registrar`, reingreso).toPromise();
      return response;
    } catch (error) {
      console.error('Error al registrar reingreso:', error);
      throw error;
    }
  }

  // Listar reingresos
  async listarReingresos(filtros?: any): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/listar`, filtros || {}).toPromise();
      return response;
    } catch (error) {
      console.error('Error al listar reingresos:', error);
      throw error;
    }
  }

  // Obtener reingreso por ID
  async obtenerReingresoPorId(id: number): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/obtener-por-id`, { id }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al obtener reingreso:', error);
      throw error;
    }
  }

  // Aprobar reingreso
  async aprobarReingreso(id: number, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/aprobar`, {
        id,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al aprobar reingreso:', error);
      throw error;
    }
  }

  // Rechazar reingreso
  async rechazarReingreso(id: number, motivo: string, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/rechazar`, {
        id,
        motivo,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al rechazar reingreso:', error);
      throw error;
    }
  }

  // Anular reingreso
  async anularReingreso(id: number, motivo: string, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/anular`, {
        id,
        motivo,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al anular reingreso:', error);
      throw error;
    }
  }

  // Listar saldos pendientes
  async listarSaldosPendientes(filtros?: any): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/listar-saldos-pendientes`, filtros || {}).toPromise();
      return response;
    } catch (error) {
      console.error('Error al listar saldos pendientes:', error);
      throw error;
    }
  }

  // Generar reingreso desde saldo pendiente
  async generarReingresoDesdeSaldo(saldoPendienteId: number, motivo: string, usuario: string): Promise<any> {
    try {
      const response = await this.http.post(`${this.baseUrl}/generar-desde-saldo`, {
        saldoPendienteId,
        motivo,
        usuario
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error al generar reingreso desde saldo:', error);
      throw error;
    }
  }
}
