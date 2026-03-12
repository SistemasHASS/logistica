import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  UsuarioPorArea,
  AprobadorAsignado,
  FlujoAprobacion,
  RequerimientoPendiente,
  RequerimientoConAprobacion,
  DashboardAprobaciones,
  ProcesarAprobacionRequest,
  ProcesarAprobacionResponse
} from '../interfaces/aprobaciones.interface';

@Injectable({
  providedIn: 'root'
})
export class AprobacionesService {
  private baseUrl = `${environment.baseUrl}/api/logistica`;

  constructor(private http: HttpClient) { }

  // =============================================
  // GESTIÓN DE USUARIOS POR ÁREA
  // =============================================

  obtenerUsuariosPorArea(data: {
    ruc: string;
    idarea: number;
    idsubarea?: number;
    rol?: string;
  }): Observable<UsuarioPorArea[]> {
    return this.http.post<UsuarioPorArea[]>(
      `${this.baseUrl}/obtener-usuarios-por-area`,
      data
    );
  }

  // =============================================
  // FLUJO DE APROBACIÓN
  // =============================================

  obtenerAprobadorPorArea(data: {
    ruc: string;
    idarea: number;
    idsubarea?: number;
    tipoRequerimiento: string;
    montoTotal: number;
  }): Observable<AprobadorAsignado> {
    return this.http.post<AprobadorAsignado>(
      `${this.baseUrl}/obtener-aprobador-por-area`,
      data
    );
  }

  obtenerFlujoCompletoAprobacion(data: {
    ruc: string;
    idarea: number;
    idsubarea?: number;
    tipoRequerimiento: string;
  }): Observable<FlujoAprobacion[]> {
    return this.http.post<FlujoAprobacion[]>(
      `${this.baseUrl}/obtener-flujo-completo-aprobacion`,
      data
    );
  }

  asignarAprobadoresRequerimiento(data: {
    idRequerimiento: number;
    numeroRequerimiento: string;
    ruc: string;
    idarea: number;
    idsubarea?: number;
    usuarioSolicita: string;
    tipoRequerimiento: string;
    montoTotal: number;
  }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/asignar-aprobadores-requerimiento`,
      data
    );
  }

  // =============================================
  // GESTIÓN DE APROBACIONES
  // =============================================

  obtenerRequerimientosPendientesAprobacion(data: {
    aprobadorAsignado: string;
    estado?: string;
  }): Observable<RequerimientoPendiente[]> {
    return this.http.post<RequerimientoPendiente[]>(
      `${this.baseUrl}/obtener-requerimientos-pendientes-aprobacion`,
      data
    );
  }

  procesarAprobacionRequerimiento(data: ProcesarAprobacionRequest): Observable<ProcesarAprobacionResponse> {
    return this.http.post<ProcesarAprobacionResponse>(
      `${this.baseUrl}/procesar-aprobacion-requerimiento`,
      data
    );
  }

  // =============================================
  // CONSULTAS INTEGRADAS
  // =============================================

  obtenerRequerimientosConAprobacion(data: {
    usuario: string;
    rol: string;
    ruc?: string;
    idarea?: number;
    estado?: string;
  }): Observable<RequerimientoConAprobacion[]> {
    return this.http.post<RequerimientoConAprobacion[]>(
      `${this.baseUrl}/obtener-requerimientos-con-aprobacion`,
      data
    );
  }

  obtenerDashboardAprobaciones(documentoidentidad: string): Observable<DashboardAprobaciones> {
    return this.http.get<DashboardAprobaciones>(
      `${this.baseUrl}/obtener-dashboard-aprobaciones/${documentoidentidad}`
    );
  }

  // =============================================
  // MÉTODOS AUXILIARES
  // =============================================

  /**
   * Obtiene el badge de urgencia según el nivel
   */
  getUrgenciaBadge(urgencia: string): { severity: 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast'; label: string } {
    const badges: { [key: string]: { severity: 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast'; label: string } } = {
      'ALTA': { severity: 'danger', label: 'URGENTE' },
      'MEDIA': { severity: 'warn', label: 'MEDIA' },
      'NORMAL': { severity: 'info', label: 'NORMAL' }
    };
    return badges[urgencia] || badges['NORMAL'];
  }

  /**
   * Obtiene el badge de estado
   */
  getEstadoBadge(estado: string): { severity: 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast'; label: string } {
    const badges: { [key: string]: { severity: 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast'; label: string } } = {
      'PENDIENTE': { severity: 'warn', label: 'PENDIENTE' },
      'APROBADO': { severity: 'success', label: 'APROBADO' },
      'RECHAZADO': { severity: 'danger', label: 'RECHAZADO' },
      'PENDIENTE_APROBACION': { severity: 'info', label: 'EN APROBACIÓN' }
    };
    return badges[estado] || badges['PENDIENTE'];
  }

  /**
   * Formatea el tiempo de espera en formato legible
   */
  formatTiempoEspera(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    } else if (minutos < 1440) {
      const horas = Math.floor(minutos / 60);
      return `${horas}h ${minutos % 60}min`;
    } else {
      const dias = Math.floor(minutos / 1440);
      const horas = Math.floor((minutos % 1440) / 60);
      return `${dias}d ${horas}h`;
    }
  }

  /**
   * Calcula el porcentaje de aprobación
   */
  calcularPorcentajeAprobacion(completadas: number, total: number): number {
    return total > 0 ? Math.round((completadas / total) * 100) : 0;
  }
}
