import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AprobacionesAreaService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el flujo completo de aprobación para un requerimiento
   */
  obtenerFlujoCompletoAprobacion(data: {
    ruc: string;
    idarea: number;
    tipoRequerimiento: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/obtener-flujo-completo-aprobacion`, data);
  }

  /**
   * Asigna aprobadores a un requerimiento
   */
  asignarAprobadoresRequerimiento(data: {
    ruc: string;
    idrequerimiento: string;
    idarea: number;
    tipoRequerimiento: string;
    usuarioSolicitud: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/asignar-aprobadores-requerimiento`, data);
  }

  /**
   * Registra un requerimiento en el sistema de aprobaciones
   */
  registrarRequerimiento(data: {
    ruc: string;
    idrequerimiento: string;
    idarea: number;
    tipoRequerimiento: string;
    descripcion: string;
    usuarioSolicitud: string;
    glosa?: string;
    monto?: number;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/registrar-requerimiento`, data);
  }

  /**
   * Obtiene los requerimientos pendientes de aprobación para un usuario
   */
  obtenerRequerimientosPendientesAprobacion(dni: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/obtener-requerimientos-pendientes-aprobacion`, { dni });
  }

  /**
   * Obtiene los requerimientos con su estado de aprobación
   */
  obtenerRequerimientosConAprobacion(data: {
    usuario: string;
    rol: string;
    ruc?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/obtener-requerimientos-con-aprobacion`, data).pipe(
      catchError((error) => {
        console.log('🔧 Error interceptado en obtenerRequerimientosConAprobacion:', error);
        if (error.status === 500) {
          console.log('🔧 Convirtiendo error 500 a respuesta vacía');
          return of({ resultado: [] });
        }
        throw error;
      })
    );
  }

  /**
   * Procesa una aprobación o rechazo
   */
  procesarAprobacionRequerimiento(data: {
    idrequerimiento: string;
    idarea: number;
    secuencia: number;
    dniAprobador: string;
    accion: 'APROBADO' | 'RECHAZADO';
    observacion?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/procesar-aprobacion-requerimiento`, data);
  }

  /**
   * Obtiene el dashboard de aprobaciones para un usuario
   */
  obtenerDashboardAprobaciones(dni: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/logistica/obtener-dashboard-aprobaciones/${dni}`);
  }

  /**
   * Obtiene el aprobador de un área
   */
  obtenerAprobadorPorArea(data: {
    ruc: string;
    idarea: number;
    secuencia: number;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/obtener-aprobador-por-area`, data);
  }

  // =============================================
  // NUEVO FLUJO DE APROBACIÓN POR ÁREA
  // =============================================

  /**
   * Obtiene requerimientos pendientes para el jefe de área
   */
  obtenerRequerimientosPendientesArea(data: {
    documentoidentidad: string;
    ruc?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/requerimientos-pendientes-area`, data).pipe(
      catchError((error) => {
        console.log('🔧 Error interceptado en servicio:', error);
        // Si el error es 500 con Data is Null, devolver array vacío
        if (error.status === 500) {
          console.log('🔧 Convirtiendo error 500 a respuesta vacía');
          return of({ resultado: [] });
        }
        // Para otros errores, propagarlos
        throw error;
      })
    );
  }

  /**
   * Obtiene requerimientos pendientes con todos los ítems
   */
  obtenerRequerimientosPendientesAreaDetalle(data: {
    documentoidentidad: string;
    ruc?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/requerimientos-pendientes-area-detalle`, data);
  }

  /**
   * Aprueba o rechaza un requerimiento en el flujo por área
   */
  aprobarRequerimientoArea(data: {
    idrequerimiento: string;
    documentoidentidad: string;
    accion: 'APROBADO' | 'RECHAZADO';
    comentarios?: string;
    ruc?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobar-requerimiento-area`, data);
  }

  /**
   * Obtiene el reporte de aprobaciones realizadas por el jefe de área
   */
  obtenerReporteAprobacionesArea(data: {
    documentoidentidad: string;
    ruc?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/reporte-aprobaciones-area`, data).pipe(
      catchError((error) => {
        console.log('🔧 Error interceptado en reporte aprobaciones:', error);
        if (error.status === 500) {
          console.log('🔧 Convirtiendo error 500 a respuesta vacía');
          return of({ resultado: [] });
        }
        throw error;
      })
    );
  }

  /**
   * Obtiene el historial de aprobaciones por área
   */
  obtenerHistorialAprobacionesArea(data: {
    idrequerimiento: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/historial-aprobaciones-area`, data);
  }

  /**
   * Obtiene el área asignada a un usuario
   */
  obtenerAreaUsuario(data: {
    documentoidentidad: string;
    ruc?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/obtener-area-usuario`, data);
  }
}
