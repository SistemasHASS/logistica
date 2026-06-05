import { Injectable, signal, inject, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AccordionItemConfig {
  id: string;
  nombre: string;
  icono: string;
  ruta: string;
  activo: boolean;
  orden: number;
}

export interface AccordionGroupConfig {
  id: string;
  label: string;
  icono: string;
  activo: boolean;
  orden: number;
  items: AccordionItemConfig[];
}

/** Estructura por defecto — se usa como fallback si no hay config en BD */
export const ACCORDION_DEFAULT: AccordionGroupConfig[] = [
  {
    id: 'panel', label: 'Mi Panel', icono: 'bx bxs-dashboard', activo: true, orden: 1,
    items: [
      { id: 'dashboard-jlologist', nombre: 'Dashboard Jef. Logística', icono: 'bx bx-line-chart',       ruta: './dashboard-jlologist',  activo: true, orden: 1 },
      { id: 'dashboard-oplogist',  nombre: 'Mi Dashboard',             icono: 'bx bx-user-check',        ruta: './dashboard-oplogist',   activo: true, orden: 2 },
      { id: 'dashboard-logistica', nombre: 'Dashboard Logística',      icono: 'bx bx-bar-chart-alt-2',   ruta: './dashboard-logistica',  activo: true, orden: 3 },
    ]
  },
  {
    id: 'config', label: 'Configuración', icono: 'icon icon-equalizer', activo: true, orden: 2,
    items: [
      { id: 'notificaciones', nombre: 'Notificaciones', icono: 'bx bx-bell', ruta: './notificaciones', activo: true, orden: 1 },
    ]
  },
  {
    id: 'requerimientos', label: 'Requerimientos', icono: 'icon icon-stack', activo: true, orden: 3,
    items: [
      { id: 'requerimientos',      nombre: 'Requerimientos',        icono: 'icon icon-stack',  ruta: './requerimientos',      activo: true, orden: 1 },
      { id: 'saldo-requerimiento', nombre: 'Saldo de Requerimiento',icono: 'icon icon-balance', ruta: './saldo-requerimiento', activo: true, orden: 2 },
    ]
  },
  {
    id: 'compras', label: 'Compras & Órdenes', icono: 'bx bx-cart', activo: true, orden: 4,
    items: [
      { id: 'solicitudes-compra',    nombre: 'Solicitudes de Compra',   icono: 'bx bx-shopping-bag',   ruta: './solicitudes-compra',    activo: true, orden: 1 },
      { id: 'ordenes-compra',        nombre: 'Órdenes de Compra',       icono: 'icon icon-file-text',  ruta: './ordenes-compra',        activo: true, orden: 2 },
      { id: 'consolidacion-compras', nombre: 'Consolidación Compras',   icono: 'bx bx-cart',           ruta: './consolidacion-compras', activo: true, orden: 3 },
      { id: 'solicitudes-servicio',  nombre: 'Solicitudes de Servicio', icono: 'bx bx-briefcase',      ruta: './solicitudes-servicio',  activo: true, orden: 4 },
      { id: 'ordenes-servicio',      nombre: 'Órdenes de Servicio',     icono: 'bx bx-wrench',         ruta: './ordenes-servicio',      activo: true, orden: 5 },
      { id: 'cotizaciones',          nombre: 'Cotizaciones',            icono: 'icon icon-calculator',  ruta: './cotizaciones',          activo: true, orden: 6 },
    ]
  },
  {
    id: 'almacen', label: 'Almacén & Stock', icono: 'bx bx-package', activo: true, orden: 5,
    items: [
      { id: 'despachos',            nombre: 'Gestión de Despachos',    icono: 'icon icon-stack',    ruta: './despachos',            activo: true, orden: 1 },
      { id: 'recepcion-mercaderia', nombre: 'Recepción de Mercadería', icono: 'icon icon-package',  ruta: './recepcion-mercaderia', activo: true, orden: 2 },
      { id: 'kardex',               nombre: 'Kardex e Inventario',     icono: 'bx bx-container',    ruta: './kardex',               activo: true, orden: 3 },
    ]
  },
  {
    id: 'aprobaciones', label: 'Aprobaciones', icono: 'icon icon-file-check', activo: true, orden: 6,
    items: [
      { id: 'aprobaciones-oc', nombre: 'Aprobación OC', icono: 'icon icon-file-check', ruta: './aprobaciones-oc', activo: true, orden: 1 },
      { id: 'aprobaciones-os', nombre: 'Aprobación OS', icono: 'icon icon-file-check', ruta: './aprobaciones-os', activo: true, orden: 2 },
    ]
  },
  {
    id: 'reportes', label: 'Reportes', icono: 'icon icon-file-text', activo: true, orden: 7,
    items: [
      { id: 'reportes-compras',        nombre: 'Reportes Avanzados',       icono: 'icon icon-pie-chart',  ruta: './reportes-compras',        activo: true, orden: 1 },
      { id: 'reporte-requerimientos',  nombre: 'Reporte Requerimientos',   icono: 'icon icon-file-check', ruta: './reporte-requerimientos',  activo: true, orden: 2 },
      { id: 'reporte-despachos',       nombre: 'Reporte de Despachos',     icono: 'icon icon-file-text',  ruta: './reporte-despachos',       activo: true, orden: 3 },
    ]
  },
];

@Injectable({ providedIn: 'root' })
export class LayoutConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  private accordionRoles = signal<Set<string>>(new Set());
  private accordionMenus = signal<Map<string, AccordionGroupConfig[]>>(new Map());

  /** true = datos vigentes en memoria, false = necesita recargar */
  readonly cargado = signal(false);

  private cargando = false;

  async cargar(): Promise<void> {
    if (untracked(this.cargado) || this.cargando) return;
    this.cargando = true;
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/logistica/listar-config-permisos`, {})
      );
      const permisos: { idrol: string; clave: string; valor: string }[] = Array.isArray(resp) ? resp : [];

      const roles = new Set(
        permisos.filter(p => p.clave === 'LAYOUT_ACCORDION' && p.valor === '1').map(p => p.idrol)
      );
      this.accordionRoles.set(roles);

      const menus = new Map<string, AccordionGroupConfig[]>();
      permisos
        .filter(p => p.clave.startsWith('ACCORDION_MENU_'))
        .forEach(p => {
          try {
            const idrol = p.clave.replace('ACCORDION_MENU_', '');
            menus.set(idrol, JSON.parse(p.valor) as AccordionGroupConfig[]);
          } catch { /* JSON inválido, ignorar */ }
        });
      this.accordionMenus.set(menus);
      this.cargado.set(true);
    } catch {
      this.accordionRoles.set(new Set());
      this.cargado.set(true);
    } finally {
      this.cargando = false;
    }
  }

  usaAccordion(idrol: string): boolean {
    return this.accordionRoles().has(idrol);
  }

  /** Devuelve el menú accordion para un rol. Si no hay config en BD, devuelve el default. */
  getAccordionMenu(idrol: string): AccordionGroupConfig[] {
    const custom = this.accordionMenus().get(idrol);
    if (custom && custom.length > 0) return custom;
    return ACCORDION_DEFAULT;
  }

  /** Fuerza recarga en el próximo ciclo (después de guardar cambios en admin) */
  invalidar(): void {
    this.cargando = false;
    this.accordionRoles.set(new Set());
    this.accordionMenus.set(new Map());
    this.cargado.set(false);   // dispara efecto en layout (misma pestaña)
    // Marca para comunicar a otras pestañas/instancias
    localStorage.setItem('LAYOUT_CONFIG_INVALIDADO', Date.now().toString());
  }
}
