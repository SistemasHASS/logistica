import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface AuditoriaLog {
  id: number;
  fecha: string;
  usuario: string;
  tipo: string;
  modulo: string;
  accion: string;
  descripcion: string;
  ipAddress: string;
  datosAnteriores?: string;
  datosNuevos?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getLogs(filtros: { fechaInicio: string; fechaFin: string; tipo?: string; usuario?: string }): Observable<AuditoriaLog[]> {
    return this.http.get<AuditoriaLog[]>(`${this.baseUrl}/api/logistica/admin-logistica/auditoria`, { params: filtros as any });
  }

  exportarLogs(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/api/logistica/admin-logistica/auditoria/exportar`, { responseType: 'blob' });
  }
}
