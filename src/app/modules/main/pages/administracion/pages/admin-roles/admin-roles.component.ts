import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-roles.component.html',
  styleUrls: ['./admin-roles.component.scss']
})
export class AdminRolesComponent {

  roles: { id: number; nombre: string; estado: string }[] = [
    { id: 1, nombre: 'Administrador', estado: 'ACTIVO' },
    { id: 2, nombre: 'Aprobador', estado: 'ACTIVO' },
    { id: 3, nombre: 'Consulta', estado: 'INACTIVO' }
  ];

  showModal = false;
  isEdit = false;

  form: { id?: number; nombre: string; estado: string } = {
    nombre: '',
    estado: 'ACTIVO'
  };

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
  editarRol(rol: { id: number; nombre: string; estado: string }) {
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

