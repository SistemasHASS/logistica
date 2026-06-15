import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { ACCORDION_DEFAULT, AccordionGroupConfig } from '../../../../services/layout-config.service';

interface Rol {
  idrol: string;
  nombre: string;
}

interface ModuloPermiso {
  id: string;
  nombre: string;
  icono: string;
  grupo: string;
  habilitado: boolean;
}

/**
 * Componente para configurar permisos de visibilidad del menú dinámico por rol.
 * Independiente del admin-permisos-roles (que maneja permisos operativos).
 * Este módulo define qué items del menú dinámico puede ver cada rol.
 */
@Component({
  selector: 'app-admin-permisos-menu-dinamico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="permisos-menu-container">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header-left">
          <h4 class="page-title"><i class='bx bx-lock-open-alt'></i> Permisos Menú Dinámico</h4>
          <p class="page-subtitle">Configure qué módulos puede ver cada rol en su menú dinámico</p>
        </div>
        <div class="page-header-right">
          <div class="alert alert-info mb-0 py-1 px-2">
            <small><i class='bx bx-info-circle'></i> JLOLOGIST usa su menú propio (no se configura aquí)</small>
          </div>
        </div>
      </div>

      <!-- Selector de rol -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="d-flex align-items-center gap-3 flex-wrap">
            <label class="fw-semibold text-nowrap"><i class='bx bx-user-circle'></i> Rol:</label>
            <select class="form-select form-select-sm" style="max-width: 320px;" 
                    [(ngModel)]="rolSeleccionado" (change)="cargarPermisos()">
              <option value="">-- Seleccione un rol --</option>
              @for (rol of roles; track rol.idrol) {
                <option [value]="rol.idrol">{{ rol.nombre }} ({{ rol.idrol }})</option>
              }
            </select>
            @if (rolSeleccionado && cambiosPendientes()) {
              <button class="btn btn-sm btn-success ms-auto" (click)="guardarPermisos()" [disabled]="guardando()">
                @if (guardando()) { <i class='bx bx-loader-alt bx-spin'></i> Guardando... }
                @else { <i class='bx bx-save'></i> Guardar cambios }
              </button>
            }
          </div>
        </div>
      </div>

      @if (!rolSeleccionado) {
        <div class="text-center text-muted py-5">
          <i class='bx bx-pointer fs-1'></i>
          <p>Seleccione un rol para configurar sus permisos de menú</p>
        </div>
      }

      @if (rolSeleccionado && cargando()) {
        <div class="text-center py-5">
          <i class='bx bx-loader-alt bx-spin fs-1 text-success'></i>
          <p class="text-muted">Cargando permisos...</p>
        </div>
      }

      @if (rolSeleccionado && !cargando()) {
        <!-- Tabla de permisos por grupo -->
        <div class="row">
          @for (grupo of gruposMenu; track grupo.id) {
            <div class="col-lg-6 col-xl-4 mb-3">
              <div class="card h-100">
                <div class="card-header py-2 d-flex align-items-center gap-2">
                  <i [class]="grupo.icono" class="text-success"></i>
                  <strong class="fs-6">{{ grupo.label }}</strong>
                  <span class="badge bg-secondary ms-auto">{{ contarHabilitados(grupo.id) }}/{{ contarTotal(grupo.id) }}</span>
                </div>
                <div class="card-body p-0">
                  <ul class="list-group list-group-flush">
                    @for (modulo of getModulosPorGrupo(grupo.id); track modulo.id) {
                      <li class="list-group-item d-flex align-items-center gap-2 py-2 px-3">
                        <div class="form-check form-switch mb-0">
                          <input class="form-check-input" type="checkbox" role="switch"
                                 [id]="'mod-' + modulo.id" [(ngModel)]="modulo.habilitado"
                                 (change)="marcarCambio()">
                        </div>
                        <i [class]="modulo.icono" class="text-muted"></i>
                        <label [for]="'mod-' + modulo.id" class="mb-0 flex-grow-1 cursor-pointer"
                               [class.text-decoration-line-through]="!modulo.habilitado"
                               [class.text-muted]="!modulo.habilitado">
                          {{ modulo.nombre }}
                        </label>
                      </li>
                    }
                  </ul>
                </div>
                <!-- Toggle todo el grupo -->
                <div class="card-footer py-1 px-3 d-flex gap-2">
                  <button class="btn btn-sm btn-outline-success flex-fill" (click)="toggleGrupo(grupo.id, true)">
                    <i class='bx bx-check-double'></i> Todos
                  </button>
                  <button class="btn btn-sm btn-outline-secondary flex-fill" (click)="toggleGrupo(grupo.id, false)">
                    <i class='bx bx-x'></i> Ninguno
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Resumen -->
        <div class="card mt-2">
          <div class="card-body py-2 px-3 d-flex align-items-center gap-3">
            <small class="text-muted">
              <strong>{{ totalHabilitados() }}</strong> de <strong>{{ totalModulos() }}</strong> módulos habilitados para <strong>{{ rolSeleccionado }}</strong>
            </small>
            @if (cambiosPendientes()) {
              <span class="badge bg-warning text-dark ms-auto">Cambios sin guardar</span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .permisos-menu-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
    .page-title { color: #238664; margin: 0 0 4px 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
    .page-subtitle { color: #666; margin: 0; font-size: 13px; }
    .cursor-pointer { cursor: pointer; }
    .form-check-input:checked { background-color: #238664; border-color: #238664; }
    @media (max-width: 768px) {
      .page-header { flex-direction: column; }
    }
  `]
})
export class AdminPermisosMenuDinamicoComponent {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);

  baseUrl = environment.baseUrl;

  // Roles disponibles (excluyendo JLOLOGIST que usa sistema propio)
  roles: Rol[] = [
    { idrol: 'ADLOGIST', nombre: 'Admin Logística' },
    { idrol: 'TILOGIST', nombre: 'Admin Sistema (TI)' },
    { idrol: 'JEMLOGIST', nombre: 'Jefe Licitaciones/Compras' },
    { idrol: 'LOLOGIST', nombre: 'Operador Logística' },
    { idrol: 'EMLOGIST', nombre: 'Operador Licitaciones' },
    { idrol: 'OPLOGIST', nombre: 'Operativo Campo' },
    { idrol: 'ALLOGIST', nombre: 'Almacén' },
    { idrol: 'APLOGIST', nombre: 'Aprobador Consumo' },
    { idrol: 'FINANZAS', nombre: 'Finanzas' },
    { idrol: 'GERENTE', nombre: 'Gerente' },
  ];

  rolSeleccionado = '';
  gruposMenu: { id: string; label: string; icono: string }[] = [];
  modulos = signal<ModuloPermiso[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  cambiosPendientes = signal(false);

  constructor() {
    // Extraer grupos del ACCORDION_DEFAULT
    this.gruposMenu = ACCORDION_DEFAULT.map(g => ({
      id: g.id,
      label: g.label,
      icono: g.icono
    }));
  }

  async cargarPermisos() {
    if (!this.rolSeleccionado) {
      this.modulos.set([]);
      return;
    }

    this.cargando.set(true);
    this.cambiosPendientes.set(false);

    try {
      // Cargar permisos guardados desde backend
      const response = await lastValueFrom(
        this.http.post<any[]>(`${this.baseUrl}/api/configmenu/listar`, {
          idrol: this.rolSeleccionado
        })
      );

      const permisosGuardados = response || [];
      
      // Buscar si hay una config de ITEMS_VISIBLES guardada
      const itemsConfig = permisosGuardados.find((c: any) => c.clave === 'ITEMS_VISIBLES');
      let itemsHabilitados: string[] | null = null;
      
      if (itemsConfig) {
        try {
          itemsHabilitados = JSON.parse(itemsConfig.valor);
        } catch { /* Si no es JSON válido, habilitar todo */ }
      }

      // Construir lista de módulos desde ACCORDION_DEFAULT
      const modulosList: ModuloPermiso[] = [];
      ACCORDION_DEFAULT.forEach(grupo => {
        grupo.items.forEach(item => {
          modulosList.push({
            id: item.id,
            nombre: item.nombre,
            icono: item.icono,
            grupo: grupo.id,
            // Si no hay config guardada, todos habilitados por defecto
            habilitado: itemsHabilitados ? itemsHabilitados.includes(item.id) : true
          });
        });
      });

      this.modulos.set(modulosList);
    } catch (error) {
      console.error('Error cargando permisos:', error);
      // Fallback: cargar todos habilitados
      const modulosList: ModuloPermiso[] = [];
      ACCORDION_DEFAULT.forEach(grupo => {
        grupo.items.forEach(item => {
          modulosList.push({
            id: item.id, nombre: item.nombre, icono: item.icono,
            grupo: grupo.id, habilitado: true
          });
        });
      });
      this.modulos.set(modulosList);
    } finally {
      this.cargando.set(false);
    }
  }

  async guardarPermisos() {
    if (!this.rolSeleccionado) return;

    this.guardando.set(true);
    try {
      const itemsHabilitados = this.modulos()
        .filter(m => m.habilitado)
        .map(m => m.id);

      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/configmenu/guardar`, {
          idrol: this.rolSeleccionado,
          clave: 'ITEMS_VISIBLES',
          valor: JSON.stringify(itemsHabilitados),
          descripcion: `Módulos visibles del menú dinámico para ${this.rolSeleccionado}`,
          usuarioModifica: 'ADMIN'
        })
      );

      this.alertService.showAlert('Éxito', 'Permisos del menú guardados correctamente', 'success');
      this.cambiosPendientes.set(false);
    } catch (error) {
      console.error('Error guardando permisos:', error);
      this.alertService.showAlertError('Error', 'Error al guardar los permisos del menú');
    } finally {
      this.guardando.set(false);
    }
  }

  getModulosPorGrupo(grupoId: string): ModuloPermiso[] {
    return this.modulos().filter(m => m.grupo === grupoId);
  }

  contarHabilitados(grupoId: string): number {
    return this.modulos().filter(m => m.grupo === grupoId && m.habilitado).length;
  }

  contarTotal(grupoId: string): number {
    return this.modulos().filter(m => m.grupo === grupoId).length;
  }

  totalHabilitados(): number {
    return this.modulos().filter(m => m.habilitado).length;
  }

  totalModulos(): number {
    return this.modulos().length;
  }

  toggleGrupo(grupoId: string, habilitar: boolean) {
    this.modulos.update(modulos =>
      modulos.map(m => m.grupo === grupoId ? { ...m, habilitado: habilitar } : m)
    );
    this.cambiosPendientes.set(true);
  }

  marcarCambio() {
    this.cambiosPendientes.set(true);
  }
}
