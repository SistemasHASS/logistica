import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { lastValueFrom } from 'rxjs';
import { AdminPerfilesService } from '../../services/admin-perfiles.service';
import { AdminRolesService } from '../../services/admin-roles.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

interface Perfil {
  idperfil: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  roles?: { idrol: string }[];
  totalUsuarios?: number;
}

interface RolCatalogo {
  idrol: string;
  descripcion: string;
}

@Component({
  selector: 'app-admin-perfiles',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './admin-perfiles.component.html',
  styleUrls: ['./admin-perfiles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPerfilesComponent implements OnInit {

  perfiles = signal<Perfil[]>([]);
  rolesCatalogo = signal<RolCatalogo[]>([]);
  cargando = signal(false);

  showModal = false;
  isEdit = false;
  guardando = signal(false);
  errorMsg = signal<string | null>(null);

  form: { idperfil?: number; codigo: string; nombre: string; descripcion: string; roles: string[] } = {
    codigo: '', nombre: '', descripcion: '', roles: []
  };

  usuariosPerfil = signal<any[]>([]);
  nuevoUsuario: { ruc: string; nrodocumento: string } = { ruc: '', nrodocumento: '' };
  asignando = signal(false);

  adminUser = JSON.parse(localStorage.getItem('ADMIN_USER') || '{}');
  private get actor(): string {
    return this.adminUser?.documentoidentidad || this.adminUser?.usuario || 'ADMIN';
  }

  constructor(
    private perfilesService: AdminPerfilesService,
    private rolesService: AdminRolesService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPerfiles();
    this.cargarRolesCatalogo();
  }

  cargarPerfiles(): void {
    this.cargando.set(true);
    this.perfilesService.listarPerfiles({ incluirInactivos: true }).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.resultado ? JSON.parse(res.resultado) : []);
        this.perfiles.set(data || []);
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando.set(false);
        this.alertService.showAlert('Error', 'No se pudieron cargar los perfiles.', 'error');
      }
    });
  }

  cargarRolesCatalogo(): void {
    this.rolesService.listarRoles({}).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.resultado ?? []);
        this.rolesCatalogo.set(data.map((r: any) => ({
          idrol: r.nombre ?? r.RolNombre ?? r.id,
          descripcion: r.descripcion ?? r.Descripcion ?? ''
        })));
        this.cdr.markForCheck();
      },
      error: () => { /* catálogo opcional */ }
    });
  }

  openCreate(): void {
    this.isEdit = false;
    this.errorMsg.set(null);
    this.usuariosPerfil.set([]);
    this.form = { codigo: '', nombre: '', descripcion: '', roles: [] };
    this.showModal = true;
  }

  openEdit(perfil: Perfil): void {
    this.isEdit = true;
    this.errorMsg.set(null);
    this.form = {
      idperfil: perfil.idperfil,
      codigo: perfil.codigo,
      nombre: perfil.nombre,
      descripcion: perfil.descripcion,
      roles: (perfil.roles ?? []).map(r => r.idrol),
    };
    this.cargarUsuariosPerfil(perfil.idperfil);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  toggleRol(idrol: string, checked: boolean): void {
    this.form.roles = checked
      ? [...new Set([...this.form.roles, idrol])]
      : this.form.roles.filter(r => r !== idrol);
  }

  hasRol(idrol: string): boolean {
    return this.form.roles.includes(idrol);
  }

  async guardar(): Promise<void> {
    if (!this.form.nombre.trim()) return;
    this.guardando.set(true);
    this.errorMsg.set(null);
    try {
      let idperfil = this.form.idperfil;

      if (this.isEdit && idperfil) {
        const r = await this.perfilesService.actualizarPerfil({
          idperfil, nombre: this.form.nombre, descripcion: this.form.descripcion,
          usuarioModifica: this.actor
        });
        if (r?.exito === false) throw new Error(r.error || 'Error al actualizar');
      } else {
        const r = await this.perfilesService.crearPerfil({
          codigo: this.form.codigo || undefined, nombre: this.form.nombre,
          descripcion: this.form.descripcion, usuarioCreacion: this.actor
        });
        if (r?.exito === false) throw new Error(r.error || 'Error al crear');
        idperfil = r?.idperfil;
      }

      if (idperfil) {
        const r = await this.perfilesService.asignarRolesPerfil({
          idperfil, roles: this.form.roles, usuarioModifica: this.actor
        });
        if (r?.exito === false) throw new Error(r.error || 'Error al asignar roles');
      }

      this.guardando.set(false);
      this.closeModal();
      this.cargarPerfiles();
    } catch (e: any) {
      this.guardando.set(false);
      this.errorMsg.set(e?.message || 'Error al guardar');
      this.cdr.markForCheck();
    }
  }

  async eliminar(perfil: Perfil): Promise<void> {
    const ok = await this.alertService.showConfirm(
      'Eliminar perfil',
      `¿Eliminar el perfil "${perfil.nombre}"? Los usuarios asignados perderán sus roles de perfil.`,
      'warning'
    );
    if (!ok) return;
    try {
      const r = await this.perfilesService.eliminarPerfil({
        idperfil: perfil.idperfil, usuarioModifica: this.actor
      });
      if (r?.exito === false) throw new Error(r.error);
      this.cargarPerfiles();
    } catch (e: any) {
      this.alertService.showAlert('Error', e?.message || 'No se pudo eliminar el perfil.', 'error');
    }
  }

  /* ---- Asignación de usuarios al perfil ---- */

  cargarUsuariosPerfil(idperfil: number): void {
    this.perfilesService.obtenerPerfilPorId({ idperfil }).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.resultado ? JSON.parse(res.resultado) : res);
        this.usuariosPerfil.set(data?.usuarios ?? []);
        this.cdr.markForCheck();
      },
      error: () => this.usuariosPerfil.set([])
    });
  }

  async asignarUsuario(): Promise<void> {
    const { ruc, nrodocumento } = this.nuevoUsuario;
    if (!ruc.trim() || !nrodocumento.trim() || !this.form.idperfil) return;
    this.asignando.set(true);
    try {
      const r = await this.perfilesService.asignarPerfilUsuario({
        ruc: ruc.trim(), nrodocumento: nrodocumento.trim(),
        idperfil: this.form.idperfil, usuarioAsigna: this.actor
      });
      if (r?.exito === false) throw new Error(r.error);
      this.nuevoUsuario = { ruc, nrodocumento: '' };
      this.cargarUsuariosPerfil(this.form.idperfil!);
    } catch (e: any) {
      this.errorMsg.set(e?.message || 'Error al asignar usuario');
    } finally {
      this.asignando.set(false);
      this.cdr.markForCheck();
    }
  }

  async quitarUsuario(u: any): Promise<void> {
    const ok = await this.alertService.showConfirm(
      'Quitar perfil',
      `¿Quitar este perfil al usuario ${u.usuario}?`,
      'question'
    );
    if (!ok) return;
    try {
      const r = await this.perfilesService.quitarPerfilUsuario({
        ruc: u.ruc, usuario: u.usuario,
        idperfil: this.form.idperfil, usuarioModifica: this.actor
      });
      if (r?.exito === false) throw new Error(r.error);
      this.cargarUsuariosPerfil(this.form.idperfil!);
    } catch (e: any) {
      this.errorMsg.set(e?.message || 'Error al quitar usuario');
      this.cdr.markForCheck();
    }
  }
}
