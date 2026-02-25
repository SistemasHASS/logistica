import { inject, Injectable } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom } from 'rxjs';
import { DexieService } from 'src/app/shared/dixiedb/dexie-db.service';

@Injectable({
  providedIn: 'root'
})

export class SaldoRequerimientoService {
  private dexieService = inject( DexieService );
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  async listarMisSaldos(dni: string): Promise<any[]> {
    const url = `${this.baseUrl}/api/logistica/listar-mis-saldos`;
    try {
      return await lastValueFrom(this.http.post<any[]>(url, { dni }));
    } catch(error: any) {
      throw new Error(error.error?.message || 'Error al listar saldos');
    }
  }

  async confirmarAtencionSaldo(idSaldo: number): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/confirmar-atencion-saldo`;
    try {
      return await lastValueFrom(this.http.post<any>(url, { idSaldo }));
    } catch(error: any) {
      throw new Error(error.error?.message || 'Error al confirmar atención de saldo');
    }
  }

  async cerrarSaldo(idSaldo: number): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/cerrar-saldo`;
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    try {
      return await lastValueFrom(this.http.post<any>(url, { 
        idSaldo: idSaldo, // SP expects idSaldo in the JSON
        usuario: usuario.usuario || 'system',
        motivo: 'Cerrado por consolidación'
      }));
    } catch(error: any) {
      throw new Error(error.error?.message || 'Error al cerrar saldo');
    }
  }
}
