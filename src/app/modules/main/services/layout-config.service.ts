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
  {
    id: 'consultas', label: 'Consultas', icono: 'bx bx-search-alt', activo: true, orden: 8,
    items: [
      { id: 'catalogo-items', nombre: 'Catálogo de Items', icono: 'bx bx-list-ul', ruta: './catalogo-items', activo: true, orden: 1 },
    ]
  },
];

/**
 * Módulos permitidos por rol — basado en las mismas reglas del layout estático
 * Solo se usan como FALLBACK cuando no hay MENU_JSON en BD
 */
const MODULOS_POR_ROL: Record<string, string[]> = {
  TILOGIST:  ['dashboard-tilogist', 'notificaciones', 'parametros', 'requerimientos', 'solicitudes-compra', 'ordenes-compra', 'consolidacion-compras', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'despachos', 'recepcion-mercaderia', 'kardex', 'aprobaciones-oc', 'aprobaciones-os', 'reportes-compras', 'reporte-requerimientos', 'reporte-despachos', 'catalogo-items'],
  ADLOGIST:  ['dashboard-adlogist', 'notificaciones', 'parametros', 'requerimientos', 'solicitudes-compra', 'ordenes-compra', 'consolidacion-compras', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'despachos', 'recepcion-mercaderia', 'kardex', 'aprobaciones-oc', 'aprobaciones-os', 'reportes-compras', 'reporte-requerimientos', 'reporte-despachos', 'catalogo-items'],
  JLOLOGIST: ['dashboard-jlologist', 'dashboard-oplogist', 'notificaciones', 'requerimientos', 'solicitudes-compra', 'ordenes-compra', 'consolidacion-compras', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'aprobaciones-oc', 'aprobaciones-os', 'reportes-compras', 'reporte-requerimientos', 'catalogo-items'],
  JEMLOGIST: ['dashboard-jemlogist', 'dashboard-oplogist', 'notificaciones', 'requerimientos', 'solicitudes-compra', 'ordenes-compra', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'aprobaciones-oc', 'aprobaciones-os', 'catalogo-items'],
  LOLOGIST:  ['dashboard-oplogist', 'notificaciones', 'parametros', 'requerimientos', 'saldo-requerimiento', 'solicitudes-compra', 'ordenes-compra', 'consolidacion-compras', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'despachos', 'recepcion-mercaderia', 'kardex', 'aprobaciones-oc', 'aprobaciones-os', 'reportes-compras', 'reporte-requerimientos', 'reporte-despachos', 'catalogo-items'],
  EMLOGIST:  ['dashboard-oplogist', 'notificaciones', 'parametros', 'requerimientos', 'catalogo-items'],
  OPLOGIST:  ['dashboard-oplogist', 'notificaciones', 'requerimientos', 'catalogo-items'],
  ALLOGIST:  ['dashboard-despacho', 'notificaciones', 'parametros', 'requerimientos', 'despachos', 'recepcion-mercaderia', 'kardex', 'reporte-despachos', 'catalogo-items'],
  APLOGIST:  ['dashboard-oplogist', 'notificaciones', 'catalogo-items'],
  FINANZAS:  ['dashboard-finanzas', 'aprobaciones-oc', 'aprobaciones-os', 'catalogo-items'],
  GERENTE:   ['dashboard-oplogist', 'aprobaciones-oc', 'aprobaciones-os', 'catalogo-items'],
};

/** Filtra el ACCORDION_DEFAULT dejando solo los módulos permitidos para un rol */
export function getMenuDefaultParaRol(idrol: string): AccordionGroupConfig[] {
  const permitidos = MODULOS_POR_ROL[idrol];
  if (!permitidos) return ACCORDION_DEFAULT;

  const resultado: AccordionGroupConfig[] = [];
  for (const grupo of ACCORDION_DEFAULT) {
    const itemsFiltrados = grupo.items.filter(item => permitidos.includes(item.id));
    if (itemsFiltrados.length > 0) {
      resultado.push({ ...grupo, items: itemsFiltrados });
    }
  }
  return resultado.length > 0 ? resultado : ACCORDION_DEFAULT;
}

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
      // Llamar ambas APIs en paralelo
      const [respPermisos, respConfigMenu] = await Promise.allSettled([
        lastValueFrom(this.http.post(`${this.baseUrl}/api/ConfiguracionPermiso/listar-config-permisos`, {})),
        lastValueFrom(this.http.post<any[]>(`${this.baseUrl}/api/configmenu/listar`, {}))
      ]);

      const permisos: { idrol: string; clave: string; valor: string }[] =
        respPermisos.status === 'fulfilled' && Array.isArray((respPermisos as any).value)
          ? (respPermisos as any).value
          : [];

      // configmenu devuelve filas con {idrol, clave, valor} — misma forma que permisos
      const configMenuRows: { idrol: string; clave: string; valor: string }[] =
        respConfigMenu.status === 'fulfilled' && Array.isArray((respConfigMenu as any).value)
          ? (respConfigMenu as any).value
          : [];

      // Unificar: configmenu tiene precedencia para claves de menú
      const todasLasClaves = [...permisos, ...configMenuRows];

      console.log('[LayoutConfig] Total configs recibidas (permisos + configmenu):', todasLasClaves.length);

      // Procesar roles con accordion
      const roles = new Set(
        todasLasClaves.filter(p => p.clave === 'LAYOUT_ACCORDION' && p.valor === '1').map(p => p.idrol)
      );
      this.accordionRoles.set(roles);

      // Procesar configuraciones de menú por rol
      const configs = new Map<string, MenuConfig>();
      const menus = new Map<string, AccordionGroupConfig[]>();

      // Agrupar por idrol — configmenu sobrescribe permisos para misma clave
      const porRol = new Map<string, Map<string, string>>();
      todasLasClaves.forEach(p => {
        if (!porRol.has(p.idrol)) porRol.set(p.idrol, new Map());
        // Las últimas entradas (configmenu) sobrescriben las primeras (permisos)
        porRol.get(p.idrol)!.set(p.clave, p.valor);
      });

      // Procesar cada rol
      porRol.forEach((clavesMap, idrol) => {
        const config: MenuConfig = { idrol, tipoMenu: 'default', usaAccordion: false };

        clavesMap.forEach((valor, clave) => {
          switch (clave) {
            case 'LAYOUT_ACCORDION':
              config.usaAccordion = valor === '1';
              break;
            case 'LAYOUT_MENU_TYPE':
            case 'MENU_TYPE':
              config.tipoMenu = (valor as MenuType) || 'default';
              if (config.tipoMenu !== 'default') config.usaAccordion = true;
              break;
            case 'ACCORDION_MENU_CONFIG':
            case `ACCORDION_MENU_${idrol}`:
            case 'MENU_JSON':
              try {
                const parsed = JSON.parse(valor) as AccordionGroupConfig[];
                if (parsed && parsed.length > 0) {
                  config.menuConfig = parsed;
                  menus.set(idrol, parsed);
                  console.log(`[LayoutConfig] Menú cargado para ${idrol} (clave: ${clave}), grupos:`, parsed.length);
                }
              } catch (err) {
                console.error(`[LayoutConfig] Error parsing JSON para ${idrol} clave ${clave}:`, err);
              }
              break;
          }
        });

        // Si tiene menuConfig, siempre marcar usaAccordion y tipoMenu correcto
        if (config.menuConfig && config.menuConfig.length > 0) {
          config.usaAccordion = true;
          if (config.tipoMenu === 'default') config.tipoMenu = 'accordion';
        }

        configs.set(idrol, config);
      });

      this.menuConfigs.set(configs);
      this.accordionMenus.set(menus);
      this.cargado.set(true);

      console.log('[LayoutConfig] Roles con menú configurado:', Array.from(configs.keys()));
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
    // Fallback: menú filtrado según módulos permitidos del rol
    return getMenuDefaultParaRol(idrol);
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

      // Guardar configuración del menú (para todos los tipos que tengan grupos)
      if (menuConfig && menuConfig.length > 0) {
        requests.push(
          lastValueFrom(this.http.post(`${this.baseUrl}/api/ConfiguracionPermiso/guardar-config-permiso`, {
            idrol,
            clave: 'ACCORDION_MENU_CONFIG',
            valor: JSON.stringify(menuConfig),
            descripcion: `Configuración de menú ${tipoMenu} para ${idrol}`,
            usuarioModifica: 'ADMIN'
          }))
        );
      }

      await Promise.all(requests);

      // Actualizar signals locales inmediatamente (sin esperar próximo cargar())
      const newConfig: MenuConfig = {
        idrol,
        tipoMenu,
        usaAccordion: tipoMenu !== 'default',
        menuConfig,
        ultimaModificacion: new Date()
      };

      const newConfigs = new Map(this.menuConfigs());
      newConfigs.set(idrol, newConfig);
      this.menuConfigs.set(newConfigs);

      if (menuConfig && menuConfig.length > 0) {
        const newMenus = new Map(this.accordionMenus());
        newMenus.set(idrol, menuConfig);
        this.accordionMenus.set(newMenus);
      }
      if (newConfig.usaAccordion) {
        this.accordionRoles.set(new Set([...this.accordionRoles(), idrol]));
      }

      // Notificar a otras pestañas
      localStorage.setItem('LAYOUT_CONFIG_INVALIDADO', Date.now().toString());

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
