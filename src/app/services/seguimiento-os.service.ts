import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import {
  SeguimientoOrdenServicio,
  HitoServicio,
  EstadoSeguimientoOS,
  ActualizarSeguimientoOSDTO,
  RegistrarConformidadOSDTO
} from '@/app/shared/interfaces/Tables';

/**
 * Servicio para gestionar el seguimiento de Órdenes de Servicio
 * PASO 4: Servicio de seguimiento con métodos para actualizar estados y hitos
 */
@Injectable({
  providedIn: 'root'
})
export class SeguimientoOSService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el seguimiento completo de una orden de servicio
   */
  obtenerSeguimiento(idOrdenServicio: number): Observable<{
    error: number;
    mensaje: string;
    data?: SeguimientoOrdenServicio;
  }> {
    const url = `${this.baseUrl}/api/logistica/seguimiento-os/obtener`;
    return this.http.post<any>(url, { idOrdenServicio });
  }

  /**
   * Actualiza el estado del seguimiento y los hitos
   */
  actualizarSeguimiento(datos: ActualizarSeguimientoOSDTO): Observable<{
    error: number;
    mensaje: string;
    estado?: EstadoSeguimientoOS;
    porcentajeAvance?: number;
  }> {
    const url = `${this.baseUrl}/api/logistica/seguimiento-os/actualizar`;
    return this.http.post<any>(url, datos);
  }

  /**
   * Crea el seguimiento inicial al generar una orden
   */
  crearSeguimientoInicial(
    idOrdenServicio: number,
    numeroOrden: string,
    usuarioGenera: string,
    hitos?: HitoServicio[]
  ): Observable<{
    error: number;
    mensaje: string;
    idSeguimiento?: number;
  }> {
    const url = `${this.baseUrl}/api/logistica/seguimiento-os/crear`;
    return this.http.post<any>(url, {
      idOrdenServicio,
      numeroOrden,
      usuarioGenera,
      hitosJson: hitos ? JSON.stringify(hitos) : null
    });
  }

  /**
   * Actualiza el progreso de un hito específico
   */
  actualizarHito(
    idOrdenServicio: number,
    hitoIndex: number,
    nuevoEstado: HitoServicio['estado'],
    porcentajeAvance: number,
    observaciones?: string
  ): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/seguimiento-os/actualizar-hito`;
    return this.http.post<any>(url, {
      idOrdenServicio,
      hitoIndex,
      nuevoEstado,
      porcentajeAvance,
      observaciones
    });
  }

  /**
   * Registra la conformidad final del servicio
   */
  registrarConformidad(datos: RegistrarConformidadOSDTO): Observable<{
    error: number;
    mensaje: string;
    conformidad?: string;
    calificacion?: number;
  }> {
    const url = `${this.baseUrl}/api/logistica/seguimiento-os/registrar-conformidad`;
    return this.http.post<any>(url, datos);
  }

  /**
   * Lista todas las órdenes en seguimiento con filtros
   */
  listarSeguimientos(filtros?: {
    estado?: EstadoSeguimientoOS;
    usuarioGenera?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/seguimiento-os/listar`;
    return this.http.post<any>(url, filtros || {});
  }

  /**
   * Calcula el porcentaje de avance basado en los hitos
   */
  calcularPorcentajeAvance(hitos: HitoServicio[]): number {
    if (!hitos || hitos.length === 0) return 0;

    const sumaPorcentajes = hitos.reduce((sum, hito) => {
      if (hito.estado === 'COMPLETADO') return sum + 100;
      if (hito.estado === 'EN_EJECUCION') return sum + (hito.porcentajeAvance || 0);
      return sum;
    }, 0);

    return Math.round(sumaPorcentajes / hitos.length);
  }

  /**
   * Obtiene el siguiente estado válido en el flujo
   */
  obtenerSiguienteEstado(estadoActual: EstadoSeguimientoOS): EstadoSeguimientoOS | null {
    const flujo: { [key in EstadoSeguimientoOS]?: EstadoSeguimientoOS } = {
      'GENERADA': 'ENVIADA',
      'ENVIADA': 'ACEPTADA',
      'ACEPTADA': 'EN_EJECUCION',
      'EN_EJECUCION': 'FINALIZADA',
    };
    return flujo[estadoActual] || null;
  }

  /**
   * Verifica si un estado permite retroceder
   */
  puedeRetroceder(estadoActual: EstadoSeguimientoOS): boolean {
    return estadoActual === 'ENVIADA' || estadoActual === 'ACEPTADA';
  }

  /**
   * Obtiene el color del badge según el estado
   */
  obtenerColorEstado(estado: EstadoSeguimientoOS): string {
    const colores: { [key in EstadoSeguimientoOS]: string } = {
      'GENERADA': 'badge-info',
      'ENVIADA': 'badge-warning',
      'ACEPTADA': 'badge-primary',
      'EN_EJECUCION': 'badge-secondary',
      'FINALIZADA': 'badge-success',
      'RECHAZADA': 'badge-danger',
    };
    return colores[estado] || 'badge-secondary';
  }

  /**
   * Obtiene el texto descriptivo del estado
   */
  obtenerTextoEstado(estado: EstadoSeguimientoOS): string {
    const textos: { [key in EstadoSeguimientoOS]: string } = {
      'GENERADA': 'Generada',
      'ENVIADA': 'Enviada',
      'ACEPTADA': 'Aceptada',
      'EN_EJECUCION': 'En Ejecución',
      'FINALIZADA': 'Finalizada',
      'RECHAZADA': 'Rechazada',
    };
    return textos[estado] || estado;
  }
}
