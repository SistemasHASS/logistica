import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '@/environments/environment';
import { PendienteAprobacion } from '../bandeja-aprobaciones.component';

export interface BandejaResponse {
  items: PendienteAprobacion[];
  kpis: {
    totalPendientes: number;
    consumoPendientes: number;
    compraPendientes: number;
    urgentes: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BandejaService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getPendientes(): Observable<BandejaResponse> {
    return this.http.get<BandejaResponse>(`${this.baseUrl}/api/logistica/admin-logistica/bandeja/pendientes`);
  }

  getPendientesPorTipo(tipo: 'CONSUMO' | 'COMPRA'): Observable<PendienteAprobacion[]> {
    return this.http.get<PendienteAprobacion[]>(`${this.baseUrl}/api/logistica/admin-logistica/bandeja/pendientes/${tipo}`);
  }
}
