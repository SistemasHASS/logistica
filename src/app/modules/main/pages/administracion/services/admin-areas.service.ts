import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AdminAreasService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar todas las áreas
   */
  listarAreas(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-areas`;
    console.log('Making request to:', url);
    console.log('Request body:', body);
    
    try {
      return this.http.post<any>(url, body).pipe(
        tap(response => {
          console.log('HTTP Response received:', response);
        }),
        catchError(error => {
          console.error('HTTP Error:', error);
          throw error;
        })
      );
    } catch (error: any) {
      console.error('Service error:', error);
      throw new Error(error.error?.message || 'Error al listar áreas');
    }
  }

  /**
   * Crear nueva área
   */
  async crearArea(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/crear-area`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al crear área');
    }
  }

  /**
   * Actualizar área existente
   */
  async actualizarArea(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/actualizar-area`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al actualizar área');
    }
  }

  /**
   * Eliminar área (cambiar estado)
   */
  async eliminarArea(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/eliminar-area`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al eliminar área');
    }
  }

  /**
   * Obtener área por ID
   */
  obtenerAreaPorId(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/obtener-area`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener área');
    }
  }
}
