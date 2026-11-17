import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminLogisticaAuthService } from '../auth/services/admin-logistica-auth.service';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export type TipoAmbito = 'ADMINISTRATIVO' | 'FUNDO';
export type TipoRequerimientoAmbito = 'CONSUMO' | 'COMPRA' | 'SERVICIO';

export interface AmbitoOrganizacional {
  idAmbito: number;
  ruc: string;
  tipoAmbito: TipoAmbito;
  codigoUnidad: string;
  nombre: string;
  idFundoMaestro?: number | null;
  empresaFundoMaestro?: number | null;
  activo: boolean;
}

export interface AreaAmbito {
  idAreaAmbito: number;
  ruc: string;
  idAmbito: number;
  idarea: number;
  nombre: string;
  activo: boolean;
}

export interface AsignacionAmbito {
  idAreaAmbito: number;
  documentoidentidad: string;
  puedeSolicitar: boolean;
  puedeAprobarN1: boolean;
  puedeAprobarN2: boolean;
  activo: boolean;
  vigenteDesde: string;
  vigenteHasta: string | null;
}

export interface ResponsableReglaAmbito {
  nivel: number;
  documentoidentidad: string;
  orden: number;
  disponible: boolean;
  vigenteDesde: string;
  vigenteHasta: string | null;
}

export interface ReglaAmbito {
  idRegla: number;
  tipoAmbito: TipoAmbito;
  idAmbito: number | null;
  idarea: number | null;
  tipoRequerimiento: TipoRequerimientoAmbito;
  niveles: number;
  estado: 'BORRADOR' | 'PUBLICADA' | 'INACTIVA';
  vigenteDesde: string;
  vigenteHasta: string | null;
  responsables: ResponsableReglaAmbito[];
}

export interface AuditoriaConfigAmbito {
  idAuditoria: number;
  entidad: string;
  idEntidad: number;
  accion: string;
  usuario: string;
  motivo: string;
  fecha: string;
}

export interface DespliegueAmbito {
  ruc: string;
  habilitado: boolean;
  fechaActivacion: string | null;
  usuario: string;
  motivo: string;
  fechaModificacion: string;
}

export interface ConfiguracionAmbitos {
  ambitos: AmbitoOrganizacional[];
  areas: AreaAmbito[];
  asignaciones: AsignacionAmbito[];
  reglas: ReglaAmbito[];
  auditoria: AuditoriaConfigAmbito[];
  despliegue?: DespliegueAmbito | null;
}

export interface CambioAmbito {
  ruc: string;
  usuario: string;
  motivo: string;
}

export interface ResultadoCambioAmbito {
  success: number;
  idAmbito?: number;
  idAreaAmbito?: number;
  idAsignacion?: number;
  idRegla?: number;
  estado?: string;
}

export interface SimulacionRutaAmbito {
  idRegla: number | null;
  niveles: number | null;
  responsableN1: string | null;
  responsableN2: string | null;
  omitirN1: boolean;
  autoaprobacion?: boolean;
  valido: boolean;
  mensaje: string;
}

export interface ConfigAutoaprobacion {
  idConfig: number;
  ruc: string;
  tipoRequerimiento: TipoRequerimientoAmbito;
  idAreaAmbito: number; // 0 = toda la empresa (global)
  nombreAmbitoArea?: string | null;
  exigeNivel2: boolean;
  requiereMotivo: boolean;
  activo: boolean;
  fechaModificacion?: string | null;
  usuarioModificacion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AprobacionAmbitosService {
  private http = inject(HttpClient);
  private auth = inject(AdminLogisticaAuthService);
  private opciones() {
    const roles = (this.auth.currentUser()?.idrol || '').split(',').map(r => r.trim());
    const rol = roles.find(r => r === 'TILOGIST' || r === 'ADLOGIST') || '';
    return { headers: { 'X-User-Role': rol } };
  }
  private baseUrl = `${environment.baseUrl}/api/logistica/aprobacion-ambitos`;

  obtenerConfiguracion(ruc: string): Observable<ConfiguracionAmbitos> {
    return this.http.post<ConfiguracionAmbitos>(`${this.baseUrl}/configuracion`, { ruc }, this.opciones());
  }

  guardarAmbito(data: Omit<AmbitoOrganizacional, 'ruc'> & CambioAmbito): Observable<ResultadoCambioAmbito> {
    return this.http.post<ResultadoCambioAmbito>(`${this.baseUrl}/guardar-ambito`, data, this.opciones());
  }

  guardarArea(data: { idAmbito: number; idarea: number; activo: boolean } & CambioAmbito): Observable<ResultadoCambioAmbito> {
    return this.http.post<ResultadoCambioAmbito>(`${this.baseUrl}/guardar-area`, data, this.opciones());
  }

  guardarAsignacion(data: AsignacionAmbito & CambioAmbito): Observable<ResultadoCambioAmbito> {
    return this.http.post<ResultadoCambioAmbito>(`${this.baseUrl}/guardar-asignacion`, data, this.opciones());
  }

  guardarRegla(data: Omit<ReglaAmbito, 'estado'> & CambioAmbito): Observable<ResultadoCambioAmbito> {
    return this.http.post<ResultadoCambioAmbito>(`${this.baseUrl}/guardar-regla`, data, this.opciones());
  }

  cambiarEstado(data: { idRegla: number; estado: 'PUBLICADA' | 'INACTIVA' } & CambioAmbito): Observable<ResultadoCambioAmbito> {
    return this.http.post<ResultadoCambioAmbito>(`${this.baseUrl}/estado-regla`, data, this.opciones());
  }

  cambiarDespliegue(data: { ruc: string; habilitado: boolean } & CambioAmbito): Observable<ResultadoCambioAmbito> {
    return this.http.post<ResultadoCambioAmbito>(`${this.baseUrl}/cambiar-despliegue`, data, this.opciones());
  }

  simular(data: { ruc: string; idAreaAmbito: number; documentoidentidad: string; tipoRequerimiento: TipoRequerimientoAmbito }): Observable<SimulacionRutaAmbito> {
    return this.http.post<SimulacionRutaAmbito>(`${environment.baseUrl}/api/logistica/simular-ruta-aprobacion-ambito`, data, this.opciones());
  }

  listarAutoaprobacion(ruc: string): Observable<ConfigAutoaprobacion[]> {
    return this.http.post<ConfigAutoaprobacion[]>(`${this.baseUrl}/config-autoaprobacion`, { ruc }, this.opciones());
  }

  guardarAutoaprobacion(data: {
    tipoRequerimiento: TipoRequerimientoAmbito; idAreaAmbito: number;
    exigeNivel2: boolean; requiereMotivo: boolean; activo: boolean;
  } & CambioAmbito): Observable<ResultadoCambioAmbito> {
    return this.http.post<ResultadoCambioAmbito>(`${this.baseUrl}/guardar-autoaprobacion`, data, this.opciones());
  }

  eliminarAutoaprobacion(data: { idConfig: number } & CambioAmbito): Observable<ResultadoCambioAmbito> {
    return this.http.post<ResultadoCambioAmbito>(`${this.baseUrl}/eliminar-autoaprobacion`, data, this.opciones());
  }
}
