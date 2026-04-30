import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import {
  SeguimientoOrdenCompra,
  ActualizarSeguimientoOCDTO,
  EstadoSeguimientoOC,
  HitoCompra
} from '@/app/shared/interfaces/Tables';

@Injectable({
  providedIn: 'root'
})
export class SeguimientoOCService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener seguimiento de una orden de compra
   */
  obtenerSeguimiento(idOrden: number): Observable<SeguimientoOrdenCompra> {
    return this.http.post<SeguimientoOrdenCompra>(
      `${this.baseUrl}/api/logistica/obtener-seguimiento-oc`,
      { idOrden }
    );
  }

  /**
   * Actualizar seguimiento de una orden de compra
   */
  actualizarSeguimiento(dto: ActualizarSeguimientoOCDTO): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/actualizar-seguimiento-oc`,
      dto
    );
  }

  /**
   * Crear seguimiento inicial para una orden de compra
   */
  crearSeguimientoInicial(idOrden: number, numeroOrden: string, usuario: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/crear-seguimiento-oc`,
      {
        idOrden,
        numeroOrden,
        usuarioGenera: usuario
      }
    );
  }

  /**
   * Calcular porcentaje de avance basado en hitos
   */
  calcularPorcentajeAvance(hitos: HitoCompra[]): number {
    if (!hitos || hitos.length === 0) return 0;

    const totalPorcentaje = hitos.reduce((sum, hito) => sum + (hito.porcentajeAvance || 0), 0);
    return Math.round(totalPorcentaje / hitos.length);
  }

  /**
   * Obtener el siguiente estado en el flujo
   */
  obtenerSiguienteEstado(estadoActual: EstadoSeguimientoOC): EstadoSeguimientoOC | null {
    const flujoEstados: EstadoSeguimientoOC[] = [
      'GENERADA',
      'APROBADA',
      'CONFIRMADA',
      'EN_PROCESO',
      'RECIBIDA_PARCIAL',
      'RECIBIDA_TOTAL'
    ];

    const indiceActual = flujoEstados.indexOf(estadoActual);
    if (indiceActual === -1 || indiceActual === flujoEstados.length - 1) {
      return null;
    }

    return flujoEstados[indiceActual + 1];
  }

  /**
   * Verificar si se puede avanzar de estado
   */
  puedeAvanzar(estado: EstadoSeguimientoOC): boolean {
    return this.obtenerSiguienteEstado(estado) !== null;
  }

  /**
   * Obtener texto descriptivo del estado
   */
  obtenerTextoEstado(estado: EstadoSeguimientoOC): string {
    const textos: Record<EstadoSeguimientoOC, string> = {
      GENERADA: 'Generada',
      APROBADA: 'Aprobada',
      CONFIRMADA: 'Confirmada',
      EN_PROCESO: 'En Proceso',
      RECIBIDA_PARCIAL: 'Recibida Parcial',
      RECIBIDA_TOTAL: 'Recibida Total',
      ANULADA: 'Anulada'
    };

    return textos[estado] || estado;
  }

  /**
   * Obtener color de badge según estado
   */
  obtenerColorEstado(estado: EstadoSeguimientoOC): string {
    const colores: Record<EstadoSeguimientoOC, string> = {
      GENERADA: 'badge-info',
      APROBADA: 'badge-warning',
      CONFIRMADA: 'badge-primary',
      EN_PROCESO: 'badge-secondary',
      RECIBIDA_PARCIAL: 'badge-warning',
      RECIBIDA_TOTAL: 'badge-success',
      ANULADA: 'badge-danger'
    };

    return colores[estado] || 'badge-secondary';
  }

  /**
   * Obtener texto del estado de hito
   */
  obtenerTextoEstadoHito(estado: string): string {
    const textos: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      EN_PROCESO: 'En Proceso',
      COMPLETADO: 'Completado'
    };

    return textos[estado] || estado;
  }

  /**
   * Obtener clase CSS para estado de hito
   */
  obtenerClaseEstadoHito(estado: string): string {
    const clases: Record<string, string> = {
      PENDIENTE: 'badge-secondary',
      EN_PROCESO: 'badge-warning',
      COMPLETADO: 'badge-success'
    };

    return clases[estado] || 'badge-secondary';
  }

  /**
   * Verificar si un hito está completado
   */
  esHitoCompletado(hito: HitoCompra): boolean {
    return hito.estado === 'COMPLETADO';
  }

  /**
   * Actualizar porcentaje de hito al cambiar estado
   */
  actualizarPorcentajeHito(hito: HitoCompra, nuevoEstado: string): HitoCompra {
    if (nuevoEstado === 'COMPLETADO') {
      hito.porcentajeAvance = 100;
      hito.fechaEjecucion = new Date().toISOString();
    } else if (nuevoEstado === 'EN_PROCESO') {
      hito.porcentajeAvance = Math.max(hito.porcentajeAvance || 0, 50);
    } else if (nuevoEstado === 'PENDIENTE') {
      hito.porcentajeAvance = 0;
    }

    return hito;
  }
}
