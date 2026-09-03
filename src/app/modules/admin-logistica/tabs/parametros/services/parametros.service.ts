import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface Parametro {
  parametro: string;
  valor: string;
  descripcion: string;
  categoria: string;
  editable: boolean;
}

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

export type ParametrosRecord = Record<string, string>;

@Injectable({
  providedIn: 'root'
})
export class ParametrosService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getParametros(): Observable<Parametro[]> {
    return this.http.get<Parametro[]>(`${this.baseUrl}/api/logistica/admin-logistica/parametros`);
  }

  saveParametros(config: ParametrosRecord): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/parametros`, config);
  }

  saveParametro(parametro: string, valor: string): Observable<any> {
    return this.saveParametros({ [parametro]: valor });
  }
}
