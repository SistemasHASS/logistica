import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface ConfigFlujo {
  tipoRequerimiento: string;
  modo: 'UN_NIVEL' | 'DOS_NIVELES';
  activo: boolean;
  nivel2Habilitado: string;
  fechaModificacion?: string;
}

export interface AprobadorNivel2 {
  idAprobadorN2: number;
  ruc: string;
  documentoidentidad: string;
  nombreCompleto: string;
  rol: 'GERENTE' | 'SUBGERENTE';
  orden: number;
  disponible: boolean;
  activo: boolean;
  esVigente: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigFlujoAprobacionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}/api/logistica`;

  // Configuración de modo de flujo por empresa + tipo
  listarConfigFlujo(ruc: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/listar-config-flujo`, { ruc });
  }

  guardarConfigFlujo(data: {
    ruc: string;
    tipoRequerimiento: string;
    modo: 'UN_NIVEL' | 'DOS_NIVELES';
    activo?: boolean;
    usuario?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/guardar-config-flujo`, data);
  }

  // Cadena de aprobadores nivel 2
  listarAprobadoresNivel2(ruc: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/listar-aprobadores-nivel2`, { ruc });
  }

  guardarAprobadorNivel2(data: Partial<AprobadorNivel2> & { usuario?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/guardar-aprobador-nivel2`, data);
  }

  eliminarAprobadorNivel2(idAprobadorN2: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/eliminar-aprobador-nivel2`, { idAprobadorN2 });
  }

  reordenarAprobadorNivel2(ruc: string, idAprobadorN2: number, direccion: -1 | 1): Observable<any> {
    return this.http.post(`${this.baseUrl}/reordenar-aprobador-nivel2`, { ruc, idAprobadorN2, direccion });
  }

  toggleDisponibleAprobadorN2(idAprobadorN2: number, disponible: boolean): Observable<any> {
    return this.http.post(`${this.baseUrl}/toggle-disponible-aprobador-n2`, { idAprobadorN2, disponible });
  }
}
