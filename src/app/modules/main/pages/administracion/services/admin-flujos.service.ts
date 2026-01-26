import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminFlujosService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar todos los flujos de aprobación
   */
  listarFlujos(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-flujos`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar flujos');
    }
  }

  /**
   * Crear nuevo flujo
   */
  async crearFlujo(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/crear-flujo`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al crear flujo');
    }
  }

  /**
   * Actualizar flujo existente
   */
  async actualizarFlujo(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/actualizar-flujo`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al actualizar flujo');
    }
  }

  /**
   * Eliminar flujo (cambiar estado)
   */
  async eliminarFlujo(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/eliminar-flujo`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al eliminar flujo');
    }
  }

  /**
   * Obtener flujo por ID
   */
  obtenerFlujoPorId(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/obtener-flujo`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener flujo');
    }
  }

  /**
   * Listar flujos por área
   */
  listarFlujosPorArea(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-flujos-area`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar flujos por área');
    }
  }

  /**
   * Asignar aprobadores a flujo
   */
  async asignarAprobadores(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/asignar-aprobadores-flujo`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al asignar aprobadores');
    }
  }
}
