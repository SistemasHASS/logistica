import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { lastValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl: string = environment.baseUrl;
  private readonly aplicaciones: string = 'LOGISTICA';
  private readonly baseUrlMaestra: string = environment.apiMaestra;

  constructor(private http: HttpClient, private dexieService: DexieService) { }

  async login(
    usuario: string,
    clave: string,
    aplicacion: string
  ): Promise<any> {
    const url = `${this.baseUrlMaestra}/api/Maestros/get-usuarios`;

    // const body = [{ usuario, clave, aplicacion:'LOGISTICA' }];
    const body = [{ usuario, clave, aplicacion: this.aplicaciones }];

    try {
      const response = await lastValueFrom(this.http.post<any>(url, body));
      return response;
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error de autenticación');
    }
  }
  async isLoggedIn() {
    const user = await this.dexieService.showUsuario();
    return !!user;
  }

  async getUser() {
    return await this.dexieService.getUsuarioLogueado();
  }

  //Perfil Administrador
  async isAdministrador() {
    const user = await this.getUser();
    return user?.idrol === 'ADLOGIST';
  }

  //Perfil Aprobador
  async isAprobador() {
    const user = await this.getUser();
    return user?.idrol === 'APLOGIST';
  }

  //Perfil Almacen
  async isAlmacen() {
    const user = await this.getUser();
    return user?.idrol === 'ALLOGIST';
  }

  //Perfil Usuario
  async isUsuario() {
    const user = await this.getUser();
    return user?.idrol === 'OPLOGIST';
  }

  //Perfil Sistemas
  async isSistemas() {
    const user = await this.getUser();
    return user?.idrol === 'TILOGIST';
  }

  //Perfil Empaque
  async isEmpaque() {
    const user = await this.getUser();
    return user?.idrol === 'EMLOGIST';
  }

  //Perfil Logístico
  async isLogistico() {
    const user = await this.getUser();
    return user?.idrol === 'LOLOGIST';
  }

  // ============================
  // 🔐 VALIDACIÓN LOGÍSTICA REAL
  // ============================
  async isAdminSistemaLogistica(): Promise<boolean> {
    const u = await this.getUser();
    if (!u) return false;

    const url = `${this.baseUrl}/api/logistica/es-admin-sistema/${u.usuario}`;
    const resp: any = await lastValueFrom(this.http.get(url));

    return resp?.permitido === true;
  }
}
