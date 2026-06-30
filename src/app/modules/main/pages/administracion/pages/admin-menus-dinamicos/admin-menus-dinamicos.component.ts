import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { DynamicMenuComponent } from '../../../layout/components/dynamic-menu/dynamic-menu.component';
import { LayoutConfigService, AccordionGroupConfig, MenuType, ACCORDION_DEFAULT, getMenuDefaultParaRol } from '../../../../services/layout-config.service';

interface ConfigMenuDinamico {
  id: string;
  idrol: string;
  clave: string;
  valor: string;
  descripcion: string;
  fechaCreacion: string;
  usuarioModifica: string;
}

interface Rol {
  idrol: string;
  nombre: string;
}

// Claves de configuración disponibles con descripciones
const CLAVES_CONFIGURACION = [
  { clave: 'MENU_TYPE', descripcion: 'Tipo de menú (accordion, nav, list, default)', ejemplo: 'accordion' },
  { clave: 'MENU_JSON', descripcion: 'JSON con estructura completa del menú', ejemplo: '[{"id":"panel",...}]' },
  { clave: 'ITEMS_VISIBLES', descripcion: 'IDs de items visibles separados por coma', ejemplo: 'dashboard,requerimientos,compras' },
  { clave: 'LAYOUT_ACCORDION', descripcion: 'Flag para activar modo accordion (1/0)', ejemplo: '1' },
  { clave: 'LAYOUT_MENU_TYPE', descripcion: 'Tipo de layout alternativo', ejemplo: 'nav' }
];

/**
 * Componente para configuración de menús dinámicos
 * Maneja el nuevo sistema de menús separado del sistema legacy
 */
@Component({
  selector: 'app-admin-menus-dinamicos',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="menus-dinamicos-container">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header-left">
          <h4 class="page-title"><i class='bx bx-menu'></i> Menús Dinámicos</h4>
          <p class="page-subtitle">Configuración de menús dinámicos por rol (independiente del menú JLOLOGIST)</p>
        </div>
        <div class="page-header-right">
          <div class="alert alert-info mb-0 py-1 px-2">
            <small><i class='bx bx-info-circle'></i> JLOLOGIST usa su menú especial. Aquí se configuran los demás roles.</small>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <div class="row">
        <!-- Panel de configuración -->
        <div class="col-lg-7">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">
                <i class='bx bx-cog'></i> Configuración
              </h5>
            </div>
            <div class="card-body">
              <!-- Selector de rol -->
              <div class="form-group mb-3">
                <label for="rolSelect" class="form-label fw-semibold">Seleccionar Rol:</label>
                <select id="rolSelect" class="form-select" [(ngModel)]="rolSeleccionado" (change)="cargarConfiguracion()">
                  <option value="">-- Seleccione un rol --</option>
                  @for (rol of roles(); track rol.idrol) {
                    <option [value]="rol.idrol">{{ rol.nombre }} ({{ rol.idrol }})</option>
                  }
                </select>
              </div>

              @if (rolSeleccionado) {
                <!-- Tipo de menú -->
                <div class="form-group mb-3">
                  <label class="form-label fw-semibold">Tipo de Menú:</label>
                  <select class="form-select" [(ngModel)]="previewMenuType" (change)="actualizarPreview()">
                    <option value="accordion">Accordion (grupos colapsables)</option>
                    <option value="nav">Nav (menú vertical)</option>
                    <option value="list">List (lista plana)</option>
                    <option value="default">Default (menú estándar)</option>
                  </select>
                </div>

                <!-- Configuración actual de BD -->
                <div class="config-section">
                  <h6 class="section-title">
                    <i class='bx bx-data'></i> Configuraciones en BD
                    <span class="badge bg-secondary ms-2">{{ configuraciones().length }}</span>
                  </h6>
                  @if (configuraciones().length === 0) {
                    <div class="text-muted text-center py-3">
                      <i class='bx bx-info-circle fs-4'></i><br>
                      <small>Sin configuraciones guardadas para este rol.</small><br>
                      <button class="btn btn-sm btn-outline-success mt-2" (click)="aplicarConfiguracionPorDefecto()">
                        <i class='bx bx-magic-wand'></i> Usar configuración por defecto
                      </button>
                    </div>
                  }
                  <div class="config-items">
                    @for (config of configuraciones(); track config.id) {
                      <div class="config-item">
                        <div class="config-header">
                          <span class="config-key">{{ config.clave }}</span>
                          <button class="btn btn-sm btn-outline-danger" (click)="eliminarConfig(config.id)">
                            <i class='bx bx-trash'></i>
                          </button>
                        </div>
                        <div class="config-value">
                          <input type="text" class="form-control form-control-sm" [(ngModel)]="config.valor" 
                                 (blur)="actualizarConfig(config)" placeholder="Valor">
                        </div>
                        <div class="config-desc">
                          <small class="text-muted">{{ config.descripcion }}</small>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Agregar nueva configuración -->
                <div class="add-config-section">
                  <h6 class="section-title"><i class='bx bx-plus-circle'></i> Agregar Configuración</h6>
                  
                  <!-- Selector de clave predefinida -->
                  <div class="form-group mb-2">
                    <label class="form-label small text-muted mb-1">Clave predefinida (opcional):</label>
                    <select class="form-select form-select-sm" [(ngModel)]="clavePredefinidaSeleccionada" 
                            (change)="onClavePredefinidaChange()">
                      <option value="">-- Escribir clave personalizada --</option>
                      @for (clave of clavesDisponibles; track clave.clave) {
                        <option [value]="clave.clave">{{ clave.clave }} - {{ clave.descripcion }}</option>
                      }
                    </select>
                  </div>
                  
                  <div class="row g-2">
                    <div class="col-md-4">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevaConfig.clave" 
                             placeholder="Clave" [readonly]="clavePredefinidaSeleccionada !== ''">
                    </div>
                    <div class="col-md-4">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevaConfig.valor" 
                             [placeholder]="placeholderValor">
                    </div>
                    <div class="col-md-4">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="nuevaConfig.descripcion" 
                             placeholder="Descripción">
                    </div>
                  </div>
                  <div class="mt-2">
                    <button class="btn btn-sm btn-primary" (click)="agregarConfiguracion()" 
                            [disabled]="!nuevaConfig.clave || !nuevaConfig.valor">
                      <i class='bx bx-plus'></i> Agregar
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Panel de Preview -->
        <div class="col-lg-5">
          <!-- Preview en vivo -->
          <div class="card">
            <div class="card-header py-2">
              <h5 class="card-title mb-0 d-flex align-items-center gap-2">
                <i class='bx bx-show'></i> Preview del Menú
                @if (rolSeleccionado) {
                  <span class="badge bg-success ms-auto">{{ previewMenuType }}</span>
                }
              </h5>
            </div>
            <div class="card-body p-0">
              @if (!rolSeleccionado) {
                <div class="preview-empty">
                  <i class='bx bx-pointer fs-1 text-muted'></i>
                  <p class="text-muted mb-0">Selecciona un rol para ver la preview del menú</p>
                </div>
              }
              @if (rolSeleccionado) {
                <div class="preview-wrapper">
                  <!-- Simulated sidebar header -->
                  <div class="preview-user-header">
                    <div class="preview-avatar">
                      <i class='bx bx-user-circle'></i>
                    </div>
                    <div class="preview-user-info">
                      <span class="preview-greeting">Hola</span>
                      <span class="preview-name">Usuario {{ rolSeleccionado }}</span>
                      <span class="preview-version">V. Preview</span>
                    </div>
                  </div>
                  <!-- DynamicMenu component -->
                  <div class="preview-sidebar">
                    <app-dynamic-menu
                      [menuType]="previewMenuType"
                      [menuGroups]="previewMenuGroups"
                      [contadorNotificaciones]="3">
                    </app-dynamic-menu>
                  </div>
                  <!-- Simulated logout -->
                  <div class="preview-logout">
                    <button class="btn btn-danger btn-sm w-100" disabled>
                      <i class='bx bx-log-out'></i> Cerrar sesion
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Info compacta -->
          <div class="card mt-3">
            <div class="card-body py-2 px-3">
              <small class="text-muted">
                <strong>API:</strong> <code>POST /api/configmenu/*</code><br>
                <strong>Claves:</strong> MENU_TYPE, MENU_JSON, ITEMS_VISIBLES
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menus-dinamicos-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
    .page-title { color: #238664; margin: 0 0 4px 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
    .page-subtitle { color: #666; margin: 0; font-size: 13px; }
    .config-section { margin-bottom: 20px; }
    .section-title { color: #238664; font-weight: 600; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 2px solid #238664; font-size: 14px; display: flex; align-items: center; gap: 6px; }
    .config-item { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .config-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .config-key { font-weight: 600; color: #495057; font-family: monospace; font-size: 13px; }
    .config-value { margin-bottom: 4px; }
    .config-desc { font-size: 0.82em; }
    .add-config-section { background: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 8px; padding: 12px; margin-top: 16px; }

    /* Preview styles */
    .preview-empty { text-align: center; padding: 60px 20px; }
    .preview-wrapper { background: #ffffff; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; overflow: hidden; }
    .preview-user-header { padding: 20px 16px 12px; text-align: center; background: #238664; }
    .preview-avatar { font-size: 48px; color: rgba(255,255,255,0.8); line-height: 1; }
    .preview-user-info { display: flex; flex-direction: column; }
    .preview-greeting { color: rgba(255,255,255,0.7); font-size: 12px; }
    .preview-name { color: #fff; font-weight: 600; font-size: 14px; }
    .preview-version { color: rgba(255,255,255,0.5); font-size: 10px; }
    .preview-sidebar { padding: 4px 0; min-height: 200px; max-height: 460px; overflow-y: auto; background: #f8f9fa; }
    .preview-sidebar ::ng-deep .dm-group-header,
    .preview-sidebar ::ng-deep .dm-icon,
    .preview-sidebar ::ng-deep .dm-label,
    .preview-sidebar ::ng-deep .dm-arrow,
    .preview-sidebar ::ng-deep .dm-item-link,
    .preview-sidebar ::ng-deep .dm-item-link i,
    .preview-sidebar ::ng-deep .dm-item-link span.hide-menu,
    .preview-sidebar ::ng-deep .dm-nav-link,
    .preview-sidebar ::ng-deep .dm-nav-link i,
    .preview-sidebar ::ng-deep .dm-nav-submenu-header,
    .preview-sidebar ::ng-deep .dm-list-link,
    .preview-sidebar ::ng-deep .dm-list-link i,
    .preview-sidebar ::ng-deep .dm-list-divider,
    .preview-sidebar ::ng-deep .dm-list-submenu-toggle,
    .preview-sidebar ::ng-deep .dm-submenu-toggle { color: #333 !important; }
    .preview-sidebar ::ng-deep .dm-nav-items { border-left-color: rgba(0,0,0,0.15); }
    .preview-sidebar ::ng-deep .dm-item-link:hover,
    .preview-sidebar ::ng-deep .dm-nav-link:hover,
    .preview-sidebar ::ng-deep .dm-list-link:hover { background: rgba(0,0,0,0.06); color: #000 !important; }
    .preview-sidebar ::ng-deep .dm-item-link.active,
    .preview-sidebar ::ng-deep .dm-nav-link.active,
    .preview-sidebar ::ng-deep .dm-list-link.active { background: rgba(0,0,0,0.1); color: #000 !important; font-weight: 600; }
    .preview-sidebar ::ng-deep .dm-accordion-items { background: rgba(0,0,0,0.04); }
    .preview-logout { padding: 12px 16px 16px; background: #f8f9fa; }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; }
    }
  `]
})
export class AdminMenusDinamicosComponent {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  public layoutConfig = inject(LayoutConfigService);

  baseUrl = environment.baseUrl;
  
  // Signals
  roles = signal<Rol[]>([]);
  configuraciones = signal<ConfigMenuDinamico[]>([]);
  rolSeleccionado = '';
  
  // Preview
  previewMenuType: MenuType = 'accordion';
  previewMenuGroups: AccordionGroupConfig[] = [];

  // Nueva configuración
  nuevaConfig = {
    clave: '',
    valor: '',
    descripcion: ''
  };

  // Claves predefinidas
  clavesDisponibles = CLAVES_CONFIGURACION;
  clavePredefinidaSeleccionada = '';
  placeholderValor = 'Valor';

  constructor() {
    this.cargarRoles();
  }

  async cargarRoles() {
    try {
      const rolesDisponibles: Rol[] = [
        { idrol: 'ADLOGIST', nombre: 'Admin Logística' },
        { idrol: 'OPLOGIST', nombre: 'Operativo Logística' },
        { idrol: 'TILOGIST', nombre: 'TI Logística' },
        { idrol: 'APLOGIST', nombre: 'Aprobador Logística' },
        { idrol: 'JEMLOGIST', nombre: 'Jefe Licitaciones/Compras' },
        { idrol: 'LOLOGIST', nombre: 'Operador Logística' },
        { idrol: 'EMLOGIST', nombre: 'Operador Licitaciones' },
        { idrol: 'ALLOGIST', nombre: 'Almacén Logística' },
        { idrol: 'FINANZAS', nombre: 'Finanzas' },
        { idrol: 'GERENTE', nombre: 'Gerente' }
      ];
      
      this.roles.set(rolesDisponibles);
    } catch (error) {
      console.error('Error cargando roles:', error);
      this.alertService.showAlertError('Error', 'Error al cargar los roles');
    }
  }

  async cargarConfiguracion() {
    if (!this.rolSeleccionado) {
      this.previewMenuGroups = [];
      return;
    }
    
    try {
      const response = await lastValueFrom(
        this.http.post<ConfigMenuDinamico[]>(`${this.baseUrl}/api/configmenu/listar`, {
          idrol: this.rolSeleccionado
        })
      );
      
      this.configuraciones.set(response || []);
      this.actualizarPreview();
    } catch (error) {
      console.error('Error cargando configuración:', error);
      this.alertService.showAlertError('Error', 'Error al cargar la configuración del menú');
      this.configuraciones.set([]);
      this.actualizarPreview();
    }
  }

  actualizarPreview() {
    // Intentar obtener el menú desde LayoutConfigService (ya cargado)
    const menuType = this.layoutConfig.getMenuType(this.rolSeleccionado);
    this.previewMenuType = menuType !== 'default' ? menuType : this.previewMenuType;

    // Buscar si hay un MENU_JSON en las configuraciones actuales
    const menuJsonConfig = this.configuraciones().find(c => c.clave === 'MENU_JSON');
    if (menuJsonConfig) {
      try {
        const parsed = JSON.parse(menuJsonConfig.valor) as AccordionGroupConfig[];
        // Sincronizar items nuevos del ACCORDION_DEFAULT que no estén en el JSON guardado
        this.previewMenuGroups = this.sincronizarItemsNuevos(parsed);
        return;
      } catch { /* JSON inválido, usar default */ }
    }

    // Buscar config desde LayoutConfigService
    const configMenu = this.layoutConfig.getAccordionMenu(this.rolSeleccionado);
    if (configMenu && configMenu.length > 0) {
      this.previewMenuGroups = this.sincronizarItemsNuevos(configMenu);
      return;
    }

    // Fallback: usar ACCORDION_DEFAULT
    this.previewMenuGroups = ACCORDION_DEFAULT;
  }

  /** Agrega grupos e items del ACCORDION_DEFAULT que no estén en el menú cargado desde BD */
  private sincronizarItemsNuevos(menu: AccordionGroupConfig[]): AccordionGroupConfig[] {
    const resultado = menu.map(g => ({ ...g, items: [...(g.items || [])] }));
    const idsGrupos = new Set(resultado.map(g => g.id));

    for (const grupoDefault of ACCORDION_DEFAULT) {
      if (!idsGrupos.has(grupoDefault.id)) {
        resultado.push({ ...JSON.parse(JSON.stringify(grupoDefault)), activo: false });
      } else {
        const grupoGuardado = resultado.find(g => g.id === grupoDefault.id)!;
        const idsItems = new Set(grupoGuardado.items.map(i => i.id));
        for (const itemDefault of grupoDefault.items) {
          if (!idsItems.has(itemDefault.id)) {
            grupoGuardado.items.push({ ...JSON.parse(JSON.stringify(itemDefault)), activo: false });
          }
        }
      }
    }
    return resultado;
  }

  async agregarConfiguracion() {
    if (!this.nuevaConfig.clave || !this.nuevaConfig.valor || !this.rolSeleccionado) {
      this.alertService.showAlert('Advertencia', 'Complete todos los campos', 'warning');
      return;
    }

    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: this.rolSeleccionado,
          clave: this.nuevaConfig.clave,
          valor: this.nuevaConfig.valor,
          descripcion: this.nuevaConfig.descripcion || `Configuración para ${this.rolSeleccionado}`,
          usuarioModifica: 'ADMIN'
        })
      );

      this.alertService.showAlert('Éxito', 'Configuración agregada correctamente', 'success');
      this.nuevaConfig = { clave: '', valor: '', descripcion: '' };
      this.notificarCambioMenu();
      this.cargarConfiguracion();
    } catch (error) {
      console.error('Error agregando configuración:', error);
      this.alertService.showAlertError('Error', 'Error al agregar la configuración');
    }
  }

  async actualizarConfig(config: ConfigMenuDinamico) {
    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: this.rolSeleccionado,
          clave: config.clave,
          valor: config.valor,
          descripcion: config.descripcion,
          usuarioModifica: 'ADMIN'
        })
      );

      this.alertService.showAlert('Éxito', 'Configuración actualizada correctamente', 'success');
      this.notificarCambioMenu();
      this.actualizarPreview();
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      this.alertService.showAlertError('Error', 'Error al actualizar la configuración');
    }
  }

  async eliminarConfig(id: string) {
    if (!confirm('¿Está seguro de eliminar esta configuración?')) return;

    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/eliminar`, { id })
      );

      this.alertService.showAlert('Éxito', 'Configuración eliminada correctamente', 'success');
      this.notificarCambioMenu();
      this.cargarConfiguracion();
    } catch (error) {
      console.error('Error eliminando configuración:', error);
      this.alertService.showAlertError('Error', 'Error al eliminar la configuración');
    }
  }

  // Cuando selecciona una clave predefinida, autocompletar campos
  onClavePredefinidaChange() {
    if (this.clavePredefinidaSeleccionada) {
      const claveDef = this.clavesDisponibles.find(c => c.clave === this.clavePredefinidaSeleccionada);
      if (claveDef) {
        this.nuevaConfig.clave = claveDef.clave;
        this.nuevaConfig.valor = claveDef.ejemplo;
        this.nuevaConfig.descripcion = claveDef.descripcion;
        this.placeholderValor = claveDef.ejemplo;
      }
    } else {
      this.nuevaConfig.clave = '';
      this.nuevaConfig.valor = '';
      this.nuevaConfig.descripcion = '';
      this.placeholderValor = 'Valor';
    }
  }

  /** Invalida el caché del servicio y notifica a otras pestañas para que recarguen el menú */
  private notificarCambioMenu(): void {
    this.layoutConfig.invalidar();
    localStorage.setItem('LAYOUT_CONFIG_INVALIDADO', Date.now().toString());
  }

  // Aplicar configuración por defecto al rol seleccionado
  async aplicarConfiguracionPorDefecto() {
    if (!this.rolSeleccionado) {
      this.alertService.showAlert('Advertencia', 'Seleccione un rol primero', 'warning');
      return;
    }

    const confirmacion = confirm(
      `¿Aplicar configuración por defecto al rol ${this.rolSeleccionado}?\n\n` +
      `Se crearán las siguientes claves:\n` +
      `- MENU_TYPE = accordion\n` +
      `- MENU_JSON = [menú completo por defecto]`
    );
    
    if (!confirmacion) return;

    try {
      // 1. Guardar MENU_TYPE
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: this.rolSeleccionado,
          clave: 'MENU_TYPE',
          valor: 'accordion',
          descripcion: 'Tipo de menú: accordion (grupos colapsables)',
          usuarioModifica: 'ADMIN'
        })
      );

      // 2. Guardar MENU_JSON con el menú filtrado para el rol
      const menuParaRol = getMenuDefaultParaRol(this.rolSeleccionado);
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: this.rolSeleccionado,
          clave: 'MENU_JSON',
          valor: JSON.stringify(menuParaRol),
          descripcion: 'Estructura completa del menú accordion por defecto',
          usuarioModifica: 'ADMIN'
        })
      );

      // 3. Guardar LAYOUT_ACCORDION flag
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: this.rolSeleccionado,
          clave: 'LAYOUT_ACCORDION',
          valor: '1',
          descripcion: 'Activar modo accordion para este rol',
          usuarioModifica: 'ADMIN'
        })
      );

      this.alertService.showAlert('Éxito', 'Configuración por defecto aplicada correctamente', 'success');
      this.notificarCambioMenu();
      this.cargarConfiguracion();
    } catch (error) {
      console.error('Error aplicando configuración por defecto:', error);
      this.alertService.showAlertError('Error', 'Error al aplicar la configuración por defecto');
    }
  }
}
