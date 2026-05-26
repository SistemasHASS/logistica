import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { UsuarioLogistica } from '../usuarios.component';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<UsuarioLogistica[]> {
    return this.http.get<UsuarioLogistica[]>(`${this.baseUrl}/api/logistica/admin-logistica/usuarios`);
  }

  getUsuario(id: number): Observable<UsuarioLogistica> {
    return this.http.get<UsuarioLogistica>(`${this.baseUrl}/api/logistica/admin-logistica/usuarios/${id}`);
  }

  crearUsuario(data: Partial<UsuarioLogistica> & { clave?: string; ruc?: string; nrodocumento?: string; idEmpresa?: string; creadoPor?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/logistica/admin-logistica/usuarios`, data);
  }

  actualizarUsuario(id: number, data: Partial<UsuarioLogistica>): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/logistica/admin-logistica/usuarios/${id}`, data);
  }

  cambiarEstado(id: number, activo: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/api/logistica/admin-logistica/usuarios/${id}/estado`, { activo });
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/logistica/admin-logistica/usuarios/${id}`);
  }

  buscarEnErp(q: string): Observable<{ nrodocumento: string; usuario: string; nombre: string; clave: string }[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/logistica/admin-logistica/usuarios/buscar-erp?q=${encodeURIComponent(q)}`);
  }
}
