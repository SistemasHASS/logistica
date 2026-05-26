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
    const url = `${this.baseUrl}/api/logistica/listar-aprobadores`;
    return this.http.post<Nivel[]>(url, { tipo: 'NIVELES' });
  }

  listarTiposDocumento(): Observable<TipoDocumento[]> {
    const url = `${this.baseUrl}/api/logistica/listar-aprobadores`;
    return this.http.post<TipoDocumento[]>(url, { tipo: 'TIPOS' });
  }

  listarAprobadores(
    idNivel: number,
    codigoDocumento: string
  ): Observable<Aprobador[]> {
    const url = `${this.baseUrl}/api/logistica/listar-aprobadores`;
    return this.http.post<Aprobador[]>(url, { idNivel, codigoDocumento });
  }

  registrarAprobador(a: Aprobador): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/crear-aprobador`;
    return this.http.post(url, a);
  }

  desactivarAprobador(idAprobador: number): Observable<any> {
    const url = `${this.baseUrl}/api/logistica/crear-aprobador`;
    return this.http.post(url, { idAprobador, accion: 'DESACTIVAR' });
  }
}
