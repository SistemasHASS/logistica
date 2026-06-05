import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({ providedIn: 'root' })
export class TipoCambioService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  async obtenerTipoCambio(fecha?: string): Promise<{ fecha: string; tipoCambio: number } | null> {
    const body = fecha ? { fecha } : {};
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/tipo-cambio/obtener`, body)
      );
      return resp ?? null;
    } catch {
      return null;
    }
  }

  fechaHoyString(): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear().toString();
    const mm = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const dd = hoy.getDate().toString().padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }
}
