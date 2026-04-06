import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SolicitudServicioService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  guardarSolicitudServicio(solicitud: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/solicitud-servicio/guardar`;
    return this.http.post<any>(url, solicitud);
  }

  listarSolicitudesServicio(filtros: any = {}): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/solicitud-servicio/listar`;
    return this.http.post<any>(url, filtros);
  }

  obtenerSolicitudServicioPorId(id?: number, numeroSolicitud?: string): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/solicitud-servicio/obtener-por-id`;
    return this.http.post<any>(url, { id, numeroSolicitud });
  }

  enviarSolicitudServicio(id: number): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/solicitud-servicio/enviar`;
    return this.http.post<any>(url, { id });
  }

  anularSolicitudServicio(id: number, motivo: string): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/solicitud-servicio/anular`;
    return this.http.post<any>(url, { id, motivo });
  }

  obtenerContadores(usuarioSolicita?: string): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/solicitud-servicio/contadores`;
    return this.http.post<any>(url, { usuarioSolicita });
  }

  // Aprobaciones SS
  asignarAprobadoresSS(solicitudServicioId: number, montoEstimado: number): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/aprobacion-ss/asignar-aprobadores`;
    return this.http.post<any>(url, { solicitudServicioId, montoEstimado });
  }

  aprobarRechazarSS(
    idAprobacion: number,
    accion: string,
    usuarioAprueba: string,
    nombreUsuario: string,
    observaciones?: string
  ): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/aprobacion-ss/aprobar-rechazar`;
    return this.http.post<any>(url, {
      idAprobacion,
      accion,
      usuarioAprueba,
      nombreUsuario,
      observaciones
    });
  }

  listarSSPendientesAprobacion(documentoIdentidad?: string, rol?: string): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/aprobacion-ss/listar-pendientes`;
    return this.http.post<any>(url, { documentoIdentidad, rol });
  }

  // Cotizaciones
  guardarCotizacionServicio(cotizacion: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/cotizacion/guardar`;
    return this.http.post<any>(url, cotizacion);
  }

  listarCotizacionesServicio(filtros: any = {}): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/cotizacion/listar`;
    return this.http.post<any>(url, filtros);
  }

  seleccionarCotizacionServicio(idCotizacion: number): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/cotizacion/seleccionar`;
    return this.http.post<any>(url, { idCotizacion });
  }
}
