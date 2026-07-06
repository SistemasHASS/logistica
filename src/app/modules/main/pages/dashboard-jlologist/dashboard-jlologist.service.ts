import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardJlologistService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  obtenerKPIs(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-jlologist/kpis`,
      payload
    );
  }

  listarReqsRecientes(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-jlologist/reqs-recientes`,
      payload
    );
  }

  listarOCsRecientes(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-jlologist/ocs-recientes`,
      payload
    );
  }

  listarItemsDetalle(payload: any) {
    return this.http.post<any[]>(
      `${this.baseUrl}/api/logistica/dashboard-jlologist/items-detalle`,
      payload
    );
  }
}
