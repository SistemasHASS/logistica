import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface IncrementoOcConfiguracion {
  idConfigIncremento: number;
  version: number;
  porcentaje: number;
  fechaInicioVigencia: string;
  fechaFinVigencia: string | null;
  vigente: boolean;
  motivoCambio: string;
  usuarioRegistra: string;
  nombreUsuarioRegistra: string | null;
  fechaRegistro: string;
  ipRegistro: string | null;
  origenRegistro: string | null;
  activo: boolean;
}

export interface IncrementoOcPayload {
  porcentaje: number;
  motivo: string;
  usuario: string;
  nombreUsuario: string;
}

export interface IncrementoOcGuardarResponse {
  success: boolean;
  idConfigIncremento?: number;
  version?: number;
  porcentaje?: number;
  mensaje: string;
  errorCodigo?: number;
}

export interface IncrementoOcHistorialPayload {
  desde?: string;
  hasta?: string;
  estado?: string;
}

export interface IncrementoOcAuditoriaPayload {
  idConfigIncremento: number;
  desde?: string;
  hasta?: string;
}

export interface IncrementoOcAuditoria {
  idAuditoria: number;
  idConfigIncremento: number;
  accion: string;
  porcentajeAnterior: number | null;
  porcentajeNuevo: number | null;
  motivo: string | null;
  usuario: string;
  nombreUsuario: string | null;
  fecha: string;
  ip: string | null;
  datosAnterioresJson: string | null;
  datosNuevosJson: string | null;
}

@Injectable({ providedIn: 'root' })
export class IncrementoOcService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.baseUrl}/api/logistica/admin-logistica/incremento-oc`;

  obtenerVigente(): Observable<IncrementoOcConfiguracion> {
    return this.http.get<IncrementoOcConfiguracion>(`${this.endpoint}/vigente`);
  }

  crear(payload: IncrementoOcPayload): Observable<IncrementoOcGuardarResponse> {
    return this.http.post<IncrementoOcGuardarResponse>(this.endpoint, payload);
  }

  obtenerHistorial(payload: IncrementoOcHistorialPayload): Observable<IncrementoOcConfiguracion[]> {
    return this.http.post<IncrementoOcConfiguracion[]>(`${this.endpoint}/historial`, payload);
  }

  obtenerAuditoria(payload: IncrementoOcAuditoriaPayload): Observable<IncrementoOcAuditoria[]> {
    return this.http.post<IncrementoOcAuditoria[]>(`${this.endpoint}/auditoria`, payload);
  }
}
