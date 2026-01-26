import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminContextService {

  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  async getEmpresaByPerfil(idPerfil: string): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/admin-contexto-empresa`;

    const body = [{
      idPerfil
    }];

    return await lastValueFrom(this.http.post<any>(url, body));
  }
}
