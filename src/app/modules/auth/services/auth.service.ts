import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { lastValueFrom } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private readonly baseUrl: string = environment.baseUrl;
  private readonly aplicacion: string = 'LOGISTICA';
  private readonly baseUrlMaestra: string = environment.apiMaestra;

  constructor(
    private http: HttpClient,
    private dexieService: DexieService
  ) { }

  async login(usuario: string, clave: string, aplicacion: string): Promise<any> {

    const url = `${this.baseUrlMaestra}/api/Maestros/get-usuarios`;

    // const body = [{ usuario, clave, aplicacion:'LOGISTICA' }];
    const body = [{ usuario, clave, aplicacion: this.aplicacion }];

    try {
      const response = await lastValueFrom(this.http.post<any>(url, body));
      return response;
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error de autenticación');
    }
  }
  async isLoggedIn() {
    const user = await this.dexieService.showUsuario();
    return !!user
  }

  async getUser() {
    return await this.dexieService.getUsuarioLogueado();
  }

  async isAdministrador() {
    const user = await this.getUser();
    return user?.idrol === 'ADLOGIST';
  }

  async isAprobador() {
    const user = await this.getUser();
    return user?.idrol === 'APLOGIST';
  }

  async isAlmacen() {
    const user = await this.getUser();
    return user?.idrol === 'ALLOGIST';
  }
}
