import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Almacen } from '../model/almacen.model';


@Injectable({
  providedIn: 'root'
})
export class LogisticaService {
  private apiUrl = 'https://localhost:7140/api/logistica';

  constructor(private http: HttpClient) {}

  listarAlmacenes(ruc: string): Observable<Almacen[]> {
    // Enviamos el RUC al backend como arreglo, que es lo que espera el SP
    return this.http.post<Almacen[]>(`${this.apiUrl}/listar-almacen`, [{ ruc }]);
  }

  listarFundos(idEmpresa: string): Observable<any[]> {
    // Enviamos el idempresa al backend como arreglo, que es lo que espera el SP
    return this.http.post<any[]>(`${this.apiUrl}/listar-fundo`, [{ idEmpresa }]);
  }

  listarRequerimientos(filtro: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/listar-requerimiento`, filtro);
  }

  registrarRequerimientos(data: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/registrar-requerimiento`, data);
  }

  reporteSemanal(data: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/reporte-semanal`, data);
  }
}
