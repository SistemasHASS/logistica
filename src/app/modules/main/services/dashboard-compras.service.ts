import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardComprasService {
  private baseUrl = `${environment.baseUrl}/api/logistica/dashboard-compras`;

  constructor(private http: HttpClient) {}

  async obtenerKPIs(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/kpis`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al obtener KPIs:', error);
      throw error;
    }
  }

  async obtenerSolicitudesPorEstado(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/solicitudes-por-estado`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al obtener solicitudes por estado:', error);
      throw error;
    }
  }

  async obtenerTendencia(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/tendencia`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al obtener tendencia:', error);
      throw error;
    }
  }

  async obtenerTopItems(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/top-items`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al obtener top items:', error);
      throw error;
    }
  }

  async obtenerSolicitudesRecientes(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/solicitudes-recientes`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al obtener solicitudes recientes:', error);
      throw error;
    }
  }

  async obtenerEstadisticasAlmacen(filtros?: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/estadisticas-almacen`, filtros || {})
      );
      return response;
    } catch (error) {
      console.error('Error al obtener estadísticas por almacén:', error);
      throw error;
    }
  }
}
