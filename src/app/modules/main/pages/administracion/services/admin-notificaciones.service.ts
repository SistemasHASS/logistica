import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminNotificacionesService {
  private readonly base = `${environment.baseUrl}/api/logistica/notificacion-config`;

  constructor(private http: HttpClient) {}

  listarTipos(): Promise<any[]> {
    return firstValueFrom(this.http.post<any[]>(`${this.base}/listar-tipos`, {}));
  }

  guardarTipo(tipo: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.base}/guardar-tipo`, tipo));
  }

  eliminarTipo(tipo_notificacion: string): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.base}/eliminar-tipo`, { tipo_notificacion }));
  }

  listarConfig(idrol?: string): Promise<any[]> {
    return firstValueFrom(this.http.post<any[]>(`${this.base}/listar-config`, { idrol: idrol ?? '' }));
  }

  guardarConfig(idrol: string, items: any[], usuarioModifica?: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.base}/guardar-config`, { idrol, items, usuarioModifica }),
    );
  }

  listarParams(): Promise<any[]> {
    return firstValueFrom(this.http.post<any[]>(`${this.base}/listar-params`, {}));
  }

  guardarParam(clave: string, valor: string, usuarioModifica?: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.base}/guardar-param`, { clave, valor, usuarioModifica }),
    );
  }
}
