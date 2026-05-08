import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminConfigSmtpService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  listarConfigSmtp(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-config-smtp`;
    return this.http.post<any>(url, body);
  }

  async guardarConfigSmtp(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/guardar-config-smtp`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al guardar configuración SMTP');
    }
  }

  async probarConexionSmtp(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/probar-conexion-smtp`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al probar conexión SMTP');
    }
  }

  async eliminarConfigSmtp(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/eliminar-config-smtp`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al eliminar configuración SMTP');
    }
  }
}
