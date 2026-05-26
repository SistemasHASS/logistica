import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecepcionOCService {
  private baseUrl = environment.baseUrl;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  // =============================================
  // MÉTODOS PRINCIPALES DE RECEPCIÓN OC
  // =============================================

  /**
   * Registrar una nueva recepción de orden de compra
   */
  registrarRecepcion(recepcionData: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/recepcion-oc/registrar`,
      recepcionData,
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Listar recepciones con filtros opcionales
   */
  listarRecepciones(filtros?: any): Observable<any[]> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/recepcion-oc/listar`,
      filtros || {},
      { headers: this.headers }
    ).pipe(
      map(response => response as any[]),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener recepción por ID o número
   */
  obtenerRecepcionPorId(idRecepcion?: number, numeroRecepcion?: string): Observable<any> {
    const data: any = {};
    if (idRecepcion) data.idRecepcion = idRecepcion;
    if (numeroRecepcion) data.numeroRecepcion = numeroRecepcion;

    return this.http.post(
      `${this.baseUrl}/api/logistica/recepcion-oc/obtener-por-id`,
      data,
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Validar una recepción
   */
  validarRecepcion(idRecepcion: number, usuarioValida: string, observaciones?: string): Observable<any> {
    const data = {
      idRecepcion,
      usuarioValida,
      observaciones: observaciones || ''
    };

    return this.http.post(
      `${this.baseUrl}/api/logistica/recepcion-oc/validar`,
      data,
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Ingresar recepción a Kardex
   */
  ingresarRecepcionKardex(idRecepcion: number, usuarioIngresa: string): Observable<any> {
    const data = {
      idRecepcion,
      usuarioIngresa
    };

    return this.http.post(
      `${this.baseUrl}/api/logistica/recepcion-oc/ingresar-kardex`,
      data,
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar cantidad recibida de un detalle de recepción
   */
  actualizarCantidadRecepcion(datos: {
    idDetalleRecepcion: number;
    cantidadRecibida?: number;
    cantidadAceptada?: number;
    lote?: string;
    motivoRechazo?: string;
  }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/recepcion-oc/actualizar-cantidad`,
      datos,
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener contadores de recepciones
   */
  obtenerContadores(): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/recepcion-oc/contadores`,
      {},
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  // =============================================
  // MÉTODOS DE CONVENIENCIA
  // =============================================

  /**
   * Generar número de recepción localmente
   */
  generarNumeroRecepcion(): string {
    const fecha = new Date();
    const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `REC-${fechaStr}-${random}`;
  }

  /**
   * Preparar datos para enviar al backend
   */
  prepararDatosRecepcion(recepcion: any, detalle: any[], usuario: any): any {
    return {
      idOrden: recepcion.ordenCompraId,
      guiaRemision: recepcion.guiaRemision || '',
      fechaGuiaRemision: recepcion.fechaGuiaRemision || null,
      transportista: recepcion.transportista || '',
      placaVehiculo: recepcion.placaVehiculo || '',
      conductorNombre: recepcion.conductorNombre || '',
      conductorDNI: recepcion.conductorDNI || '',
      observaciones: recepcion.observaciones || '',
      usuarioRecibe: usuario.documentoidentidad,
      nombreUsuarioRecibe: usuario.nombre,
      conformeRecepcion: recepcion.conformidad,
      motivoNoConformidad: recepcion.motivoNoConformidad || '',
      detalle: detalle.map(item => ({
        idDetalleOrden: item.detalleOrdenCompraId,
        item: item.item || 0,
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidadOrdenada: item.cantidadOrdenada,
        cantidadRecibida: item.cantidadRecibida,
        cantidadAceptada: item.cantidadAceptada,
        cantidadRechazada: item.cantidadRechazada || 0,
        unidadMedida: item.unidadMedida || 'UND',
        lote: item.lote || '',
        fechaVencimiento: item.fechaVencimiento || null,
        ubicacion: item.ubicacion || '',
        estadoItem: item.estado || 'CONFORME',
        motivoRechazo: item.motivoRechazo || '',
        observaciones: item.observaciones || '',
        proyecto: item.proyecto || '',
        ceco: item.ceco || '',
        precioUnitario: item.precioUnitario || 0
      }))
    };
  }

  /**
   * Verificar conexión con el backend
   */
  verificarConexion(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/api/logistica/recepcion-oc/contadores`, { 
      headers: this.headers,
      observe: 'response' 
    }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false))
    );
  }

  // =============================================
  // MANEJO DE ERRORES
  // =============================================

  private handleError(error: any): Observable<never> {
    console.error('Error en RecepcionOCService:', error);
    
    let errorMessage = 'Error en la operación de recepción';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      if (error.status === 400) {
        errorMessage = 'Datos inválidos. Verifique la información.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado.';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

// Importación necesaria para el método verificarConexion
import { of } from 'rxjs';
