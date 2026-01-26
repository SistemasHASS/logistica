import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminAprobadoresService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar todos los aprobadores
   */
  listarAprobadores(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-aprobadores`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar aprobadores');
    }
  }

  /**
   * Crear nuevo aprobador
   */
  async crearAprobador(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/crear-aprobador`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al crear aprobador');
    }
  }

  /**
   * Actualizar aprobador existente
   */
  async actualizarAprobador(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/actualizar-aprobador`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al actualizar aprobador');
    }
  }

  /**
   * Eliminar aprobador (cambiar estado)
   */
  async eliminarAprobador(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/eliminar-aprobador`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al eliminar aprobador');
    }
  }

  /**
   * Obtener aprobador por ID
   */
  obtenerAprobadorPorId(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/obtener-aprobador`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener aprobador');
    }
  }

  /**
   * Listar aprobadores por área
   */
  listarAprobadoresPorArea(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-aprobadores-area`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar aprobadores por área');
    }
  }

  /**
   * Asignar flujo a aprobador
   */
  async asignarFlujo(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/asignar-flujo-aprobador`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al asignar flujo');
    }
  }
}
