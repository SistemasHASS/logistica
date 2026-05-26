import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface PdfConfig {
  logoUrl: string;
  colorPrimario: string;
  colorSecundario: string;
  textoEncabezado: string;
  textoPie: string;
  mostrarLogo: boolean;
  mostrarCodigoBarras: boolean;
  formatoNumero: string;
  tamanioPagina: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<PdfConfig> {
    return this.http.get<PdfConfig>(`${this.baseUrl}/api/logistica/admin-logistica/pdf-config`);
  }

  saveConfig(config: PdfConfig): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/pdf-config`, config);
  }
}
