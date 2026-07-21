import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdenServicioService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  generarOrdenServicio(orden: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/generar`;
    return this.http.post<any>(url, orden);
  }

  listarOrdenesServicio(filtros: any = {}): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/listar`;
    return this.http.post<any>(url, filtros);
  }

  obtenerOrdenServicioPorId(id?: number, numeroOrden?: string): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/obtener-por-id`;
    return this.http.post<any>(url, { id, numeroOrden });
  }

  asignarAprobadoresOS(ordenServicioId: number, montoTotal: number): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/asignar-aprobadores`;
    return this.http.post<any>(url, { ordenServicioId, montoTotal });
  }

  aprobarRechazarOS(
    idAprobacion: number,
    accion: string,
    usuarioAprueba: string,
    nombreUsuario: string,
    observaciones?: string
  ): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/aprobar-rechazar`;
    return this.http.post<any>(url, {
      idAprobacion,
      accion,
      usuarioAprueba,
      nombreUsuario,
      observaciones
    });
  }

  listarOSPendientesAprobacion(documentoIdentidad?: string, rol?: string): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/listar-pendientes-aprobacion`;
    return this.http.post<any>(url, { documentoIdentidad, rol });
  }

  registrarConformidadServicio(conformidad: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/registrar-conformidad`;
    return this.http.post<any>(url, conformidad);
  }

  sincronizarOrdenServicio(orden: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/orden-servicio/sincronizar`;
    return this.http.post<any>(url, orden);
  }

  listarRequerimientosServicioParaOS(filtros: any = {}): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-requerimientos-servicio-para-os`;
    return this.http.post<any>(url, filtros);
  }
}
