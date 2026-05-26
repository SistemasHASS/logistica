import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface UsuarioPorArea {
  idUsuarioArea?: number;
  documentoidentidad: string;
  nombreCompleto: string;
  ruc: string;
  idarea: number;
  idsubarea?: number;
  rol: string;
  esJefeArea: boolean;
  esAprobador: boolean;
  email?: string;
  telefono?: string;
  activo: boolean;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
  idUsuario?: number;
  // Campos de relación
  nombreArea?: string;
  nombreSubArea?: string;
}

export interface UsuarioLocal {
  idUsuario: number;
  documentoidentidad: string;
  nombreCompleto: string;
  email?: string;
  telefono?: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioAreaService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  listarUsuariosPorArea(filtros: {
    ruc?: string;
    idarea?: number;
    idsubarea?: number;
    rol?: string;
    activo?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/usuarios-por-area/listar`, filtros);
  }

  crearUsuarioPorArea(usuario: Partial<UsuarioPorArea>): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/usuarios-por-area/crear`, usuario);
  }

  actualizarUsuarioPorArea(usuario: Partial<UsuarioPorArea>): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/usuarios-por-area/actualizar`, usuario);
  }

  eliminarUsuarioPorArea(idUsuarioArea: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/usuarios-por-area/eliminar`, { idUsuarioArea });
  }

  // ==================== USUARIOS LOCALES ====================
  listarUsuariosLocales(ruc?: string, activo?: boolean): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/listar-usuarios-locales`, { ruc, activo });
  }

  // ==================== SINCRONIZACIÓN ====================
  sincronizarUsuariosDesdeERP(ruc: string, usuarioCreacion: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/usuarios/sincronizar-erp`, { ruc, usuarioCreacion });
  }

  asignarUsuarioAArea(data: {
    documentoidentidad: string;
    ruc: string;
    idarea: number;
    idsubarea?: number;
    rol: string;
    esJefeArea?: boolean;
    esAprobador?: boolean;
    usuarioCreacion: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/asignar-usuario-area`, data);
  }

  // ==================== ROLES DISPONIBLES ====================
  getRolesDisponibles(): Array<{ id: string; nombre: string }> {
    return [
      { id: 'TILOGIST', nombre: 'Admin Sistema' },
      { id: 'ADLOGIST', nombre: 'Admin Logística' },
      { id: 'JLOLOGIST', nombre: 'Jefe Logística' },
      { id: 'JEMLOGIST', nombre: 'Jefe Licitaciones' },
      { id: 'LOLOGIST', nombre: 'Operador Logística' },
      { id: 'EMLOGIST', nombre: 'Operador Licitaciones' },
      { id: 'ALLOGIST', nombre: 'Almacén' },
      { id: 'OPLOGIST', nombre: 'Operativo Campo' },
      { id: 'APLOGIST', nombre: 'Aprobador Consumo' },
      { id: 'JEFE_AREA', nombre: 'Jefe de Área' },
      { id: 'SOLICITANTE', nombre: 'Solicitante' }
    ];
  }
}
