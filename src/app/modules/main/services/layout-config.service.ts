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
    id: 'consultas', label: 'Consultas', icono: 'bx bx-search-alt', activo: true, orden: 9,
    items: [
      { id: 'catalogo-items', nombre: 'Catálogo de Items', icono: 'bx bx-list-ul', ruta: './catalogo-items', activo: true, orden: 1 },
    ]
  },
  {
    id: 'panel', label: 'Mi Panel', icono: 'bx bxs-dashboard', activo: true, orden: 1,
    items: [
      { id: 'dashboard-jlologist', nombre: 'Dashboard Jef. Logística', icono: 'bx bx-line-chart',       ruta: './dashboard-jlologist',  activo: true, orden: 1 },
      { id: 'dashboard-oplogist',  nombre: 'Mi Dashboard',             icono: 'bx bx-user-check',        ruta: './dashboard-oplogist',   activo: true, orden: 2 },
      { id: 'dashboard-logistica', nombre: 'Dashboard Logística',      icono: 'bx bx-bar-chart-alt-2',   ruta: './dashboard-logistica',  activo: true, orden: 3 },
      { id: 'dashboard-despacho',  nombre: 'Dashboard Almacén',        icono: 'bx bxs-dashboard',        ruta: './dashboard-despacho',   activo: true, orden: 4 },
      { id: 'dashboard-tilogist',  nombre: 'Dashboard TI',             icono: 'bx bxs-dashboard',        ruta: './dashboard-tilogist',   activo: true, orden: 5 },
      { id: 'dashboard-adlogist',  nombre: 'Dashboard Admin',          icono: 'bx bxs-dashboard',        ruta: './dashboard-adlogist',   activo: true, orden: 6 },
      { id: 'dashboard-jemlogist', nombre: 'Dashboard Jef. Empaque',   icono: 'bx bxs-dashboard',        ruta: './dashboard-jemlogist',  activo: true, orden: 7 },
      { id: 'dashboard-finanzas',  nombre: 'Dashboard Finanzas',       icono: 'bx bx-line-chart',        ruta: './dashboard-finanzas',   activo: true, orden: 8 },
      { id: 'dashboard-aprobaciones-area', nombre: 'Dashboard Aprobaciones', icono: 'bx bxs-dashboard', ruta: './dashboard-aprobaciones-area', activo: true, orden: 9 },
    ]
  },
  {
    id: 'config', label: 'Notificaciones', icono: 'icon icon-equalizer', activo: true, orden: 2,
    items: [
      { id: 'notificaciones', nombre: 'Notificaciones', icono: 'bx bx-bell', ruta: './notificaciones', activo: true, orden: 1 },
    ]
  },
  {
    id: 'maestros', label: 'Maestros', icono: 'bx bx-data', activo: true, orden: 3,
    items: [
      { id: 'maestros', nombre: 'Items / Commodities / UM', icono: 'bx bx-equalizer', ruta: './maestros', activo: true, orden: 1 },
      { id: 'maestro-proveedores', nombre: 'Maestro Proveedores', icono: 'bx bx-store', ruta: './maestro-proveedores', activo: true, orden: 2 },
    ]
  },
  {
    id: 'requerimientos', label: 'Requerimientos', icono: 'icon icon-stack', activo: true, orden: 4,
    items: [
      { id: 'requerimientos',      nombre: 'Requerimientos',        icono: 'icon icon-stack',  ruta: './requerimientos',      activo: true, orden: 1 },
      { id: 'saldo-requerimiento', nombre: 'Saldo de Requerimiento',icono: 'icon icon-balance', ruta: './saldo-requerimiento', activo: true, orden: 2 },
    ]
  },
  {
    id: 'compras', label: 'Compras & Órdenes', icono: 'bx bx-cart', activo: true, orden: 5,
    items: [
      { id: 'solicitudes-compra',      nombre: 'Solicitudes de Compra',    icono: 'bx bx-shopping-bag',    ruta: './solicitudes-compra',      activo: true, orden: 1 },
      { id: 'ordenes-compra',          nombre: 'Órdenes de Compra',        icono: 'icon icon-file-text',   ruta: './ordenes-compra',          activo: true, orden: 2 },
      { id: 'consolidacion-compra',   nombre: 'Consolidación Compras',     icono: 'bx bx-cart',            ruta: './consolidacion-compra',   activo: true, orden: 3 },
      { id: 'consolidacion-compras',  nombre: 'Flujo de Compras',        icono: 'bx bx-cart',            ruta: './consolidacion-compras',  activo: true, orden: 4 },
      { id: 'consolidacion-servicios', nombre: 'Consolidación Servicios', icono: 'bx bx-wrench',          ruta: './consolidacion-servicios', activo: true, orden: 5 },
      { id: 'solicitudes-servicio',    nombre: 'Solicitudes de Servicio',  icono: 'bx bx-briefcase',       ruta: './solicitudes-servicio',    activo: true, orden: 6 },
      { id: 'ordenes-servicio',        nombre: 'Órdenes de Servicio',      icono: 'bx bx-wrench',          ruta: './ordenes-servicio',        activo: true, orden: 7 },
      { id: 'cotizaciones',            nombre: 'Cotizaciones',             icono: 'icon icon-calculator',  ruta: './cotizaciones',            activo: true, orden: 8 },
      { id: 'conformidad-servicios',   nombre: 'Conformidad de OS',        icono: 'bx bx-check-shield',    ruta: './conformidad-servicios',   activo: true, orden: 9 },
    ]
  },
  {
    id: 'almacen', label: 'Almacén & Stock', icono: 'bx bx-package', activo: true, orden: 6,
    items: [
      { id: 'despachos',            nombre: 'Gestión de Despachos',    icono: 'icon icon-stack',    ruta: './despachos',            activo: true, orden: 1 },
      { id: 'recepcion-mercaderia', nombre: 'Recepción de Mercadería', icono: 'icon icon-package',  ruta: './recepcion-mercaderia', activo: true, orden: 2 },
      { id: 'kardex',               nombre: 'Kardex e Inventario',     icono: 'bx bx-container',    ruta: './kardex',               activo: true, orden: 3 },
      { id: 'conformidad-almacen',  nombre: 'Conformidad NI / NS',     icono: 'bx bx-pen',          ruta: './conformidad-almacen',  activo: true, orden: 4 },
    ]
  },
  {
    id: 'aprobaciones', label: 'Aprobaciones', icono: 'icon icon-file-check', activo: true, orden: 7,
    items: [
      { id: 'aprobaciones-oc', nombre: 'Aprobación OC', icono: 'icon icon-file-check', ruta: './aprobaciones-oc', activo: true, orden: 1 },
      { id: 'aprobaciones-os', nombre: 'Aprobación OS', icono: 'icon icon-file-check', ruta: './aprobaciones-os', activo: true, orden: 2 },
      { id: 'aprobaciones-area', nombre: 'Aprobaciones por Área', icono: 'icon icon-circle', ruta: './aprobaciones-area', activo: true, orden: 3 },
    ]
  },
  {
    id: 'reportes', label: 'Reportes', icono: 'icon icon-file-text', activo: true, orden: 8,
    items: [
      { id: 'reportes-compras',        nombre: 'Reportes Avanzados',       icono: 'icon icon-pie-chart',  ruta: './reportes-compras',        activo: true, orden: 1 },
      { id: 'reporte-requerimientos',  nombre: 'Reporte Requerimientos',   icono: 'icon icon-file-check', ruta: './reporte-requerimientos',  activo: true, orden: 2 },
      { id: 'reporte-despachos',       nombre: 'Reporte de Despachos',     icono: 'icon icon-file-text',  ruta: './reporte-despachos',       activo: true, orden: 3 },
      { id: 'reporte-aprobaciones-area', nombre: 'Reporte Aprobaciones Área', icono: 'icon icon-file-text', ruta: './reporte-aprobaciones-area', activo: true, orden: 4 },
    ]
  },
];

/**
 * Módulos permitidos por rol — basado en las mismas reglas del layout estático
 * Solo se usan como FALLBACK cuando no hay MENU_JSON en BD
 */
const MODULOS_POR_ROL: Record<string, string[]> = {
  TILOGIST:  ['catalogo-items', 'dashboard-tilogist', 'dashboard-aprobaciones-area', 'notificaciones', 'parametros', 'maestros', 'maestro-proveedores', 'requerimientos', 'solicitudes-compra', 'ordenes-compra', 'consolidacion-compra', 'consolidacion-compras', 'consolidacion-servicios', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'conformidad-servicios', 'despachos', 'recepcion-mercaderia', 'kardex', 'conformidad-almacen', 'aprobaciones-oc', 'aprobaciones-os', 'aprobaciones-area', 'reportes-compras', 'reporte-requerimientos', 'reporte-despachos', 'reporte-aprobaciones-area'],
  ADLOGIST:  ['catalogo-items', 'dashboard-adlogist', 'dashboard-aprobaciones-area', 'notificaciones', 'parametros', 'maestros', 'maestro-proveedores', 'requerimientos', 'solicitudes-compra', 'ordenes-compra', 'consolidacion-compra', 'consolidacion-compras', 'consolidacion-servicios', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'conformidad-servicios', 'despachos', 'recepcion-mercaderia', 'kardex', 'conformidad-almacen', 'aprobaciones-oc', 'aprobaciones-os', 'aprobaciones-area', 'reportes-compras', 'reporte-requerimientos', 'reporte-despachos', 'reporte-aprobaciones-area'],
  JLOLOGIST: ['catalogo-items', 'dashboard-jlologist', 'dashboard-oplogist', 'notificaciones', 'requerimientos', 'solicitudes-compra', 'ordenes-compra', 'consolidacion-compra', 'consolidacion-compras', 'consolidacion-servicios', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'conformidad-servicios', 'despachos', 'recepcion-mercaderia', 'kardex', 'conformidad-almacen', 'aprobaciones-oc', 'aprobaciones-os', 'aprobaciones-area', 'reportes-compras', 'reporte-requerimientos', 'reporte-despachos', 'reporte-aprobaciones-area'],
  JEMLOGIST: ['catalogo-items', 'dashboard-jemlogist', 'dashboard-oplogist', 'notificaciones', 'requerimientos', 'solicitudes-compra', 'ordenes-compra', 'consolidacion-compra', 'consolidacion-compras', 'consolidacion-servicios', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'conformidad-servicios', 'aprobaciones-oc', 'aprobaciones-os', 'aprobaciones-area', 'reporte-aprobaciones-area'],
  LOLOGIST:  ['catalogo-items', 'dashboard-oplogist', 'notificaciones', 'parametros', 'requerimientos', 'saldo-requerimiento', 'solicitudes-compra', 'ordenes-compra', 'consolidacion-compra', 'consolidacion-compras', 'consolidacion-servicios', 'solicitudes-servicio', 'ordenes-servicio', 'cotizaciones', 'conformidad-servicios', 'despachos', 'recepcion-mercaderia', 'kardex', 'conformidad-almacen', 'aprobaciones-oc', 'aprobaciones-os', 'reportes-compras', 'reporte-requerimientos', 'reporte-despachos', 'reporte-aprobaciones-area'],
  EMLOGIST:  ['catalogo-items', 'dashboard-oplogist', 'notificaciones', 'parametros', 'requerimientos', 'conformidad-servicios', 'aprobaciones-area'],
  OPLOGIST:  ['catalogo-items', 'dashboard-oplogist', 'notificaciones', 'requerimientos', 'conformidad-almacen', 'catalogo-items'],
  ALLOGIST:  ['catalogo-items', 'dashboard-despacho', 'notificaciones', 'parametros', 'requerimientos', 'despachos', 'recepcion-mercaderia', 'kardex', 'conformidad-almacen', 'reporte-despachos'],
  APLOGIST:  ['catalogo-items', 'dashboard-oplogist', 'dashboard-aprobaciones-area', 'notificaciones', 'aprobaciones-area', 'reporte-aprobaciones-area', 'catalogo-items'],
  FINANZAS:  ['catalogo-items', 'dashboard-finanzas', 'aprobaciones-oc', 'aprobaciones-os'],
  GERENTE:   ['catalogo-items', 'dashboard-oplogist', 'aprobaciones-oc', 'aprobaciones-os'],
};

/** Filtra el ACCORDION_DEFAULT dejando solo los módulos permitidos para un rol (soporta roles concatenados por coma) */
export function getMenuDefaultParaRol(idrol: string): AccordionGroupConfig[] {
  const roles = (idrol || '').split(',').map(r => r.trim()).filter(Boolean);
  const permitidos = new Set<string>();
  for (const rol of roles) {
    (MODULOS_POR_ROL[rol] || []).forEach(id => permitidos.add(id));
  }
  if (permitidos.size === 0) return ACCORDION_DEFAULT;

  const resultado: AccordionGroupConfig[] = [];
  for (const grupo of ACCORDION_DEFAULT) {
    const itemsFiltrados = grupo.items.filter(item => permitidos.has(item.id));
    if (itemsFiltrados.length > 0) {
      resultado.push({ ...grupo, items: itemsFiltrados });
    }
  }
  return resultado.length > 0 ? resultado : ACCORDION_DEFAULT;
}

/** Helper para normalizar roles concatenados por coma */
function getRolesArray(idrol: string): string[] {
  return (idrol || '').split(',').map(r => r.trim()).filter(Boolean);
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

  async cargar(idrol?: string): Promise<void> {
    console.log('[LayoutConfig] cargar() iniciado - cargado:', untracked(this.cargado), 'cargando:', this.cargando, 'idrol:', idrol);
    if (untracked(this.cargado) || this.cargando) {
      console.log('[LayoutConfig] cargar() - ya cargado o cargando, retornando');
      return;
    }
    this.cargando = true;
    try {
      // Llamar ambas APIs en paralelo
      const bodyPermisos = idrol ? { idrol } : {};
      const bodyConfigMenu = idrol ? { idrol } : {};
      const [respPermisos, respConfigMenu] = await Promise.allSettled([
        lastValueFrom(this.http.post(`${this.baseUrl}/api/ConfiguracionPermiso/listar-config-permisos`, bodyPermisos)),
        lastValueFrom(this.http.post<any[]>(`${this.baseUrl}/api/configmenu/listar`, bodyConfigMenu))
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

        // Recopilar todas las claves primero para aplicar ITEMS_VISIBLES al final
        let itemsVisiblesIds: string[] | null = null;

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
            case 'ITEMS_VISIBLES':
              try {
                const ids = JSON.parse(valor) as string[];
                if (ids && ids.length > 0) itemsVisiblesIds = ids;
              } catch (err) {
                console.error(`[LayoutConfig] Error parsing ITEMS_VISIBLES para ${idrol}:`, err);
              }
              break;
          }
        });

        // Aplicar ITEMS_VISIBLES: si hay MENU_JSON, úsalo como base y aplica los toggles;
        // si no, construye desde ACCORDION_DEFAULT filtrando solo los ids habilitados
        if (itemsVisiblesIds !== null) {
          const ids = itemsVisiblesIds as string[];

          // Base: MENU_JSON guardado o ACCORDION_DEFAULT completo
          const base: AccordionGroupConfig[] = config.menuConfig && config.menuConfig.length > 0
            ? config.menuConfig.map(g => ({ ...g, items: [...g.items] }))
            : ACCORDION_DEFAULT.map(g => ({ ...g, items: [...g.items] }));

          // Paso 1 — agregar items/grupos nuevos del ACCORDION_DEFAULT que no estén en base
          const idsGruposBase = new Set(base.map(g => g.id));
          for (const gDefault of ACCORDION_DEFAULT) {
            if (!idsGruposBase.has(gDefault.id)) {
              base.push({ ...JSON.parse(JSON.stringify(gDefault)), activo: false });
            } else {
              const gBase = base.find(g => g.id === gDefault.id)!;
              const idsItemsBase = new Set(gBase.items.map(i => i.id));
              for (const iDefault of gDefault.items) {
                if (!idsItemsBase.has(iDefault.id)) {
                  gBase.items.push({ ...JSON.parse(JSON.stringify(iDefault)), activo: false });
                }
              }
            }
          }

          // Paso 2 — marcar activo según ITEMS_VISIBLES
          const menuFiltrado: AccordionGroupConfig[] = base
            .map(grupo => ({
              ...grupo,
              activo: grupo.items.some(item => ids.includes(item.id)),
              items: grupo.items.map(item => ({ ...item, activo: ids.includes(item.id) }))
            }))
            .filter(grupo => grupo.items.some(item => item.activo));

          if (menuFiltrado.length > 0) {
            config.menuConfig = menuFiltrado;
            menus.set(idrol, menuFiltrado);
            config.usaAccordion = true;
            if (config.tipoMenu === 'default') config.tipoMenu = 'accordion';
            console.log(`[LayoutConfig] ITEMS_VISIBLES aplicado para ${idrol}: ${menuFiltrado.length} grupos`);
          }
        }

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
      const cfgJlologist = configs.get('JLOLOGIST');
      if (cfgJlologist) {
        console.log('[LayoutConfig] Config JLOLOGIST:', {
          tipoMenu: cfgJlologist.tipoMenu,
          usaAccordion: cfgJlologist.usaAccordion,
          grupos: cfgJlologist.menuConfig?.length || 0
        });
      }
    } catch (err) {
      console.error('[LayoutConfig] Error cargando:', err);
      this.accordionRoles.set(new Set());
      this.cargado.set(true);
    } finally {
      this.cargando = false;
    }
  }

  /** Obtiene la configuración completa del menú para un rol (soporta roles concatenados por coma) */
  getMenuConfig(idrol: string): MenuConfig {
    const config = this.getConfigParaRol(idrol);
    if (config) return config;
    
    // Fallback: mantener compatibilidad con sistema anterior
    const roles = getRolesArray(idrol);
    const usaAccordion = roles.some(rol => this.accordionRoles().has(rol));
    return {
      idrol,
      tipoMenu: usaAccordion ? 'accordion' : 'default',
      usaAccordion,
      menuConfig: usaAccordion ? this.getAccordionMenu(idrol) : undefined
    };
  }

  private getConfigParaRol(idrol: string): MenuConfig | undefined {
    const roles = getRolesArray(idrol);
    for (const rol of roles) {
      const config = this.menuConfigs().get(rol);
      if (config) return config;
    }
    return undefined;
  }

  private getAccordionMenuParaRol(idrol: string): AccordionGroupConfig[] | undefined {
    const roles = getRolesArray(idrol);
    for (const rol of roles) {
      const menu = this.accordionMenus().get(rol);
      if (menu && menu.length > 0) return menu;
    }
    return undefined;
  }

  // Roles que SIEMPRE usan menú accordion (fallback sin depender de BD)
  private readonly ROLES_ACCORDION_DEFAULT = new Set(['JLOLOGIST']);

  /** Determina el tipo de menú a usar para un rol (soporta roles concatenados por coma) */
  getMenuType(idrol: string): MenuType {
    const config = this.getConfigParaRol(idrol);
    if (config) return config.tipoMenu;
    const roles = getRolesArray(idrol);
    if (roles.some(rol => this.accordionRoles().has(rol) || this.ROLES_ACCORDION_DEFAULT.has(rol))) return 'accordion';
    return 'default';
  }

  /** Verifica si un rol usa menú dinámico configurado (soporta roles concatenados por coma) */
  tieneMenuConfigurado(idrol: string): boolean {
    const roles = getRolesArray(idrol);
    return roles.some(rol =>
      this.menuConfigs().has(rol) ||
      this.accordionRoles().has(rol) ||
      this.ROLES_ACCORDION_DEFAULT.has(rol)
    );
  }

  /** Legacy: verifica si usa accordion (soporta roles concatenados por coma) */
  usaAccordion(idrol: string): boolean {
    const config = this.getConfigParaRol(idrol);
    if (config) return config.usaAccordion || config.tipoMenu === 'accordion';
    const roles = getRolesArray(idrol);
    return roles.some(rol => this.accordionRoles().has(rol) || this.ROLES_ACCORDION_DEFAULT.has(rol));
  }

  /** Devuelve el menú configurado para un rol. Si no hay config en BD, devuelve el default. */
  getAccordionMenu(idrol: string): AccordionGroupConfig[] {
    const config = this.getConfigParaRol(idrol);
    console.log('[LayoutConfig] getAccordionMenu para', idrol, '- config encontrada:', !!config, 'roles:', getRolesArray(idrol));
    // Devolver menuConfig para cualquier tipo (accordion, nav, list)
    let menu: AccordionGroupConfig[] | undefined;
    if (config?.menuConfig && config.menuConfig.length > 0) {
      menu = config.menuConfig;
      console.log('[LayoutConfig] Usando menuConfig de BD con', config.menuConfig.length, 'grupos');
    } else {
      menu = this.getAccordionMenuParaRol(idrol);
      console.log('[LayoutConfig] Usando accordionMenus de BD:', menu ? menu.length + ' grupos' : 'no encontrado');
    }

    if (menu && menu.length > 0) {
      // Respetar exactamente el menú configurado en BD
      console.log('[LayoutConfig] Menú final desde BD:', menu.length, 'grupos');
      return menu;
    }

    // Fallback: menú filtrado según módulos permitidos del rol
    console.log('[LayoutConfig] Fallback a default filtrado por rol');
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
