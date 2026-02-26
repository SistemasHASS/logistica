import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';
import { 
  ItemPendienteConsolidacion,
  FiltroConsolidacion,
  CrearConsolidacionRequest,
  CrearConsolidacionResponse,
  ConsolidacionCab,
  FiltroHistorial,
  GenerarSolicitudCotizacionRequest,
  GenerarSolicitudCotizacionResponse,
  AnularConsolidacionRequest,
  AnularConsolidacionResponse,
  AnularLineaConsolidacionRequest,
  AnularLineaConsolidacionResponse,
  AnularItemPendienteRequest,
  AnularItemPendienteResponse,
  RegistrarSaldoPendienteRequest,
  RegistrarSaldoPendienteResponse,
  SaldoPendienteAprobacion,
  AprobarRechazarSaldoPendienteRequest,
  AprobarRechazarSaldoPendienteResponse,
  MigrarSaldoDirectoConsolidacionRequest,
  MigrarSaldoDirectoConsolidacionResponse
} from '../models/consolidacion.model';

@Injectable({
  providedIn: 'root'
})
export class ConsolidacionService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  // POST api/consolidacion/listar-items-pendientes-consolidacion
  async listarItemsPendientes(filtros: FiltroConsolidacion): Promise<ItemPendienteConsolidacion[]> {
    const url = `${this.baseUrl}/api/consolidacion/listar-items-pendientes-consolidacion`;
    const resp = await firstValueFrom(this.http.post<any>(url, filtros));
    return Array.isArray(resp) ? resp : [];
  }

  // POST api/consolidacion/crear-consolidacion
  async crearConsolidacion(request: CrearConsolidacionRequest): Promise<CrearConsolidacionResponse> {
    const url = `${this.baseUrl}/api/consolidacion/crear-consolidacion`;
    return firstValueFrom(this.http.post<CrearConsolidacionResponse>(url, request));
  }

  // POST api/consolidacion/obtener-consolidacion
  async obtenerConsolidacion(idConsolidacion: number): Promise<ConsolidacionCab> {
    const url = `${this.baseUrl}/api/consolidacion/obtener-consolidacion`;
    return firstValueFrom(this.http.post<ConsolidacionCab>(url, { idConsolidacion }));
  }

  // POST api/consolidacion/listar-historial-consolidaciones
  async listarHistorial(filtros: FiltroHistorial): Promise<ConsolidacionCab[]> {
    const url = `${this.baseUrl}/api/consolidacion/listar-historial-consolidaciones`;
    const resp = await firstValueFrom(this.http.post<any>(url, filtros));
    return Array.isArray(resp) ? resp : [];
  }

  // POST api/consolidacion/generar-solicitud-cotizacion
  async generarSolicitudCotizacion(request: GenerarSolicitudCotizacionRequest): Promise<GenerarSolicitudCotizacionResponse> {
    const url = `${this.baseUrl}/api/consolidacion/generar-solicitud-cotizacion`;
    return firstValueFrom(this.http.post<GenerarSolicitudCotizacionResponse>(url, request));
  }

  // POST api/consolidacion/anular-consolidacion
  async anularConsolidacion(request: AnularConsolidacionRequest): Promise<AnularConsolidacionResponse> {
    const url = `${this.baseUrl}/api/consolidacion/anular-consolidacion`;
    return firstValueFrom(this.http.post<AnularConsolidacionResponse>(url, request));
  }

  // POST api/consolidacion/obtener-detalle-requerimiento
  async obtenerDetalleRequerimiento(idDetalle: number): Promise<any> {
    const url = `${this.baseUrl}/api/consolidacion/obtener-detalle-requerimiento`;
    return firstValueFrom(this.http.post<any>(url, [{ idDetalle }]));
  }

  // POST api/consolidacion/anular-linea-consolidacion
  async anularLineaConsolidacion(request: AnularLineaConsolidacionRequest): Promise<AnularLineaConsolidacionResponse> {
    const url = `${this.baseUrl}/api/consolidacion/anular-linea-consolidacion`;
    return firstValueFrom(this.http.post<AnularLineaConsolidacionResponse>(url, request));
  }

  // POST api/consolidacion/anular-item-pendiente
  async anularItemPendiente(request: AnularItemPendienteRequest): Promise<AnularItemPendienteResponse> {
    const url = `${this.baseUrl}/api/consolidacion/anular-item-pendiente`;
    return firstValueFrom(this.http.post<AnularItemPendienteResponse>(url, request));
  }

  // POST api/logistica/registrar-saldo-pendiente-aprobacion
  async registrarSaldoPendienteAprobacion(request: RegistrarSaldoPendienteRequest): Promise<RegistrarSaldoPendienteResponse> {
    const url = `${this.baseUrl}/api/logistica/registrar-saldo-pendiente-aprobacion`;
    return firstValueFrom(this.http.post<RegistrarSaldoPendienteResponse>(url, request));
  }

  // POST api/consolidacion/listar-saldos-pendientes-aprobacion
  async listarSaldosPendientesAprobacion(filtros: any = {}): Promise<SaldoPendienteAprobacion[]> {
    const url = `${this.baseUrl}/api/consolidacion/listar-saldos-pendientes-aprobacion`;
    const resp = await firstValueFrom(this.http.post<any>(url, filtros));
    return Array.isArray(resp) ? resp : [];
  }

  // POST api/logistica/aprobar-rechazar-saldo-pendiente
  async aprobarRechazarSaldoPendiente(request: AprobarRechazarSaldoPendienteRequest): Promise<AprobarRechazarSaldoPendienteResponse> {
    try {
      return await firstValueFrom(
        this.http.post<AprobarRechazarSaldoPendienteResponse>(`${this.baseUrl}/api/logistica/aprobar-rechazar-saldo-pendiente`, request)
      );
    } catch (error: any) {
      return {
        success: false,
        mensaje: error.error?.mensaje || 'Error al aprobar/rechazar saldo pendiente'
      };
    }
  }

  async migrarSaldoDirectoConsolidacion(request: MigrarSaldoDirectoConsolidacionRequest): Promise<MigrarSaldoDirectoConsolidacionResponse> {
    try {
      return await firstValueFrom(
        this.http.post<MigrarSaldoDirectoConsolidacionResponse>(`${this.baseUrl}/api/logistica/migrar-saldo-directo-consolidacion`, request)
      );
    } catch (error: any) {
      return {
        success: false,
        mensaje: error.error?.mensaje || 'Error al migrar saldo directamente a consolidación'
      };
    }
  }

  // POST api/logistica/registrar-notificacion-stock
  async registrarNotificacionStock(request: any): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/api/logistica/registrar-notificacion-stock`, request)
      );
    } catch (error: any) {
      return {
        success: false,
        mensaje: error.error?.mensaje || 'Error al registrar notificación de stock'
      };
    }
  }

  // POST api/consolidacion/listar-mis-notificaciones
  async listarMisNotificaciones(request: { dni: string }): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/api/consolidacion/listar-mis-notificaciones`, request)
      );
    } catch (error: any) {
      return {
        resultado: '[]'
      };
    }
  }

  // POST api/logistica/notificar-stock-disponible
  async notificarStockDisponible(request: { items: string[] }): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/api/logistica/notificar-stock-disponible`, request)
      );
    } catch (error: any) {
      return {
        success: false,
        mensaje: error.error?.mensaje || 'Error al notificar stock disponible'
      };
    }
  }
}
