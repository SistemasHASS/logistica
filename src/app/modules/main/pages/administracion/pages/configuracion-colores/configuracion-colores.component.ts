import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  ThemeConfigService, 
  ColorPalette, 
  SemanticColors, 
  ModuloRegistrado,
  TypographyConfig
} from '@/app/shared/services/theme-config.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-configuracion-colores',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, TooltipModule, BadgeModule, ProgressBarModule],
  templateUrl: './configuracion-colores.component.html',
  styleUrl: './configuracion-colores.component.scss'
})
export class ConfiguracionColoresComponent {
  private themeService = inject(ThemeConfigService);
  private alertService = inject(AlertService);

  // ============================================
  // ESTADO
  // ============================================
  palette: ColorPalette = { ...this.themeService.palette() };
  semantic: SemanticColors = { ...this.themeService.semantic() };
  
  // Tipografía
  typography: TypographyConfig = { ...this.themeService.typography() };

  readonly FUENTES_DISPONIBLES = [
    { value: 'inherit',          label: 'Predeterminada del sistema' },
    { value: 'Arial, sans-serif',                label: 'Arial' },
    { value: '\'Roboto\', sans-serif',           label: 'Roboto' },
    { value: '\'Open Sans\', sans-serif',        label: 'Open Sans' },
    { value: '\'Nunito\', sans-serif',           label: 'Nunito' },
    { value: '\'Inter\', sans-serif',            label: 'Inter' },
    { value: '\'Poppins\', sans-serif',          label: 'Poppins' },
    { value: '\'Source Sans Pro\', sans-serif',  label: 'Source Sans Pro' },
    { value: 'Georgia, serif',                   label: 'Georgia' },
    { value: '\'Courier New\', monospace',       label: 'Courier New' },
  ];

  readonly COMPONENTES_TYPO: { key: keyof Omit<TypographyConfig, 'fontFamily' | 'fontSize' | 'colorTexto'>; label: string; icono: string }[] = [
    { key: 'tablas',      label: 'Tablas',      icono: 'bx bx-table' },
    { key: 'inputs',      label: 'Inputs',      icono: 'bx bx-text' },
    { key: 'formularios', label: 'Formularios', icono: 'bx bx-list-ul' },
    { key: 'cards',       label: 'Cards',       icono: 'bx bx-card' },
    { key: 'botones',     label: 'Botones',     icono: 'bx bx-pointer' },
    { key: 'badges',      label: 'Badges',      icono: 'bx bx-purchase-tag' },
    { key: 'labels',      label: 'Labels',      icono: 'bx bx-label' },
    { key: 'modales',     label: 'Modales',     icono: 'bx bx-window-alt' },
  ];

  guardarTypografia() {
    this.themeService.updateTypography(this.typography);
    this.alertService.showAlert('Tipografía guardada', 'Los cambios tipográficos se aplicaron en toda la app.', 'success');
  }

  restaurarTypografiaDefault() {
    this.themeService.restaurarTypographyDefault();
    this.typography = { ...this.themeService.typography() };
    this.alertService.showAlert('Tipografía restaurada', 'Se restauraron los valores por defecto.', 'success');
  }

  // Tab activo
  activeTab = signal(0);
  
  // Módulo seleccionado para preview
  moduloPreviewSeleccionado = signal<string>('dashboard-aprobaciones-area');

  // Computed: Módulos registrados
  modulosRegistrados = computed(() => this.themeService.modulosRegistrados());
  
  // Computed: Dashboards disponibles
  dashboardsDisponibles = computed(() => 
    this.modulosRegistrados().filter(m => m.tipo === 'dashboard')
  );

  // Computed: Nombre del módulo seleccionado para preview
  moduloPreviewNombre = computed(() => {
    const modulos = this.modulosRegistrados();
    const id = this.moduloPreviewSeleccionado();
    return modulos.find(m => m.id === id)?.nombre || 'Dashboard Seleccionado';
  });

  // Computed: Objeto módulo seleccionado completo
  moduloSeleccionado = computed(() => {
    const modulos = this.modulosRegistrados();
    const id = this.moduloPreviewSeleccionado();
    return modulos.find(m => m.id === id);
  });

  // Método para seleccionar un módulo desde la lista
  seleccionarModulo(moduloId: string) {
    this.moduloPreviewSeleccionado.set(moduloId);
  }

  // Signal para controlar la visibilidad del modal de preview
  mostrarModalPreview = signal(false);

  // Método para abrir el modal de preview
  abrirModalPreview(moduloId: string) {
    this.moduloPreviewSeleccionado.set(moduloId);
    this.mostrarModalPreview.set(true);
  }

  // Método para cerrar el modal
  cerrarModalPreview() {
    this.mostrarModalPreview.set(false);
  }

  // ============================================
  // GESTIÓN DE MÓDULOS DEL MENÚ (CON ROLES)
  // ============================================
  
  // Signals para gestión de módulos del menú
  mostrarFormularioNuevoModuloMenu = signal(false);
  moduloMenuEditando = signal<string | null>(null);
  
  // Propiedad regular para ngModel (no signal)
  rolPreviewSeleccionadoValue: string = '';
  
  // Computed: Todos los módulos del menú
  todosModulosMenu = computed(() => this.themeService.todosModulosMenu());
  
  // Computed: Roles disponibles
  rolesDisponibles = computed(() => this.themeService.getRolesDisponibles());

  // Computed: Roles filtrados (sin 'ALL') para el selector de preview
  rolesFiltradosParaPreview = computed(() =>
    this.rolesDisponibles().filter(r => r.idrol !== 'ALL')
  );

  // Computed: Módulos visibles para el rol seleccionado en preview
  modulosVisiblesPreview = computed(() => {
    const rol = this.rolPreviewSeleccionadoValue;
    if (!rol) return [];
    return this.themeService.getModulosPorRol(rol);
  });
  
  // Computed: Módulos agrupados por categoría para el preview
  modulosPorCategoriaPreview = computed(() => {
    const modulos = this.modulosVisiblesPreview();
    const categorias: { [key: string]: any[] } = {};
    
    modulos.forEach(modulo => {
      if (!categorias[modulo.categoria]) {
        categorias[modulo.categoria] = [];
      }
      categorias[modulo.categoria].push(modulo);
    });
    
    return categorias;
  });
  
  // Modelo para nuevo módulo del menú
  nuevoModuloMenu = {
    nombre: '',
    descripcion: '',
    icono: 'ti ti-layout-dashboard',
    ruta: '',
    categoria: 'Mi Dashboard',
    orden: 1,
    roles: [] as string[],
    activo: true
  };
  
  // Métodos para gestión de módulos del menú
  
  // Mostrar formulario para nuevo módulo
  mostrarNuevoModuloMenu() {
    this.moduloMenuEditando.set(null);
    this.resetNuevoModuloMenu();
    this.mostrarFormularioNuevoModuloMenu.set(true);
  }
  
  // Editar módulo existente
  editarModuloMenu(id: string) {
    const modulo = this.todosModulosMenu().find(m => m.id === id);
    if (!modulo) return;
    
    this.nuevoModuloMenu = {
      nombre: modulo.nombre,
      descripcion: modulo.descripcion,
      icono: modulo.icono,
      ruta: modulo.ruta,
      categoria: modulo.categoria,
      orden: modulo.orden,
      roles: [...modulo.roles],
      activo: modulo.activo
    };
    
    this.moduloMenuEditando.set(id);
    this.mostrarFormularioNuevoModuloMenu.set(true);
  }
  
  // Guardar módulo (crear o actualizar)
  guardarModuloMenu() {
    if (!this.nuevoModuloMenu.nombre || !this.nuevoModuloMenu.ruta || this.nuevoModuloMenu.roles.length === 0) {
      this.alertService.showAlert('Error', 'Completa todos los campos requeridos y selecciona al menos un rol.', 'error');
      return;
    }
    
    const moduloData = {
      nombre: this.nuevoModuloMenu.nombre,
      descripcion: this.nuevoModuloMenu.descripcion,
      icono: this.nuevoModuloMenu.icono,
      ruta: this.nuevoModuloMenu.ruta,
      categoria: this.nuevoModuloMenu.categoria,
      orden: this.nuevoModuloMenu.orden,
      roles: [...this.nuevoModuloMenu.roles],
      activo: this.nuevoModuloMenu.activo
    };
    
    const editando = this.moduloMenuEditando();
    if (editando) {
      this.themeService.actualizarModuloMenu(editando, moduloData);
      this.alertService.showAlert('Módulo Actualizado', `El módulo "${moduloData.nombre}" ha sido actualizado.`, 'success');
    } else {
      const id = this.themeService.agregarModuloMenu(moduloData);
      this.alertService.showAlert('Módulo Creado', `El módulo "${moduloData.nombre}" ha sido creado con ID: ${id}.`, 'success');
    }
    
    this.cancelarFormularioModuloMenu();
  }
  
  // Eliminar módulo
  eliminarModuloMenu(id: string) {
    const modulo = this.todosModulosMenu().find(m => m.id === id);
    if (!modulo) return;
    
    if (confirm(`¿Estás seguro de eliminar el módulo "${modulo.nombre}"?`)) {
      this.themeService.eliminarModuloMenu(id);
      this.alertService.showAlert('Módulo Eliminado', `El módulo "${modulo.nombre}" ha sido eliminado.`, 'success');
    }
  }
  
  // Toggle activo/inactivo
  toggleModuloMenuActivo(id: string) {
    this.themeService.toggleModuloMenuActivo(id);
    const modulo = this.todosModulosMenu().find(m => m.id === id);
    if (modulo) {
      const estado = modulo.activo ? 'visible' : 'oculto';
      this.alertService.showAlert('Estado Actualizado', `El módulo "${modulo.nombre}" ahora está ${estado}.`, 'success');
    }
  }
  
  // Toggle rol en la selección
  toggleRolModuloMenu(rolId: string) {
    const index = this.nuevoModuloMenu.roles.indexOf(rolId);
    if (index > -1) {
      this.nuevoModuloMenu.roles.splice(index, 1);
    } else {
      this.nuevoModuloMenu.roles.push(rolId);
    }
  }
  
  // Cancelar formulario
  cancelarFormularioModuloMenu() {
    this.mostrarFormularioNuevoModuloMenu.set(false);
    this.moduloMenuEditando.set(null);
    this.resetNuevoModuloMenu();
  }
  
  // Resetear modelo
  private resetNuevoModuloMenu() {
    this.nuevoModuloMenu = {
      nombre: '',
      descripcion: '',
      icono: 'ti ti-layout-dashboard',
      ruta: '',
      categoria: 'Mi Dashboard',
      orden: 1,
      roles: [],
      activo: true
    };
  }
  
  // Restaurar módulos por defecto
  restaurarModulosMenuDefault() {
    if (confirm('¿Restaurar todos los módulos del menú a los valores por defecto? Se perderán los módulos personalizados.')) {
      this.themeService.restaurarModulosMenuDefault();
      this.alertService.showAlert('Módulos Restaurados', 'Los módulos del menú han sido restaurados a los valores por defecto.', 'success');
    }
  }
  
  // Actualizar preview de rol
  actualizarPreviewRol() {
    // El computed se actualiza automáticamente
  }

  // ============================================
  // PALETAS PRECONFIGURADAS
  // ============================================
  readonly PALETA_ARANDANO: ColorPalette = {
    primary: '#9B2335',
    success: '#27ae60',
    danger: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
    secondary: '#E8B4B8',
    light: '#FDF2F4',
    dark: '#5D1A25',
    cranberry: '#9B2335',
    cranberryLight: '#E8B4B8',
    cranberryDark: '#5D1A25',
    rose: '#E8B4B8',
    magenta: '#C2185B'
  };

  readonly PALETA_CORPORATIVA: ColorPalette = {
    primary: '#2952ff',
    success: '#85d446',
    danger: '#f25a5a',
    warning: '#f2d15a',
    info: '#745af2',
    secondary: '#74dbf7',
    light: '#f6f8fa',
    dark: '#3a4752',
    cranberry: '#9B2335',
    cranberryLight: '#E8B4B8',
    cranberryDark: '#5D1A25',
    rose: '#E8B4B8',
    magenta: '#C2185B'
  };

  readonly PALETA_OCEANO: ColorPalette = {
    primary: '#0066CC',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    secondary: '#6c757d',
    light: '#f8f9fa',
    dark: '#343a40',
    cranberry: '#9B2335',
    cranberryLight: '#E8B4B8',
    cranberryDark: '#5D1A25',
    rose: '#E8B4B8',
    magenta: '#C2185B'
  };

  // ============================================
  // PREVIEW COLORES BASE
  // ============================================
  get previewColors() {
    return [
      { label: 'Primary / Acción Primaria', color: this.palette.primary, uso: 'Botones principales, navegación, branding', clase: 'primario' },
      { label: 'Success / Éxito', color: this.palette.success, uso: 'Aprobaciones, completado, éxito', clase: 'exito' },
      { label: 'Danger / Peligro', color: this.palette.danger, uso: 'Rechazos, anulaciones, errores', clase: 'peligro' },
      { label: 'Warning / Advertencia', color: this.palette.warning, uso: 'Pendientes, en proceso, advertencias', clase: 'advertencia' },
      { label: 'Info / Información', color: this.palette.info, uso: 'Mensajes informativos, datos secundarios', clase: 'informativo' },
      { label: 'Secondary / Secundario', color: this.palette.secondary, uso: 'Acciones secundarias, complementos', clase: 'secundario' },
      { label: 'Cranberry / Arándano', color: this.palette.cranberry, uso: 'Color distintivo de marca HASS', clase: 'cranberry' },
      { label: 'Rose / Rosa', color: this.palette.rose, uso: 'Fondos suaves, estados alternativos', clase: 'rose' },
    ];
  }

  // ============================================
  // PREVIEW ESTADOS SEMÁNTICOS
  // ============================================
  get previewEstados() {
    return [
      { nombre: 'Aprobado', color: this.semantic.aprobado, icono: 'ti ti-check', descripcion: 'Requerimientos aprobados, éxito' },
      { nombre: 'Pendiente', color: this.semantic.pendiente, icono: 'ti ti-clock', descripcion: 'Esperando aprobación' },
      { nombre: 'Rechazado', color: this.semantic.rechazado, icono: 'ti ti-x', descripcion: 'Requerimientos rechazados' },
      { nombre: 'Anulado', color: this.semantic.anulado, icono: 'ti ti-ban', descripcion: 'Requerimientos anulados' },
      { nombre: 'Procesando', color: this.semantic.procesando, icono: 'ti ti-loader', descripcion: 'En proceso de revisión' },
      { nombre: 'Nuevo', color: this.semantic.reqNuevo, icono: 'ti ti-plus', descripcion: 'Requerimiento nuevo' },
      { nombre: 'En Proceso', color: this.semantic.reqEnProceso, icono: 'ti ti-loader', descripcion: 'Requerimiento en curso' },
      { nombre: 'Completado', color: this.semantic.reqCompletado, icono: 'ti ti-check', descripcion: 'Requerimiento completado' },
    ];
  }

  // ============================================
  // KPI CARDS PREVIEW (para dashboards)
  // ============================================
  get previewKPICards() {
    return [
      { 
        titulo: 'Pendientes', 
        valor: 12, 
        icono: 'ti ti-clock', 
        color: this.semantic.pendiente,
        clase: 'kpi-pendiente',
        subtipo: { consumo: 8, compra: 4 }
      },
      { 
        titulo: 'Aprobados', 
        valor: 45, 
        icono: 'ti ti-check', 
        color: this.semantic.aprobado,
        clase: 'kpi-aprobado',
        subtipo: { consumo: 30, compra: 15 }
      },
      { 
        titulo: 'Rechazados', 
        valor: 3, 
        icono: 'ti ti-x', 
        color: this.semantic.rechazado,
        clase: 'kpi-rechazado',
        subtipo: { consumo: 2, compra: 1 }
      },
      { 
        titulo: 'Total', 
        valor: 60, 
        icono: 'ti ti-chart-bar', 
        color: this.palette.primary,
        clase: 'kpi-total',
        subtipo: { consumo: 40, compra: 20 }
      },
    ];
  }

  // ============================================
  // ACCIONES
  // ============================================
  
  aplicarPaletaArandano() {
    this.palette = { ...this.PALETA_ARANDANO };
    this.actualizarSemanticDesdePalette();
    this.guardarCambios();
    
    this.alertService.showAlert(
      'Paleta Arándano Aplicada',
      'Se ha aplicado la paleta de colores arándano HASS.',
      'success'
    );
  }

  aplicarPaletaCorporativa() {
    this.palette = { ...this.PALETA_CORPORATIVA };
    this.actualizarSemanticDesdePalette();
    this.guardarCambios();
    
    this.alertService.showAlert(
      'Paleta Corporativa Aplicada',
      'Se ha aplicado la paleta corporativa estándar.',
      'success'
    );
  }

  aplicarPaletaOceano() {
    this.palette = { ...this.PALETA_OCEANO };
    this.actualizarSemanticDesdePalette();
    this.guardarCambios();
    
    this.alertService.showAlert(
      'Paleta Océano Aplicada',
      'Se ha aplicado la paleta de tonos azules.',
      'success'
    );
  }

  guardarCambios() {
    this.themeService.updatePalette(this.palette);
    this.themeService.updateSemantic(this.semantic);
    
    this.alertService.showAlert(
      'Configuración Guardada',
      'Los colores han sido actualizados y se aplicarán en toda la aplicación.',
      'success'
    );
  }

  restaurarDefault() {
    this.palette = { ...this.PALETA_ARANDANO };
    this.actualizarSemanticDesdePalette();
    this.guardarCambios();
    
    this.alertService.showAlert(
      'Valores Restaurados',
      'Se han restaurado los valores por defecto (Arándano).',
      'success'
    );
  }

  // ============================================
  // HELPERS
  // ============================================
  
  private actualizarSemanticDesdePalette() {
    this.semantic = {
      aprobado: this.palette.success,
      pendiente: this.palette.warning,
      rechazado: this.palette.danger,
      anulado: '#95a5a6',
      procesando: this.palette.info,
      accionPrimaria: this.palette.primary,
      accionSecundaria: this.palette.secondary,
      accionPeligro: this.palette.danger,
      accionAdvertencia: this.palette.warning,
      datoPrincipal: this.palette.primary,
      datoSecundario: this.palette.info,
      datoAlerta: this.palette.warning,
      datoInformativo: this.palette.info,
      reqNuevo: this.palette.primary,
      reqEnProceso: this.palette.warning,
      reqCompletado: this.palette.success,
      reqCancelado: this.palette.danger
    };
  }

  getBgStyle(color: string) {
    return { 'background-color': color };
  }

  getColorStyle(color: string) {
    return { 'color': color };
  }

  // ============================================
  // REGISTRO DE NUEVOS MÓDULOS
  // ============================================
  
  nuevoModulo = {
    id: '',
    nombre: '',
    descripcion: '',
    tipo: 'dashboard' as ModuloRegistrado['tipo'],
    icono: 'ti ti-layout-dashboard',
    coloresRequeridos: ['primary', 'success', 'danger', 'warning']
  };

  mostrarFormularioNuevoModulo = signal(false);

  registrarNuevoModulo() {
    if (!this.nuevoModulo.id || !this.nuevoModulo.nombre) {
      this.alertService.showAlert(
        'Datos Incompletos',
        'Por favor complete el ID y nombre del módulo.',
        'warning'
      );
      return;
    }

    const modulo: ModuloRegistrado = {
      id: this.nuevoModulo.id,
      nombre: this.nuevoModulo.nombre,
      descripcion: this.nuevoModulo.descripcion,
      tipo: this.nuevoModulo.tipo,
      icono: this.nuevoModulo.icono,
      coloresRequeridos: this.nuevoModulo.coloresRequeridos,
      estados: [
        { nombre: 'Activo', color: 'success', icono: 'ti ti-check' },
        { nombre: 'Inactivo', color: 'danger', icono: 'ti ti-x' }
      ]
    };

    this.themeService.registrarModulo(modulo);
    
    // Reset form
    this.nuevoModulo = {
      id: '',
      nombre: '',
      descripcion: '',
      tipo: 'dashboard',
      icono: 'ti ti-layout-dashboard',
      coloresRequeridos: ['primary', 'success', 'danger', 'warning']
    };
    this.mostrarFormularioNuevoModulo.set(false);

    this.alertService.showAlert(
      'Módulo Registrado',
      `El módulo "${modulo.nombre}" ha sido registrado y aparecerá en el preview.`,
      'success'
    );
  }
}
