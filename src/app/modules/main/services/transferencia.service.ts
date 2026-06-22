import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransferenciaService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  async crearRequerimientoTransferencia(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/crear-requerimiento-transferencia`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al crear requerimiento de transferencia');
    }
  }

  async listarTransferenciasPendientes(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/listar-transferencias-pendientes`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar transferencias pendientes');
    }
  }

  async detalleRequerimientoTransferencia(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/detalle-requerimiento-transferencia`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener detalle de transferencia');
    }
  }

  async ejecutarTransferencia(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/ejecutar-transferencia`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al ejecutar transferencia');
    }
  }

  async listarHistorialTransferencias(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/listar-historial-transferencias`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al listar historial de transferencias');
    }
  }
}
