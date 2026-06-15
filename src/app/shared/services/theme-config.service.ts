import { Injectable, signal, computed } from '@angular/core';

export interface ColorPalette {
  primary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  secondary: string;
  light: string;
  dark: string;
  // Colores arándano adicionales
  cranberry: string;
  cranberryLight: string;
  cranberryDark: string;
  rose: string;
  magenta: string;
}

export interface SemanticColors {
  // Estados de aprobación
  aprobado: string;
  pendiente: string;
  rechazado: string;
  anulado: string;
  procesando: string;
  
  // Acciones
  accionPrimaria: string;
  accionSecundaria: string;
  accionPeligro: string;
  accionAdvertencia: string;
  
  // Datos
  datoPrincipal: string;
  datoSecundario: string;
  datoAlerta: string;
  datoInformativo: string;
  
  // Estados de requerimientos
  reqNuevo: string;
  reqEnProceso: string;
  reqCompletado: string;
  reqCancelado: string;
}

// Configuración tipográfica global y por componente
export interface TypographyConfig {
  // Global
  fontFamily: string;
  fontSize: number;        // en px
  colorTexto: string;
  // Por componente
  tablas: { fontSize: number; colorTexto: string };
  inputs: { fontSize: number; colorTexto: string };
  formularios: { fontSize: number; colorTexto: string };
  cards: { fontSize: number; colorTexto: string };
  botones: { fontSize: number; colorTexto: string };
  badges: { fontSize: number; colorTexto: string };
  labels: { fontSize: number; colorTexto: string };
  modales: { fontSize: number; colorTexto: string };
}

// Interfaz para módulos registrados en el sistema
export interface ModuloRegistrado {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'dashboard' | 'tabla' | 'formulario' | 'kanban' | 'reporte';
  icono: string;
  coloresRequeridos: string[];
  previewComponent?: string;
  estados?: { nombre: string; color: string; icono: string }[];
}

// Interfaz para módulos del menú lateral con permisos por rol
export interface ModuloMenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  ruta: string;
  roles: string[]; // Lista de idrol que pueden ver este módulo (ej: ['TILOGIST', 'ADLOGIST'])
  categoria: string; // Para agrupar en el menú (ej: 'Dashboards', 'Configuración', 'Reportes')
  orden: number; // Orden de aparición en el menú
  activo: boolean; // Si está visible o no
  requiereAuth?: boolean; // Si requiere autenticación
  badge?: { // Badge opcional (ej: contador de notificaciones)
    tipo: 'contador' | 'texto';
    valor: string;
    color: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeConfigService {
  // ============================================
  // PALETA ARÁNDANO (CRANBERRY) - Por defecto
  // ============================================
  private readonly PALETA_ARANDANO: ColorPalette = {
    primary: '#9B2335',        // Arándano principal
    success: '#27ae60',        // Verde éxito
    danger: '#e74c3c',         // Rojo peligro
    warning: '#f39c12',        // Naranja advertencia
    info: '#3498db',           // Azul info
    secondary: '#E8B4B8',      // Rosa claro secundario
    light: '#FDF2F4',          // Fondo rosado muy claro
    dark: '#5D1A25',           // Arándano oscuro
    cranberry: '#9B2335',      // Arándano base
    cranberryLight: '#E8B4B8', // Arándano claro
    cranberryDark: '#5D1A25', // Arándano oscuro
    rose: '#E8B4B8',           // Rosa pálido
    magenta: '#C2185B'         // Magenta
  };

  // Tipografía por defecto
  private readonly TYPOGRAPHY_DEFAULT: TypographyConfig = {
    fontFamily: 'inherit',
    fontSize: 9,
    colorTexto: '#212529',
    tablas:      { fontSize: 9,  colorTexto: '#212529' },
    inputs:      { fontSize: 9,  colorTexto: '#495057' },
    formularios: { fontSize: 9,  colorTexto: '#212529' },
    cards:       { fontSize: 9,  colorTexto: '#212529' },
    botones:     { fontSize: 9,  colorTexto: '#ffffff' },
    badges:      { fontSize: 8,  colorTexto: '#ffffff' },
    labels:      { fontSize: 9,  colorTexto: '#6c757d' },
    modales:     { fontSize: 9,  colorTexto: '#212529' },
  };

  private _typography = signal<TypographyConfig>(this.cargarTypographyGuardada());
  typography = computed(() => this._typography());

  // Paleta base actual (cargada de localStorage o default)
  private _palette = signal<ColorPalette>(this.cargarPaletaGuardada());

  // Colores semánticos mapeados
  private _semantic = signal<SemanticColors>({
    aprobado: '#27ae60',       // success
    pendiente: '#f39c12',      // warning
    rechazado: '#e74c3c',      // danger
    anulado: '#95a5a6',        // gray
    procesando: '#3498db',     // info
    accionPrimaria: '#9B2335', // cranberry
    accionSecundaria: '#E8B4B8', // rose
    accionPeligro: '#e74c3c',  // danger
    accionAdvertencia: '#f39c12', // warning
    datoPrincipal: '#9B2335',  // cranberry
    datoSecundario: '#3498db', // info
    datoAlerta: '#f39c12',     // warning
    datoInformativo: '#3498db', // info
    reqNuevo: '#9B2335',       // cranberry
    reqEnProceso: '#f39c12',   // warning
    reqCompletado: '#27ae60',  // success
    reqCancelado: '#e74c3c'    // danger
  });

  // ============================================
  // REGISTRO DE MÓDULOS DEL SISTEMA
  // ============================================
  private _modulosRegistrados = signal<ModuloRegistrado[]>([
    // Dashboards
    {
      id: 'dashboard-aprobaciones-area',
      nombre: 'Dashboard Aprobaciones',
      descripcion: 'Dashboard para aprobadores de área con KPIs de requerimientos',
      tipo: 'dashboard',
      icono: 'ti ti-layout-dashboard',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'procesando'],
      estados: [
        { nombre: 'Pendiente', color: 'pendiente', icono: 'ti ti-clock' },
        { nombre: 'Aprobado', color: 'aprobado', icono: 'ti ti-check' },
        { nombre: 'Rechazado', color: 'rechazado', icono: 'ti ti-x' }
      ]
    },
    {
      id: 'dashboard-oplogist',
      nombre: 'Dashboard Operativo',
      descripcion: 'Dashboard operativo de logística',
      tipo: 'dashboard',
      icono: 'ti ti-dashboard',
      coloresRequeridos: ['reqNuevo', 'reqEnProceso', 'reqCompletado', 'reqCancelado'],
      estados: [
        { nombre: 'Nuevo', color: 'reqNuevo', icono: 'ti ti-plus' },
        { nombre: 'En Proceso', color: 'reqEnProceso', icono: 'ti ti-loader' },
        { nombre: 'Completado', color: 'reqCompletado', icono: 'ti ti-check' },
        { nombre: 'Cancelado', color: 'reqCancelado', icono: 'ti ti-ban' }
      ]
    },
    {
      id: 'dashboard-logistica',
      nombre: 'Dashboard Logística',
      descripcion: 'Dashboard principal de logística',
      tipo: 'dashboard',
      icono: 'ti ti-truck',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'anulado'],
      estados: [
        { nombre: 'Pendiente', color: 'pendiente', icono: 'ti ti-clock' },
        { nombre: 'Aprobado', color: 'aprobado', icono: 'ti ti-check' },
        { nombre: 'Rechazado', color: 'rechazado', icono: 'ti ti-x' },
        { nombre: 'Anulado', color: 'anulado', icono: 'ti ti-ban' }
      ]
    },
    {
      id: 'dashboard-adlogist',
      nombre: 'Dashboard Admin Logística',
      descripcion: 'Dashboard administrativo de logística',
      tipo: 'dashboard',
      icono: 'ti ti-user-cog',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'anulado', 'procesando']
    },
    {
      id: 'dashboard-compras',
      nombre: 'Dashboard Compras',
      descripcion: 'Dashboard de compras y cotizaciones',
      tipo: 'dashboard',
      icono: 'ti ti-shopping-cart',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'dashboard-despacho',
      nombre: 'Dashboard Despacho',
      descripcion: 'Dashboard de despachos y distribución',
      tipo: 'dashboard',
      icono: 'ti ti-package-export',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'dashboard-finanzas',
      nombre: 'Dashboard Finanzas',
      descripcion: 'Dashboard financiero de logística',
      tipo: 'dashboard',
      icono: 'ti ti-cash',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'anulado']
    },
    {
      id: 'dashboard-jemlogist',
      nombre: 'Dashboard Jefe Licitaciones',
      descripcion: 'Dashboard para jefatura de licitaciones',
      tipo: 'dashboard',
      icono: 'ti ti-briefcase',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'procesando']
    },
    {
      id: 'dashboard-jlologist',
      nombre: 'Dashboard Jefe Logística',
      descripcion: 'Dashboard para jefatura de logística',
      tipo: 'dashboard',
      icono: 'ti ti-users',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'procesando']
    },
    {
      id: 'dashboard-tilogist',
      nombre: 'Dashboard TI Logística',
      descripcion: 'Dashboard para administración de sistemas',
      tipo: 'dashboard',
      icono: 'ti ti-device-desktop',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'anulado', 'procesando']
    },
    // Aprobaciones
    {
      id: 'aprobaciones-area',
      nombre: 'Aprobaciones por Área',
      descripcion: 'Módulo de aprobación de requerimientos por área',
      tipo: 'tabla',
      icono: 'ti ti-file-check',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    {
      id: 'aprobaciones',
      nombre: 'Aprobaciones',
      descripcion: 'Módulo de aprobaciones generales',
      tipo: 'tabla',
      icono: 'ti ti-checks',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    {
      id: 'aprobaciones-oc',
      nombre: 'Aprobaciones Ordenes Compra',
      descripcion: 'Aprobación de órdenes de compra',
      tipo: 'tabla',
      icono: 'ti ti-file-dollar',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'anulado']
    },
    {
      id: 'aprobaciones-os',
      nombre: 'Aprobaciones Ordenes Servicio',
      descripcion: 'Aprobación de órdenes de servicio',
      tipo: 'tabla',
      icono: 'ti ti-file-invoice',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'anulado']
    },
    {
      id: 'aprobaciones-sc',
      nombre: 'Aprobaciones Solicitudes Compra',
      descripcion: 'Aprobación de solicitudes de compra',
      tipo: 'tabla',
      icono: 'ti ti-shopping-bag',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    {
      id: 'aprobadores',
      nombre: 'Aprobadores',
      descripcion: 'Configuración de aprobadores del sistema',
      tipo: 'tabla',
      icono: 'ti ti-user-check',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    // Gestión
    {
      id: 'requerimientos',
      nombre: 'Requerimientos',
      descripcion: 'Gestión de requerimientos de compra y consumo',
      tipo: 'formulario',
      icono: 'ti ti-file-text',
      coloresRequeridos: ['reqNuevo', 'reqEnProceso', 'reqCompletado', 'reqCancelado']
    },
    {
      id: 'consolidacion-requerimientos',
      nombre: 'Consolidación',
      descripcion: 'Consolidación de requerimientos',
      tipo: 'kanban',
      icono: 'ti ti-layers',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando']
    },
    {
      id: 'cotizaciones',
      nombre: 'Cotizaciones',
      descripcion: 'Gestión de cotizaciones de proveedores',
      tipo: 'tabla',
      icono: 'ti ti-currency-dollar',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'ordenes-compra',
      nombre: 'Ordenes de Compra',
      descripcion: 'Gestión de órdenes de compra',
      tipo: 'tabla',
      icono: 'ti ti-file-dollar',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado', 'anulado']
    },
    {
      id: 'ordenes-servicio',
      nombre: 'Ordenes de Servicio',
      descripcion: 'Gestión de órdenes de servicio',
      tipo: 'tabla',
      icono: 'ti ti-file-invoice',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado', 'anulado']
    },
    {
      id: 'solicitudes-compra',
      nombre: 'Solicitudes de Compra',
      descripcion: 'Solicitudes de compra internas',
      tipo: 'tabla',
      icono: 'ti ti-shopping-cart',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando']
    },
    {
      id: 'solicitudes-servicio',
      nombre: 'Solicitudes de Servicio',
      descripcion: 'Solicitudes de servicio internas',
      tipo: 'tabla',
      icono: 'ti ti-tools',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando']
    },
    // Almacén
    {
      id: 'despachos',
      nombre: 'Despachos',
      descripcion: 'Gestión de despachos de almacén',
      tipo: 'tabla',
      icono: 'ti ti-package-export',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'devoluciones-consumo',
      nombre: 'Devoluciones Consumo',
      descripcion: 'Devoluciones de materiales de consumo',
      tipo: 'formulario',
      icono: 'ti ti-rotate-left',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    {
      id: 'devoluciones-proveedores',
      nombre: 'Devoluciones Proveedores',
      descripcion: 'Devoluciones a proveedores',
      tipo: 'formulario',
      icono: 'ti ti-rotate-2',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    {
      id: 'recepcion-mercaderia',
      nombre: 'Recepción Mercadería',
      descripcion: 'Recepción de mercadería de proveedores',
      tipo: 'formulario',
      icono: 'ti ti-package-import',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'gestion-inventario',
      nombre: 'Gestión de Inventario',
      descripcion: 'Control y gestión de inventario',
      tipo: 'tabla',
      icono: 'ti ti-packages',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando']
    },
    {
      id: 'kardex',
      nombre: 'Kardex',
      descripcion: 'Kardex de movimientos de almacén',
      tipo: 'reporte',
      icono: 'ti ti-file-analytics',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'listas-stock',
      nombre: 'Listas de Stock',
      descripcion: 'Listas de stock disponible',
      tipo: 'reporte',
      icono: 'ti ti-list-check',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando']
    },
    {
      id: 'reingresos',
      nombre: 'Reingresos',
      descripcion: 'Reingresos de materiales',
      tipo: 'formulario',
      icono: 'ti ti-arrow-back-up',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando']
    },
    // Administración
    {
      id: 'administracion',
      nombre: 'Administración',
      descripcion: 'Administración del sistema',
      tipo: 'tabla',
      icono: 'ti ti-settings',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'anulado']
    },
    {
      id: 'maestros',
      nombre: 'Maestros',
      descripcion: 'Maestros del sistema',
      tipo: 'tabla',
      icono: 'ti ti-database',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'anulado']
    },
    {
      id: 'parametros',
      nombre: 'Parámetros',
      descripcion: 'Configuración de parámetros del sistema',
      tipo: 'formulario',
      icono: 'ti ti-adjustments',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    {
      id: 'maestro-proveedores',
      nombre: 'Maestro Proveedores',
      descripcion: 'Gestión de proveedores',
      tipo: 'tabla',
      icono: 'ti ti-users-group',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'anulado']
    },
    {
      id: 'evaluacion-proveedores',
      nombre: 'Evaluación Proveedores',
      descripcion: 'Evaluación de proveedores',
      tipo: 'formulario',
      icono: 'ti ti-star',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'notificaciones-lista',
      nombre: 'Notificaciones',
      descripcion: 'Gestión de notificaciones del sistema',
      tipo: 'tabla',
      icono: 'ti ti-bell',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado', 'datoInformativo']
    },
    {
      id: 'configuracion-correo',
      nombre: 'Configuración Correo',
      descripcion: 'Configuración de correos del sistema',
      tipo: 'formulario',
      icono: 'ti ti-mail',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    {
      id: 'admin-correo',
      nombre: 'Admin Correo',
      descripcion: 'Administración de correos',
      tipo: 'tabla',
      icono: 'ti ti-mail-cog',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    // Reportes
    {
      id: 'reporte',
      nombre: 'Reportes',
      descripcion: 'Reportes generales del sistema',
      tipo: 'reporte',
      icono: 'ti ti-chart-bar',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'reporte-aprobaciones-area',
      nombre: 'Reporte Aprobaciones Área',
      descripcion: 'Reporte de aprobaciones por área',
      tipo: 'reporte',
      icono: 'ti ti-chart-pie',
      coloresRequeridos: ['aprobado', 'pendiente', 'rechazado']
    },
    {
      id: 'reporte-requerimientos',
      nombre: 'Reporte Requerimientos',
      descripcion: 'Reporte de requerimientos',
      tipo: 'reporte',
      icono: 'ti ti-chart-line',
      coloresRequeridos: ['reqNuevo', 'reqEnProceso', 'reqCompletado', 'reqCancelado']
    },
    {
      id: 'reportes',
      nombre: 'Reportes Logística',
      descripcion: 'Reportes de logística',
      tipo: 'reporte',
      icono: 'ti ti-chart-dots',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'reportes-compras',
      nombre: 'Reportes Compras',
      descripcion: 'Reportes de compras',
      tipo: 'reporte',
      icono: 'ti ti-shopping-cart',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    {
      id: 'reporte_logistico',
      nombre: 'Reporte Logístico',
      descripcion: 'Reporte logístico completo',
      tipo: 'reporte',
      icono: 'ti ti-truck-delivery',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando', 'reqCompletado']
    },
    // Otros
    {
      id: 'saldo-requerimiento',
      nombre: 'Saldo Requerimiento',
      descripcion: 'Gestión de saldos de requerimientos',
      tipo: 'tabla',
      icono: 'ti ti-calculator',
      coloresRequeridos: ['aprobado', 'pendiente', 'procesando']
    }
  ]);

  // Getters públicos
  palette = computed(() => this._palette());
  semantic = computed(() => this._semantic());
  modulosRegistrados = computed(() => this._modulosRegistrados());

  // Paleta Arándano predefinida
  getPaletaArandano(): ColorPalette {
    return { ...this.PALETA_ARANDANO };
  }

  // ============================================
  // GESTIÓN DE MÓDULOS
  // ============================================
  
  // Registrar un nuevo módulo dinámicamente
  registrarModulo(modulo: ModuloRegistrado): void {
    const current = this._modulosRegistrados();
    const exists = current.find(m => m.id === modulo.id);
    if (!exists) {
      this._modulosRegistrados.update(modulos => [...modulos, modulo]);
      this.guardarModulosEnStorage();
    }
  }

  // Obtener módulo por ID
  getModulo(id: string): ModuloRegistrado | undefined {
    return this._modulosRegistrados().find(m => m.id === id);
  }

  // Obtener módulos por tipo
  getModulosPorTipo(tipo: ModuloRegistrado['tipo']): ModuloRegistrado[] {
    return this._modulosRegistrados().filter(m => m.tipo === tipo);
  }

  // ============================================
  // PERSISTENCIA
  // ============================================
  
  private cargarPaletaGuardada(): ColorPalette {
    if (typeof window === 'undefined') return this.PALETA_ARANDANO;
    
    const saved = localStorage.getItem('hass_palette');
    if (saved) {
      try {
        return { ...this.PALETA_ARANDANO, ...JSON.parse(saved) };
      } catch {
        return this.PALETA_ARANDANO;
      }
    }
    return this.PALETA_ARANDANO;
  }

  private guardarPaletaEnStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('hass_palette', JSON.stringify(this._palette()));
  }

  private guardarModulosEnStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('hass_modulos', JSON.stringify(this._modulosRegistrados()));
  }

  // Cargar configuración completa
  cargarConfiguracion(): void {
    if (typeof window === 'undefined') return;
    
    const paletteSaved = localStorage.getItem('hass_palette');
    if (paletteSaved) {
      try {
        const parsed = JSON.parse(paletteSaved);
        this._palette.update(current => ({ ...current, ...parsed }));
      } catch (e) {
        console.error('Error cargando paleta:', e);
      }
    }

    const modulosSaved = localStorage.getItem('hass_modulos');
    if (modulosSaved) {
      try {
        const parsed = JSON.parse(modulosSaved);
        this._modulosRegistrados.set(parsed);
      } catch (e) {
        console.error('Error cargando módulos:', e);
      }
    }

    this.actualizarCSSVariables();
  }

  // Métodos para módulos específicos
  getColoresAprobacion(): { oc: { pendiente: string; aprobada: string }; os: { pendiente: string; aprobada: string } } {
    return {
      oc: {
        pendiente: this._semantic().pendiente,
        aprobada: this._semantic().aprobado
      },
      os: {
        pendiente: this._semantic().pendiente,
        aprobada: this._semantic().datoSecundario // info para diferenciar
      }
    };
  }

  // ============================================
  // ACTUALIZACIÓN DE COLORES
  // ============================================
  
  updatePalette(nuevaPaleta: Partial<ColorPalette>) {
    this._palette.update(current => ({ ...current, ...nuevaPaleta }));
    this.guardarPaletaEnStorage();
    this.actualizarCSSVariables();
    this.actualizarSemanticDesdePalette();
  }

  updateSemantic(nuevoSemantic: Partial<SemanticColors>) {
    this._semantic.update(current => ({ ...current, ...nuevoSemantic }));
  }

  // Actualizar semánticos automáticamente desde paleta
  private actualizarSemanticDesdePalette() {
    const p = this._palette();
    this._semantic.update(s => ({
      ...s,
      aprobado: p.success,
      rechazado: p.danger,
      pendiente: p.warning,
      anulado: '#95a5a6',
      procesando: p.info,
      accionPrimaria: p.primary,
      accionSecundaria: p.secondary,
      accionPeligro: p.danger,
      accionAdvertencia: p.warning,
      datoPrincipal: p.primary,
      datoSecundario: p.info,
      datoAlerta: p.warning,
      datoInformativo: p.info,
      reqNuevo: p.primary,
      reqEnProceso: p.warning,
      reqCompletado: p.success,
      reqCancelado: p.danger
    }));
  }

  // Aplicar paleta arándano completa
  aplicarPaletaArandano() {
    this._palette.set({ ...this.PALETA_ARANDANO });
    this.guardarPaletaEnStorage();
    this.actualizarCSSVariables();
    this.actualizarSemanticDesdePalette();
  }

  // Restaurar valores por defecto
  restaurarDefault() {
    this._palette.set({ ...this.PALETA_ARANDANO });
    this.guardarPaletaEnStorage();
    this.actualizarCSSVariables();
    this.actualizarSemanticDesdePalette();
  }

  // ============================================
  // TIPOGRAFÍA
  // ============================================

  updateTypography(config: Partial<TypographyConfig>) {
    this._typography.update(current => ({ ...current, ...config }));
    this.guardarTypographyEnStorage();
    this.actualizarCSSVariables();
  }

  private cargarTypographyGuardada(): TypographyConfig {
    if (typeof window === 'undefined') return this.TYPOGRAPHY_DEFAULT;
    const saved = localStorage.getItem('hass_typography');
    if (saved) {
      try { return { ...this.TYPOGRAPHY_DEFAULT, ...JSON.parse(saved) }; }
      catch { return this.TYPOGRAPHY_DEFAULT; }
    }
    return this.TYPOGRAPHY_DEFAULT;
  }

  private guardarTypographyEnStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('hass_typography', JSON.stringify(this._typography()));
  }

  restaurarTypographyDefault() {
    this._typography.set({ ...this.TYPOGRAPHY_DEFAULT });
    this.guardarTypographyEnStorage();
    this.actualizarCSSVariables();
  }

  // ============================================
  // CSS VARIABLES GLOBALES
  // ============================================
  
  private actualizarCSSVariables() {
    const palette = this._palette();
    const semantic = this._semantic();
    const root = document.documentElement;
    
    // Variables de paleta base
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(`--app-${key}`, value);
    });

    // Variables semánticas
    Object.entries(semantic).forEach(([key, value]) => {
      root.style.setProperty(`--app-semantic-${key}`, value);
    });

    // Variables específicas para estados
    root.style.setProperty('--estado-aprobado', semantic.aprobado);
    root.style.setProperty('--estado-pendiente', semantic.pendiente);
    root.style.setProperty('--estado-rechazado', semantic.rechazado);
    root.style.setProperty('--estado-anulado', semantic.anulado);
    root.style.setProperty('--estado-procesando', semantic.procesando);

    // Variables de módulos
    root.style.setProperty('--modulo-req-nuevo', semantic.reqNuevo);
    root.style.setProperty('--modulo-req-proceso', semantic.reqEnProceso);
    root.style.setProperty('--modulo-req-completado', semantic.reqCompletado);
    root.style.setProperty('--modulo-req-cancelado', semantic.reqCancelado);

    // Variables de tipografía
    const t = this._typography();
    root.style.setProperty('--typo-font-family',    t.fontFamily);
    root.style.setProperty('--typo-font-size',      `${t.fontSize}px`);
    root.style.setProperty('--typo-color',          t.colorTexto);
    root.style.setProperty('--typo-tablas-size',    `${t.tablas.fontSize}px`);
    root.style.setProperty('--typo-tablas-color',   t.tablas.colorTexto);
    root.style.setProperty('--typo-inputs-size',    `${t.inputs.fontSize}px`);
    root.style.setProperty('--typo-inputs-color',   t.inputs.colorTexto);
    root.style.setProperty('--typo-forms-size',     `${t.formularios.fontSize}px`);
    root.style.setProperty('--typo-forms-color',    t.formularios.colorTexto);
    root.style.setProperty('--typo-cards-size',     `${t.cards.fontSize}px`);
    root.style.setProperty('--typo-cards-color',    t.cards.colorTexto);
    root.style.setProperty('--typo-btns-size',      `${t.botones.fontSize}px`);
    root.style.setProperty('--typo-btns-color',     t.botones.colorTexto);
    root.style.setProperty('--typo-badges-size',    `${t.badges.fontSize}px`);
    root.style.setProperty('--typo-badges-color',   t.badges.colorTexto);
    root.style.setProperty('--typo-labels-size',    `${t.labels.fontSize}px`);
    root.style.setProperty('--typo-labels-color',   t.labels.colorTexto);
    root.style.setProperty('--typo-modales-size',   `${t.modales.fontSize}px`);
    root.style.setProperty('--typo-modales-color',  t.modales.colorTexto);
  }

  // Obtener CSS variable para un color
  getCSSVariable(nombre: string): string {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(`--app-${nombre}`).trim();
  }

  // ============================================
  // GESTIÓN DE MÓDULOS DEL MENÚ (CON ROLES)
  // ============================================
  
  // Signal para módulos del menú
  private _modulosMenu = signal<ModuloMenuItem[]>(this.cargarModulosMenu());
  
  // Computed: Módulos del menú activos (solo los visibles)
  modulosMenu = computed(() => this._modulosMenu().filter(m => m.activo).sort((a, b) => a.orden - b.orden));
  
  // Computed: Módulos agrupados por categoría
  modulosMenuPorCategoria = computed(() => {
    const modulos = this.modulosMenu();
    const categorias: { [key: string]: ModuloMenuItem[] } = {};
    
    modulos.forEach(modulo => {
      if (!categorias[modulo.categoria]) {
        categorias[modulo.categoria] = [];
      }
      categorias[modulo.categoria].push(modulo);
    });
    
    return categorias;
  });
  
  // Computed: Todos los módulos (incluyendo inactivos) para administración
  todosModulosMenu = computed(() => this._modulosMenu());
  
  // Módulos por defecto (si no hay configuración guardada)
  private readonly MODULOS_MENU_DEFAULT: ModuloMenuItem[] = [
    {
      id: 'dashboard-tilogist',
      nombre: 'Dashboard TI',
      descripcion: 'Dashboard para administradores de sistema',
      icono: 'bx bxs-dashboard',
      ruta: './dashboard-tilogist',
      roles: ['TILOGIST'],
      categoria: 'Mi Dashboard',
      orden: 1,
      activo: true
    },
    {
      id: 'dashboard-adlogist',
      nombre: 'Dashboard Admin',
      descripcion: 'Dashboard para administradores de logística',
      icono: 'bx bxs-dashboard',
      ruta: './dashboard-adlogist',
      roles: ['ADLOGIST'],
      categoria: 'Mi Dashboard',
      orden: 2,
      activo: true
    },
    {
      id: 'dashboard-oplogist',
      nombre: 'Mi Dashboard',
      descripcion: 'Dashboard operativo',
      icono: 'bx bx-user-check',
      ruta: './dashboard-oplogist',
      roles: ['OPLOGIST', 'EMLOGIST', 'JEMLOGIST', 'JLOLOGIST', 'APLOGIST', 'ADLOGIST', 'LOLOGIST'],
      categoria: 'Mi Dashboard',
      orden: 3,
      activo: true
    },
    {
      id: 'dashboard-finanzas',
      nombre: 'Dashboard Finanzas',
      descripcion: 'Dashboard financiero',
      icono: 'bx bx-line-chart',
      ruta: './dashboard-finanzas',
      roles: ['FINANZAS'],
      categoria: 'Mi Dashboard',
      orden: 4,
      activo: true
    },
    {
      id: 'requerimientos',
      nombre: 'Requerimientos',
      descripcion: 'Gestión de requerimientos',
      icono: 'icon icon-stack',
      ruta: './requerimientos',
      roles: ['TILOGIST', 'ADLOGIST', 'JLOLOGIST', 'JEMLOGIST', 'OPLOGIST', 'EMLOGIST', 'LOLOGIST'],
      categoria: 'Requerimientos',
      orden: 5,
      activo: true
    },
    {
      id: 'colores-sistema',
      nombre: 'Colores del Sistema',
      descripcion: 'Configuración de colores y temas',
      icono: 'ti ti-palette',
      ruta: './administracion/configuracion-colores',
      roles: ['TILOGIST', 'ADLOGIST'],
      categoria: 'Configuración Visual',
      orden: 6,
      activo: true
    }
  ];
  
  // Cargar módulos del menú desde localStorage
  private cargarModulosMenu(): ModuloMenuItem[] {
    if (typeof window === 'undefined') return this.MODULOS_MENU_DEFAULT;
    
    const modulosSaved = localStorage.getItem('hass_modulos_menu');
    if (modulosSaved) {
      try {
        const parsed = JSON.parse(modulosSaved);
        return parsed.length > 0 ? parsed : this.MODULOS_MENU_DEFAULT;
      } catch (e) {
        console.error('Error cargando módulos del menú:', e);
        return this.MODULOS_MENU_DEFAULT;
      }
    }
    return this.MODULOS_MENU_DEFAULT;
  }
  
  // Guardar módulos del menú en localStorage
  private guardarModulosMenu() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('hass_modulos_menu', JSON.stringify(this._modulosMenu()));
  }
  
  // CRUD para módulos del menú
  
  // Agregar nuevo módulo al menú
  agregarModuloMenu(modulo: Omit<ModuloMenuItem, 'id'>): string {
    const id = `modulo-${Date.now()}`;
    const nuevoModulo: ModuloMenuItem = { ...modulo, id };
    
    this._modulosMenu.update(current => [...current, nuevoModulo]);
    this.guardarModulosMenu();
    
    return id;
  }
  
  // Actualizar módulo existente
  actualizarModuloMenu(id: string, cambios: Partial<ModuloMenuItem>) {
    this._modulosMenu.update(current => 
      current.map(m => m.id === id ? { ...m, ...cambios } : m)
    );
    this.guardarModulosMenu();
  }
  
  // Eliminar módulo
  eliminarModuloMenu(id: string) {
    this._modulosMenu.update(current => current.filter(m => m.id !== id));
    this.guardarModulosMenu();
  }
  
  // Cambiar estado activo/inactivo
  toggleModuloMenuActivo(id: string) {
    this._modulosMenu.update(current => 
      current.map(m => m.id === id ? { ...m, activo: !m.activo } : m)
    );
    this.guardarModulosMenu();
  }
  
  // Obtener módulos visibles para un rol específico
  getModulosPorRol(idrol: string): ModuloMenuItem[] {
    return this.modulosMenu().filter(m => 
      m.roles.includes(idrol) || m.roles.includes('ALL')
    );
  }
  
  // Verificar si un usuario tiene acceso a un módulo específico
  usuarioTieneAcceso(idrol: string, moduloId: string): boolean {
    const modulo = this._modulosMenu().find(m => m.id === moduloId);
    if (!modulo || !modulo.activo) return false;
    return modulo.roles.includes(idrol) || modulo.roles.includes('ALL');
  }
  
  // Restaurar módulos por defecto
  restaurarModulosMenuDefault() {
    this._modulosMenu.set([...this.MODULOS_MENU_DEFAULT]);
    this.guardarModulosMenu();
  }
  
  // Lista de roles disponibles en el sistema
  getRolesDisponibles(): { idrol: string; nombre: string; descripcion: string }[] {
    return [
      { idrol: 'TILOGIST', nombre: 'Admin Sistema', descripcion: 'Administradores de TI - Acceso total' },
      { idrol: 'ADLOGIST', nombre: 'Admin Logística', descripcion: 'Administradores de Logística' },
      { idrol: 'JLOLOGIST', nombre: 'Jef. Logística', descripcion: 'Jefatura de Logística' },
      { idrol: 'JEMLOGIST', nombre: 'Jef. Licitaciones', descripcion: 'Jefatura de Compras/Licitaciones' },
      { idrol: 'LOLOGIST', nombre: 'Operador Logística', descripcion: 'Operadores de Logística' },
      { idrol: 'EMLOGIST', nombre: 'Operador Licitaciones', descripcion: 'Operadores de Licitaciones' },
      { idrol: 'OPLOGIST', nombre: 'Operativo Campo', descripcion: 'Personal operativo de campo' },
      { idrol: 'ALLOGIST', nombre: 'Almacén', descripcion: 'Personal de Almacén' },
      { idrol: 'APLOGIST', nombre: 'Aprobador', descripcion: 'Aprobadores por área' },
      { idrol: 'FINANZAS', nombre: 'Finanzas', descripcion: 'Aprobadores de Finanzas' },
      { idrol: 'ALL', nombre: 'Todos', descripcion: 'Visible para todos los roles' }
    ];
  }

  // Inicializar
  constructor() {
    this.cargarConfiguracion();
  }
}
