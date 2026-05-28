import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import { UsuariosService } from './services/usuarios.service';

export interface UsuarioLogistica {
  id: number;
  usuario: string;
  nombre: string;
  email: string;
  idrol: string;
  rol: string;
  activo: boolean;
  idempresa: string;
  ruc?: string;
  nrodocumento?: string;
  documentoidentidad?: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, TagModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent implements OnInit {
  private authService = inject(AdminLogisticaAuthService);
  private usuariosService = inject(UsuariosService);
  private fb = inject(FormBuilder);

  user = this.authService.currentUser;
  loading = signal(true);
  error = signal('');
  modalVisible = signal(false);
  isEditing = signal(false);

  usuarios = signal<UsuarioLogistica[]>([]);
  selectedUsuario = signal<UsuarioLogistica | null>(null);

  form: FormGroup = this.fb.group({
    id: [null],
    usuario: ['', [Validators.required, Validators.minLength(3)]],
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    idrol: ['', [Validators.required]],
    clave: ['', []],
    activo: [true],
    nrodocumento: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]]
  });

  roles = this.authService.getAvailableRoles();

  ngOnInit() {
    this.cargarUsuarios();
  }

  private cargarUsuarios() {
    this.loading.set(true);
    this.usuariosService.getUsuarios().subscribe({
      next: (data) => {
        // Filtrar usuarios visibles según rol del usuario logueado
        const usuariosVisibles = this.authService.getVisibleUsers(data);
        this.usuarios.set(usuariosVisibles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar usuarios');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  openCreate() {
    this.isEditing.set(false);
    this.form.reset({ activo: true, idrol: '' });
    this.form.get('clave')?.setValidators([Validators.required, Validators.minLength(4)]);
    this.modalVisible.set(true);
  }

  openEdit(usuario: UsuarioLogistica) {
    this.isEditing.set(true);
    this.selectedUsuario.set(usuario);
    this.form.patchValue({
      id: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      idrol: usuario.idrol,
      activo: usuario.activo,
      nrodocumento: usuario.nrodocumento || usuario.documentoidentidad || ''
    });
    this.form.get('clave')?.clearValidators();
    this.form.get('clave')?.setValue('');
    this.modalVisible.set(true);
  }

  closeModal() {
    this.modalVisible.set(false);
    this.selectedUsuario.set(null);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = this.form.value;
    
    // Preparar datos para el backend con mapeo de campos
    const data = {
      ...formData,
      documentoidentidad: formData.nrodocumento,  // Mapear a nombre esperado por SP
      idempresa: this.user()?.idempresa || '',
      ruc: this.user()?.ruc || '',
      creadoPor: this.user()?.usuario || ''
    };
    
    if (this.isEditing()) {
      this.usuariosService.actualizarUsuario(data.id, data).subscribe({
        next: () => {
          this.closeModal();
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.error.set('Error al actualizar usuario');
        }
      });
    } else {
      this.usuariosService.crearUsuario(data).subscribe({
        next: () => {
          this.closeModal();
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error('Error al crear:', err);
          this.error.set('Error al crear usuario');
        }
      });
    }
  }

  toggleActivo(usuario: UsuarioLogistica) {
    const nuevoEstado = !usuario.activo;
    this.usuariosService.cambiarEstado(usuario.id, nuevoEstado).subscribe({
      next: () => {
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
      }
    });
  }

  getRolNombre(idrol: string): string {
    return this.roles.find(r => r.id === idrol)?.nombre || idrol;
  }

  refresh() {
    this.cargarUsuarios();
  }
}
