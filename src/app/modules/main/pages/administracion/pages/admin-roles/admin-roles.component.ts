import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { AdminRolesService } from '../../services/admin-roles.service';

interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: string;
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './admin-roles.component.html',
  styleUrls: ['./admin-roles.component.scss']
})
export class AdminRolesComponent implements OnInit {

  roles: Rol[] = [];
  loading = false;
  error = '';

  showModal = false;
  isEdit = false;

  form: { id?: number; nombre: string; estado: string } = {
    nombre: '',
    estado: 'ACTIVO'
  };

  constructor(private adminRolesService: AdminRolesService) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.loading = true;
    this.error = '';

    this.adminRolesService.listarRoles({}).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.resultado ?? []);
        this.roles = data.map((r: any) => ({
          id: r.id ?? r.RolId,
          nombre: r.nombre ?? r.RolNombre,
          descripcion: r.descripcion ?? r.Descripcion,
          estado: r.estado ?? 'ACTIVO'
        }));
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar roles', err);
        this.error = 'No se pudieron cargar los roles';
        this.loading = false;
      }
    });
  }

  /* =========================
     NUEVO
  ========================== */
  nuevoRol() {
    console.log('Nuevo rol');
    this.isEdit = false;

    this.form.id = undefined;  // o null
    this.form.nombre = '';
    this.form.estado = 'ACTIVO';

    this.showModal = true;
  }

  /* =========================
     EDITAR
  ========================== */
  editarRol(rol: Rol) {
    console.log('Editar rol', rol);
    this.isEdit = true;
    this.form.nombre = rol.nombre;
    this.form.estado = rol.estado;
    this.form.id = rol.id;

    this.showModal = true;
  }

  /* =========================
     GUARDAR
  ========================== */
  guardar() {
    if (!this.form.nombre.trim()) return;

    if (this.isEdit) {
      const index = this.roles.findIndex(r => r.id === this.form.id);
      if (index !== -1) {
        // Aseguramos que id nunca sea null
        this.roles[index] = {
          ...this.roles[index],
          id: this.form.id!,
          nombre: this.form.nombre,
          estado: this.form.estado
        };
      }
    } else {
      // Nuevo rol, asignamos id único
      this.roles.push({
        id: Date.now(),
        nombre: this.form.nombre,
        estado: this.form.estado
      });
    }

    this.cerrarModal();
  }

  cerrarModal() {
    this.showModal = false;
  }
}
