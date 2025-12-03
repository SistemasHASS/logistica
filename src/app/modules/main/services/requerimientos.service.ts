import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RequerimientosService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getRequerimientos(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-requerimientos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener requerimientos de consumo'
      );
    }
  }

  getRequerimientosConsumo(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-requerimiento-consumo`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener requerimientos de consumo'
      );
    }
  }

  getBuscarRequerimietnos(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-requerimiento-consumo`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener requerimientos de consumo'
      );
    }
  }

  registrarRequerimientos(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/registrar-requerimiento-consumo`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al registrar requerimientos de consumo'
      );
    }
  }

  obtenerReporteSaldos(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-saldos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener reporte de saldos'
      );
    }
  }

  registrarDespacho(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/registrar-despacho`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al registrar despacho');
    }
  }

  updateEstadoRequerimiento(body: any) {
    const url = `${this.baseUrl}/api/logistica/update-requerimiento`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al actualizar estado de requerimiento'
      );
    }
  }

  aprobarRequerimiento(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/aprobar-requerimientos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al aprobar requerimientos'
      );
    }
  }

  getReporteAprobarRequerimiento(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/reporte-requerimientos-aprobados`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message ||
          'Error al obtener el reporte de requerimientos aprobados'
      );
    }
  }

  despacharItem(iddetalle: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/despachar-item`;
    try {
      return this.http.post<any>(url, { iddetalle });
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al despachar item');
    }
  }

  getRegristroRequerimientoSPRING(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/registra-requerimientos-aprobados`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message ||
          'Error al registrar el requerimientos aprobados en SPRING'
      );
    }
  }

  NuevoRequerimientoCorrelativo(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/requerimiento-correlativo-nuevo`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al generar nuevo correlativo de requerimiento'
      );
    }
  }
}
