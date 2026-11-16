import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Almacen } from '../model/almacen.model';
import { environment } from '@/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class LogisticaService {
  private apiUrl = environment.baseUrl + '/api/logistica';

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

  reporteRequerimientos(data: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/generar-reporte-requerimientos`, data);
  }

  // ===================== SEGUIMIENTO REQ. COMPRA =====================

  reporteSeguimientoCompras(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reporte-seguimiento-compras`, data);
  }

  reporteSeguimientoComprasAnalisis(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reporte-seguimiento-compras-analisis`, data);
  }

  reporteSeguimientoConsumos(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reporte-seguimiento-consumos`, data);
  }

  listarAccesoReporte(modulo: string, busqueda: string = ''): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/listar-acceso-reporte`, [{ modulo, busqueda }]);
  }

  guardarAccesoReporte(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/guardar-acceso-reporte`, [payload]);
  }

  buscarUsuarioPorDni(dni: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buscar-usuario-por-dni`, [{ dni }]);
  }

  listarEmpresas(filtro: any = []): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/lista-empresa`, filtro);
  }
}
