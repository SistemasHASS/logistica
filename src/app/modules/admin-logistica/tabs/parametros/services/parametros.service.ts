import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface ParametrosConfig {
  montoLimiteDirecto: number;
  requiereAprobacionMonto: number;
  diasMaximoAprobacion: number;
  diasEntregaDefault: number;
  diasCreditoDefault: number;
  monedaDefault: string;
  horarioCorte: string;
  enviarNotificaciones: boolean;
  consolidacionAutomatica: boolean;
  maximoItemsPorReq: number;
  maximoOCBorrador: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParametrosService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getParametros(): Observable<ParametrosConfig> {
    return this.http.get<ParametrosConfig>(`${this.baseUrl}/api/logistica/admin-logistica/parametros`);
  }

  saveParametros(config: ParametrosConfig): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/parametros`, config);
  }
}
