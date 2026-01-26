import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthAdminService {

  private readonly baseUrl = environment.baseUrl; // API LOGISTICA

  constructor(private http: HttpClient) { }

  async login(usuario: string, clave: string): Promise<any> {
    const url = `${this.baseUrl}/api/logistica/admin-login`;

    const body = [{
      usuario,
      clave
    }];

    try {
      return await lastValueFrom(this.http.post<any>(url, body));
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error login admin');
    }
  }

  isLogged(): boolean {
    return !!localStorage.getItem('ADMIN_TOKEN');
  }

  logout(): void {
    localStorage.removeItem('ADMIN_TOKEN');
    localStorage.removeItem('ADMIN_USER');
  }

  getUser(): any {
    const user = localStorage.getItem('ADMIN_USER');
    return user ? JSON.parse(user) : null;
  }
}
