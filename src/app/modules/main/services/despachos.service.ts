import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DespachosService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Genera salida NS en SPRING (WH) llamando al SP LOGISTICA_generarSalidaNSWH_JSON
   * @param body Objeto con los datos de la salida
   * @returns Observable con la respuesta del backend
   */
  generarSalidaNS(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/generar-salida-ns`, body);
  }

  /**
   * Actualiza el estado del requerimiento en la base de datos LOGISTICA
   * @param body Objeto con idrequerimiento y nuevo estado
   * @returns Observable con la respuesta del backend
   */
  actualizarEstadoRequerimiento(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/actualizar-estado-requerimiento`, body);
  }

  /**
   * Obtiene saldos de stock por lote de items y almacén
   * @param items Array de objetos con { Item, AlmacenCodigo }
   * @returns Observable con array de saldos
   */
  saldosLoteItem(items: { Item: string; AlmacenCodigo: string }[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/saldos-lote-item`, items);
  }

  /**
   * Lista los despachos realizados (NS generadas)
   * @param body Filtros opcionales
   * @returns Observable con array de despachos
   */
  listarDespachosRealizados(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/listar-despachos`, body);
  }

  /**
   * Registra un despacho en la BD local (logistica_despacho y detalle)
   * @param body Objeto con idrequerimiento, usuario, observacion, numeroNS y detalle[]
   * @returns Observable con resultado del registro
   */
  registrarDespacho(body: {
    idrequerimiento: number;
    usuario: string;
    observacion?: string;
    numeroNS: string;
    detalle: { codigo: string; solicitado: number; despachado: number }[];
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/registrar-despacho`, body);
  }
}
