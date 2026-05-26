import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface Area {
  idarea: number;
  ruc: string;
  nombre?: string;
  descripcion: string;
  estado: boolean;
  mostrarAdmision: boolean;
  fechaCreacion: string;
  usuarioCreacion?: string;
}

export interface SubArea {
  idsubarea: number;
  ruc: string;
  idarea: number;
  nombre: string;
  estado: boolean;
  fechaCreacion: string;
  usuarioCreacion?: string;
  nombreArea?: string;
}

export interface CatalogoArea {
  idarea: number;
  descripcion: string;
  codigo: string;
  orden: number;
  estado: boolean;
  fechaCreacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class AreasService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  // ==================== ÁREAS ====================
  listarAreas(ruc: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/areas/listar`, { ruc });
  }

  crearArea(area: Partial<Area>): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/areas/crear`, area);
  }

  actualizarArea(area: Partial<Area>): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/areas/actualizar`, area);
  }

  eliminarArea(idarea: number, ruc: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/areas/eliminar`, { idarea, ruc });
  }

  // ==================== SUBÁREAS ====================
  listarSubAreas(ruc: string, idarea?: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/subareas/listar`, { ruc, idarea });
  }

  crearSubArea(subarea: Partial<SubArea>): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/subareas/crear`, subarea);
  }

  actualizarSubArea(subarea: Partial<SubArea>): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/subareas/actualizar`, subarea);
  }

  eliminarSubArea(idsubarea: number, ruc: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/subareas/eliminar`, { idsubarea, ruc });
  }

  // ==================== CATÁLOGO ÁREAS ====================
  listarCatalogoAreas(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/listar-catalogo-areas`, {});
  }

  crearCatalogoArea(area: Partial<CatalogoArea>): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/crear-catalogo-area`, area);
  }

  actualizarCatalogoArea(area: Partial<CatalogoArea>): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/actualizar-catalogo-area`, area);
  }

  // ==================== SINCRONIZACIÓN ====================
  sincronizarAreasDesdeCatalogo(ruc: string, usuarioCreacion: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/areas/sincronizar-catalogo`, { ruc, usuarioCreacion });
  }
}
