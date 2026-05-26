import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UnidadMedida } from '@/app/shared/interfaces/Tables';

@Injectable({ providedIn: 'root' })
export class UnidadesMedidaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/api/logistica/maestros/unidades-medida`;

  async listar(soloActivas = false): Promise<UnidadMedida[]> {
    const url = `${this.base}?soloActivas=${soloActivas}`;
    const res = await firstValueFrom(this.http.get<UnidadMedida[]>(url));
    return Array.isArray(res) ? res : [];
  }

  async guardar(u: UnidadMedida): Promise<any> {
    return firstValueFrom(this.http.post(`${this.base}/guardar`, u));
  }

  async eliminar(id: number): Promise<any> {
    return firstValueFrom(this.http.post(`${this.base}/eliminar`, { id }));
  }
}
