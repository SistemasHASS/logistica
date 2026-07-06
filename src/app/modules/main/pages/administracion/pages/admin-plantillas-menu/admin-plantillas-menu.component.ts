import { Component, ChangeDetectionStrategy, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import {
  AccordionGroupConfig, AccordionItemConfig,
  ACCORDION_DEFAULT, LayoutConfigService, MenuType
} from '@/app/modules/main/services/layout-config.service';
import { DynamicMenuComponent } from '@/app/modules/main/pages/layout/components/dynamic-menu/dynamic-menu.component';

interface PlantillaMenu {
  id: string;
  nombre: string;
  descripcion: string;
  tipoMenu: MenuType;
  grupos: AccordionGroupConfig[];
  fechaCreacion: string;
  usuarioCreador: string;
  activo: boolean;
}

interface TipoMenuCustom {
  value: string;
  label: string;
  icono: string;
  descripcion: string;
  color: string;
  esCustom: boolean;
}

interface ItemPaleta {
  id: string;
  nombre: string;
  icono: string;
  tipo: 'grupo' | 'item';
  ruta?: string;
}

const PALETA_GRUPOS: ItemPaleta[] = [
  { id: 'grp-dashboard', nombre: 'Mi Panel', icono: 'bx bxs-dashboard', tipo: 'grupo' },
  { id: 'grp-config', nombre: 'Configuración', icono: 'icon icon-equalizer', tipo: 'grupo' },
  { id: 'grp-requerimientos', nombre: 'Requerimientos', icono: 'icon icon-stack', tipo: 'grupo' },
  { id: 'grp-compras', nombre: 'Compras & Órdenes', icono: 'bx bx-cart', tipo: 'grupo' },
  { id: 'grp-almacen', nombre: 'Almacén & Stock', icono: 'bx bx-package', tipo: 'grupo' },
  { id: 'grp-aprobaciones', nombre: 'Aprobaciones', icono: 'icon icon-file-check', tipo: 'grupo' },
  { id: 'grp-reportes', nombre: 'Reportes', icono: 'icon icon-pie-chart', tipo: 'grupo' },
  { id: 'grp-custom', nombre: 'Grupo Personalizado', icono: 'bx bx-folder', tipo: 'grupo' },
];

const PALETA_ITEMS: ItemPaleta[] = [
  { id: 'itm-dashboard-jlologist', nombre: 'Dashboard Jef. Logística', icono: 'bx bx-line-chart', tipo: 'item', ruta: './dashboard-jlologist' },
  { id: 'itm-dashboard-oplogist', nombre: 'Mi Dashboard', icono: 'bx bx-user-check', tipo: 'item', ruta: './dashboard-oplogist' },
  { id: 'itm-dashboard-logistica', nombre: 'Dashboard Logística', icono: 'bx bx-bar-chart-alt-2', tipo: 'item', ruta: './dashboard-logistica' },
  { id: 'itm-notificaciones', nombre: 'Notificaciones', icono: 'bx bx-bell', tipo: 'item', ruta: './notificaciones' },
  { id: 'itm-parametros', nombre: 'Parámetros', icono: 'icon icon-equalizer', tipo: 'item', ruta: './parametros' },
  { id: 'itm-requerimientos', nombre: 'Requerimientos', icono: 'icon icon-stack', tipo: 'item', ruta: './requerimientos' },
  { id: 'itm-saldo-requerimiento', nombre: 'Saldo de Requerimiento', icono: 'icon icon-balance', tipo: 'item', ruta: './saldo-requerimiento' },
  { id: 'itm-solicitudes-compra', nombre: 'Solicitudes de Compra', icono: 'bx bx-shopping-bag', tipo: 'item', ruta: './solicitudes-compra' },
  { id: 'itm-ordenes-compra', nombre: 'Órdenes de Compra', icono: 'icon icon-file-text', tipo: 'item', ruta: './ordenes-compra' },
  { id: 'itm-consolidacion-compra', nombre: 'Consolidación Compras', icono: 'bx bx-cart', tipo: 'item', ruta: './consolidacion-compra' },
  { id: 'itm-consolidacion-compras', nombre: 'Flujo de Compras', icono: 'bx bx-cart', tipo: 'item', ruta: './consolidacion-compras' },
  { id: 'itm-solicitudes-servicio', nombre: 'Solicitudes de Servicio', icono: 'bx bx-briefcase', tipo: 'item', ruta: './solicitudes-servicio' },
  { id: 'itm-ordenes-servicio', nombre: 'Órdenes de Servicio', icono: 'bx bx-wrench', tipo: 'item', ruta: './ordenes-servicio' },
  { id: 'itm-cotizaciones', nombre: 'Cotizaciones', icono: 'icon icon-calculator', tipo: 'item', ruta: './cotizaciones' },
  { id: 'itm-despachos', nombre: 'Gestión de Despachos', icono: 'icon icon-stack', tipo: 'item', ruta: './despachos' },
  { id: 'itm-recepcion-mercaderia', nombre: 'Recepción de Mercadería', icono: 'icon icon-package', tipo: 'item', ruta: './recepcion-mercaderia' },
  { id: 'itm-kardex', nombre: 'Kardex e Inventario', icono: 'bx bx-container', tipo: 'item', ruta: './kardex' },
  { id: 'itm-aprobaciones-oc', nombre: 'Aprobación OC', icono: 'icon icon-file-check', tipo: 'item', ruta: './aprobaciones-oc' },
  { id: 'itm-aprobaciones-os', nombre: 'Aprobación OS', icono: 'icon icon-file-check', tipo: 'item', ruta: './aprobaciones-os' },
  { id: 'itm-aprobaciones-area', nombre: 'Aprobación por Área', icono: 'icon icon-file-check', tipo: 'item', ruta: './aprobaciones-area' },
  { id: 'itm-reportes-compras', nombre: 'Reportes Avanzados', icono: 'icon icon-pie-chart', tipo: 'item', ruta: './reportes-compras' },
  { id: 'itm-reporte-requerimientos', nombre: 'Reporte Requerimientos', icono: 'icon icon-file-text', tipo: 'item', ruta: './reporte-requerimientos' },
  { id: 'itm-reporte-despachos', nombre: 'Reporte de Despachos', icono: 'icon icon-file-text', tipo: 'item', ruta: './reporte-despachos' },
];

/** Plantillas base por tipo de menú — cada tipo tiene su propia estructura predefinida */
const PLANTILLAS_POR_TIPO: Record<MenuType, AccordionGroupConfig[]> = {
  accordion: ACCORDION_DEFAULT,
  nav: [
    {
      id: 'nav-principal', label: 'Navegación Principal', icono: 'bx bx-menu', activo: true, orden: 1, tipo: 'nav',
      items: [
        { id: 'dashboard-oplogist', nombre: 'Mi Dashboard', icono: 'bx bx-user-check', ruta: './dashboard-oplogist', activo: true, orden: 1 },
        { id: 'notificaciones', nombre: 'Notificaciones', icono: 'bx bx-bell', ruta: './notificaciones', activo: true, orden: 2 },
        { id: 'requerimientos', nombre: 'Requerimientos', icono: 'icon icon-stack', ruta: './requerimientos', activo: true, orden: 3 },
        { id: 'solicitudes-compra', nombre: 'Solicitudes de Compra', icono: 'bx bx-shopping-bag', ruta: './solicitudes-compra', activo: true, orden: 4 },
        { id: 'ordenes-compra', nombre: 'Órdenes de Compra', icono: 'icon icon-file-text', ruta: './ordenes-compra', activo: true, orden: 5 },
        { id: 'despachos', nombre: 'Gestión de Despachos', icono: 'icon icon-stack', ruta: './despachos', activo: true, orden: 6 },
        { id: 'aprobaciones-oc', nombre: 'Aprobación OC', icono: 'icon icon-file-check', ruta: './aprobaciones-oc', activo: true, orden: 7 },
        { id: 'reportes-compras', nombre: 'Reportes Avanzados', icono: 'icon icon-pie-chart', ruta: './reportes-compras', activo: true, orden: 8 },
      ]
    }
  ],
  list: [
    {
      id: 'list-modulos', label: 'Módulos', icono: 'bx bx-list-ul', activo: true, orden: 1, tipo: 'list',
      items: [
        { id: 'dashboard-oplogist', nombre: 'Mi Dashboard', icono: 'bx bx-user-check', ruta: './dashboard-oplogist', activo: true, orden: 1 },
        { id: 'requerimientos', nombre: 'Requerimientos', icono: 'icon icon-stack', ruta: './requerimientos', activo: true, orden: 2 },
        { id: 'saldo-requerimiento', nombre: 'Saldo de Requerimiento', icono: 'icon icon-balance', ruta: './saldo-requerimiento', activo: true, orden: 3 },
        { id: 'solicitudes-compra', nombre: 'Solicitudes de Compra', icono: 'bx bx-shopping-bag', ruta: './solicitudes-compra', activo: true, orden: 4 },
        { id: 'ordenes-compra', nombre: 'Órdenes de Compra', icono: 'icon icon-file-text', ruta: './ordenes-compra', activo: true, orden: 5 },
        { id: 'despachos', nombre: 'Gestión de Despachos', icono: 'icon icon-stack', ruta: './despachos', activo: true, orden: 6 },
      ]
    }
  ],
  default: [
    {
      id: 'default-panel', label: 'Mi Panel', icono: 'bx bxs-dashboard', activo: true, orden: 1,
      items: [
        { id: 'dashboard-oplogist', nombre: 'Mi Dashboard', icono: 'bx bx-user-check', ruta: './dashboard-oplogist', activo: true, orden: 1 },
      ]
    },
    {
      id: 'default-operaciones', label: 'Operaciones', icono: 'bx bx-briefcase-alt-2', activo: true, orden: 2,
      items: [
        { id: 'requerimientos', nombre: 'Requerimientos', icono: 'icon icon-stack', ruta: './requerimientos', activo: true, orden: 1 },
        { id: 'solicitudes-compra', nombre: 'Solicitudes de Compra', icono: 'bx bx-shopping-bag', ruta: './solicitudes-compra', activo: true, orden: 2 },
        { id: 'ordenes-compra', nombre: 'Órdenes de Compra', icono: 'icon icon-file-text', ruta: './ordenes-compra', activo: true, orden: 3 },
      ]
    },
    {
      id: 'default-reportes', label: 'Reportes', icono: 'icon icon-pie-chart', activo: true, orden: 3,
      items: [
        { id: 'reportes-compras', nombre: 'Reportes Avanzados', icono: 'icon icon-pie-chart', ruta: './reportes-compras', activo: true, orden: 1 },
      ]
    }
  ]
};

@Component({
  selector: 'app-admin-plantillas-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DynamicMenuComponent],
  template: `
    <div class="plantillas-container">

      <!-- Header -->
      <div class="page-header">
        <div class="page-header-left">
          <h4 class="page-title"><i class='bx bx-customize'></i> Plantillas de Menú</h4>
          <p class="page-subtitle">Crea, configura y guarda tipos de menú personalizados arrastrando elementos.</p>
        </div>
        <div class="page-header-right">
          <button class="btn-nuevo-tipo" (click)="abrirFormNuevoTipo()">
            <i class='bx bx-category-alt'></i> Nuevo Tipo
          </button>
          <button class="btn-nueva-plantilla" (click)="nuevaPlantilla()">
            <i class='bx bx-plus'></i> Nueva Plantilla
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab-btn" [class.active]="tabActivo === 'tipos'" (click)="tabActivo = 'tipos'">
          <i class='bx bx-layout'></i> Tipos de Menú
        </button>
        <button class="tab-btn" [class.active]="tabActivo === 'plantillas'" (click)="tabActivo = 'plantillas'">
          <i class='bx bx-collection'></i> Mis Plantillas
        </button>
        <button class="tab-btn" [class.active]="tabActivo === 'editor'" (click)="tabActivo = 'editor'">
          <i class='bx bx-edit-alt'></i> Editor Drag & Drop
        </button>
        <button class="tab-btn" [class.active]="tabActivo === 'roles'" (click)="irTabRoles()">
          <i class='bx bx-user-pin'></i> Menú por Rol
        </button>
      </div>

      <!-- ═══════ TAB: TIPOS DE MENÚ ═══════ -->
      @if (tabActivo === 'tipos') {

        <!-- Formulario nuevo tipo -->
        @if (formNuevoTipoVisible) {
          <div class="form-nuevo-tipo">
            <h6 class="form-title"><i class='bx bx-category-alt'></i> Crear Nuevo Tipo de Menú</h6>
            <div class="form-nuevo-tipo-fields">
              <div class="config-field">
                <label>Identificador (sin espacios):</label>
                <input type="text" [(ngModel)]="nuevoTipo.value" class="input-config" placeholder="ej: mega-menu">
              </div>
              <div class="config-field">
                <label>Nombre visible:</label>
                <input type="text" [(ngModel)]="nuevoTipo.label" class="input-config" placeholder="ej: Mega Menú">
              </div>
              <div class="config-field">
                <label>Icono (clase):</label>
                <input type="text" [(ngModel)]="nuevoTipo.icono" class="input-config" placeholder="bx bx-...">
              </div>
              <div class="config-field">
                <label>Color:</label>
                <input type="color" [(ngModel)]="nuevoTipo.color" class="input-color">
              </div>
              <div class="config-field flex-1">
                <label>Descripción:</label>
                <input type="text" [(ngModel)]="nuevoTipo.descripcion" class="input-config" placeholder="Descripción del tipo...">
              </div>
            </div>
            <div class="form-nuevo-tipo-actions">
              <button class="btn-cancelar-modal" (click)="formNuevoTipoVisible = false">Cancelar</button>
              <button class="btn-confirmar-modal" (click)="guardarNuevoTipo()">
                <i class='bx bx-save'></i> Guardar Tipo
              </button>
            </div>
          </div>
        }

        <div class="tipos-menu-grid">
          @for (tipo of tiposMenuList; track tipo.value) {
            <div class="tipo-menu-card" [class.selected]="tipoSeleccionado === tipo.value" (click)="tipoSeleccionado = tipo.value">
              <div class="tipo-card-header">
                <div class="tipo-icon-badge" [style.background]="tipo.color + '18'" [style.color]="tipo.color">
                  <i [class]="tipo.icono"></i>
                </div>
                <div class="tipo-info">
                  <h6 class="tipo-nombre">{{ tipo.label }}</h6>
                  <p class="tipo-desc">{{ tipo.descripcion }}</p>
                </div>
                @if (tipo.esCustom) {
                  <button class="btn-icon danger" title="Eliminar tipo" (click)="eliminarTipoCustom(tipo); $event.stopPropagation()">
                    <i class='bx bx-trash'></i>
                  </button>
                }
              </div>
              <div class="tipo-card-preview">
                <app-dynamic-menu
                  [menuType]="getTipoMenuValue(tipo.value)"
                  [menuGroups]="getPlantillaPorTipo(tipo.value)"
                  [contadorNotificaciones]="2">
                </app-dynamic-menu>
              </div>
              <div class="tipo-card-footer">
                <button class="btn-editar-tipo" (click)="editarPlantillaTipo(tipo); $event.stopPropagation()">
                  <i class='bx bx-edit'></i> Editar
                </button>
                <button class="btn-usar-base" (click)="usarTipoComoBase(tipo.value); $event.stopPropagation()">
                  <i class='bx bx-plus-circle'></i> Usar como base
                </button>
                <button class="btn-aplicar-tipo" (click)="aplicarTipoARol(tipo.value); $event.stopPropagation()">
                  <i class='bx bx-user-check'></i> Aplicar a rol
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ═══════ TAB: MIS PLANTILLAS ═══════ -->
      @if (tabActivo === 'plantillas') {
        <div class="plantillas-grid">
          @if (plantillas().length === 0) {
            <div class="empty-state">
              <i class='bx bx-folder-open'></i>
              <p>No hay plantillas guardadas.</p>
              <button class="btn-crear" (click)="nuevaPlantilla()">
                <i class='bx bx-plus'></i> Crear primera plantilla
              </button>
            </div>
          }
          @for (p of plantillas(); track p.id) {
            <div class="plantilla-card" [class.inactiva]="!p.activo">
              <div class="plantilla-card-header">
                <span class="plantilla-tipo-badge">{{ p.tipoMenu }}</span>
                <div class="plantilla-actions">
                  <button class="btn-icon" title="Editar" (click)="editarPlantilla(p)"><i class='bx bx-edit'></i></button>
                  <button class="btn-icon" title="Duplicar" (click)="duplicarPlantilla(p)"><i class='bx bx-copy'></i></button>
                  <button class="btn-icon danger" title="Eliminar" (click)="eliminarPlantilla(p)"><i class='bx bx-trash'></i></button>
                </div>
              </div>
              <div class="plantilla-card-body">
                <h6 class="plantilla-nombre">{{ p.nombre }}</h6>
                <p class="plantilla-desc">{{ p.descripcion || 'Sin descripción' }}</p>
                <div class="plantilla-meta">
                  <span><i class='bx bx-layer'></i> {{ p.grupos.length }} grupos</span>
                  <span><i class='bx bx-calendar'></i> {{ p.fechaCreacion | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
              <div class="plantilla-card-footer">
                <button class="btn-aplicar" (click)="aplicarPlantilla(p)">
                  <i class='bx bx-check'></i> Aplicar a rol
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ═══════ TAB: EDITOR DRAG & DROP ═══════ -->
      @if (tabActivo === 'editor') {
        <div class="editor-wrapper">

          <!-- Barra de configuración de la plantilla -->
          <div class="editor-config-bar">
            <div class="config-field">
              <label>Nombre:</label>
              <input type="text" [(ngModel)]="editorPlantilla.nombre" class="input-config" placeholder="Nombre de la plantilla">
            </div>
            <div class="config-field">
              <label>Tipo:</label>
              <select [(ngModel)]="editorPlantilla.tipoMenu" class="select-config">
                <option value="accordion">Accordion</option>
                <option value="nav">Nav</option>
                <option value="list">List</option>
                <option value="default">Default</option>
              </select>
            </div>
            <div class="config-field flex-1">
              <label>Descripción:</label>
              <input type="text" [(ngModel)]="editorPlantilla.descripcion" class="input-config" placeholder="Descripción breve...">
            </div>
            <button class="btn-guardar-plantilla" (click)="guardarPlantilla()" [disabled]="guardando()">
              @if (guardando()) { <i class='bx bx-loader-alt bx-spin'></i> }
              @else { <i class='bx bx-save'></i> }
              Guardar
            </button>
          </div>

          <div class="editor-panels">
            <!-- Panel izquierdo: Paleta de elementos -->
            <div class="paleta-panel">
              <h6 class="paleta-title"><i class='bx bx-grid-alt'></i> Paleta de Elementos</h6>
              <p class="paleta-hint">Arrastra grupos o items al área de construcción</p>

              <!-- Buscar en paleta -->
              <input type="text" [(ngModel)]="busquedaPaleta" class="input-buscar-paleta" placeholder="Buscar...">

              <div class="paleta-section">
                <span class="paleta-section-title">Grupos (secciones)</span>
                <div class="paleta-items">
                  @for (g of gruposPaletaFiltrados(); track g.id) {
                    <div class="paleta-item grupo-item"
                         draggable="true"
                         (dragstart)="onDragStartPaleta($event, g)">
                      <i [class]="g.icono"></i>
                      <span>{{ g.nombre }}</span>
                      <i class='bx bx-move drag-handle'></i>
                    </div>
                  }
                </div>
              </div>

              <div class="paleta-section">
                <span class="paleta-section-title">Items (módulos)</span>
                <div class="paleta-items">
                  @for (item of itemsPaletaFiltrados(); track item.id) {
                    <div class="paleta-item item-item"
                         draggable="true"
                         (dragstart)="onDragStartPaleta($event, item)">
                      <i [class]="item.icono"></i>
                      <span>{{ item.nombre }}</span>
                      <i class='bx bx-move drag-handle'></i>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Panel central: Área de construcción -->
            <div class="builder-panel">
              <h6 class="builder-title"><i class='bx bx-layer'></i> Estructura del Menú</h6>

              @if (editorPlantilla.grupos.length === 0) {
                <div class="drop-zone-empty"
                     (dragover)="onDragOver($event)"
                     (drop)="onDropZonaVacia($event)">
                  <i class='bx bx-target-lock'></i>
                  <p>Arrastra un <b>grupo</b> aquí para empezar</p>
                </div>
              }

              <div class="builder-grupos"
                   (dragover)="onDragOver($event)"
                   (drop)="onDropZonaVacia($event)">
                @for (grupo of editorPlantilla.grupos; track grupo.id; let gi = $index) {
                  <div class="builder-grupo"
                       [class.drag-over]="dragOverGrupoIdx === gi"
                       draggable="true"
                       (dragstart)="onDragStartGrupo($event, gi)"
                       (dragover)="onDragOverGrupo($event, gi)"
                       (dragleave)="onDragLeaveGrupo()"
                       (drop)="onDropGrupo($event, gi)">

                    <div class="builder-grupo-header">
                      <i class='bx bx-dots-vertical-rounded drag-grip'></i>
                      <span class="grupo-icon-preview"><i [class]="grupo.icono"></i></span>
                      <input type="text" [(ngModel)]="grupo.label" class="input-grupo-nombre" placeholder="Nombre del grupo">
                      <input type="text" [(ngModel)]="grupo.icono" class="input-grupo-icono" placeholder="bx bx-...">
                      <div class="builder-grupo-actions">
                        <button class="btn-mini" title="Subir" (click)="moverGrupoBuilder(gi, -1)" [disabled]="gi === 0">
                          <i class='bx bx-chevron-up'></i>
                        </button>
                        <button class="btn-mini" title="Bajar" (click)="moverGrupoBuilder(gi, 1)" [disabled]="gi === editorPlantilla.grupos.length - 1">
                          <i class='bx bx-chevron-down'></i>
                        </button>
                        <button class="btn-mini danger" title="Eliminar grupo" (click)="eliminarGrupoBuilder(gi)">
                          <i class='bx bx-x'></i>
                        </button>
                      </div>
                    </div>

                    <div class="builder-grupo-items"
                         (dragover)="onDragOverItems($event, gi)"
                         (drop)="onDropItem($event, gi)">
                      @if (grupo.items.length === 0) {
                        <div class="drop-hint-items">
                          <small>Arrastra items aquí</small>
                        </div>
                      }
                      @for (item of grupo.items; track item.id; let ii = $index) {
                        <div class="builder-item"
                             draggable="true"
                             (dragstart)="onDragStartItem($event, gi, ii)"
                             [class.drag-over-item]="dragOverItemIdx?.gi === gi && dragOverItemIdx?.ii === ii">
                          <i class='bx bx-dots-vertical-rounded drag-grip-sm'></i>
                          <span class="builder-item-icon"><i [class]="item.icono"></i></span>
                          <span class="builder-item-nombre">{{ item.nombre }}</span>
                          <code class="builder-item-ruta">{{ item.ruta }}</code>
                          <button class="btn-mini-xs danger" (click)="eliminarItemBuilder(gi, ii)" title="Quitar">
                            <i class='bx bx-x'></i>
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Panel derecho: Preview -->
            <div class="preview-panel">
              <h6 class="preview-title"><i class='bx bx-show'></i> Preview</h6>
              <div class="preview-sidebar-mock">
                <div class="preview-user-area">
                  <i class='bx bx-user-circle'></i>
                  <span>Usuario Preview</span>
                </div>
                <div class="preview-menu-area">
                  <app-dynamic-menu
                    [menuType]="editorPlantilla.tipoMenu"
                    [menuGroups]="editorPlantilla.grupos"
                    [contadorNotificaciones]="2">
                  </app-dynamic-menu>
                </div>
              </div>
            </div>
          </div>

        </div>
      }

      <!-- ═══════ TAB: MENÚ POR ROL ═══════ -->
      @if (tabActivo === 'roles') {
        <div class="roles-tab-wrapper">

          <div class="roles-tab-header">
            <div>
              <h5 class="roles-tab-title"><i class='bx bx-user-pin'></i> Configuración de Menú por Rol</h5>
              <p class="roles-tab-subtitle">Visualiza y asigna el menú dinámico para cada rol del sistema.</p>
            </div>
            <button class="btn-recargar" (click)="cargarConfigRoles()" [disabled]="cargandoRoles()">
              @if (cargandoRoles()) { <i class='bx bx-loader-alt bx-spin'></i> }
              @else { <i class='bx bx-refresh'></i> }
              Recargar
            </button>
          </div>

          <div class="roles-accordion">
            @for (rol of rolesDisponibles; track rol.id) {
              <div class="rol-acordion-item" [class.open]="rolAcordionAbierto === rol.id">

                <!-- Header del acordion del rol -->
                <div class="rol-acordion-header" (click)="toggleRolAcordion(rol.id)">
                  <div class="rol-header-left">
                    <span class="rol-badge" [class]="getRolBadgeClass(rol.id)">{{ rol.id }}</span>
                    <div class="rol-info">
                      <span class="rol-nombre">{{ rol.nombre }}</span>
                      <span class="rol-config-badge" [class.tiene-config]="tieneConfigRol(rol.id)">
                        @if (tieneConfigRol(rol.id)) {
                          <i class='bx bx-check-circle'></i> Menú configurado: <strong>{{ getTipoMenuRol(rol.id) }}</strong>
                        } @else {
                          <i class='bx bx-info-circle'></i> Sin configuración personalizada
                        }
                      </span>
                    </div>
                  </div>
                  <div class="rol-header-right">
                    <span class="rol-grupo-count" *ngIf="tieneConfigRol(rol.id)">
                      <i class='bx bx-layer'></i> {{ getGruposRol(rol.id).length }} grupos
                    </span>
                    <i class="bx bx-chevron-down rol-chevron"></i>
                  </div>
                </div>

                <!-- Cuerpo del acordion del rol -->
                @if (rolAcordionAbierto === rol.id) {
                  <div class="rol-acordion-body">

                    <div class="rol-body-grid">

                      <!-- Columna izquierda: preview del menú actual -->
                      <div class="rol-preview-col">
                        <div class="rol-preview-header">
                          <h6><i class='bx bx-show'></i> Menú Actual</h6>
                          @if (!tieneConfigRol(rol.id)) {
                            <span class="badge-sin-config">Usa menú por defecto del sistema</span>
                          }
                        </div>
                        <div class="rol-preview-sidebar">
                          <div class="rol-preview-user">
                            <i class='bx bx-user-circle'></i>
                            <span>{{ rol.nombre }}</span>
                            <code class="rol-preview-id">{{ rol.id }}</code>
                          </div>
                          <div class="rol-preview-menu-area">
                            <app-dynamic-menu
                              [menuType]="getTipoMenuRol(rol.id)"
                              [menuGroups]="getGruposRol(rol.id)"
                              [contadorNotificaciones]="0">
                            </app-dynamic-menu>
                          </div>
                        </div>
                      </div>

                      <!-- Columna derecha: acciones -->
                      <div class="rol-actions-col">
                        <div class="rol-actions-section">
                          <h6 class="rol-actions-title"><i class='bx bx-edit-alt'></i> Editar Menú</h6>
                          <button class="btn-editar-rol" (click)="abrirEditorParaRol(rol.id)">
                            <i class='bx bx-pencil'></i> Abrir editor drag & drop
                          </button>
                          @if (tieneConfigRol(rol.id)) {
                            <button class="btn-resetear-rol" (click)="resetearConfigRol(rol.id)">
                              <i class='bx bx-reset'></i> Resetear a sistema por defecto
                            </button>
                          }
                        </div>

                        <div class="rol-actions-section">
                          <h6 class="rol-actions-title"><i class='bx bx-collection'></i> Aplicar Plantilla Guardada</h6>
                          @if (plantillas().length > 0) {
                            <div class="plantillas-lista-compact">
                              @for (p of plantillas(); track p.id) {
                                @if (p.activo) {
                                  <div class="plantilla-compact-item">
                                    <div class="plantilla-compact-info">
                                      <span class="plantilla-compact-badge">{{ p.tipoMenu }}</span>
                                      <span class="plantilla-compact-nombre">{{ p.nombre }}</span>
                                    </div>
                                    <button class="btn-aplicar-compact" (click)="aplicarPlantillaARol(p, rol.id)" [disabled]="aplicandoRol()">
                                      @if (aplicandoRol() && rolAplicando === rol.id) {
                                        <i class='bx bx-loader-alt bx-spin'></i>
                                      } @else {
                                        <i class='bx bx-check'></i>
                                      }
                                      Aplicar
                                    </button>
                                  </div>
                                }
                              }
                            </div>
                          } @else {
                            <p class="sin-plantillas-hint"><i class='bx bx-info-circle'></i> No hay plantillas guardadas. Crea una desde el Editor.</p>
                          }
                        </div>

                        <div class="rol-actions-section">
                          <h6 class="rol-actions-title"><i class='bx bx-layout'></i> Aplicar Tipo de Menú</h6>
                          <div class="tipos-compact-lista">
                            @for (tipo of tiposMenuDisponibles; track tipo.value) {
                              <button class="btn-tipo-compact" [class.activo]="getTipoMenuRol(rol.id) === tipo.value" (click)="aplicarTipoDirectoARol(tipo.value, rol.id)" [style.border-color]="tipo.color" [disabled]="aplicandoRol()">
                                <i [class]="tipo.icono" [style.color]="tipo.color"></i>
                                <span>{{ tipo.label }}</span>
                              </button>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

        </div>
      }

      <!-- ═══════ MODAL: APLICAR A ROL ═══════ -->
      @if (modalAplicarVisible) {
        <div class="modal-overlay" (click)="cerrarModalAplicar()">
          <div class="modal-aplicar" (click)="$event.stopPropagation()">
            <div class="modal-aplicar-header">
              <h5><i class='bx bx-user-check'></i> Aplicar a Rol</h5>
              <button class="btn-cerrar-modal" (click)="cerrarModalAplicar()"><i class='bx bx-x'></i></button>
            </div>
            <div class="modal-aplicar-body">
              <p class="modal-info-text">
                @if (modalAplicarPlantilla) {
                  Plantilla: <strong>{{ modalAplicarPlantilla.nombre }}</strong> ({{ modalAplicarPlantilla.tipoMenu }})
                } @else if (modalAplicarTipo) {
                  Tipo de menú: <strong>{{ modalAplicarTipo }}</strong>
                }
              </p>
              <label class="modal-label">Seleccione el rol destino:</label>
              <select [(ngModel)]="modalRolSeleccionado" class="modal-select">
                <option value="">-- Seleccionar rol --</option>
                @for (r of rolesDisponibles; track r.id) {
                  <option [value]="r.id">{{ r.id }} — {{ r.nombre }}</option>
                }
              </select>
              @if (modalRolSeleccionado) {
                <div class="modal-warning">
                  <i class='bx bx-info-circle'></i>
                  <span>Se reemplazará la configuración de menú actual del rol <strong>{{ modalRolSeleccionado }}</strong>.</span>
                </div>
              }
            </div>
            <div class="modal-aplicar-footer">
              <button class="btn-cancelar-modal" (click)="cerrarModalAplicar()">Cancelar</button>
              <button class="btn-confirmar-modal" (click)="confirmarAplicar()" [disabled]="!modalRolSeleccionado || aplicandoRol()">
                @if (aplicandoRol()) { <i class='bx bx-loader-alt bx-spin'></i> }
                @else { <i class='bx bx-check'></i> }
                Aplicar
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .plantillas-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
    .page-title { font-size: 18px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; margin: 0 0 4px; }
    .page-subtitle { color: #666; font-size: 13px; margin: 0; }
    .page-header-right { display: flex; gap: 8px; }
    .btn-nueva-plantilla { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #1a73e8; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .btn-nueva-plantilla:hover { background: #1557b0; }
    .btn-nuevo-tipo { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #7b1fa2; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .btn-nuevo-tipo:hover { background: #5c1580; }

    /* Form nuevo tipo */
    .form-nuevo-tipo { background: #fff; border: 2px solid #7b1fa2; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .form-title { margin: 0 0 14px; font-size: 14px; font-weight: 600; color: #7b1fa2; display: flex; align-items: center; gap: 8px; }
    .form-nuevo-tipo-fields { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
    .form-nuevo-tipo-fields .config-field { min-width: 160px; }
    .form-nuevo-tipo-fields .config-field.flex-1 { flex: 1; min-width: 200px; }
    .form-nuevo-tipo-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .input-color { width: 42px; height: 34px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; padding: 2px; }
    .btn-editar-tipo { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 8px 10px; background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.12s; }
    .btn-editar-tipo:hover { background: #ffe0b2; }

    /* Tabs */
    .tabs-bar { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 2px solid #e8e8e8; }
    .tab-btn { padding: 8px 18px; border: none; background: transparent; font-size: 13px; font-weight: 500; color: #666; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .tab-btn:hover { color: #1a73e8; }
    .tab-btn.active { color: #1a73e8; border-bottom-color: #1a73e8; font-weight: 600; }

    /* ═══ Plantillas Grid ═══ */
    .plantillas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #aaa; }
    .empty-state i { font-size: 48px; display: block; margin-bottom: 12px; }
    .btn-crear { margin-top: 12px; padding: 8px 16px; background: #1a73e8; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .plantilla-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; transition: box-shadow 0.15s; }
    .plantilla-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .plantilla-card.inactiva { opacity: 0.55; }
    .plantilla-card-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8f9fa; border-bottom: 1px solid #eee; }
    .plantilla-tipo-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 10px; border-radius: 12px; background: #e8f5e9; color: #2e7d32; }
    .plantilla-actions { display: flex; gap: 4px; }
    .btn-icon { padding: 4px 6px; border: 1px solid #e0e0e0; background: #fff; border-radius: 4px; cursor: pointer; font-size: 14px; color: #555; }
    .btn-icon:hover { background: #f0f0f0; }
    .btn-icon.danger { color: #c62828; }
    .btn-icon.danger:hover { background: #ffebee; }
    .plantilla-card-body { padding: 14px; }
    .plantilla-nombre { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #333; }
    .plantilla-desc { margin: 0 0 10px; font-size: 12px; color: #777; }
    .plantilla-meta { display: flex; gap: 12px; font-size: 11px; color: #999; }
    .plantilla-meta span { display: flex; align-items: center; gap: 4px; }
    .plantilla-card-footer { padding: 10px 14px; border-top: 1px solid #f0f0f0; }
    .btn-aplicar { width: 100%; padding: 6px; background: #e8f0fe; color: #1a73e8; border: 1px solid #c5d8ff; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-aplicar:hover { background: #d2e3fc; }

    /* ═══ Editor ═══ */
    .editor-wrapper { display: flex; flex-direction: column; gap: 16px; }
    .editor-config-bar { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; padding: 14px 16px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; }
    .config-field { display: flex; flex-direction: column; gap: 4px; }
    .config-field label { font-size: 11px; font-weight: 600; color: #555; }
    .config-field.flex-1 { flex: 1; min-width: 180px; }
    .input-config { border: 1px solid #ddd; border-radius: 6px; padding: 7px 10px; font-size: 13px; outline: none; }
    .input-config:focus { border-color: #1a73e8; }
    .select-config { border: 1px solid #ddd; border-radius: 6px; padding: 7px 10px; font-size: 13px; outline: none; cursor: pointer; }
    .btn-guardar-plantilla { display: flex; align-items: center; gap: 6px; padding: 8px 18px; background: #238664; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-guardar-plantilla:disabled { opacity: 0.6; cursor: not-allowed; }

    .editor-panels { display: grid; grid-template-columns: 240px 1fr 260px; gap: 16px; min-height: 500px; }

    /* Paleta */
    .paleta-panel { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; overflow-y: auto; max-height: 650px; }
    .paleta-title { font-size: 13px; font-weight: 600; color: #333; margin: 0 0 4px; display: flex; align-items: center; gap: 6px; }
    .paleta-hint { font-size: 11px; color: #888; margin: 0 0 10px; }
    .input-buscar-paleta { width: 100%; border: 1px solid #e0e0e0; border-radius: 6px; padding: 6px 10px; font-size: 12px; margin-bottom: 12px; outline: none; }
    .paleta-section { margin-bottom: 14px; }
    .paleta-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: 0.5px; display: block; margin-bottom: 6px; }
    .paleta-items { display: flex; flex-direction: column; gap: 4px; }
    .paleta-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border: 1px solid #e8e8e8; border-radius: 6px; font-size: 12px; color: #333; cursor: grab; background: #fff; transition: all 0.12s; user-select: none; }
    .paleta-item:hover { background: #f0f7ff; border-color: #90caf9; }
    .paleta-item:active { cursor: grabbing; }
    .paleta-item i:first-child { font-size: 14px; color: #555; min-width: 18px; text-align: center; }
    .paleta-item span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .drag-handle { font-size: 12px; color: #bbb; }
    .grupo-item { border-left: 3px solid #1a73e8; }
    .item-item { border-left: 3px solid #43a047; }

    /* Builder */
    .builder-panel { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; overflow-y: auto; max-height: 650px; }
    .builder-title { font-size: 13px; font-weight: 600; color: #333; margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
    .drop-zone-empty { border: 2px dashed #bbb; border-radius: 10px; padding: 60px 20px; text-align: center; color: #999; transition: all 0.15s; }
    .drop-zone-empty.drag-active { border-color: #1a73e8; background: #e8f0fe; }
    .drop-zone-empty i { font-size: 36px; display: block; margin-bottom: 8px; }
    .builder-grupos { display: flex; flex-direction: column; gap: 10px; min-height: 100px; }
    .builder-grupo { border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; overflow: hidden; transition: box-shadow 0.12s; }
    .builder-grupo.drag-over { box-shadow: 0 0 0 2px #1a73e8; }
    .builder-grupo-header { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #f0f4ff; border-bottom: 1px solid #e0e0e0; cursor: grab; }
    .drag-grip { font-size: 16px; color: #aaa; cursor: grab; }
    .drag-grip-sm { font-size: 13px; color: #ccc; cursor: grab; }
    .grupo-icon-preview { font-size: 15px; color: #555; }
    .input-grupo-nombre { border: 1px solid #ddd; border-radius: 4px; padding: 4px 8px; font-size: 12px; font-weight: 600; flex: 1; min-width: 100px; }
    .input-grupo-icono { border: 1px solid #ddd; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-family: monospace; width: 120px; color: #555; }
    .builder-grupo-actions { display: flex; gap: 2px; margin-left: auto; }
    .btn-mini { padding: 3px 5px; border: 1px solid #ddd; background: #fff; border-radius: 4px; cursor: pointer; font-size: 12px; color: #555; }
    .btn-mini:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-mini.danger { color: #c62828; border-color: #ffcdd2; }
    .btn-mini.danger:hover { background: #ffebee; }
    .btn-mini-xs { padding: 2px 4px; border: none; background: transparent; cursor: pointer; font-size: 13px; color: #999; }
    .btn-mini-xs.danger:hover { color: #c62828; }
    .builder-grupo-items { padding: 6px 8px; min-height: 36px; }
    .drop-hint-items { text-align: center; padding: 10px; color: #bbb; border: 1px dashed #ddd; border-radius: 6px; font-size: 11px; }
    .builder-item { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border: 1px solid #eee; border-radius: 5px; margin-bottom: 3px; background: #fff; cursor: grab; font-size: 12px; transition: background 0.1s; }
    .builder-item:hover { background: #f8f9fa; }
    .builder-item.drag-over-item { box-shadow: 0 0 0 2px #43a047; }
    .builder-item-icon { font-size: 13px; color: #666; min-width: 16px; }
    .builder-item-nombre { flex: 1; color: #333; }
    .builder-item-ruta { font-size: 10px; color: #888; background: #f5f5f5; padding: 1px 5px; border-radius: 3px; }

    /* Preview */
    .preview-panel { display: flex; flex-direction: column; gap: 8px; }
    .preview-title { font-size: 13px; font-weight: 600; color: #333; margin: 0; display: flex; align-items: center; gap: 6px; }
    .preview-sidebar-mock { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; flex: 1; max-height: 600px; overflow-y: auto; }
    .preview-user-area { background: #238664; padding: 16px 12px; display: flex; align-items: center; gap: 8px; color: #fff; font-size: 13px; }
    .preview-user-area i { font-size: 28px; opacity: 0.8; }
    .preview-menu-area { padding: 4px 0; background: #f8f9fa; min-height: 200px; }
    .preview-menu-area ::ng-deep .dm-group-header,
    .preview-menu-area ::ng-deep .dm-icon,
    .preview-menu-area ::ng-deep .dm-label,
    .preview-menu-area ::ng-deep .dm-arrow,
    .preview-menu-area ::ng-deep .dm-item-link,
    .preview-menu-area ::ng-deep .dm-item-link i,
    .preview-menu-area ::ng-deep .dm-item-link span.hide-menu,
    .preview-menu-area ::ng-deep .dm-nav-link,
    .preview-menu-area ::ng-deep .dm-nav-link i,
    .preview-menu-area ::ng-deep .dm-list-link,
    .preview-menu-area ::ng-deep .dm-list-link i,
    .preview-menu-area ::ng-deep .dm-submenu-toggle { color: #333 !important; }
    .preview-menu-area ::ng-deep .dm-item-link:hover,
    .preview-menu-area ::ng-deep .dm-nav-link:hover,
    .preview-menu-area ::ng-deep .dm-list-link:hover { background: rgba(0,0,0,0.06); }

    /* ═══ Tipos de Menú ═══ */
    .tipos-menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .tipo-menu-card { background: #fff; border: 2px solid #e0e0e0; border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.2s; }
    .tipo-menu-card:hover { border-color: #90caf9; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .tipo-menu-card.selected { border-color: #1a73e8; box-shadow: 0 0 0 3px rgba(26,115,232,0.15); }
    .tipo-card-header { display: flex; align-items: flex-start; gap: 12px; padding: 16px 16px 12px; }
    .tipo-icon-badge { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .tipo-info { flex: 1; }
    .tipo-nombre { margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #333; }
    .tipo-desc { margin: 0; font-size: 12px; color: #666; line-height: 1.4; }
    .tipo-card-preview { background: #f8f9fa; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 8px 0; max-height: 220px; overflow-y: auto; }
    .tipo-card-preview ::ng-deep .dm-group-header,
    .tipo-card-preview ::ng-deep .dm-icon,
    .tipo-card-preview ::ng-deep .dm-label,
    .tipo-card-preview ::ng-deep .dm-arrow,
    .tipo-card-preview ::ng-deep .dm-item-link,
    .tipo-card-preview ::ng-deep .dm-item-link i,
    .tipo-card-preview ::ng-deep .dm-item-link span.hide-menu,
    .tipo-card-preview ::ng-deep .dm-nav-link,
    .tipo-card-preview ::ng-deep .dm-nav-link i,
    .tipo-card-preview ::ng-deep .dm-list-link,
    .tipo-card-preview ::ng-deep .dm-list-link i,
    .tipo-card-preview ::ng-deep .dm-submenu-toggle { color: #333 !important; font-size: 12px; }
    .tipo-card-preview ::ng-deep .dm-item-link:hover,
    .tipo-card-preview ::ng-deep .dm-nav-link:hover,
    .tipo-card-preview ::ng-deep .dm-list-link:hover { background: rgba(0,0,0,0.05); }
    .tipo-card-footer { display: flex; gap: 8px; padding: 12px 16px; }
    .btn-usar-base { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; background: #e8f0fe; color: #1a73e8; border: 1px solid #c5d8ff; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.12s; }
    .btn-usar-base:hover { background: #d2e3fc; }
    .btn-aplicar-tipo { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.12s; }
    .btn-aplicar-tipo:hover { background: #c8e6c9; }

    /* ═══ Modal Aplicar a Rol ═══ */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1050; animation: fadeIn 0.15s; }
    .modal-aplicar { background: #fff; border-radius: 12px; width: 440px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: slideUp 0.2s; }
    .modal-aplicar-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; }
    .modal-aplicar-header h5 { margin: 0; font-size: 15px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; }
    .btn-cerrar-modal { border: none; background: transparent; font-size: 20px; color: #999; cursor: pointer; padding: 4px; }
    .btn-cerrar-modal:hover { color: #333; }
    .modal-aplicar-body { padding: 20px; }
    .modal-info-text { font-size: 13px; color: #555; margin: 0 0 16px; padding: 10px 12px; background: #f0f7ff; border-radius: 6px; border-left: 3px solid #1a73e8; }
    .modal-label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 6px; }
    .modal-select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; outline: none; cursor: pointer; appearance: auto; }
    .modal-select:focus { border-color: #1a73e8; box-shadow: 0 0 0 3px rgba(26,115,232,0.1); }
    .modal-warning { display: flex; align-items: flex-start; gap: 8px; margin-top: 14px; padding: 10px 12px; background: #fff3e0; border-radius: 6px; font-size: 12px; color: #e65100; border: 1px solid #ffe0b2; }
    .modal-warning i { font-size: 16px; margin-top: 1px; flex-shrink: 0; }
    .modal-aplicar-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid #eee; }
    .btn-cancelar-modal { padding: 8px 18px; background: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .btn-cancelar-modal:hover { background: #e0e0e0; }
    .btn-confirmar-modal { display: flex; align-items: center; gap: 6px; padding: 8px 20px; background: #1a73e8; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-confirmar-modal:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-confirmar-modal:not(:disabled):hover { background: #1557b0; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* ═══ Tab Roles ═══ */
    .roles-tab-wrapper { display: flex; flex-direction: column; gap: 16px; }
    .roles-tab-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; padding: 0 0 8px; border-bottom: 1px solid #eee; margin-bottom: 4px; }
    .roles-tab-title { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #333; display: flex; align-items: center; gap: 8px; }
    .roles-tab-subtitle { margin: 0; font-size: 12px; color: #777; }
    .btn-recargar { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f0f4ff; color: #1a73e8; border: 1px solid #c5d8ff; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-recargar:hover:not(:disabled) { background: #d2e3fc; }
    .btn-recargar:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Acordion de roles */
    .roles-accordion { display: flex; flex-direction: column; gap: 8px; }
    .rol-acordion-item { background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; transition: box-shadow 0.15s; }
    .rol-acordion-item.open { border-color: #1a73e8; box-shadow: 0 2px 12px rgba(26,115,232,0.1); }
    .rol-acordion-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; background: #fafafa; transition: background 0.12s; user-select: none; }
    .rol-acordion-header:hover { background: #f0f4ff; }
    .rol-acordion-item.open .rol-acordion-header { background: #f0f4ff; border-bottom: 1px solid #e0e8ff; }
    .rol-header-left { display: flex; align-items: center; gap: 12px; }
    .rol-header-right { display: flex; align-items: center; gap: 10px; }
    .rol-info { display: flex; flex-direction: column; gap: 3px; }
    .rol-nombre { font-size: 14px; font-weight: 600; color: #333; }
    .rol-config-badge { font-size: 11px; display: flex; align-items: center; gap: 4px; color: #999; }
    .rol-config-badge.tiene-config { color: #2e7d32; }
    .rol-grupo-count { font-size: 11px; color: #888; display: flex; align-items: center; gap: 4px; }
    .rol-chevron { font-size: 18px; color: #aaa; transition: transform 0.2s; }
    .rol-acordion-item.open .rol-chevron { transform: rotate(180deg); color: #1a73e8; }

    /* Badges de rol */
    .rol-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    .rol-badge-ti { background: #1a237e; color: #fff; }
    .rol-badge-admin { background: #4a148c; color: #fff; }
    .rol-badge-jefe { background: #0d47a1; color: #fff; }
    .rol-badge-op { background: #006064; color: #fff; }
    .rol-badge-campo { background: #e65100; color: #fff; }
    .rol-badge-almacen { background: #1b5e20; color: #fff; }
    .rol-badge-aprobador { background: #880e4f; color: #fff; }
    .rol-badge-finanzas { background: #b71c1c; color: #fff; }
    .rol-badge-gerente { background: #37474f; color: #fff; }
    .rol-badge-default { background: #616161; color: #fff; }

    /* Cuerpo del acordion */
    .rol-acordion-body { padding: 16px; animation: slideDown 0.18s ease; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .rol-body-grid { display: grid; grid-template-columns: 260px 1fr; gap: 20px; }

    /* Preview col */
    .rol-preview-col { display: flex; flex-direction: column; gap: 8px; }
    .rol-preview-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
    .rol-preview-header h6 { margin: 0; font-size: 13px; font-weight: 600; color: #555; display: flex; align-items: center; gap: 6px; }
    .badge-sin-config { font-size: 10px; padding: 2px 8px; background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; border-radius: 10px; }
    .rol-preview-sidebar { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; max-height: 360px; overflow-y: auto; }
    .rol-preview-user { background: #1565c0; padding: 12px 10px; display: flex; align-items: center; gap: 8px; color: #fff; font-size: 12px; }
    .rol-preview-user i { font-size: 22px; opacity: 0.9; }
    .rol-preview-id { font-size: 9px; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; color: #fff; margin-left: auto; font-weight: 700; }
    .rol-preview-menu-area { padding: 4px 0; background: #f8f9fa; min-height: 100px; }
    .rol-preview-menu-area ::ng-deep .dm-group-header,
    .rol-preview-menu-area ::ng-deep .dm-icon,
    .rol-preview-menu-area ::ng-deep .dm-label,
    .rol-preview-menu-area ::ng-deep .dm-arrow,
    .rol-preview-menu-area ::ng-deep .dm-item-link,
    .rol-preview-menu-area ::ng-deep .dm-item-link i,
    .rol-preview-menu-area ::ng-deep .dm-item-link span.hide-menu,
    .rol-preview-menu-area ::ng-deep .dm-nav-link,
    .rol-preview-menu-area ::ng-deep .dm-nav-link i,
    .rol-preview-menu-area ::ng-deep .dm-list-link,
    .rol-preview-menu-area ::ng-deep .dm-list-link i { color: #333 !important; font-size: 12px; }

    /* Acciones col */
    .rol-actions-col { display: flex; flex-direction: column; gap: 16px; }
    .rol-actions-section { background: #f8f9fa; border: 1px solid #eee; border-radius: 8px; padding: 12px 14px; }
    .rol-actions-title { margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #555; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.4px; }
    .btn-editar-rol { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; background: #1a73e8; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.12s; }
    .btn-editar-rol:hover { background: #1557b0; }
    .btn-resetear-rol { width: 100%; margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; background: #fff; color: #c62828; border: 1px solid #ffcdd2; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.12s; }
    .btn-resetear-rol:hover { background: #ffebee; }

    /* Plantillas compactas */
    .plantillas-lista-compact { display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; }
    .plantilla-compact-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 10px; background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; }
    .plantilla-compact-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    .plantilla-compact-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 10px; background: #e8f5e9; color: #2e7d32; white-space: nowrap; flex-shrink: 0; }
    .plantilla-compact-nombre { font-size: 12px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .btn-aplicar-compact { display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
    .btn-aplicar-compact:hover:not(:disabled) { background: #c8e6c9; }
    .btn-aplicar-compact:disabled { opacity: 0.5; cursor: not-allowed; }
    .sin-plantillas-hint { font-size: 12px; color: #aaa; display: flex; align-items: center; gap: 6px; margin: 0; }

    /* Tipos compactos */
    .tipos-compact-lista { display: flex; flex-wrap: wrap; gap: 6px; }
    .btn-tipo-compact { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: #fff; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 12px; font-weight: 500; color: #555; cursor: pointer; transition: all 0.12s; }
    .btn-tipo-compact:hover:not(:disabled) { background: #f0f4ff; }
    .btn-tipo-compact.activo { background: #f0f4ff; font-weight: 700; }
    .btn-tipo-compact:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 1100px) {
      .editor-panels { grid-template-columns: 1fr; }
      .paleta-panel { max-height: 300px; }
      .tipos-menu-grid { grid-template-columns: 1fr; }
      .rol-body-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminPlantillasMenuComponent {
  private readonly http = inject(HttpClient);
  private readonly alertService = inject(AlertService);
  private readonly layoutConfig = inject(LayoutConfigService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly baseUrl = environment.baseUrl;
  private readonly adminUser = JSON.parse(localStorage.getItem('ADMIN_USER') || '{}');

  tabActivo: 'tipos' | 'plantillas' | 'editor' | 'roles' = 'tipos';
  plantillas = signal<PlantillaMenu[]>([]);
  guardando = signal(false);
  busquedaPaleta = '';

  // Tipos de Menú
  tipoSeleccionado = '';
  tiposMenuList: TipoMenuCustom[] = [];
  readonly tiposMenuDisponibles: TipoMenuCustom[] = [
    { value: 'accordion', label: 'Accordion', icono: 'bx bx-list-minus', descripcion: 'Grupos colapsables con items dentro. Ideal para muchos módulos organizados por categoría.', color: '#1a73e8', esCustom: false },
    { value: 'nav', label: 'Nav (Vertical)', icono: 'bx bx-menu', descripcion: 'Menú vertical con submenús desplegables. Estilo navegación clásica.', color: '#7b1fa2', esCustom: false },
    { value: 'list', label: 'List (Plana)', icono: 'bx bx-list-ul', descripcion: 'Lista plana de items sin agrupación. Simple y directo, ideal para pocos módulos.', color: '#e65100', esCustom: false },
    { value: 'default', label: 'Default (Tradicional)', icono: 'bx bx-sidebar', descripcion: 'Menú tradicional del sistema por roles. Estructura fija, no personalizable.', color: '#2e7d32', esCustom: false },
  ];

  // Nuevo Tipo Form
  formNuevoTipoVisible = false;
  nuevoTipo: TipoMenuCustom = { value: '', label: '', icono: 'bx bx-menu', descripcion: '', color: '#1a73e8', esCustom: true };
  tiposCustom = signal<TipoMenuCustom[]>([]);

  // Editor
  editorPlantilla: PlantillaMenu = this.crearPlantillaVacia();

  // Editor — cuando viene de 'abrirEditorParaRol', guardar directo al rol
  _rolEditorDestino: string | null = null;

  // Drag state
  private dragData: { tipo: 'paleta-grupo' | 'paleta-item' | 'builder-grupo' | 'builder-item'; payload: any } | null = null;
  dragOverGrupoIdx: number | null = null;
  dragOverItemIdx: { gi: number; ii: number } | null = null;

  // Modal Aplicar a Rol
  modalAplicarVisible = false;
  modalAplicarPlantilla: PlantillaMenu | null = null;
  modalAplicarTipo: MenuType | null = null;
  modalRolSeleccionado = '';
  aplicandoRol = signal(false);

  // Tab Roles
  rolAcordionAbierto: string | null = null;
  cargandoRoles = signal(false);
  configsRolCargadas = signal<Map<string, { tipoMenu: MenuType; grupos: AccordionGroupConfig[] }>>(new Map());
  rolAplicando: string | null = null;
  readonly rolesDisponibles = [
    { id: 'TILOGIST', nombre: 'Admin Sistema' },
    { id: 'ADLOGIST', nombre: 'Admin Logística' },
    { id: 'JLOLOGIST', nombre: 'Jefe/Coord. Logística' },
    { id: 'JEMLOGIST', nombre: 'Jefe Licitaciones' },
    { id: 'LOLOGIST', nombre: 'Operador Logística' },
    { id: 'EMLOGIST', nombre: 'Operador Licitaciones' },
    { id: 'OPLOGIST', nombre: 'Operativo campo' },
    { id: 'ALLOGIST', nombre: 'Almacén' },
    { id: 'APLOGIST', nombre: 'Aprobador consumo' },
    { id: 'FINANZAS', nombre: 'Finanzas' },
    { id: 'GERENTE', nombre: 'Gerente' },
  ];

  constructor() {
    this.cargarTiposCustom();
    this.cargarPlantillas();
  }

  // ══════════════════════════════════════════════
  // TAB: MENÚ POR ROL
  // ══════════════════════════════════════════════

  irTabRoles() {
    this.tabActivo = 'roles';
    this.cargarConfigRoles();
    this.cdr.markForCheck();
  }

  async cargarConfigRoles() {
    this.cargandoRoles.set(true);
    try {
      await this.layoutConfig.cargar();
      const mapa = new Map<string, { tipoMenu: MenuType; grupos: AccordionGroupConfig[] }>();
      for (const rol of this.rolesDisponibles) {
        const config = this.layoutConfig.getMenuConfig(rol.id);
        if (config && (config.menuConfig?.length || config.usaAccordion)) {
          mapa.set(rol.id, {
            tipoMenu: config.tipoMenu,
            grupos: config.menuConfig || this.layoutConfig.getAccordionMenu(rol.id)
          });
        }
      }
      this.configsRolCargadas.set(mapa);
    } catch (err) {
      console.error('[PlantillasMenu] Error cargando configs de roles:', err);
    }
    this.cargandoRoles.set(false);
    this.cdr.markForCheck();
  }

  toggleRolAcordion(idrol: string) {
    this.rolAcordionAbierto = this.rolAcordionAbierto === idrol ? null : idrol;
    this.cdr.markForCheck();
  }

  tieneConfigRol(idrol: string): boolean {
    return this.configsRolCargadas().has(idrol);
  }

  getTipoMenuRol(idrol: string): MenuType {
    return this.configsRolCargadas().get(idrol)?.tipoMenu || 'default';
  }

  getGruposRol(idrol: string): AccordionGroupConfig[] {
    const cfg = this.configsRolCargadas().get(idrol);
    if (cfg?.grupos?.length) return cfg.grupos;
    return this.layoutConfig.getAccordionMenu(idrol);
  }

  getRolBadgeClass(idrol: string): string {
    const map: Record<string, string> = {
      TILOGIST: 'rol-badge-ti',
      ADLOGIST: 'rol-badge-admin',
      JLOLOGIST: 'rol-badge-jefe',
      JEMLOGIST: 'rol-badge-jefe',
      LOLOGIST: 'rol-badge-op',
      EMLOGIST: 'rol-badge-op',
      OPLOGIST: 'rol-badge-campo',
      ALLOGIST: 'rol-badge-almacen',
      APLOGIST: 'rol-badge-aprobador',
      FINANZAS: 'rol-badge-finanzas',
      GERENTE: 'rol-badge-gerente',
    };
    return 'rol-badge ' + (map[idrol] || 'rol-badge-default');
  }

  abrirEditorParaRol(idrol: string) {
    const grupos = this.getGruposRol(idrol);
    const tipoMenu = this.getTipoMenuRol(idrol);
    const nombreRol = this.rolesDisponibles.find(r => r.id === idrol)?.nombre || idrol;
    this.editorPlantilla = {
      id: `rol-${idrol.toLowerCase()}-${Date.now().toString(36)}`,
      nombre: `Menú ${nombreRol}`,
      descripcion: `Configuración de menú para el rol ${idrol}`,
      tipoMenu,
      grupos: JSON.parse(JSON.stringify(grupos)),
      fechaCreacion: new Date().toISOString(),
      usuarioCreador: this.adminUser?.documentoidentidad || 'ADMIN',
      activo: true
    };
    this._rolEditorDestino = idrol;
    this.tabActivo = 'editor';
    this.cdr.markForCheck();
  }

  async aplicarPlantillaARol(p: PlantillaMenu, idrol: string) {
    this.aplicandoRol.set(true);
    this.rolAplicando = idrol;
    const ok = await this.layoutConfig.guardarMenuConfig(idrol, p.tipoMenu, p.grupos);
    if (ok) {
      this.alertService.showAlert('Aplicado', `Plantilla "${p.nombre}" aplicada al rol ${idrol}.`, 'success');
      await this.cargarConfigRoles();
    } else {
      this.alertService.showAlertError('Error', 'No se pudo aplicar la plantilla.');
    }
    this.rolAplicando = null;
    this.aplicandoRol.set(false);
    this.cdr.markForCheck();
  }

  async aplicarTipoDirectoARol(tipo: string, idrol: string) {
    const menuType = this.getTipoMenuValue(tipo);
    this.aplicandoRol.set(true);
    this.rolAplicando = idrol;
    const grupos = PLANTILLAS_POR_TIPO[menuType] || [];
    const ok = await this.layoutConfig.guardarMenuConfig(idrol, menuType, grupos);
    if (ok) {
      this.alertService.showAlert('Aplicado', `Tipo "${tipo}" aplicado al rol ${idrol}.`, 'success');
      await this.cargarConfigRoles();
    } else {
      this.alertService.showAlertError('Error', 'No se pudo aplicar el tipo.');
    }
    this.rolAplicando = null;
    this.aplicandoRol.set(false);
    this.cdr.markForCheck();
  }

  async resetearConfigRol(idrol: string) {
    if (!confirm(`¿Resetear la configuración del menú para el rol ${idrol}? Volverá al menú por defecto del sistema.`)) return;
    this.aplicandoRol.set(true);
    this.rolAplicando = idrol;
    const ok = await this.layoutConfig.guardarMenuConfig(idrol, 'default', []);
    if (ok) {
      this.alertService.showAlert('Reseteado', `Rol ${idrol} vuelve al menú por defecto.`, 'success');
      await this.cargarConfigRoles();
    } else {
      this.alertService.showAlertError('Error', 'No se pudo resetear la configuración.');
    }
    this.rolAplicando = null;
    this.aplicandoRol.set(false);
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════
  // CRUD PLANTILLAS
  // ══════════════════════════════════════════════

  async cargarPlantillas() {
    let lista: PlantillaMenu[] = [];
    try {
      const response = await lastValueFrom(
        this.http.post<any[]>(`${this.baseUrl}/api/configmenu/listar`, { idrol: '__PLANTILLAS__' })
      );
      const raw = response || [];
      raw.forEach(r => {
        if (r.clave?.startsWith('PLANTILLA_')) {
          try {
            const p = JSON.parse(r.valor) as PlantillaMenu;
            p.id = r.id || r.clave;
            lista.push(p);
          } catch { /* ignorar JSON inválido */ }
        }
      });
    } catch {
      // Si no hay endpoint o falla, seguir con lista vacía
    }

    // Precargar plantillas base por tipo de menú si no existen
    const plantillasBase = this.generarPlantillasBase();
    for (const base of plantillasBase) {
      const yaExiste = lista.some(p => p.tipoMenu === base.tipoMenu && p.nombre === base.nombre);
      if (!yaExiste) {
        lista.push(base);
      }
    }

    this.plantillas.set(lista);
    this.cdr.markForCheck();
  }

  private generarPlantillasBase(): PlantillaMenu[] {
    return this.tiposMenuDisponibles.map(tipo => ({
      id: `base-${tipo.value}`,
      nombre: `${tipo.label}`,
      descripcion: tipo.descripcion,
      tipoMenu: tipo.value as MenuType,
      grupos: JSON.parse(JSON.stringify(PLANTILLAS_POR_TIPO[tipo.value as MenuType] || [])),
      fechaCreacion: new Date().toISOString(),
      usuarioCreador: 'SISTEMA',
      activo: true
    }));
  }

  nuevaPlantilla() {
    this.editorPlantilla = this.crearPlantillaVacia();
    this.tabActivo = 'editor';
    this.cdr.markForCheck();
  }

  editarPlantilla(p: PlantillaMenu) {
    this.editorPlantilla = JSON.parse(JSON.stringify(p));
    this.tabActivo = 'editor';
    this.cdr.markForCheck();
  }

  duplicarPlantilla(p: PlantillaMenu) {
    const copia = JSON.parse(JSON.stringify(p)) as PlantillaMenu;
    copia.id = this.generarId();
    copia.nombre = `${copia.nombre} (copia)`;
    copia.fechaCreacion = new Date().toISOString();
    this.editorPlantilla = copia;
    this.tabActivo = 'editor';
    this.cdr.markForCheck();
  }

  async eliminarPlantilla(p: PlantillaMenu) {
    if (!confirm(`¿Eliminar la plantilla "${p.nombre}"?`)) return;
    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: '__PLANTILLAS__',
          clave: `PLANTILLA_${p.id}`,
          valor: '',
          descripcion: 'ELIMINADA',
          usuarioModifica: this.adminUser?.documentoidentidad || 'ADMIN'
        })
      );
      await this.cargarPlantillas();
      this.alertService.showAlert('Eliminada', 'Plantilla eliminada.', 'success');
    } catch {
      this.alertService.showAlertError('Error', 'No se pudo eliminar la plantilla.');
    }
  }

  async guardarPlantilla() {
    if (!this.editorPlantilla.nombre?.trim()) {
      this.alertService.showAlert('Advertencia', 'Ingrese un nombre para la plantilla.', 'warning');
      return;
    }
    if (this.editorPlantilla.grupos.length === 0) {
      this.alertService.showAlert('Advertencia', 'La plantilla debe tener al menos un grupo.', 'warning');
      return;
    }

    this.guardando.set(true);
    try {
      this.editorPlantilla.fechaCreacion = this.editorPlantilla.fechaCreacion || new Date().toISOString();
      this.editorPlantilla.usuarioCreador = this.adminUser?.documentoidentidad || 'ADMIN';
      this.editorPlantilla.activo = true;

      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: '__PLANTILLAS__',
          clave: `PLANTILLA_${this.editorPlantilla.id}`,
          valor: JSON.stringify(this.editorPlantilla),
          descripcion: `Plantilla: ${this.editorPlantilla.nombre}`,
          usuarioModifica: this.adminUser?.documentoidentidad || 'ADMIN'
        })
      );

      this.alertService.showAlert('Guardada', `Plantilla "${this.editorPlantilla.nombre}" guardada correctamente.`, 'success');
      await this.cargarPlantillas();
      // Si venía de editar un rol, aplicar también al rol destino
      if (this._rolEditorDestino) {
        await this.layoutConfig.guardarMenuConfig(
          this._rolEditorDestino,
          this.editorPlantilla.tipoMenu,
          this.editorPlantilla.grupos
        );
        this._rolEditorDestino = null;
        await this.cargarConfigRoles();
        this.tabActivo = 'roles';
      } else {
        this.tabActivo = 'plantillas';
      }
    } catch (err) {
      console.error('Error guardando plantilla:', err);
      this.alertService.showAlertError('Error', 'No se pudo guardar la plantilla.');
    }
    this.guardando.set(false);
    this.cdr.markForCheck();
  }

  aplicarPlantilla(p: PlantillaMenu) {
    this.modalAplicarPlantilla = p;
    this.modalAplicarTipo = null;
    this.modalRolSeleccionado = '';
    this.modalAplicarVisible = true;
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════
  // TIPOS DE MENÚ
  // ══════════════════════════════════════════════

  async cargarTiposCustom() {
    try {
      const response = await lastValueFrom(
        this.http.post<any[]>(`${this.baseUrl}/api/configmenu/listar`, { idrol: '__TIPOS_MENU__' })
      );
      const custom: TipoMenuCustom[] = [];
      (response || []).forEach(r => {
        if (r.clave?.startsWith('TIPO_')) {
          try { custom.push(JSON.parse(r.valor) as TipoMenuCustom); } catch {}
        }
      });
      this.tiposCustom.set(custom);
    } catch {
      this.tiposCustom.set([]);
    }
    this.actualizarTiposMenuList();
  }

  private actualizarTiposMenuList() {
    this.tiposMenuList = [...this.tiposMenuDisponibles, ...this.tiposCustom()];
    this.cdr.markForCheck();
  }

  getPlantillaPorTipo(tipo: string): AccordionGroupConfig[] {
    return PLANTILLAS_POR_TIPO[tipo as MenuType] || [];
  }

  getTipoMenuValue(tipo: string): MenuType {
    const validos: MenuType[] = ['accordion', 'nav', 'list', 'default'];
    return validos.includes(tipo as MenuType) ? tipo as MenuType : 'accordion';
  }

  usarTipoComoBase(tipo: string) {
    const menuType = this.getTipoMenuValue(tipo);
    this.editorPlantilla = this.crearPlantillaVacia();
    this.editorPlantilla.tipoMenu = menuType;
    this.editorPlantilla.nombre = `Plantilla ${this.tiposMenuList.find(t => t.value === tipo)?.label || tipo}`;
    this.editorPlantilla.descripcion = `Basada en tipo: ${tipo}`;
    this.editorPlantilla.grupos = JSON.parse(JSON.stringify(PLANTILLAS_POR_TIPO[menuType] || []));
    this.tabActivo = 'editor';
    this.cdr.markForCheck();
  }

  editarPlantillaTipo(tipo: TipoMenuCustom) {
    const menuType = this.getTipoMenuValue(tipo.value);
    this.editorPlantilla = {
      id: `tipo-${tipo.value}`,
      nombre: `${tipo.label} (editar base)`,
      descripcion: `Plantilla base para tipo: ${tipo.label}`,
      tipoMenu: menuType,
      grupos: JSON.parse(JSON.stringify(PLANTILLAS_POR_TIPO[menuType] || [])),
      fechaCreacion: new Date().toISOString(),
      usuarioCreador: this.adminUser?.documentoidentidad || 'ADMIN',
      activo: true
    };
    this.tabActivo = 'editor';
    this.cdr.markForCheck();
  }

  aplicarTipoARol(tipo: string) {
    this.modalAplicarTipo = this.getTipoMenuValue(tipo);
    this.modalAplicarPlantilla = null;
    this.modalRolSeleccionado = '';
    this.modalAplicarVisible = true;
    this.cdr.markForCheck();
  }

  abrirFormNuevoTipo() {
    this.nuevoTipo = { value: '', label: '', icono: 'bx bx-menu', descripcion: '', color: '#1a73e8', esCustom: true };
    this.formNuevoTipoVisible = true;
    this.tabActivo = 'tipos';
    this.cdr.markForCheck();
  }

  async guardarNuevoTipo() {
    if (!this.nuevoTipo.value?.trim() || !this.nuevoTipo.label?.trim()) {
      this.alertService.showAlert('Advertencia', 'Ingrese identificador y nombre del tipo.', 'warning');
      return;
    }
    // Normalizar identificador
    this.nuevoTipo.value = this.nuevoTipo.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (this.tiposMenuList.some(t => t.value === this.nuevoTipo.value)) {
      this.alertService.showAlert('Advertencia', 'Ya existe un tipo con ese identificador.', 'warning');
      return;
    }

    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: '__TIPOS_MENU__',
          clave: `TIPO_${this.nuevoTipo.value}`,
          valor: JSON.stringify(this.nuevoTipo),
          descripcion: `Tipo menú: ${this.nuevoTipo.label}`,
          usuarioModifica: this.adminUser?.documentoidentidad || 'ADMIN'
        })
      );
      this.alertService.showAlert('Guardado', `Tipo "${this.nuevoTipo.label}" creado.`, 'success');
      this.formNuevoTipoVisible = false;
      await this.cargarTiposCustom();
    } catch {
      this.alertService.showAlertError('Error', 'No se pudo guardar el tipo de menú.');
    }
  }

  async eliminarTipoCustom(tipo: TipoMenuCustom) {
    if (!confirm(`¿Eliminar el tipo "${tipo.label}"?`)) return;
    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: '__TIPOS_MENU__',
          clave: `TIPO_${tipo.value}`,
          valor: '',
          descripcion: 'ELIMINADO',
          usuarioModifica: this.adminUser?.documentoidentidad || 'ADMIN'
        })
      );
      this.alertService.showAlert('Eliminado', `Tipo "${tipo.label}" eliminado.`, 'success');
      await this.cargarTiposCustom();
    } catch {
      this.alertService.showAlertError('Error', 'No se pudo eliminar el tipo.');
    }
  }

  // ══════════════════════════════════════════════
  // MODAL APLICAR A ROL
  // ══════════════════════════════════════════════

  cerrarModalAplicar() {
    this.modalAplicarVisible = false;
    this.modalAplicarPlantilla = null;
    this.modalAplicarTipo = null;
    this.modalRolSeleccionado = '';
    this.cdr.markForCheck();
  }

  async confirmarAplicar() {
    if (!this.modalRolSeleccionado) return;

    this.aplicandoRol.set(true);
    try {
      let ok = false;
      if (this.modalAplicarPlantilla) {
        ok = await this.layoutConfig.guardarMenuConfig(
          this.modalRolSeleccionado,
          this.modalAplicarPlantilla.tipoMenu,
          this.modalAplicarPlantilla.grupos
        );
      } else if (this.modalAplicarTipo) {
        ok = await this.layoutConfig.guardarMenuConfig(
          this.modalRolSeleccionado,
          this.modalAplicarTipo,
          PLANTILLAS_POR_TIPO[this.modalAplicarTipo]
        );
      }

      if (ok) {
        const nombre = this.modalAplicarPlantilla?.nombre || this.modalAplicarTipo || '';
        this.alertService.showAlert('Aplicado', `"${nombre}" aplicado al rol ${this.modalRolSeleccionado} exitosamente.`, 'success');
        this.cerrarModalAplicar();
      } else {
        this.alertService.showAlertError('Error', 'No se pudo aplicar la configuración.');
      }
    } catch {
      this.alertService.showAlertError('Error', 'Error al aplicar la configuración.');
    }
    this.aplicandoRol.set(false);
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════
  // PALETA — FILTROS
  // ══════════════════════════════════════════════

  gruposPaletaFiltrados(): ItemPaleta[] {
    if (!this.busquedaPaleta) return PALETA_GRUPOS;
    const q = this.busquedaPaleta.toLowerCase();
    return PALETA_GRUPOS.filter(g => g.nombre.toLowerCase().includes(q));
  }

  itemsPaletaFiltrados(): ItemPaleta[] {
    if (!this.busquedaPaleta) return PALETA_ITEMS;
    const q = this.busquedaPaleta.toLowerCase();
    return PALETA_ITEMS.filter(i => i.nombre.toLowerCase().includes(q));
  }

  // ══════════════════════════════════════════════
  // DRAG & DROP
  // ══════════════════════════════════════════════

  onDragStartPaleta(event: DragEvent, item: ItemPaleta) {
    this.dragData = {
      tipo: item.tipo === 'grupo' ? 'paleta-grupo' : 'paleta-item',
      payload: item
    };
    event.dataTransfer?.setData('text/plain', item.id);
  }

  onDragStartGrupo(event: DragEvent, gi: number) {
    this.dragData = { tipo: 'builder-grupo', payload: gi };
    event.dataTransfer?.setData('text/plain', `grupo-${gi}`);
    event.stopPropagation();
  }

  onDragStartItem(event: DragEvent, gi: number, ii: number) {
    this.dragData = { tipo: 'builder-item', payload: { gi, ii } };
    event.dataTransfer?.setData('text/plain', `item-${gi}-${ii}`);
    event.stopPropagation();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDragOverGrupo(event: DragEvent, gi: number) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverGrupoIdx = gi;
  }

  onDragLeaveGrupo() {
    this.dragOverGrupoIdx = null;
  }

  onDragOverItems(event: DragEvent, gi: number) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDropZonaVacia(event: DragEvent) {
    event.preventDefault();
    if (!this.dragData) return;

    if (this.dragData.tipo === 'paleta-grupo') {
      const paleta = this.dragData.payload as ItemPaleta;
      const nuevoGrupo: AccordionGroupConfig = {
        id: paleta.id.replace('grp-', '') + '-' + Date.now(),
        label: paleta.nombre,
        icono: paleta.icono,
        activo: true,
        orden: this.editorPlantilla.grupos.length + 1,
        items: []
      };
      this.editorPlantilla.grupos = [...this.editorPlantilla.grupos, nuevoGrupo];
    }

    this.resetDrag();
    this.cdr.markForCheck();
  }

  onDropGrupo(event: DragEvent, gi: number) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.dragData) { this.resetDrag(); return; }

    if (this.dragData.tipo === 'paleta-grupo') {
      // Insertar nuevo grupo en posición gi
      const paleta = this.dragData.payload as ItemPaleta;
      const nuevoGrupo: AccordionGroupConfig = {
        id: paleta.id.replace('grp-', '') + '-' + Date.now(),
        label: paleta.nombre,
        icono: paleta.icono,
        activo: true,
        orden: gi + 1,
        items: []
      };
      const arr = [...this.editorPlantilla.grupos];
      arr.splice(gi, 0, nuevoGrupo);
      this.editorPlantilla.grupos = arr;
    } else if (this.dragData.tipo === 'paleta-item') {
      // Agregar item al grupo
      const paleta = this.dragData.payload as ItemPaleta;
      this.agregarItemAlGrupo(gi, paleta);
    } else if (this.dragData.tipo === 'builder-grupo') {
      // Reordenar grupos
      const fromIdx = this.dragData.payload as number;
      if (fromIdx !== gi) {
        const arr = [...this.editorPlantilla.grupos];
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(gi, 0, moved);
        this.editorPlantilla.grupos = arr;
      }
    } else if (this.dragData.tipo === 'builder-item') {
      // Mover item a este grupo
      const { gi: fromGi, ii: fromIi } = this.dragData.payload;
      const item = this.editorPlantilla.grupos[fromGi].items[fromIi];
      this.editorPlantilla.grupos[fromGi].items = this.editorPlantilla.grupos[fromGi].items.filter((_: any, i: number) => i !== fromIi);
      this.editorPlantilla.grupos[gi].items = [...this.editorPlantilla.grupos[gi].items, item];
    }

    this.resetDrag();
    this.cdr.markForCheck();
  }

  onDropItem(event: DragEvent, gi: number) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.dragData) { this.resetDrag(); return; }

    if (this.dragData.tipo === 'paleta-item') {
      const paleta = this.dragData.payload as ItemPaleta;
      this.agregarItemAlGrupo(gi, paleta);
    } else if (this.dragData.tipo === 'builder-item') {
      const { gi: fromGi, ii: fromIi } = this.dragData.payload;
      if (fromGi !== gi) {
        const item = this.editorPlantilla.grupos[fromGi].items[fromIi];
        this.editorPlantilla.grupos[fromGi].items = this.editorPlantilla.grupos[fromGi].items.filter((_: any, i: number) => i !== fromIi);
        this.editorPlantilla.grupos[gi].items = [...this.editorPlantilla.grupos[gi].items, item];
      }
    }

    this.resetDrag();
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════
  // BUILDER HELPERS
  // ══════════════════════════════════════════════

  moverGrupoBuilder(idx: number, dir: number) {
    const arr = [...this.editorPlantilla.grupos];
    const nuevo = idx + dir;
    if (nuevo < 0 || nuevo >= arr.length) return;
    [arr[idx], arr[nuevo]] = [arr[nuevo], arr[idx]];
    this.editorPlantilla.grupos = arr;
    this.cdr.markForCheck();
  }

  eliminarGrupoBuilder(idx: number) {
    if (!confirm('¿Eliminar este grupo y todos sus items?')) return;
    this.editorPlantilla.grupos = this.editorPlantilla.grupos.filter((_: any, i: number) => i !== idx);
    this.cdr.markForCheck();
  }

  eliminarItemBuilder(gi: number, ii: number) {
    this.editorPlantilla.grupos[gi].items = this.editorPlantilla.grupos[gi].items.filter((_: any, i: number) => i !== ii);
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════
  // UTILIDADES
  // ══════════════════════════════════════════════

  private agregarItemAlGrupo(gi: number, paleta: ItemPaleta) {
    const nuevoItem: AccordionItemConfig = {
      id: paleta.id.replace('itm-', ''),
      nombre: paleta.nombre,
      icono: paleta.icono,
      ruta: paleta.ruta || `./${paleta.id.replace('itm-', '')}`,
      activo: true,
      orden: this.editorPlantilla.grupos[gi].items.length + 1,
    };
    this.editorPlantilla.grupos[gi].items = [...this.editorPlantilla.grupos[gi].items, nuevoItem];
  }

  private resetDrag() {
    this.dragData = null;
    this.dragOverGrupoIdx = null;
    this.dragOverItemIdx = null;
  }

  private crearPlantillaVacia(): PlantillaMenu {
    return {
      id: this.generarId(),
      nombre: '',
      descripcion: '',
      tipoMenu: 'accordion',
      grupos: [],
      fechaCreacion: new Date().toISOString(),
      usuarioCreador: '',
      activo: true
    };
  }

  private generarId(): string {
    return 'plt-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
}
