import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AprobacionOCService {
  private baseUrl = environment.baseUrl;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  /**
   * Asignar aprobadores a una orden de compra
   */
  asignarAprobadores(idOrdenCompra: number, montoTotal: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/asignar-aprobadores`,
      { idOrdenCompra, montoTotal },
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Aprobar o rechazar una orden de compra
   */
  aprobarRechazar(
    idAprobacion: number,
    accion: 'APROBAR' | 'RECHAZAR',
    usuarioAprueba: string,
    nombreUsuario: string,
    observaciones?: string
  ): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/aprobar-rechazar`,
      { idAprobacion, accion, usuarioAprueba, nombreUsuario, observaciones },
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Listar órdenes de compra pendientes de aprobación
   */
  listarPendientes(documentoIdentidad?: string, rol?: string): Observable<any[]> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/listar-pendientes`,
      { documentoIdentidad, rol },
      { headers: this.headers }
    ).pipe(
      map(response => response as any[]),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener historial de aprobaciones de una OC
   */
  obtenerHistorial(idOrdenCompra?: number, numeroOrden?: string): Observable<any[]> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/historial`,
      { idOrdenCompra, numeroOrden },
      { headers: this.headers }
    ).pipe(
      map(response => response as any[]),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener contadores de aprobaciones
   */
  obtenerContadores(documentoIdentidad?: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/contadores`,
      { documentoIdentidad },
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Guardar usuario aprobador
   */
  guardarUsuarioAprobador(usuario: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/usuarios/guardar`,
      usuario,
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Listar usuarios aprobadores
   */
  listarUsuariosAprobadores(): Observable<any[]> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/usuarios/listar`,
      {},
      { headers: this.headers }
    ).pipe(
      map(response => response as any[]),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar usuario aprobador
   */
  eliminarUsuarioAprobador(idUsuarioAprobador: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/usuarios/eliminar`,
      { idUsuarioAprobador },
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Listar flujos de aprobación
   */
  listarFlujos(): Observable<any[]> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/flujos/listar`,
      {},
      { headers: this.headers }
    ).pipe(
      map(response => response as any[]),
      catchError(this.handleError)
    );
  }

  /**
   * Guardar flujo de aprobación
   */
  guardarFlujo(flujo: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/flujos/guardar`,
      flujo,
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar flujo de aprobación
   */
  eliminarFlujo(idFlujo: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/logistica/aprobacion-oc/flujos/eliminar`,
      { idFlujo },
      { headers: this.headers }
    ).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  // Alias para compatibilidad con componente
  listarFlujosAprobacion(): Observable<any[]> {
    return this.listarFlujos();
  }

  crearFlujoAprobacion(flujo: any): Observable<any> {
    return this.guardarFlujo(flujo);
  }

  actualizarFlujoAprobacion(flujo: any): Observable<any> {
    return this.guardarFlujo(flujo);
  }

  eliminarFlujoAprobacion(idFlujo: number): Observable<any> {
    return this.eliminarFlujo(idFlujo);
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en AprobacionOCService:', error);
    
    let errorMessage = 'Error en la operación de aprobación';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
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
