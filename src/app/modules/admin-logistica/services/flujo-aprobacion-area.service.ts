import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FlujoAprobacionArea {
  idFlujo: number;
  ruc: string;
  idarea: number;
  nombreArea?: string;
  tipoRequerimiento: string;
  rolAprobador: string;
  activo: boolean;
  fechaCreacion?: string;
}

export interface Area {
  idarea: number;
  nombre: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FlujoAprobacionAreaService {
  private http = inject(HttpClient);
  private baseUrl = 'https://apilogistica.agroapps.net:7018/api/logistica';

  listarFlujoAprobacionArea(ruc: string, idarea?: number): Observable<any> {
    const data = idarea ? { ruc, idarea } : { ruc };
    return this.http.post(`${this.baseUrl}/listar-flujo-aprobacion-area`, data);
  }

  guardarFlujoAprobacionArea(data: Partial<FlujoAprobacionArea>): Observable<any> {
    return this.http.post(`${this.baseUrl}/guardar-flujo-aprobacion-area`, data);
  }

  eliminarFlujoAprobacionArea(idFlujo: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/eliminar-flujo-aprobacion-area`, { idFlujo });
  }

  listarAreas(ruc: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/listar-areas-flujo`, { ruc });
  }
}
