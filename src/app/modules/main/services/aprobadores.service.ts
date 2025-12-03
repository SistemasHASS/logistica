import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import {
  Nivel,
  TipoDocumento,
  Aprobador,
} from 'src/app/shared/interfaces/Tables';

@Injectable({
  providedIn: 'root',
})
export class AprobadoresService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getAprobadores(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/listar-aprobadores`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al obtener usuario aprobador'
      );
    }
  }

  registrarAprobadores(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/registrar-aprobadores`;
    try {
      return this.http.post<any>(url, body);
    } catch (error: any) {
      throw new Error(
        error.error?.message || 'Error al registrar usuario aprobador'
      );
    }
  }

  listarNiveles(): Observable<Nivel[]> {
    // const url = `${this.baseUrl}/api/logistica/listar-niveles-aprobadores`;
    return this.http.get<Nivel[]>(
      `${this.baseUrl}/LOGISTICA_listarNivelesAprobacion`
    );
    // try {
    //   return this.http.post<any>(url, body);
    // } catch (error: any) {
    //   throw new Error(
    //     error.error?.message || 'Error al registrar usuario aprobador'
    //   );
    // }
  }

  listarTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(
      `${this.baseUrl}/LOGISTICA_listarTiposDocumentoAprobacion`
    );
    // Si no existe endpoint para tipos, puedes codificarlos en frontend.
  }

  listarAprobadores(
    idNivel: number,
    codigoDocumento: string
  ): Observable<Aprobador[]> {
    // Si tu endpoint acepta JSON, envía el body necesario. Ejemplo usando query:
    return this.http.get<Aprobador[]>(
      `${this.baseUrl}/LOGISTICA_listarAprobadoresNivel?idNivel=${idNivel}&codigoDocumento=${codigoDocumento}`
    );
  }

  registrarAprobador(a: Aprobador): Observable<any> {
    // Post con body o exec SP según tu backend
    return this.http.post(`${this.baseUrl}/LOGISTICA_registrarAprobadorNivel`, a);
  }

  desactivarAprobador(idAprobador: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/LOGISTICA_desactivarAprobador`, {
      idAprobador,
    });
  }
}
