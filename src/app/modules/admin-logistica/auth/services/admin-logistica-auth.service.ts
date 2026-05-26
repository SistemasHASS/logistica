import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@/environments/environment';

export interface AdminLogisticaUser {
  id: number;
  usuario: string;
  nombre: string;
  email: string;
  idrol: string;
  rol: string;
  idempresa: string;
  ruc: string;
  razonSocial?: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminLogisticaAuthService {
  private readonly TOKEN_KEY = 'admin_logistica_token';
  private readonly USER_KEY = 'admin_logistica_user';
  private baseUrl = environment.baseUrl;

  currentUser = signal<AdminLogisticaUser | null>(null);
  isLoggedIn = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
      } catch {
        this.logout();
      }
    }
  }

  login(credentials: { usuario: string; clave: string }): Observable<AdminLogisticaUser> {
    return this.http.post<AdminLogisticaUser>(`${this.baseUrl}/api/logistica/admin-logistica/auth/login`, credentials)
      .pipe(
        tap(user => {
          this.setSession(user);
        })
      );
  }

  private setSession(user: AdminLogisticaUser) {
    localStorage.setItem(this.TOKEN_KEY, user.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isLoggedIn.set(true);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.idrol === role || user?.idrol?.includes(role) || false;
  }

  isAdmin(): boolean {
    return this.hasRole('ADLOGIST') || this.hasRole('TILOGIST');
  }

  isJefeLogistica(): boolean {
    return this.hasRole('JLOLOGIST');
  }

  canCreateUsers(): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    // TILOGIST ve todos los roles
    if (user.idrol === 'TILOGIST') return true;
    
    // JLOLOGIST solo ve roles operativos
    if (user.idrol === 'JLOLOGIST') return true;
    
    // ADLOGIST puede crear usuarios
    if (user.idrol === 'ADLOGIST') return true;
    
    return false;
  }

  getAvailableRoles(): Array<{ id: string; nombre: string }> {
    const user = this.currentUser();
    if (!user) return [];

    // Todos los roles disponibles
    const allRoles = [
      { id: 'TILOGIST', nombre: 'Admin Sistema' },
      { id: 'ADLOGIST', nombre: 'Admin Logística' },
      { id: 'JLOLOGIST', nombre: 'Jefe Logística' },
      { id: 'JEMLOGIST', nombre: 'Jefe Licitaciones' },
      { id: 'LOLOGIST', nombre: 'Operador Logística' },
      { id: 'EMLOGIST', nombre: 'Operador Licitaciones' },
      { id: 'ALLOGIST', nombre: 'Almacén' },
      { id: 'OPLOGIST', nombre: 'Operativo Campo' },
      { id: 'APLOGIST', nombre: 'Aprobador Consumo' },
      { id: 'FINANZAS', nombre: 'Finanzas' },
      { id: 'GERENTE', nombre: 'Gerente' },
    ];

    // TILOGIST ve todos los roles
    if (user.idrol === 'TILOGIST') {
      return allRoles;
    }

    // JLOLOGIST solo ve roles operativos específicos
    if (user.idrol === 'JLOLOGIST') {
      return [
        { id: 'LOLOGIST', nombre: 'Operador Logística' },
        { id: 'EMLOGIST', nombre: 'Operador Licitaciones' },
        { id: 'ALLOGIST', nombre: 'Almacén' },
        { id: 'OPLOGIST', nombre: 'Operativo Campo' },
        { id: 'APLOGIST', nombre: 'Aprobador Consumo' },
      ];
    }

    // ADLOGIST ve todos excepto TILOGIST
    if (user.idrol === 'ADLOGIST') {
      return allRoles.filter(role => role.id !== 'TILOGIST');
    }

    return [];
  }

  getVisibleUsers(allUsers: any[]): any[] {
    const user = this.currentUser();
    if (!user) return [];

    // TILOGIST y ADLOGIST ven todos los usuarios
    if (user.idrol === 'TILOGIST' || user.idrol === 'ADLOGIST') {
      return allUsers;
    }

    // JLOLOGIST no ve usuarios con rol JLOLOGIST ni ADLOGIST
    if (user.idrol === 'JLOLOGIST') {
      return allUsers.filter(u => u.idrol !== 'JLOLOGIST' && u.idrol !== 'ADLOGIST');
    }

    // Otros roles no ven usuarios (por seguridad)
    return [];
  }
}
