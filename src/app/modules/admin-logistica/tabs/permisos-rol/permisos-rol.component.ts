import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import {
  PermisosRolService,
  MODULOS_MENU,
  ROLES_SISTEMA,
  ModuloMenu,
} from '../../services/permisos-rol.service';

interface FilaPermiso {
  modulo: ModuloMenu;
  permisosPorRol: Record<string, boolean>;
  editado: boolean;
}

@Component({
  selector: 'app-permisos-rol',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permisos-rol.component.html',
  styleUrl: './permisos-rol.component.scss',
})
export class PermisosRolComponent implements OnInit {
  private authService = inject(AdminLogisticaAuthService);
  private permisosService = inject(PermisosRolService);

  roles = ROLES_SISTEMA;
  filas = signal<FilaPermiso[]>([]);
  loading = signal(true);
  guardando = signal(false);
  rolSeleccionado = signal<string | null>(null);
  mensajeExito = signal('');
  mensajeError = signal('');

  ngOnInit() {
    this.cargarTodosLosPermisos();
  }

  async cargarTodosLosPermisos() {
    this.loading.set(true);
    this.mensajeError.set('');

    const cargas = this.roles.map(r =>
      this.permisosService.cargarPermisosParaRol(r.idrol).toPromise()
    );

    await Promise.allSettled(cargas);

    const filas: FilaPermiso[] = MODULOS_MENU.map(modulo => {
      const permisosPorRol: Record<string, boolean> = {};
      this.roles.forEach(r => {
        permisosPorRol[r.idrol] = this.permisosService.tienePermiso(r.idrol, modulo.clavePermiso);
      });
      return { modulo, permisosPorRol, editado: false };
    });

    this.filas.set(filas);
    this.loading.set(false);
  }

  togglePermiso(fila: FilaPermiso, idrol: string) {
    fila.permisosPorRol[idrol] = !fila.permisosPorRol[idrol];
    fila.editado = true;
    this.filas.update(f => [...f]);
  }

  seleccionarRol(idrol: string) {
    this.rolSeleccionado.set(this.rolSeleccionado() === idrol ? null : idrol);
  }

  toggleTodoRol(idrol: string, valor: boolean) {
    this.filas.update(filas => filas.map(f => ({
      ...f,
      permisosPorRol: { ...f.permisosPorRol, [idrol]: valor },
      editado: true,
    })));
  }

  hayEditados(): boolean {
    return this.filas().some(f => f.editado);
  }

  async guardarCambios() {
    if (!this.hayEditados()) return;
    this.guardando.set(true);
    this.mensajeExito.set('');
    this.mensajeError.set('');

    const usuario = this.authService.currentUser()?.usuario ?? 'sistema';
    const filaEditadas = this.filas().filter(f => f.editado);

    const permisosPorRol: Record<string, Record<string, boolean>> = {};
    for (const fila of filaEditadas) {
      for (const idrol of Object.keys(fila.permisosPorRol)) {
        if (!permisosPorRol[idrol]) permisosPorRol[idrol] = {};
        permisosPorRol[idrol][fila.modulo.clavePermiso] = fila.permisosPorRol[idrol];
      }
    }

    try {
      const saves = Object.entries(permisosPorRol).map(([idrol, permisos]) =>
        this.permisosService.guardarPermisosLote(idrol, permisos, usuario).toPromise()
      );
      await Promise.all(saves);

      this.filas.update(filas => filas.map(f => ({ ...f, editado: false })));
      this.mensajeExito.set('Permisos guardados correctamente.');
      setTimeout(() => this.mensajeExito.set(''), 3500);
    } catch {
      this.mensajeError.set('Error al guardar algunos permisos. Revisa la consola.');
    } finally {
      this.guardando.set(false);
    }
  }

  descartarCambios() {
    this.cargarTodosLosPermisos();
  }

  getRolNombre(idrol: string): string {
    return this.roles.find(r => r.idrol === idrol)?.nombre ?? idrol;
  }

  contarPermisosActivos(idrol: string): number {
    return this.filas().filter(f => f.permisosPorRol[idrol]).length;
  }
}
