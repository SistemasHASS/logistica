import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminPlantillaPdfService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  listarPlantillasPdf(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-plantillas-pdf`;
    return this.http.post<any>(url, body);
  }

  async guardarPlantillaPdf(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/guardar-plantilla-pdf`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al guardar plantilla PDF');
    }
  }

  async eliminarPlantillaPdf(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/eliminar-plantilla-pdf`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al eliminar plantilla PDF');
    }
  }
}
