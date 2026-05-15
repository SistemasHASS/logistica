import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({ providedIn: 'root' })
export class AprobacionOrdenService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/api/consolidacion`;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  /**
   * Enviar OC o OS al flujo de aprobacion.
   * Calcula los niveles requeridos segun el monto desde LOGISTICA_FlujoAprobacionOC.
   */
  enviarAprobacion(payload: {
    tipoOrden: 'OC' | 'OS';
    codigoOrden: string;
    idConsolidacion: number;
    montoTotal: number;
    moneda: string;
    usuarioGenera: string;
  }): Observable<any> {
    return this.http.post(`${this.base}/enviar-aprobacion-orden`, payload, { headers: this.headers });
  }

  /**
   * Listar OC/OS pendientes de aprobacion para el usuario/rol logueado.
   * El SP filtra por el nivel actual que corresponde al rol del usuario.
   */
  listarPendientes(documentoIdentidad: string, rol: string, tipoOrden?: 'OC' | 'OS'): Observable<any> {
    return this.http.post(
      `${this.base}/listar-pendientes-aprobacion`,
      { documentoIdentidad, rol, tipoOrden: tipoOrden ?? null },
      { headers: this.headers }
    );
  }

  /**
   * Aprobar el nivel actual de una orden.
   * Si es el ultimo nivel la orden pasa a APROBADA.
   */
  aprobar(payload: {
    idAprobacion: number;
    dniAprobador: string;
    nombreAprobador: string;
    observacion?: string;
  }): Observable<any> {
    return this.http.post(`${this.base}/aprobar-orden`, payload, { headers: this.headers });
  }

  /**
   * Rechazar con motivo obligatorio.
   * La orden queda RECHAZADA — puede regenerarse una nueva OC/OS desde el historial.
   */
  rechazar(payload: {
    idAprobacion: number;
    dniAprobador: string;
    nombreAprobador: string;
    motivo: string;
  }): Observable<any> {
    return this.http.post(`${this.base}/rechazar-orden`, payload, { headers: this.headers });
  }

  /**
   * Anular con motivo obligatorio.
   * LIBERA la consolidacion: los items vuelven a PENDIENTE
   * y reaparecen en consolidacion-requerimientos.
   */
  anular(payload: {
    idAprobacion: number;
    dniAprobador: string;
    nombreAprobador: string;
    motivo: string;
  }): Observable<any> {
    return this.http.post(`${this.base}/anular-orden`, payload, { headers: this.headers });
  }

  /**
   * Historial completo de aprobacion de una OC o OS especifica.
   */
  listarHistorial(tipoOrden: 'OC' | 'OS', codigoOrden: string): Observable<any> {
    return this.http.post(
      `${this.base}/listar-historial-aprobacion`,
      { tipoOrden, codigoOrden },
      { headers: this.headers }
    );
  }

  /**
   * NUEVO FLUJO: Crear OC con datos reales desde consolidacion y enviarla a aprobacion.
   * El SP crea la OC + detalle + registro de aprobacion en una sola transaccion.
   */
  crearOCDesdeConsolidacion(payload: {
    idConsolidacion: number;
    proveedor: string;
    nombreProveedor: string;
    rucProveedor: string;
    direccionProveedor?: string;
    telefonoProveedor?: string;
    emailProveedor?: string;
    moneda: string;
    tipoCambio?: number;
    almacen: string;
    lugarEntrega?: string;
    fechaEntregaEstimada?: string;
    condicionesPago?: string;
    formaPago?: string;
    observaciones?: string;
    usuarioGenera: string;
    items: {
      codigo: string;
      descripcion: string;
      cantidad: number;
      unidadMedida: string;
      precioUnitario: number;
      descuento?: number;
      proyecto?: string;
      ceco?: string;
      observaciones?: string;
    }[];
  }): Observable<any> {
    return this.http.post(`${this.base}/crear-oc-desde-consolidacion`, payload, { headers: this.headers });
  }

  /**
   * NUEVO FLUJO: Crear OS con datos reales desde consolidacion y enviarla a aprobacion.
   */
  crearOSDesdeConsolidacion(payload: {
    idConsolidacion: number;
    proveedor: string;
    nombreProveedor: string;
    rucProveedor: string;
    contactoProveedor?: string;
    telefonoProveedor?: string;
    emailProveedor?: string;
    tipoServicio?: string;
    descripcion?: string;
    alcance?: string;
    fechaInicioServicio?: string;
    fechaFinServicio?: string;
    plazoEjecucion?: number;
    ubicacionServicio?: string;
    moneda: string;
    condicionesPago?: string;
    formaPago?: string;
    centroCosto?: string;
    proyecto?: string;
    observaciones?: string;
    usuarioGenera: string;
    items: {
      descripcionServicio: string;
      especificaciones?: string;
      unidadMedida: string;
      cantidad: number;
      precioUnitario: number;
      observaciones?: string;
    }[];
  }): Observable<any> {
    return this.http.post(`${this.base}/crear-os-desde-consolidacion`, payload, { headers: this.headers });
  }

  /**
   * Obtener OC completa con items y niveles de aprobacion.
   */
  obtenerOCDesdeConsolidacion(params: { idAprobacion?: number; codigoOrden?: string }): Observable<any> {
    return this.http.post(`${this.base}/obtener-oc-desde-consolidacion`, params, { headers: this.headers });
  }

  /**
   * Obtener OS completa con items y niveles de aprobacion.
   */
  obtenerOSDesdeConsolidacion(params: { idAprobacion?: number; codigoOrden?: string }): Observable<any> {
    return this.http.post(`${this.base}/obtener-os-desde-consolidacion`, params, { headers: this.headers });
  }

  /**
   * Listar OC/OS pendientes de aprobacion con datos COMPLETOS del documento.
   */
  listarPendientesDetallado(rol: string, tipoOrden?: 'OC' | 'OS'): Observable<any> {
    return this.http.post(
      `${this.base}/listar-pendientes-aprobacion-detallado`,
      { rol, tipoOrden: tipoOrden ?? null },
      { headers: this.headers }
    );
  }

  /**
   * Listar OC/OS aprobadas o rechazadas donde el usuario participó como aprobador.
   */
  listarAprobacionesPorRol(rol: string, tipoOrden?: 'OC' | 'OS', estado?: string): Observable<any> {
    return this.http.post(
      `${this.base}/listar-aprobaciones-por-rol`,
      { rol, tipoOrden: tipoOrden ?? null, estado: estado ?? null },
      { headers: this.headers }
    );
  }

  reintentarSyncSpring(idOrden?: number) {
    return this.http.post(
      `${this.base}/reintentar-sync-spring`,
      idOrden ? { idOrden } : {},
      { headers: this.headers }
    );
  }
}
