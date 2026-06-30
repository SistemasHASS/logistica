import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PermisoRol {
  idPermiso?: number;
  idrol: string;
  clave: string;
  valor: string;
  descripcion?: string;
  fechaModificacion?: string;
  usuarioModifica?: string;
}

export interface ModuloMenu {
  route: string;
  label: string;
  icon: string;
  clavePermiso: string;
}

/** Prefijo para aislar las claves del admin-logistica de las del layout principal en la tabla compartida */
export const ADMINLG_PREFIX = 'ADMINLG_';

export const MODULOS_MENU: ModuloMenu[] = [
  { route: 'dashboard',             label: 'Dashboard',                  icon: 'bx bxs-dashboard',   clavePermiso: 'ADMINLG_MENU_DASHBOARD' },
  { route: 'bandeja',               label: 'Bandeja Aprobaciones',       icon: 'bx bx-inbox',        clavePermiso: 'ADMINLG_MENU_BANDEJA' },
  { route: 'aprobar-consumo',       label: 'Aprobar Consumo',            icon: 'bx bx-check-circle', clavePermiso: 'ADMINLG_MENU_APROBAR_CONSUMO' },
  { route: 'aprobar-sc',            label: 'Aprobar Solicitud Compra',   icon: 'bx bx-shopping-bag', clavePermiso: 'ADMINLG_MENU_APROBAR_SC' },
  { route: 'aprobar-ss',            label: 'Aprobar Solicitud Servicio', icon: 'bx bx-file-find',    clavePermiso: 'ADMINLG_MENU_APROBAR_SS' },
  { route: 'maestros',              label: 'Maestros',                   icon: 'bx bx-equalizer',    clavePermiso: 'ADMINLG_MENU_MAESTROS' },
  { route: 'proveedores',           label: 'Gestión Proveedores',        icon: 'bx bx-store',        clavePermiso: 'ADMINLG_MENU_PROVEEDORES' },
  { route: 'usuarios',              label: 'Usuarios',                   icon: 'bx bx-user',         clavePermiso: 'ADMINLG_MENU_USUARIOS' },
  { route: 'areas',                 label: 'Áreas',                      icon: 'bx bx-buildings',    clavePermiso: 'ADMINLG_MENU_AREAS' },
  { route: 'usuario-area',          label: 'Usuarios por Área',          icon: 'bx bx-user-check',   clavePermiso: 'ADMINLG_MENU_USUARIO_AREA' },
  { route: 'flujo-aprobacion-area', label: 'Flujo Aprobación Área',      icon: 'bx bx-git-branch',   clavePermiso: 'ADMINLG_MENU_FLUJO_AREA' },
  { route: 'pdf',                   label: 'Formato PDF',                icon: 'bx bxs-file-pdf',    clavePermiso: 'ADMINLG_MENU_PDF' },
  { route: 'empresa',               label: 'Empresa',                    icon: 'bx bx-buildings',    clavePermiso: 'ADMINLG_MENU_EMPRESA' },
  { route: 'parametros',            label: 'Parámetros',                 icon: 'bx bx-cog',          clavePermiso: 'ADMINLG_MENU_PARAMETROS' },
  { route: 'aprobadores',           label: 'Aprobadores',                icon: 'bx bx-user-check',   clavePermiso: 'ADMINLG_MENU_APROBADORES' },
  { route: 'auditoria',             label: 'Auditoría',                  icon: 'bx bx-history',      clavePermiso: 'ADMINLG_MENU_AUDITORIA' },
  { route: 'almacen',               label: 'Plantillas Almacén',         icon: 'bx bx-store-alt',    clavePermiso: 'ADMINLG_MENU_ALMACEN' },
  { route: 'conformidad-servicio',  label: 'Conformidad Servicio',       icon: 'bx bx-check-shield', clavePermiso: 'ADMINLG_MENU_CONFORMIDAD' },
  { route: 'permisos-rol',          label: 'Permisos por Rol',           icon: 'bx bx-shield',       clavePermiso: 'ADMINLG_MENU_PERMISOS_ROL' },
];

export const ROLES_SISTEMA = [
  { idrol: 'TILOGIST',  nombre: 'Admin Sistema' },
  { idrol: 'ADLOGIST',  nombre: 'Admin Logística' },
  { idrol: 'JLOLOGIST', nombre: 'Jefe Logística' },
  { idrol: 'JEMLOGIST', nombre: 'Jefe Licitaciones' },
  { idrol: 'LOLOGIST',  nombre: 'Operador Logística' },
  { idrol: 'EMLOGIST',  nombre: 'Operador Licitaciones' },
  { idrol: 'ALLOGIST',  nombre: 'Almacén' },
  { idrol: 'OPLOGIST',  nombre: 'Operativo Campo' },
  { idrol: 'APLOGIST',  nombre: 'Aprobador Consumo' },
  { idrol: 'FINANZAS',  nombre: 'Finanzas' },
  { idrol: 'GERENTE',   nombre: 'Gerente' },
];

@Injectable({ providedIn: 'root' })
export class PermisosRolService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  private _permisosCargados = signal<Map<string, Set<string>>>(new Map());
  permisosCargados = this._permisosCargados.asReadonly();

  /** Roles que se cargaron exitosamente desde BD (no desde cache de error) */
  private _cargadosDesdeDB = new Set<string>();

  cargadoDesdeDB(idrol: string): boolean {
    return this._cargadosDesdeDB.has(idrol);
  }

  private readonly CACHE_KEY = 'admin_logistica_permisos';

  /** Convierte idrol a la clave de contexto usada en BD: solo las claves ADMINLG_ pertenecen a este layout */
  private _filtrarSoloAdminLg(permisos: PermisoRol[]): PermisoRol[] {
    return permisos.filter(p => p.clave.startsWith(ADMINLG_PREFIX));
  }

  cargarPermisosParaRol(idrol: string): Observable<PermisoRol[]> {
    return this.http.post<PermisoRol[]>(
      `${this.baseUrl}/api/ConfiguracionPermiso/listar-config-permisos`,
      { idrol }
    ).pipe(
      tap(permisos => {
        const adminLgPermisos = this._filtrarSoloAdminLg(Array.isArray(permisos) ? permisos : []);
        const map = this._permisosCargados();
        const set = new Set<string>(adminLgPermisos.filter(p => p.valor === '1').map(p => p.clave));
        map.set(idrol, set);
        this._permisosCargados.set(new Map(map));
        this._cargadosDesdeDB.add(idrol);
        this._guardarCacheLocal(idrol, set);
      }),
      catchError(() => {
        this._cargarDesdeCache(idrol);
        return of([]);
      })
    );
  }

  tienePermiso(idrol: string, clave: string): boolean {
    const map = this._permisosCargados();
    if (!map.has(idrol)) {
      this._cargarDesdeCache(idrol);
    }
    return map.get(idrol)?.has(clave) ?? false;
  }

  guardarPermiso(idrol: string, clave: string, valor: boolean, usuario: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/ConfiguracionPermiso/guardar-config-permiso`,
      { idrol, clave, valor: valor ? '1' : '0', usuarioModifica: usuario }
    ).pipe(
      tap(() => {
        const map = this._permisosCargados();
        const set = map.get(idrol) ?? new Set<string>();
        valor ? set.add(clave) : set.delete(clave);
        map.set(idrol, set);
        this._permisosCargados.set(new Map(map));
        this._guardarCacheLocal(idrol, set);
      })
    );
  }

  guardarPermisosLote(idrol: string, permisos: Record<string, boolean>, usuario: string): Observable<any> {
    const requests = Object.entries(permisos).map(([clave, valor]) =>
      ({ idrol, clave, valor: valor ? '1' : '0', usuarioModifica: usuario })
    );
    return this.http.post(
      `${this.baseUrl}/api/ConfiguracionPermiso/guardar-config-permiso`,
      { permisos: requests }
    ).pipe(
      tap(() => {
        const map = this._permisosCargados();
        const set = new Set<string>(Object.entries(permisos).filter(([, v]) => v).map(([k]) => k));
        map.set(idrol, set);
        this._permisosCargados.set(new Map(map));
        this._guardarCacheLocal(idrol, set);
      }),
      catchError(() => {
        const requests2 = Object.entries(permisos);
        const saves = requests2.map(([clave, valor]) =>
          this.guardarPermiso(idrol, clave, valor, usuario)
        );
        const map = this._permisosCargados();
        const set = new Set<string>(requests2.filter(([, v]) => v).map(([k]) => k));
        map.set(idrol, set);
        this._permisosCargados.set(new Map(map));
        this._guardarCacheLocal(idrol, set);
        return of(null);
      })
    );
  }

  private _guardarCacheLocal(idrol: string, set: Set<string>) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) ?? '{}');
      cache[idrol] = Array.from(set);
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch { }
  }

  private _cargarDesdeCache(idrol: string) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) ?? '{}');
      if (cache[idrol]) {
        const map = this._permisosCargados();
        map.set(idrol, new Set<string>(cache[idrol]));
        this._permisosCargados.set(new Map(map));
      }
    } catch { }
  }
}
