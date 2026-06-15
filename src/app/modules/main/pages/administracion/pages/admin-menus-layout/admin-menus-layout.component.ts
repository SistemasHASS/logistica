import { Component, ChangeDetectionStrategy, signal, inject, ChangeDetectorRef, OnInit } from '@angular/core';
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

interface MenuItem {
  id: string;
  nombre: string;
  icono: string;
  ruta: string;
  roles: string[];
  categoria: string;
  orden: number;
}

const ROLES_SISTEMA = [
  { idrol: 'TILOGIST',  nombre: 'Admin Sistema',         color: '#6c3483' },
  { idrol: 'ADLOGIST',  nombre: 'Admin Logística',        color: '#1a5276' },
  { idrol: 'JLOLOGIST', nombre: 'Jefe Logística',         color: '#1e8449' },
  { idrol: 'JEMLOGIST', nombre: 'Jefe Licitaciones',      color: '#117a65' },
  { idrol: 'LOLOGIST',  nombre: 'Operador Logística',     color: '#2471a3' },
  { idrol: 'EMLOGIST',  nombre: 'Operador Licitaciones',  color: '#148f77' },
  { idrol: 'OPLOGIST',  nombre: 'Operativo Campo',        color: '#d68910' },
  { idrol: 'ALLOGIST',  nombre: 'Almacén',                color: '#ba4a00' },
  { idrol: 'APLOGIST',  nombre: 'Aprobador Consumo',      color: '#7d6608' },
  { idrol: 'FINANZAS',  nombre: 'Finanzas',               color: '#1f618d' },
  { idrol: 'GERENTE',   nombre: 'Gerente',                color: '#515a5a' },
];

const MENUS_LAYOUT: MenuItem[] = [
  // ── Mi Dashboard ──────────────────────────────────────────────
  { id: 'dashboard-tilogist',   nombre: 'Dashboard Admin Sistema',      icono: 'bx bxs-dashboard',    ruta: '/main/dashboard-tilogist',   roles: ['TILOGIST'],                                                                      categoria: 'Mi Dashboard', orden: 1 },
  { id: 'dashboard-adlogist',   nombre: 'Dashboard Admin Logística',    icono: 'bx bxs-dashboard',    ruta: '/main/dashboard-adlogist',   roles: ['ADLOGIST'],                                                                      categoria: 'Mi Dashboard', orden: 2 },
  { id: 'dashboard-jlologist',  nombre: 'Dashboard Jef. Logística',     icono: 'bx bx-line-chart',    ruta: '/main/dashboard-jlologist',  roles: ['JLOLOGIST'],                                                                     categoria: 'Mi Dashboard', orden: 3 },
  { id: 'dashboard-jemlogist',  nombre: 'Dashboard Jef. Empaque',       icono: 'bx bx-line-chart',    ruta: '/main/dashboard-jemlogist',  roles: ['JEMLOGIST'],                                                                     categoria: 'Mi Dashboard', orden: 4 },
  { id: 'dashboard-oplogist',   nombre: 'Mi Dashboard (Operativo)',     icono: 'bx bx-user-check',    ruta: '/main/dashboard-oplogist',   roles: ['OPLOGIST','EMLOGIST','JEMLOGIST','JLOLOGIST','APLOGIST','ADLOGIST','LOLOGIST'],   categoria: 'Mi Dashboard', orden: 5 },
  { id: 'dashboard-logistica',  nombre: 'Dashboard Logística',          icono: 'bx bx-bar-chart-alt-2',ruta: '/main/dashboard-logistica', roles: ['LOLOGIST','JLOLOGIST','ADLOGIST','EMLOGIST'],                                    categoria: 'Mi Dashboard', orden: 6 },
  { id: 'dashboard-finanzas',   nombre: 'Dashboard Finanzas',           icono: 'bx bx-line-chart',    ruta: '/main/dashboard-finanzas',   roles: ['FINANZAS'],                                                                      categoria: 'Mi Dashboard', orden: 7 },
  { id: 'dashboard-aprobaciones-area', nombre: 'Dashboard Aprobaciones Área', icono: 'bx bx-check-shield', ruta: '/main/dashboard-aprobaciones-area', roles: ['APLOGIST','TILOGIST','ADLOGIST'],                                    categoria: 'Mi Dashboard', orden: 8 },
  // ── Configuración ─────────────────────────────────────────────
  { id: 'notificaciones',       nombre: 'Notificaciones',               icono: 'bx bx-bell',          ruta: '/main/notificaciones',       roles: ['TILOGIST','ADLOGIST','JLOLOGIST','EMLOGIST','OPLOGIST','LOLOGIST'],               categoria: 'Configuración', orden: 9 },
  { id: 'parametros',           nombre: 'Parámetros',                   icono: 'icon icon-equalizer', ruta: '/main/parametros',           roles: ['TILOGIST','ADLOGIST','EMLOGIST','LOLOGIST'],                                      categoria: 'Configuración', orden: 10 },
  // ── Requerimientos ────────────────────────────────────────────
  { id: 'requerimientos',       nombre: 'Requerimientos',               icono: 'icon icon-stack',     ruta: '/main/requerimientos',       roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','OPLOGIST','EMLOGIST','LOLOGIST'],   categoria: 'Requerimientos', orden: 11 },
  { id: 'saldo-requerimiento',  nombre: 'Saldo de Requerimiento',       icono: 'icon icon-balance',   ruta: '/main/saldo-requerimiento',  roles: ['TILOGIST','ADLOGIST','JLOLOGIST','OPLOGIST','LOLOGIST','EMLOGIST'],               categoria: 'Requerimientos', orden: 12 },
  // ── Compras & Órdenes ─────────────────────────────────────────
  { id: 'solicitudes-compra',   nombre: 'Solicitudes de Compra',        icono: 'bx bx-shopping-bag',  ruta: '/main/solicitudes-compra',   roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','LOLOGIST'],                        categoria: 'Compras & Órdenes', orden: 13 },
  { id: 'ordenes-compra',       nombre: 'Órdenes de Compra',            icono: 'icon icon-file-text', ruta: '/main/ordenes-compra',       roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','LOLOGIST'],                        categoria: 'Compras & Órdenes', orden: 14 },
  { id: 'consolidacion-compras',nombre: 'Consolidación Compras',        icono: 'bx bx-cart',          ruta: '/main/consolidacion-compras',roles: ['TILOGIST','ADLOGIST','JLOLOGIST','LOLOGIST'],                                    categoria: 'Compras & Órdenes', orden: 15 },
  { id: 'solicitudes-servicio', nombre: 'Solicitudes de Servicio',      icono: 'bx bx-briefcase',     ruta: '/main/solicitudes-servicio', roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','LOLOGIST'],                        categoria: 'Compras & Órdenes', orden: 16 },
  { id: 'ordenes-servicio',     nombre: '\u00d3rdenes de Servicio',          icono: 'bx bx-wrench',        ruta: '/main/ordenes-servicio',     roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','LOLOGIST'],                        categoria: 'Compras & Órdenes', orden: 17 },
  { id: 'cotizaciones',         nombre: 'Cotizaciones',                 icono: 'icon icon-calculator',ruta: '/main/cotizaciones',         roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','LOLOGIST'],                        categoria: 'Compras & Órdenes', orden: 18 },
  // ── Almacén & Stock ───────────────────────────────────────────
  { id: 'despachos',            nombre: 'Gestión de Despachos',         icono: 'icon icon-stack',     ruta: '/main/despachos',            roles: ['TILOGIST','ADLOGIST','ALLOGIST','JLOLOGIST','LOLOGIST'],                         categoria: 'Almacén & Stock', orden: 18 },
  { id: 'recepcion-mercaderia', nombre: 'Recepción de Mercadería',      icono: 'icon icon-package',   ruta: '/main/recepcion-mercaderia', roles: ['TILOGIST','ADLOGIST','ALLOGIST','JLOLOGIST','LOLOGIST'],                         categoria: 'Almacén & Stock', orden: 19 },
  { id: 'kardex',               nombre: 'Kardex e Inventario',          icono: 'bx bx-container',     ruta: '/main/kardex',               roles: ['TILOGIST','ADLOGIST','ALLOGIST','JLOLOGIST','LOLOGIST'],                         categoria: 'Almacén & Stock', orden: 20 },
  { id: 'devoluciones-consumo', nombre: 'Devoluciones de Consumo',      icono: 'icon icon-undo2',     ruta: '/main/devoluciones-consumo', roles: ['TILOGIST','ADLOGIST','ALLOGIST'],                                                categoria: 'Almacén & Stock', orden: 21 },
  { id: 'reingresos',           nombre: 'Reingresos',                   icono: 'icon icon-enter',     ruta: '/main/reingresos',           roles: ['TILOGIST','ADLOGIST','ALLOGIST'],                                                categoria: 'Almacén & Stock', orden: 22 },
  // ── Aprobaciones ──────────────────────────────────────────────
  { id: 'aprobaciones-oc',      nombre: 'Aprobación OC',                icono: 'icon icon-file-check',ruta: '/main/aprobaciones-oc',      roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','FINANZAS','GERENTE'],               categoria: 'Aprobaciones', orden: 23 },
  { id: 'aprobaciones-os',      nombre: 'Aprobación OS',                icono: 'icon icon-file-check',ruta: '/main/aprobaciones-os',      roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','FINANZAS','GERENTE'],               categoria: 'Aprobaciones', orden: 24 },
  { id: 'aprobaciones-area',    nombre: 'Aprobación por Área',          icono: 'icon icon-file-check',ruta: '/main/aprobaciones-area',    roles: ['TILOGIST','ADLOGIST','APLOGIST'],                                                categoria: 'Aprobaciones', orden: 25 },
  // ── Reportes ──────────────────────────────────────────────────
  { id: 'reportes-compras',       nombre: 'Reportes Avanzados',         icono: 'icon icon-pie-chart', ruta: '/main/reportes-compras',       roles: ['TILOGIST','ADLOGIST','JLOLOGIST','LOLOGIST'],                                  categoria: 'Reportes', orden: 26 },
  { id: 'reporte-requerimientos', nombre: 'Reporte Requerimientos',     icono: 'icon icon-file-text', ruta: '/main/reporte-requerimientos', roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','LOLOGIST'],                      categoria: 'Reportes', orden: 27 },
  { id: 'reporte-despachos',      nombre: 'Reporte de Despachos',       icono: 'icon icon-file-text', ruta: '/main/reporte-despachos',      roles: ['TILOGIST','ADLOGIST','JLOLOGIST','ALLOGIST'],                                  categoria: 'Reportes', orden: 28 },
  { id: 'reporte-aprobaciones-area', nombre: 'Reporte Aprobaciones Área', icono: 'icon icon-file-check', ruta: '/main/reporte-aprobaciones-area', roles: ['TILOGIST','ADLOGIST','APLOGIST'],                                        categoria: 'Reportes', orden: 29 },
  { id: 'reporte-saldos',         nombre: 'Reporte de Saldos',          icono: 'icon icon-file-text', ruta: '/main/reporte-saldos',         roles: ['TILOGIST','ADLOGIST','JLOLOGIST','LOLOGIST'],                                  categoria: 'Reportes', orden: 30 },
  { id: 'reporte-aprobados',      nombre: 'Reporte Reqs. Aprobados',    icono: 'icon icon-file-check',ruta: '/main/reporte-aprobados',      roles: ['TILOGIST','ADLOGIST','JLOLOGIST','JEMLOGIST','LOLOGIST'],                      categoria: 'Reportes', orden: 31 },
];

const CATEGORIAS_ORDEN = ['Mi Dashboard','Configuración','Requerimientos','Compras & Órdenes','Almacén & Stock','Aprobaciones','Reportes'];

const CATEGORIA_ICONOS: Record<string, string> = {
  'Mi Dashboard':      'bx bxs-dashboard',
  'Configuración':     'icon icon-equalizer',
  'Requerimientos':    'icon icon-stack',
  'Compras & Órdenes': 'bx bx-cart',
  'Almacén & Stock':   'bx bx-package',
  'Aprobaciones':      'icon icon-file-check',
  'Reportes':          'icon icon-pie-chart',
};

@Component({
  selector: 'app-admin-menus-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DynamicMenuComponent],
  template: `
    <div class="menus-container">

      <!-- Header -->
      <div class="page-header">
        <div class="page-header-left">
          <h4 class="page-title"><i class='bx bx-layout'></i> Menús del Layout Principal</h4>
          <p class="page-subtitle">Vista y configuración de los módulos del sistema por rol.</p>
        </div>
        <div class="page-header-right">
          <div class="stats-chips">
            <span class="stat-chip"><b>{{ totalMenus }}</b> módulos</span>
            <span class="stat-chip"><b>{{ totalRoles }}</b> roles</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab-btn" [class.active]="tabActivo === 'vista'" (click)="tabActivo = 'vista'">
          <i class='bx bx-table'></i> Vista por roles
        </button>
        <button class="tab-btn" [class.active]="tabActivo === 'editor'" (click)="tabActivo = 'editor'; initEditor()">
          <i class='bx bx-edit'></i> Editor Accordion
        </button>
      </div>

      <!-- ══════ TAB: VISTA POR ROLES ══════ -->
      @if (tabActivo === 'vista') {
        <div class="filtros-bar">
          <div class="filtro-search">
            <i class='bx bx-search'></i>
            <input type="text" placeholder="Buscar módulo..." [(ngModel)]="busqueda" class="input-search">
          </div>
          <div class="filtro-roles">
            <span class="filtro-label">Filtrar por rol:</span>
            <select [(ngModel)]="rolFiltro" class="select-rol">
              <option value="">Todos los roles</option>
              @for (r of roles; track r.idrol) {
                <option [value]="r.idrol">{{ r.idrol }} — {{ r.nombre }}</option>
              }
            </select>
          </div>
          <div class="filtro-categoria">
            <span class="filtro-label">Sección:</span>
            <select [(ngModel)]="categoriaFiltro" class="select-rol">
              <option value="">Todas</option>
              @for (c of categorias; track c) { <option [value]="c">{{ c }}</option> }
            </select>
          </div>
          @if (busqueda || rolFiltro || categoriaFiltro) {
            <button class="btn-limpiar" (click)="limpiarFiltros()"><i class='bx bx-x'></i> Limpiar</button>
          }
        </div>

        @for (cat of categoriasFiltradas(); track cat) {
          <div class="categoria-card">
            <div class="categoria-header">
              <span class="cat-icon"><i [class]="getCatIcono(cat)"></i></span>
              <h5 class="cat-titulo">{{ cat }}</h5>
              <span class="cat-count">{{ menusPorCategoria(cat).length }} módulos</span>
            </div>
            <div class="tabla-wrapper">
              <table class="tabla-menus">
                <thead>
                  <tr>
                    <th class="col-modulo">Módulo</th>
                    <th class="col-ruta">Ruta</th>
                    @for (r of roles; track r.idrol) {
                      <th class="col-rol" [title]="r.nombre">
                        <span class="rol-badge-th" [style.background]="r.color + '22'" [style.color]="r.color">{{ r.idrol }}</span>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (m of menusPorCategoria(cat); track m.id) {
                    <tr>
                      <td class="cell-modulo">
                        <span class="mod-icon"><i [class]="m.icono"></i></span>
                        <span class="mod-nombre">{{ m.nombre }}</span>
                      </td>
                      <td class="cell-ruta"><code class="ruta-code">{{ m.ruta }}</code></td>
                      @for (r of roles; track r.idrol) {
                        <td class="cell-acceso">
                          @if (tieneAcceso(m, r.idrol)) {
                            <span class="acceso-si" [title]="r.nombre + ' tiene acceso'">✓</span>
                          } @else {
                            <span class="acceso-no">—</span>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
        @if (categoriasFiltradas().length === 0) {
          <div class="empty-state"><i class='bx bx-search-alt'></i><p>Sin resultados.</p></div>
        }
        <div class="leyenda-roles">
          <span class="leyenda-titulo"><i class='bx bx-info-circle'></i> Roles:</span>
          @for (r of roles; track r.idrol) {
            <span class="leyenda-chip" [style.background]="r.color + '18'" [style.color]="r.color" [style.border]="'1px solid ' + r.color + '44'">
              <b>{{ r.idrol }}</b> {{ r.nombre }}
            </span>
          }
        </div>
      }

      <!-- ══════ TAB: EDITOR ACCORDION ══════ -->
      @if (tabActivo === 'editor') {
        <div class="editor-container">

          <!-- Selector de rol -->
          <div class="editor-toolbar">
            <div class="editor-rol-select">
              <label class="editor-label"><i class='bx bx-user-circle'></i> Rol a editar:</label>
              <select [(ngModel)]="editorRol" (ngModelChange)="cargarMenuEditor()" class="select-rol select-lg">
                <option value="">— Seleccione un rol —</option>
                @for (r of roles; track r.idrol) {
                  <option [value]="r.idrol">{{ r.idrol }} — {{ r.nombre }}</option>
                }
              </select>
            </div>
            @if (editorRol) {
              <div class="editor-tipo-select">
                <label class="editor-label"><i class='bx bx-layout'></i> Tipo de menú:</label>
                <select [(ngModel)]="editorTipoMenu" class="select-rol select-lg">
                  @for (t of TIPOS_MENU; track t.value) {
                    <option [value]="t.value">
                      {{ t.label }}
                    </option>
                  }
                </select>
              </div>
              <div class="editor-actions">
                <button class="btn-reset" (click)="resetearADefault()" title="Restaurar configuración por defecto">
                  <i class='bx bx-reset'></i> Restaurar default
                </button>
                <button class="btn-guardar" (click)="guardarMenu()" [disabled]="guardando()">
                  @if (guardando()) { <i class='bx bx-loader-alt bx-spin'></i> Guardando... }
                  @else { <i class='bx bx-save'></i> Guardar cambios }
                </button>
              </div>
            }
          </div>

          @if (!editorRol) {
            <div class="editor-hint">
              <i class='bx bx-info-circle'></i>
              Selecciona un rol para configurar su menú. Puedes elegir entre:
              <b>Accordion</b> (grupos colapsables), <b>Nav</b> (menú vertical con submenús),
              <b>List</b> (lista plana), o <b>Default</b> (menú tradicional por roles).
            </div>
          }

          @if (editorRol && cargandoEditor()) {
            <div class="loading-state"><i class='bx bx-loader-alt bx-spin'></i> Cargando...</div>
          }

          @if (editorRol && !cargandoEditor()) {
            <div class="editor-grupos">
              @for (grupo of editorMenu; track grupo.id; let gi = $index) {
                <div class="editor-grupo-card" [class.inactivo]="!grupo.activo">

                  <!-- Header del grupo -->
                  <div class="editor-grupo-header">
                    <label class="toggle-switch" [title]="grupo.activo ? 'Grupo visible' : 'Grupo oculto'">
                      <input type="checkbox" [(ngModel)]="grupo.activo">
                      <span class="slider"></span>
                    </label>
                    <span class="grupo-icono"><i [class]="grupo.icono"></i></span>
                    <input type="text" [(ngModel)]="grupo.label" class="input-grupo-label" placeholder="Nombre del grupo">
                    <input type="text" [(ngModel)]="grupo.icono" class="input-grupo-icono" placeholder="Clase icono">
                    <!-- Selector de tipo por grupo -->
                    <select [(ngModel)]="grupo.tipo" class="select-grupo-tipo" title="Tipo de menú para este grupo">
                      @for (t of TIPOS_MENU; track t.value) {
                        <option [value]="t.value">{{ t.label }}</option>
                      }
                    </select>
                    <div class="grupo-orden-btns">
                      <button class="btn-orden" (click)="moverGrupo(gi, -1)" [disabled]="gi === 0" title="Subir"><i class='bx bx-up-arrow-alt'></i></button>
                      <button class="btn-orden" (click)="moverGrupo(gi, 1)" [disabled]="gi === editorMenu.length - 1" title="Bajar"><i class='bx bx-down-arrow-alt'></i></button>
                    </div>
                  </div>

                  <!-- Items del grupo -->
                  <div class="editor-items">
                    @for (item of grupo.items; track item.id; let ii = $index) {
                      <div class="editor-item-row" [class.inactivo]="!item.activo" [class.has-submenu]="item.submenu && item.submenu.length > 0">
                        <label class="toggle-switch sm">
                          <input type="checkbox" [(ngModel)]="item.activo">
                          <span class="slider"></span>
                        </label>
                        <span class="item-icono"><i [class]="item.icono"></i></span>
                        <span class="item-nombre">{{ item.nombre }}</span>
                        @if (item.submenu && item.submenu.length > 0) {
                          <span class="item-submenu-badge" title="Tiene {{ item.submenu.length }} subitems">
                            <i class='bx bx-collection'></i> {{ item.submenu.length }}
                          </span>
                        } @else {
                          <code class="item-ruta">{{ item.ruta }}</code>
                        }
                        <div class="item-orden-btns">
                          <button class="btn-orden sm" (click)="moverItem(grupo, ii, -1)" [disabled]="ii === 0"><i class='bx bx-up-arrow-alt'></i></button>
                          <button class="btn-orden sm" (click)="moverItem(grupo, ii, 1)" [disabled]="ii === grupo.items.length - 1"><i class='bx bx-down-arrow-alt'></i></button>
                        </div>
                      </div>
                    }

                    <!-- Agregar item existente al grupo -->
                    <div class="add-item-row">
                      <select class="select-add-item" [(ngModel)]="itemsAAgregar[grupo.id]">
                        <option value="">+ Agregar módulo a este grupo...</option>
                        @for (m of modulosDisponibles(grupo); track m.id) {
                          <option [value]="m.id">{{ m.nombre }}</option>
                        }
                      </select>
                      <button class="btn-add-item" (click)="agregarItem(grupo)" [disabled]="!itemsAAgregar[grupo.id]">
                        <i class='bx bx-plus'></i>
                      </button>
                    </div>
                  </div>

                </div>
              }
            </div>

            <!-- Preview en vivo -->
            <div class="preview-panel">
              <div class="preview-header">
                <i class='bx bx-show'></i> 
                Preview: {{ editorTipoMenuLabel }}
                <span class="preview-badge">{{ editorTipoMenu }}</span>
              </div>
              <div class="preview-sidebar">
                <app-dynamic-menu
                  [menuType]="editorTipoMenu"
                  [menuGroups]="editorMenu"
                  [contadorNotificaciones]="3">
                </app-dynamic-menu>
              </div>
            </div>
          }

        </div>
      }

    </div>
  `,
  styles: [`
    .menus-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
    .page-title { font-size: 18px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; margin: 0 0 4px; }
    .page-subtitle { color: #666; font-size: 13px; margin: 0; }
    .stats-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .stat-chip { background: #f0f4ff; color: #3a5bd9; padding: 4px 12px; border-radius: 20px; font-size: 12px; border: 1px solid #c8d5ff; }
    /* Tabs */
    .tabs-bar { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 2px solid #e8e8e8; }
    .tab-btn { padding: 8px 18px; border: none; background: transparent; font-size: 13px; font-weight: 500; color: #666; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .tab-btn:hover { color: #1a73e8; }
    .tab-btn.active { color: #1a73e8; border-bottom-color: #1a73e8; font-weight: 600; }
    /* Filtros */
    .filtros-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; background: #fff; padding: 12px 16px; border-radius: 8px; border: 1px solid #e8e8e8; }
    .filtro-search { display: flex; align-items: center; gap: 6px; background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 6px 10px; flex: 1; min-width: 180px; }
    .filtro-search i { color: #888; font-size: 15px; }
    .input-search { border: none; background: transparent; outline: none; font-size: 13px; width: 100%; color: #333; }
    .filtro-label { font-size: 12px; color: #666; white-space: nowrap; }
    .select-rol { border: 1px solid #e0e0e0; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #333; background: #f8f9fa; outline: none; cursor: pointer; }
    .select-lg { font-size: 13px; padding: 8px 12px; min-width: 260px; }
    .filtro-roles, .filtro-categoria { display: flex; align-items: center; gap: 8px; }
    .btn-limpiar { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: #fff0f0; color: #c0392b; border: 1px solid #f5c6c6; border-radius: 6px; font-size: 12px; cursor: pointer; }
    /* Tabla */
    .categoria-card { background: #fff; border-radius: 10px; border: 1px solid #e8e8e8; margin-bottom: 20px; overflow: hidden; }
    .categoria-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: #f8f9fa; border-bottom: 1px solid #e8e8e8; }
    .cat-icon { font-size: 18px; color: #555; }
    .cat-titulo { margin: 0; font-size: 14px; font-weight: 600; color: #333; flex: 1; }
    .cat-count { background: #e8f0fe; color: #1a73e8; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; }
    .tabla-wrapper { overflow-x: auto; }
    .tabla-menus { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .tabla-menus th { background: #fafafa; padding: 8px 10px; text-align: center; font-weight: 600; color: #666; border-bottom: 2px solid #eee; white-space: nowrap; }
    .tabla-menus td { padding: 8px 10px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .tabla-menus tr:last-child td { border-bottom: none; }
    .tabla-menus tr:hover td { background: #fafcff; }
    .col-modulo { min-width: 200px; text-align: left !important; }
    .col-ruta { min-width: 200px; text-align: left !important; }
    .col-rol { min-width: 80px; }
    .cell-modulo { display: flex; align-items: center; gap: 8px; }
    .mod-icon { font-size: 15px; color: #888; min-width: 18px; }
    .mod-nombre { color: #333; font-weight: 500; }
    .ruta-code { font-size: 11px; color: #1a73e8; background: #e8f0fe; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    .rol-badge-th { font-size: 10px; font-weight: 700; padding: 2px 5px; border-radius: 4px; font-family: monospace; display: inline-block; }
    .cell-acceso { text-align: center; }
    .acceso-si { color: #1e8449; font-weight: 700; font-size: 14px; }
    .acceso-no { color: #ddd; font-size: 14px; }
    .empty-state { text-align: center; padding: 40px; color: #aaa; }
    .empty-state i { font-size: 40px; display: block; margin-bottom: 8px; }
    .leyenda-roles { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 8px; padding: 12px 16px; background: #fff; border-radius: 8px; border: 1px solid #e8e8e8; }
    .leyenda-titulo { font-size: 12px; font-weight: 600; color: #555; display: flex; align-items: center; gap: 4px; margin-right: 4px; }
    .leyenda-chip { font-size: 11px; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
    /* Editor */
    .editor-container { display: flex; gap: 20px; flex-wrap: wrap; }
    .editor-toolbar { display: flex; align-items: center; gap: 16px; background: #fff; padding: 14px 16px; border-radius: 8px; border: 1px solid #e8e8e8; margin-bottom: 16px; flex-wrap: wrap; width: 100%; }
    .editor-label { font-size: 13px; font-weight: 600; color: #555; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
    .editor-rol-select { display: flex; align-items: center; gap: 10px; flex: 1; }
    .editor-tipo-select { display: flex; align-items: center; gap: 10px; }
    .editor-actions { display: flex; gap: 8px; margin-left: auto; }
    .btn-guardar { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #1a73e8; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-guardar:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-reset { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #fff8e1; color: #e65100; border: 1px solid #ffcc80; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .editor-hint { background: #e8f0fe; border: 1px solid #c5d8ff; border-radius: 8px; padding: 14px 18px; color: #1a56c7; font-size: 13px; display: flex; align-items: center; gap: 8px; width: 100%; }
    .loading-state { text-align: center; padding: 40px; color: #888; font-size: 14px; width: 100%; }
    .editor-grupos { flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 12px; }
    .editor-grupo-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; }
    .editor-grupo-card.inactivo { opacity: 0.55; }
    .editor-grupo-header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f8f9fa; border-bottom: 1px solid #eeeeee; }
    .grupo-icono { font-size: 16px; color: #555; }
    .input-grupo-label { border: 1px solid #e0e0e0; border-radius: 5px; padding: 5px 8px; font-size: 13px; font-weight: 600; color: #333; flex: 1; }
    .input-grupo-icono { border: 1px solid #e0e0e0; border-radius: 5px; padding: 5px 8px; font-size: 11px; color: #666; width: 160px; font-family: monospace; }
    .grupo-orden-btns { display: flex; gap: 2px; }
    .btn-orden { padding: 3px 5px; border: 1px solid #e0e0e0; background: #fff; border-radius: 4px; cursor: pointer; font-size: 13px; color: #555; }
    .btn-orden:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-orden.sm { font-size: 11px; padding: 2px 4px; }
    .editor-items { padding: 8px 0; }
    .editor-item-row { display: flex; align-items: center; gap: 10px; padding: 6px 14px; border-bottom: 1px solid #f5f5f5; }
    .editor-item-row:last-child { border-bottom: none; }
    .editor-item-row.inactivo { opacity: 0.45; }
    .item-icono { font-size: 14px; color: #888; min-width: 18px; }
    .item-nombre { flex: 1; font-size: 13px; color: #333; }
    .item-ruta { font-size: 11px; color: #888; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    .item-submenu-badge { font-size: 11px; color: #238664; background: #e8f5e9; padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; gap: 4px; }
    .select-grupo-tipo { padding: 5px 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 11px; background: #f8f9fa; cursor: pointer; max-width: 120px; }
    .editor-item-row.has-submenu { background: #f0f9ff; }
    .item-orden-btns { display: flex; gap: 2px; }
    .add-item-row { display: flex; gap: 8px; padding: 8px 14px; background: #fafafa; border-top: 1px solid #f0f0f0; }
    .select-add-item { flex: 1; border: 1px dashed #aaa; border-radius: 6px; padding: 5px 8px; font-size: 12px; color: #555; background: #fff; outline: none; }
    .btn-add-item { padding: 5px 10px; background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .btn-add-item:disabled { opacity: 0.4; cursor: not-allowed; }
    /* Toggle switch */
    .toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; cursor: pointer; flex-shrink: 0; }
    .toggle-switch.sm { width: 32px; height: 18px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; inset: 0; background: #ccc; border-radius: 22px; transition: .25s; }
    .slider::before { content: ''; position: absolute; height: 16px; width: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .25s; }
    .toggle-switch.sm .slider::before { height: 12px; width: 12px; left: 3px; bottom: 3px; }
    input:checked + .slider { background: #1a73e8; }
    input:checked + .slider::before { transform: translateX(18px); }
    .toggle-switch.sm input:checked + .slider::before { transform: translateX(14px); }
    /* Preview */
    .preview-panel { width: 260px; flex-shrink: 0; }
    .preview-header { font-size: 12px; font-weight: 600; color: #555; padding: 8px 12px; background: #f8f9fa; border-radius: 8px 8px 0 0; border: 1px solid #e0e0e0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .preview-badge { font-size: 10px; padding: 2px 8px; border-radius: 12px; background: #238664; color: #fff; margin-left: auto; text-transform: uppercase; }
    .preview-sidebar { background: #238664; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; padding: 8px 0; min-height: 300px; max-height: 500px; overflow-y: auto; }
    .preview-group { margin: 2px 6px; }
    .preview-group-header { display: flex; align-items: center; gap: 6px; padding: 7px 8px; color: #fff; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: default; }
    .preview-group-header i:last-child { margin-left: auto; }
    .preview-items { padding: 2px 0 4px 22px; }
    .preview-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; color: rgba(255,255,255,0.85); font-size: 11px; border-radius: 4px; }
  `]
})
export class AdminMenusLayoutComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly alertService = inject(AlertService);
  private readonly layoutConfig = inject(LayoutConfigService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly baseUrl = environment.baseUrl;
  private readonly adminUser = JSON.parse(localStorage.getItem('ADMIN_USER') || '{}');

  // ── Tab vista ──
  tabActivo = 'vista';
  busqueda = '';
  rolFiltro = '';
  categoriaFiltro = '';
  roles = ROLES_SISTEMA;
  categorias = CATEGORIAS_ORDEN;

  get totalMenus() { return MENUS_LAYOUT.length; }
  get totalRoles() { return ROLES_SISTEMA.length; }

  // ── Tab editor ──
  editorRol = '';
  editorTipoMenu: MenuType = 'accordion';
  editorMenu: AccordionGroupConfig[] = [];
  itemsAAgregar: Record<string, string> = {};
  cargandoEditor = signal(false);
  guardando = signal(false);
  rolesConAccordion: typeof ROLES_SISTEMA = [];
  private editorIniciado = false;

  // Getter para el label del tipo de menú seleccionado
  get editorTipoMenuLabel(): string {
    const tipo = this.TIPOS_MENU.find(t => t.value === this.editorTipoMenu);
    return tipo?.label || 'Accordion';
  }

  // Tipos de menú disponibles
  readonly TIPOS_MENU: { value: MenuType; label: string; icon: string }[] = [
    { value: 'accordion', label: 'Accordion (Grupos colapsables)', icon: 'bx bx-list-minus' },
    { value: 'nav', label: 'Nav (Menú vertical con submenús)', icon: 'bx bx-menu' },
    { value: 'list', label: 'List (Lista plana)', icon: 'bx bx-list-ul' },
    { value: 'default', label: 'Default (Menú tradicional)', icon: 'bx bx-sidebar' }
  ];

  async ngOnInit() {
    await this.cargarRolesConAccordion();
  }

  async cargarRolesConAccordion() {
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configuracionpermiso/listar-config-permisos`, {})
      );
      const permisos: { idrol: string; clave: string; valor: string }[] = Array.isArray(resp) ? resp : [];
      const rolesIds = new Set(
        permisos.filter(p => p.clave === 'LAYOUT_ACCORDION' && p.valor === '1').map(p => p.idrol)
      );
      this.rolesConAccordion = ROLES_SISTEMA.filter(r => rolesIds.has(r.idrol));
    } catch { this.rolesConAccordion = []; }
    this.cdr.markForCheck();
  }

  initEditor() {
    if (!this.editorIniciado) { this.editorIniciado = true; }
  }

  async cargarMenuEditor() {
    if (!this.editorRol) return;
    this.cargandoEditor.set(true);
    this.cdr.markForCheck();
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configuracionpermiso/listar-config-permisos`, {})
      );
      const permisos: { idrol: string; clave: string; valor: string }[] = Array.isArray(resp) ? resp : [];
      
      // Cargar tipo de menú
      const tipoEntry = permisos.find(p => p.idrol === this.editorRol && p.clave === 'LAYOUT_MENU_TYPE');
      this.editorTipoMenu = (tipoEntry?.valor as MenuType) || 'accordion';
      
      // Cargar configuración del menú
      const entry = permisos.find(p => p.idrol === this.editorRol && (p.clave === `ACCORDION_MENU_${this.editorRol}` || p.clave === 'ACCORDION_MENU_CONFIG'));
      if (entry) {
        this.editorMenu = JSON.parse(entry.valor) as AccordionGroupConfig[];
      } else {
        this.editorMenu = JSON.parse(JSON.stringify(ACCORDION_DEFAULT));
      }
    } catch {
      this.editorTipoMenu = 'accordion';
      this.editorMenu = JSON.parse(JSON.stringify(ACCORDION_DEFAULT));
    }
    this.itemsAAgregar = {};
    this.cargandoEditor.set(false);
    this.cdr.markForCheck();
  }

  async guardarMenu() {
    if (!this.editorRol) return;
    this.guardando.set(true);
    try {
      const requests = [];
      
      // 1. Guardar tipo de menú
      requests.push(
        lastValueFrom(
          this.http.post(`${this.baseUrl}/api/configuracionpermiso/guardar-config-permiso`, {
            idrol: this.editorRol,
            clave: 'LAYOUT_MENU_TYPE',
            valor: this.editorTipoMenu,
            descripcion: `Tipo de menú para ${this.editorRol}`,
            usuarioModifica: this.adminUser?.documentoidentidad || this.adminUser?.usuario || 'ADMIN'
          })
        )
      );
      
      // 2. Guardar flag LAYOUT_ACCORDION
      requests.push(
        lastValueFrom(
          this.http.post(`${this.baseUrl}/api/configuracionpermiso/guardar-config-permiso`, {
            idrol: this.editorRol,
            clave: 'LAYOUT_ACCORDION',
            valor: this.editorTipoMenu === 'accordion' ? '1' : '0',
            descripcion: `Usa accordion: ${this.editorTipoMenu === 'accordion'}`,
            usuarioModifica: this.adminUser?.documentoidentidad || this.adminUser?.usuario || 'ADMIN'
          })
        )
      );
      
      // 3. Guardar configuración del menú (solo para accordion y nav)
      if (this.editorTipoMenu === 'accordion' || this.editorTipoMenu === 'nav' || this.editorTipoMenu === 'list') {
        const valor = JSON.stringify(this.editorMenu);
        requests.push(
          lastValueFrom(
            this.http.post(`${this.baseUrl}/api/configuracionpermiso/guardar-config-permiso`, {
              idrol: this.editorRol,
              clave: 'ACCORDION_MENU_CONFIG',
              valor,
              descripcion: `Configuración de menú ${this.editorTipoMenu} para ${this.editorRol}`,
              usuarioModifica: this.adminUser?.documentoidentidad || this.adminUser?.usuario || 'ADMIN'
            })
          )
        );
      }
      
      await Promise.all(requests);
      
      this.layoutConfig.invalidar();
      await this.cargarRolesConAccordion();
      this.alertService.showAlert('Guardado', `Menú de ${this.editorRol} actualizado correctamente.`, 'success');
    } catch (err) {
      console.error('Error guardando menú:', err);
      this.alertService.showAlert('Error', 'No se pudo guardar el menú.', 'error');
    }
    this.guardando.set(false);
    this.cdr.markForCheck();
  }

  resetearADefault() {
    this.editorMenu = JSON.parse(JSON.stringify(ACCORDION_DEFAULT));
    this.itemsAAgregar = {};
    this.cdr.markForCheck();
  }

  moverGrupo(idx: number, dir: number) {
    const arr = this.editorMenu;
    const nuevo = idx + dir;
    if (nuevo < 0 || nuevo >= arr.length) return;
    [arr[idx], arr[nuevo]] = [arr[nuevo], arr[idx]];
    this.editorMenu = [...arr];
    this.cdr.markForCheck();
  }

  moverItem(grupo: AccordionGroupConfig, idx: number, dir: number) {
    const arr = grupo.items;
    const nuevo = idx + dir;
    if (nuevo < 0 || nuevo >= arr.length) return;
    [arr[idx], arr[nuevo]] = [arr[nuevo], arr[idx]];
    grupo.items = [...arr];
    this.cdr.markForCheck();
  }

  /** Módulos del catálogo que aún no están en este grupo */
  modulosDisponibles(grupo: AccordionGroupConfig): MenuItem[] {
    const idsEnGrupo = new Set(grupo.items.map(i => i.id));
    return MENUS_LAYOUT.filter(m => !idsEnGrupo.has(m.id));
  }

  agregarItem(grupo: AccordionGroupConfig) {
    const id = this.itemsAAgregar[grupo.id];
    if (!id) return;
    const modulo = MENUS_LAYOUT.find(m => m.id === id);
    if (!modulo) return;
    grupo.items = [...grupo.items, {
      id: modulo.id,
      nombre: modulo.nombre,
      icono: modulo.icono,
      ruta: `./${modulo.id}`,
      activo: true,
      orden: grupo.items.length + 1,
    }];
    this.itemsAAgregar[grupo.id] = '';
    this.cdr.markForCheck();
  }

  // ── Vista por roles ──
  getCatIcono(cat: string): string { return CATEGORIA_ICONOS[cat] ?? 'bx bx-menu'; }
  tieneAcceso(m: MenuItem, idrol: string): boolean { return m.roles.includes(idrol) || m.roles.includes('ALL'); }

  menusFiltrados(): MenuItem[] {
    return MENUS_LAYOUT.filter(m => {
      const b = !this.busqueda || m.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) || m.id.toLowerCase().includes(this.busqueda.toLowerCase());
      const r = !this.rolFiltro || this.tieneAcceso(m, this.rolFiltro);
      const c = !this.categoriaFiltro || m.categoria === this.categoriaFiltro;
      return b && r && c;
    });
  }

  categoriasFiltradas(): string[] {
    const menus = this.menusFiltrados();
    return CATEGORIAS_ORDEN.filter(c => menus.some(m => m.categoria === c));
  }

  menusPorCategoria(cat: string): MenuItem[] { return this.menusFiltrados().filter(m => m.categoria === cat); }
  limpiarFiltros() { this.busqueda = ''; this.rolFiltro = ''; this.categoriaFiltro = ''; }
}
