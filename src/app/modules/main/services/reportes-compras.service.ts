import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportesComprasService {
  private baseUrl = `${environment.baseUrl}/api/logistica/reportes-compras`;

  constructor(private http: HttpClient) {}

  async reporteSolicitudesPorPeriodo(filtros: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/solicitudes-periodo`, filtros)
      );
      return response;
    } catch (error) {
      console.error('Error al generar reporte de solicitudes por período:', error);
      throw error;
    }
  }

  async reporteItemsSolicitados(filtros: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/items-solicitados`, filtros)
      );
      return response;
    } catch (error) {
      console.error('Error al generar reporte de items solicitados:', error);
      throw error;
    }
  }

  async reporteEficienciaAprobaciones(filtros: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/eficiencia-aprobaciones`, filtros)
      );
      return response;
    } catch (error) {
      console.error('Error al generar reporte de eficiencia:', error);
      throw error;
    }
  }

  async reporteSolicitudesPorUsuario(filtros: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/por-usuario`, filtros)
      );
      return response;
    } catch (error) {
      console.error('Error al generar reporte por usuario:', error);
      throw error;
    }
  }

  async reporteAnalisisRechazos(filtros: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/analisis-rechazos`, filtros)
      );
      return response;
    } catch (error) {
      console.error('Error al generar reporte de rechazos:', error);
      throw error;
    }
  }

  async reporteComparativoAlmacenes(filtros: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.baseUrl}/comparativo-almacenes`, filtros)
      );
      return response;
    } catch (error) {
      console.error('Error al generar reporte comparativo:', error);
      throw error;
    }
  }
}
