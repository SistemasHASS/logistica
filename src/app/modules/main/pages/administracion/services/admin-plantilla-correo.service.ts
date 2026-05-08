import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminPlantillaCorreoService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  listarPlantillasCorreo(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-plantillas-correo`;
    return this.http.post<any>(url, body);
  }

  async guardarPlantillaCorreo(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/guardar-plantilla-correo`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al guardar plantilla de correo');
    }
  }

  async eliminarPlantillaCorreo(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/eliminar-plantilla-correo`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al eliminar plantilla de correo');
    }
  }
}
