import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommodityService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getCommodity(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-commodity`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener maestro de commodity'
      );
    }
  }

  registrarCommodity(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/registrar-commodity`;
    // console.log(body);
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al registrar maestro de commodity'
      );
    }
  }

  updateCommodity(body: any) {
    const url = `${this.baseUrl}/api/logistica/update-commodity`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al actualizar maestro de commodity'
      );
    }
  }

  getSubCommodity(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-subcommodity`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener maestro de subcommodity'
      );
    }
  }
}
