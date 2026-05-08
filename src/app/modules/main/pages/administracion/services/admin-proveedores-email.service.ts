import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminProveedoresEmailService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  listarProveedoresEmail(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-proveedores-email`;
    return this.http.post<any>(url, body);
  }

  async crearProveedorEmail(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/crear-proveedor-email`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al crear proveedor email');
    }
  }

  async actualizarProveedorEmail(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/actualizar-proveedor-email`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al actualizar proveedor email');
    }
  }

  async eliminarProveedorEmail(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/eliminar-proveedor-email`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al eliminar proveedor email');
    }
  }
}
