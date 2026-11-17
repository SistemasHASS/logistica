import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface AsignacionAmbito {
  idAreaAmbito: number;
  idAmbito: number;
  idarea: number;
  tipoAmbito: 'ADMINISTRATIVO' | 'FUNDO';
  codigoUnidad: string;
  idFundoMaestro?: number | null;
  empresaFundoMaestro?: number | null;
  nombreAmbito: string;
  nombreArea: string;
  puedeSolicitar?: boolean;
  puedeAprobarN1?: boolean;
  puedeAprobarN2?: boolean;
}

export interface ContextoAmbito {
  instalado: boolean;
  habilitado: boolean;
  asignaciones?: AsignacionAmbito[];
  permisosAprobacion?: AsignacionAmbito[];
}

export interface PendienteAmbito {
  idRuta: number;
  version: number;
  idrequerimiento: string;
  ruc: string;
  idAreaAmbito: number;
  solicitante: string;
  nivel: number;
  responsable: string;
  fechaCreacion: string;
  glosa?: string;
  tipo?: string;
  itemtipo?: string;
  estados?: string;
  tipoAmbito?: string;
  codigoUnidad?: string;
  idFundoMaestro?: number | null;
  idfundoRequerimiento?: string;
  nombreAmbito?: string;
  nombreArea?: string;
  autorizadoActualmente: boolean;
  esperaNivelAnterior: boolean;
  esAutoaprobacion?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AprobacionesAmbitosService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  contexto(ruc: string, documentoidentidad: string): Observable<ContextoAmbito> {
    return this.http.post<ContextoAmbito>(
      `${this.baseUrl}/api/logistica/aprobacion-ambitos/contexto`, { ruc, documentoidentidad });
  }

  enviar(data: { ruc: string; idrequerimiento: string; idAreaAmbito: number; documentoidentidad: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-ambitos/enviar`, data);
  }

  pendientes(ruc: string, documentoidentidad: string): Observable<PendienteAmbito[]> {
    return this.http.post<PendienteAmbito[]>(
      `${this.baseUrl}/api/logistica/aprobacion-ambitos/pendientes`, { ruc, documentoidentidad });
  }

  decidir(data: {
    ruc: string; idRuta: number; nivel: number; documentoidentidad: string;
    accion: 'APROBADO' | 'RECHAZADO'; motivo?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-ambitos/decidir`, data);
  }

  reasignar(data: {
    ruc: string; idRuta: number; nivel: number; nuevoResponsable: string;
    usuario: string; motivo: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-ambitos/reasignar`, data);
  }

  invalidar(data: { ruc: string; idrequerimiento: string; usuario: string; motivo: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-ambitos/invalidar`, data);
  }

  historial(ruc: string, idrequerimiento: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-ambitos/historial`, { ruc, idrequerimiento });
  }

  marcarEfecto(data: { ruc: string; idRuta: number; tipo: 'SALDOS' | 'SPRING'; estado: 'COMPLETADO' | 'ERROR'; error?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/aprobacion-ambitos/marcar-efecto`, data);
  }

  /**
   * Devuelve el área-ámbito que corresponde al requerimiento cuando la empresa
   * tiene habilitado el flujo por ámbitos, o null si debe seguir el flujo legado.
   * Regla: un ámbito FUNDO coincide por área y código de fundo (idfundo del
   * requerimiento); si no hay coincidencia de fundo se usa un ámbito
   * ADMINISTRATIVO del mismo área, cuando exista.
   */
  resolverAreaAmbito(contexto: ContextoAmbito | null | undefined, req: { idarea?: any; idfundo?: any }): AsignacionAmbito | null {
    if (!contexto?.habilitado || !Array.isArray(contexto.asignaciones)) return null;
    const idarea = Number(req.idarea);
    const idfundo = (req.idfundo ?? '').toString().trim();
    const candidatas = contexto.asignaciones.filter(a => a.idarea === idarea);
    const fundo = candidatas.find(a => a.tipoAmbito === 'FUNDO' && a.codigoUnidad === idfundo);
    if (fundo) return fundo;
    return candidatas.find(a => a.tipoAmbito === 'ADMINISTRATIVO') ?? null;
  }

  /**
   * Intenta enviar el requerimiento por el motor de ámbitos.
   * Devuelve el resultado del envío, o null si la empresa no está habilitada
   * o el área no está configurada en el nuevo flujo (sigue el motor legado).
   * Los errores del envío se propagan: nunca se reporta éxito sin ruta válida.
   */
  async enviarSiCorresponde(req: { ruc: string; idrequerimiento: string; idarea?: any; idfundo?: any }, documentoidentidad: string): Promise<any | null> {
    let contexto: ContextoAmbito | undefined;
    try {
      contexto = await this.contexto(req.ruc, documentoidentidad).toPromise();
    } catch {
      // Motor de ámbitos no disponible (aún no desplegado): sigue el legado.
      return null;
    }
    if (!contexto?.habilitado) return null;
    const areaAmbito = this.resolverAreaAmbito(contexto, req);
    if (!areaAmbito) return null;
    const respuesta = await this.enviar({
      ruc: req.ruc,
      idrequerimiento: req.idrequerimiento,
      idAreaAmbito: areaAmbito.idAreaAmbito,
      documentoidentidad,
    }).toPromise();
    if (!respuesta?.success) {
      throw new Error(respuesta?.mensaje ?? 'No se pudo registrar la ruta de aprobación del requerimiento');
    }
    return respuesta;
  }
}
