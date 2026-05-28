import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, lastValueFrom } from 'rxjs';

export interface Empresa {
  ruc: string;
  nombre: string;
  razonSocial?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmpresasMaestrasService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  // Signal para cachear empresas en memoria
  empresas = signal<Empresa[]>([]);
  cargando = signal(false);

  /**
   * Carga la lista de empresas desde la API maestra.
   * Si ya están cargadas, retorna el cache.
   */
  async cargarEmpresas(forceReload = false): Promise<Empresa[]> {
    // Si ya hay empresas cargadas y no se fuerza recarga, retornar cache
    if (this.empresas().length > 0 && !forceReload) {
      return this.empresas();
    }

    this.cargando.set(true);
    try {
      const res: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-empresas`, {})
      );
      const data: Empresa[] = Array.isArray(res) ? res : res?.resultado || [];
      this.empresas.set(data);
      return data;
    } catch (error) {
      console.error('Error al cargar empresas:', error);
      return this.empresas(); // Retornar lo que haya en cache
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Observable para casos donde se necesite reactivo
   */
  listarEmpresas(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/listar-empresas`, {});
  }

  /**
   * Obtiene una empresa por RUC
   */
  getEmpresaByRuc(ruc: string): Empresa | undefined {
    return this.empresas().find(e => e.ruc === ruc);
  }

  /**
   * Obtiene el nombre de una empresa por RUC
   */
  getNombreEmpresa(ruc: string): string {
    const emp = this.getEmpresaByRuc(ruc);
    return emp?.nombre || emp?.razonSocial || ruc;
  }
}
