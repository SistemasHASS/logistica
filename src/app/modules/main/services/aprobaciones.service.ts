import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AprobacionesService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // Listar requerimientos pendientes de aprobación
  listarRequerimientosPendientesAprobacion(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/listar-requerimientos-pendientes-aprobacion`, request)
    );
  }

  // Listar servicios pendientes de aprobación
  listarServiciosPendientesAprobacion(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/listar-servicios-pendientes-aprobacion`, request)
    );
  }

  // Listar activos fijos pendientes de aprobación
  listarActivosFijosPendientesAprobacion(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/listar-activos-fijos-pendientes-aprobacion`, request)
    );
  }

  // Aprobar o rechazar requerimiento
  aprobarRechazarRequerimiento(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/aprobar-rechazar-requerimiento`, request)
    );
  }

  // Aprobar o rechazar servicio
  aprobarRechazarServicio(request: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/aprobar-rechazar-servicio`, request)
    );
  }

  // Obtener requerimientos con aprobación
  obtenerRequerimientosConAprobacion(data: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/obtener-requerimientos-con-aprobacion`, data);
  }

  // Obtener dashboard de aprobaciones
  obtenerDashboardAprobaciones(dni: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/logistica/obtener-dashboard-aprobaciones/${dni}`);
  }

  // Métodos para badges
  getUrgenciaBadge(urgencia: string): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' {
    switch (urgencia?.toUpperCase()) {
      case 'ALTA':
        return 'danger';
      case 'MEDIA':
        return 'warn';
      case 'BAJA':
        return 'info';
      default:
        return 'secondary';
    }
  }

  getEstadoBadge(estado: string): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' {
    switch (estado?.toUpperCase()) {
      case 'APROBADO':
        return 'success';
      case 'RECHAZADO':
        return 'danger';
      case 'PENDIENTE':
        return 'warn';
      case 'EN PROCESO':
        return 'info';
      default:
        return 'secondary';
    }
  }
}
