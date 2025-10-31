import { inject, Injectable } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom } from 'rxjs';
import { DexieService } from 'src/app/shared/dixiedb/dexie-db.service';

@Injectable({
  providedIn: 'root'
})

export class ReporteService {
  private dexieService = inject( DexieService );
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  async reporteConsumo(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/listar-requerimiento-consumo`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch(error: any) {
      throw new Error(error.error?.message || 'Error al obtener reporte requerimiento consumo');
    }
  }

    async reporteTransferencia(body: any): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/listar-requerimiento-transferencia`;
    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch(error: any) {
      throw new Error(error.error?.message || 'Error al obtener reporte requerimiento transferencia');
    }
  }
}
