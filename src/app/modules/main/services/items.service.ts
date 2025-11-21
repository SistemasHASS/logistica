
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getItem(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-item`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener maestro de item'
      );
    }
  }

  registrarItem(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/registrar-item`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al registrar maestro de item'
      );
    }
  }

  updateItem(body: any) {
    const url = `${this.baseUrl}/api/logistica/update-item`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al actualizar maestro de item'
      );
    }
  }
}
