import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AprobacionOSService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  obtenerContadores(documentoIdentidad?: string, rol?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/contadores`, {
      documentoIdentidad,
      rol,
    });
  }

  listarOSPendientes(rol: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/listar-pendientes`, {
      rol,
    });
  }

  listarHistorialAprobaciones(rol: string, estado?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/historial`, {
      rol,
      estado: estado || '',
    });
  }

  obtenerHistorialOS(ordenServicioId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/historial-os`, {
      ordenServicioId,
    });
  }

  obtenerOSDetalle(payload: { idAprobacion?: number; codigoOrden?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/obtener-detalle`, payload);
  }

  aprobarRechazarOS(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/aprobar-rechazar`, payload);
  }

  anularOS(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/anular`, payload);
  }

  listarUsuariosAprobadores(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/listar-usuarios-aprobadores`, {});
  }

  listarFlujosAprobacion(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/listar-flujos`, {});
  }

  crearUsuarioAprobador(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/crear-usuario-aprobador`, payload);
  }

  actualizarUsuarioAprobador(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/actualizar-usuario-aprobador`, payload);
  }

  eliminarUsuarioAprobador(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/eliminar-usuario-aprobador`, { id });
  }

  crearFlujoAprobacion(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/crear-flujo`, payload);
  }

  actualizarFlujoAprobacion(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/actualizar-flujo`, payload);
  }

  eliminarFlujoAprobacion(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-os/eliminar-flujo`, { id });
  }
}
