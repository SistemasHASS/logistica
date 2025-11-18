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

  registrarRequerimientos(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/registrar-requerimiento-consumo`;
    // console.log(body);
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al registrar requerimientos de consumo'
      );
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
}
