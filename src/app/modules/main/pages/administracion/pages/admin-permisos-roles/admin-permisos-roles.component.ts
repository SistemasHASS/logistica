import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';
import { AlertService } from '@/app/shared/alertas/alerts.service';

interface ConfigPermiso {
  idPermiso?: number;
  idrol: string;
  clave: string;
  valor: string;
  descripcion: string;
  fechaModificacion?: string;
  usuarioModifica?: string;
}

const ROLES_SISTEMA = [
  { idrol: 'TILOGIST',  nombre: 'Admin Sistema (TI)' },
  { idrol: 'ADLOGIST',  nombre: 'Admin Logística' },
  { idrol: 'JLOLOGIST', nombre: 'Jefe/Coord. Logística' },
  { idrol: 'JEMLOGIST', nombre: 'Jefe Licitaciones/Compras' },
  { idrol: 'LOLOGIST',  nombre: 'Operador Logística' },
  { idrol: 'EMLOGIST',  nombre: 'Operador Licitaciones' },
  { idrol: 'OPLOGIST',  nombre: 'Operativo Campo' },
  { idrol: 'ALLOGIST',  nombre: 'Almacén' },
  { idrol: 'APLOGIST',  nombre: 'Aprobador Consumo' },
  { idrol: 'FINANZAS',  nombre: 'Finanzas' },
  { idrol: 'GERENTE',   nombre: 'Gerente' },
];

const CLAVES_PERMISOS = [
  { clave: 'SKIP_ADJUNTOS_OC', descripcion: 'Omitir validación de adjuntos al enviar OC a aprobación', categoria: 'Órdenes de Compra' },
  { clave: 'SKIP_ADJUNTOS_OS', descripcion: 'Omitir validación de adjuntos al enviar OS a aprobación', categoria: 'Órdenes de Servicio' },
  { clave: 'LAYOUT_ACCORDION', descripcion: 'Usar navegación tipo accordion (menús agrupados) en el sidebar', categoria: 'Presentación & Layout' },
];

@Component({
  selector: 'app-admin-permisos-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="permisos-container">
      <div class="page-header">
        <h4 class="page-title"><i class='bx bx-shield-quarter'></i> Permisos por Rol</h4>
        <p class="page-subtitle">Configure qué validaciones puede omitir cada rol del sistema.</p>
      </div>

      @if (cargando()) {
        <div class="loading-state">
          <i class='bx bx-loader-alt bx-spin'></i> Cargando permisos...
        </div>
      } @else {
        @for (cat of categorias; track cat) {
          <div class="categoria-section">
            <h6 class="categoria-titulo">
              <i class='bx bx-layer'></i> {{ cat }}
            </h6>
            <div class="table-responsive">
              <table class="tabla-permisos">
                <thead>
                  <tr>
                    <th class="col-rol">Rol</th>
                    @for (p of clavesDeCategoria(cat); track p.clave) {
                      <th class="col-permiso" [title]="p.descripcion">{{ p.descripcion }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (rol of roles; track rol.idrol) {
                    <tr>
                      <td class="cell-rol">
                        <span class="badge-rol">{{ rol.idrol }}</span>
                        <span class="nombre-rol">{{ rol.nombre }}</span>
                      </td>
                      @for (p of clavesDeCategoria(cat); track p.clave) {
                        <td class="cell-toggle">
                          <label class="toggle-switch" [title]="getValor(rol.idrol, p.clave) === '1' ? 'Habilitado — click para deshabilitar' : 'Deshabilitado — click para habilitar'">
                            <input
                              type="checkbox"
                              [checked]="getValor(rol.idrol, p.clave) === '1'"
                              (change)="togglePermiso(rol.idrol, p.clave, p.descripcion, $event)">
                            <span class="slider"></span>
                          </label>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .permisos-container { padding: 20px; }

    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 18px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; margin: 0 0 4px; }
    .page-subtitle { color: #666; font-size: 13px; margin: 0; }

    .loading-state { text-align: center; padding: 40px; color: #888; font-size: 14px; }
    .loading-state i { font-size: 24px; margin-right: 8px; }

    .categoria-section { background: #fff; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 20px; overflow: hidden; }
    .categoria-titulo { background: #f8f9fa; padding: 12px 16px; margin: 0; font-size: 13px; font-weight: 600; color: #555; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; gap: 6px; }

    .table-responsive { overflow-x: auto; }
    .tabla-permisos { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tabla-permisos th { background: #f8f9fa; padding: 10px 16px; text-align: left; font-weight: 600; color: #555; border-bottom: 2px solid #e0e0e0; white-space: nowrap; }
    .tabla-permisos td { padding: 10px 16px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .tabla-permisos tr:last-child td { border-bottom: none; }
    .tabla-permisos tr:hover td { background: #fafafa; }

    .col-rol { min-width: 220px; }
    .col-permiso { text-align: center; min-width: 200px; font-size: 12px; }
    .cell-rol { display: flex; align-items: center; gap: 8px; }
    .cell-toggle { text-align: center; }

    .badge-rol { background: #e8f0fe; color: #1a73e8; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-family: monospace; white-space: nowrap; }
    .nombre-rol { color: #333; font-size: 13px; }

    .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; inset: 0; background: #ccc; border-radius: 24px; transition: .3s; }
    .slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .3s; }
    input:checked + .slider { background: #1a73e8; }
    input:checked + .slider::before { transform: translateX(20px); }
    .toggle-switch:hover .slider { opacity: 0.9; }
  `]
})
export class AdminPermisosRolesComponent implements OnInit {
  private baseUrl = environment.baseUrl;

  cargando = signal(true);
  permisos: ConfigPermiso[] = [];
  roles = ROLES_SISTEMA;
  categorias: string[] = [...new Set(CLAVES_PERMISOS.map(p => p.categoria))];

  adminUser = JSON.parse(localStorage.getItem('ADMIN_USER') || '{}');

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarPermisos();
  }

  clavesDeCategoria(categoria: string) {
    return CLAVES_PERMISOS.filter(p => p.categoria === categoria);
  }

  getValor(idrol: string, clave: string): string {
    const p = this.permisos.find(x => x.idrol === idrol && x.clave === clave);
    return p?.valor ?? '0';
  }

  async cargarPermisos() {
    this.cargando.set(true);
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/ConfiguracionPermiso/listar-config-permisos`, {})
      );
      this.permisos = Array.isArray(resp) ? resp : [];
    } catch {
      this.alertService.showAlert('Error', 'No se pudieron cargar los permisos.', 'error');
    } finally {
      this.cargando.set(false);
      this.cdr.markForCheck();
    }
  }

  async togglePermiso(idrol: string, clave: string, descripcion: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const valor = checked ? '1' : '0';

    const permisoDef = CLAVES_PERMISOS.find(p => p.clave === clave);
    const rolDef = ROLES_SISTEMA.find(r => r.idrol === idrol);
    const accion = checked ? 'habilitar' : 'deshabilitar';

    const ok = await this.alertService.showConfirm(
      'Confirmar cambio',
      `¿Desea ${accion} "${permisoDef?.descripcion}" para el rol "${rolDef?.nombre}"?`,
      'question'
    );

    if (!ok) {
      // Revertir el toggle visual
      (event.target as HTMLInputElement).checked = !checked;
      return;
    }

    try {
      await lastValueFrom(
        this.http.post(`${this.baseUrl}/api/ConfiguracionPermiso/guardar-config-permiso`, {
          idrol,
          clave,
          valor,
          descripcion,
          usuarioModifica: this.adminUser?.documentoidentidad || this.adminUser?.usuario || 'ADMIN'
        })
      );

      // Actualizar local
      const idx = this.permisos.findIndex(p => p.idrol === idrol && p.clave === clave);
      if (idx >= 0) {
        this.permisos[idx] = { ...this.permisos[idx], valor };
      } else {
        this.permisos.push({ idrol, clave, valor, descripcion });
      }

      this.alertService.showAlert('Éxito', `Permiso ${checked ? 'habilitado' : 'deshabilitado'} correctamente.`, 'success');
      this.cdr.markForCheck();
    } catch {
      (event.target as HTMLInputElement).checked = !checked;
      this.alertService.showAlert('Error', 'No se pudo guardar el cambio.', 'error');
    }
  }
}
