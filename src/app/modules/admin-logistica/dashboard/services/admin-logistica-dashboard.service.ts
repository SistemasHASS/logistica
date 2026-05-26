import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '@/environments/environment';

export interface DashboardData {
  pendientesAprobacion: number;
  cambioPendientes: number;
  ocEmitidasHoy: number;
  cambioOC: number;
  osEmitidasHoy: number;
  cambioOS: number;
  usuariosActivos: number;
  actividadReciente: ActivityItem[];
  graficos: ChartData;
}

export interface ActivityItem {
  id: number;
  tipo: 'APROBACION' | 'RECHAZO' | 'CREACION' | 'ACTUALIZACION';
  descripcion: string;
  usuario: string;
  fecha: string;
  modulo: string;
}

export interface ChartData {
  aprobacionesPorDia: { dia: string; cantidad: number }[];
  ocPorEstado: { estado: string; cantidad: number }[];
  osPorEstado: { estado: string; cantidad: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminLogisticaDashboardService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.baseUrl}/api/logistica/admin-logistica/dashboard`);
  }

  getKPIs(): Observable<Partial<DashboardData>> {
    return this.http.get<Partial<DashboardData>>(`${this.baseUrl}/api/logistica/admin-logistica/dashboard/kpis`);
  }

  getRecentActivity(limit: number = 10): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`${this.baseUrl}/api/logistica/admin-logistica/dashboard/actividad?limit=${limit}`);
  }
}
