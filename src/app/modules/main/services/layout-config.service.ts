import { Injectable, signal, inject, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

export type MenuType = 'accordion' | 'nav' | 'list' | 'default';

export interface AccordionItemConfig {
  id: string;
  nombre: string;
  icono: string;
  ruta?: string;
  activo: boolean;
  orden: number;
  submenu?: AccordionItemConfig[];
}

export interface AccordionGroupConfig {
  id: string;
  label: string;
  icono: string;
  activo: boolean;
  orden: number;
  tipo?: MenuType;
  items: AccordionItemConfig[];
}

export interface MenuConfig {
  idrol: string;
  tipoMenu: MenuType;
  usaAccordion: boolean;
  menuConfig?: AccordionGroupConfig[];
  ultimaModificacion?: Date;
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

  // Signals para el estado del menú
  private menuConfigs = signal<Map<string, MenuConfig>>(new Map());
  private accordionRoles = signal<Set<string>>(new Set());
  private accordionMenus = signal<Map<string, AccordionGroupConfig[]>>(new Map());

  /** true = datos vigentes en memoria, false = necesita recargar */
  readonly cargado = signal(false);

  private cargando = false;

  async cargar(): Promise<void> {
    console.log('[LayoutConfig] cargar() iniciado - cargado:', untracked(this.cargado), 'cargando:', this.cargando);
    if (untracked(this.cargado) || this.cargando) {
      console.log('[LayoutConfig] cargar() - ya cargado o cargando, retornando');
      return;
    }
    this.cargando = true;
    try {
      console.log('[LayoutConfig] Llamando API:', `${this.baseUrl}/api/ConfiguracionPermiso/listar-config-permisos`);
      // Enviar body vacío {} para listar todas las configuraciones
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/ConfiguracionPermiso/listar-config-permisos`, {})
      );
      console.log('[LayoutConfig] Respuesta API:', resp);
      
      const permisos: { idrol: string; clave: string; valor: string }[] = Array.isArray(resp) ? resp : [];
      
      // Debug: ver todas las configs recibidas del API
      console.log('[LayoutConfig] Total configs recibidas:', permisos.length);
      console.log('[LayoutConfig] Todas las claves recibidas:', permisos.map(p => `${p.idrol}:${p.clave}`));
      console.log('[LayoutConfig] Configs ALLOGIST recibidas:', permisos.filter(p => p.idrol === 'ALLOGIST').map(p => ({ clave: p.clave, valorLen: p.valor?.length })));

      // Procesar roles con accordion
      const roles = new Set(
        permisos.filter(p => p.clave === 'LAYOUT_ACCORDION' && p.valor === '1').map(p => p.idrol)
      );
      this.accordionRoles.set(roles);

      // Procesar configuraciones de menú por rol
      const configs = new Map<string, MenuConfig>();
      const menus = new Map<string, AccordionGroupConfig[]>();

      // Agrupar por idrol
      const porRol = new Map<string, { clave: string; valor: string }[]>();
      permisos.forEach(p => {
        if (!porRol.has(p.idrol)) porRol.set(p.idrol, []);
        porRol.get(p.idrol)!.push(p);
      });

      // Procesar cada rol
      porRol.forEach((items, idrol) => {
        const config: MenuConfig = { idrol, tipoMenu: 'default', usaAccordion: false };
        
        items.forEach(item => {
          switch (item.clave) {
            case 'LAYOUT_ACCORDION':
              config.usaAccordion = item.valor === '1';
              break;
            case 'LAYOUT_MENU_TYPE':
              config.tipoMenu = (item.valor as MenuType) || 'default';
              break;
            case 'ACCORDION_MENU_CONFIG':
            case `ACCORDION_MENU_${idrol}`:
              try {
                config.menuConfig = JSON.parse(item.valor) as AccordionGroupConfig[];
                menus.set(idrol, config.menuConfig);
                console.log(`[LayoutConfig] JSON parseado OK para ${idrol}, items:`, config.menuConfig?.length);
              } catch (err) {
                console.error(`[LayoutConfig] Error parsing JSON para ${idrol}:`, err);
              }
              break;
          }
        });

        configs.set(idrol, config);
      });

      this.menuConfigs.set(configs);
      this.accordionMenus.set(menus);
      this.cargado.set(true);
      
      // Debug: mostrar roles cargados
      console.log('[LayoutConfig] Roles cargados:', Array.from(configs.keys()));
      console.log('[LayoutConfig] ALLOGIST config:', configs.get('ALLOGIST'));
    } catch (err) {
      console.error('[LayoutConfig] Error cargando:', err);
      this.accordionRoles.set(new Set());
      this.cargado.set(true);
    } finally {
      this.cargando = false;
    }
  }

  /** Obtiene la configuración completa del menú para un rol */
  getMenuConfig(idrol: string): MenuConfig {
    const config = this.menuConfigs().get(idrol);
    if (config) return config;
    
    // Fallback: mantener compatibilidad con sistema anterior
    const usaAccordion = this.accordionRoles().has(idrol);
    return {
      idrol,
      tipoMenu: usaAccordion ? 'accordion' : 'default',
      usaAccordion,
      menuConfig: usaAccordion ? this.getAccordionMenu(idrol) : undefined
    };
  }

  // Roles que SIEMPRE usan menú accordion (fallback sin depender de BD)
  private readonly ROLES_ACCORDION_DEFAULT = new Set(['JLOLOGIST']);

  /** Determina el tipo de menú a usar para un rol */
  getMenuType(idrol: string): MenuType {
    const config = this.menuConfigs().get(idrol);
    if (config) return config.tipoMenu;
    if (this.accordionRoles().has(idrol) || this.ROLES_ACCORDION_DEFAULT.has(idrol)) return 'accordion';
    return 'default';
  }

  /** Verifica si un rol usa menú dinámico configurado */
  tieneMenuConfigurado(idrol: string): boolean {
    return this.menuConfigs().has(idrol) || this.accordionRoles().has(idrol) || this.ROLES_ACCORDION_DEFAULT.has(idrol);
  }

  /** Legacy: verifica si usa accordion */
  usaAccordion(idrol: string): boolean {
    const config = this.menuConfigs().get(idrol);
    if (config) return config.usaAccordion || config.tipoMenu === 'accordion';
    return this.accordionRoles().has(idrol) || this.ROLES_ACCORDION_DEFAULT.has(idrol);
  }

  /** Devuelve el menú configurado para un rol. Si no hay config en BD, devuelve el default. */
  getAccordionMenu(idrol: string): AccordionGroupConfig[] {
    const config = this.menuConfigs().get(idrol);
    // Devolver menuConfig para cualquier tipo (accordion, nav, list)
    if (config?.menuConfig && config.menuConfig.length > 0) return config.menuConfig;
    
    const custom = this.accordionMenus().get(idrol);
    if (custom && custom.length > 0) return custom;
    return ACCORDION_DEFAULT;
  }

  /** Guarda la configuración de menú para un rol */
  async guardarMenuConfig(idrol: string, tipoMenu: MenuType, menuConfig?: AccordionGroupConfig[]): Promise<boolean> {
    try {
      const requests = [];
      
      // Guardar tipo de menú
      requests.push(
        lastValueFrom(this.http.post(`${this.baseUrl}/api/ConfiguracionPermiso/guardar-config-permiso`, {
          idrol,
          clave: 'LAYOUT_MENU_TYPE',
          valor: tipoMenu,
          descripcion: `Tipo de menú para ${idrol}`,
          usuarioModifica: 'ADMIN'
        }))
      );

      // Guardar flag de accordion
      requests.push(
        lastValueFrom(this.http.post(`${this.baseUrl}/api/ConfiguracionPermiso/guardar-config-permiso`, {
          idrol,
          clave: 'LAYOUT_ACCORDION',
          valor: tipoMenu === 'accordion' ? '1' : '0',
          descripcion: `Usa accordion: ${tipoMenu === 'accordion'}`,
          usuarioModifica: 'ADMIN'
        }))
      );

      // Guardar configuración del menú si es accordion
      if (menuConfig && tipoMenu === 'accordion') {
        requests.push(
          lastValueFrom(this.http.post(`${this.baseUrl}/api/ConfiguracionPermiso/guardar-config-permiso`, {
            idrol,
            clave: 'ACCORDION_MENU_CONFIG',
            valor: JSON.stringify(menuConfig),
            descripcion: `Configuración de menú accordion para ${idrol}`,
            usuarioModifica: 'ADMIN'
          }))
        );
      }

      await Promise.all(requests);
      
      // Actualizar signals locales
      const newConfig: MenuConfig = {
        idrol,
        tipoMenu,
        usaAccordion: tipoMenu === 'accordion',
        menuConfig,
        ultimaModificacion: new Date()
      };
      
      const newConfigs = new Map(this.menuConfigs());
      newConfigs.set(idrol, newConfig);
      this.menuConfigs.set(newConfigs);
      
      if (tipoMenu === 'accordion' && menuConfig) {
        const newMenus = new Map(this.accordionMenus());
        newMenus.set(idrol, menuConfig);
        this.accordionMenus.set(newMenus);
        this.accordionRoles.set(new Set([...this.accordionRoles(), idrol]));
      }

      return true;
    } catch (error) {
      console.error('Error guardando configuración de menú:', error);
      return false;
    }
  }

  /** Fuerza recarga en el próximo ciclo (después de guardar cambios en admin) */
  invalidar(): void {
    this.cargando = false;
    this.accordionRoles.set(new Set());
    this.accordionMenus.set(new Map());
    this.menuConfigs.set(new Map());
    this.cargado.set(false);   // dispara efecto en layout (misma pestaña)
    // Marca para comunicar a otras pestañas/instancias
    localStorage.setItem('LAYOUT_CONFIG_INVALIDADO', Date.now().toString());
  }
}
