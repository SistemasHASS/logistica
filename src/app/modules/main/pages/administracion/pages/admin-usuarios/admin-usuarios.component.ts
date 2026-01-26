import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss'],
})
export class AdminUsuariosComponent {

  usuarios: { id: number; nombre: string; email: string; perfil: string; area: string; estado: string }[] = [
    { id: 1, nombre: 'Juan Pérez', email: 'juan.perez@empresa.com', perfil: 'Administrador', area: 'Logística', estado: 'ACTIVO' },
    { id: 2, nombre: 'María García', email: 'maria.garcia@empresa.com', perfil: 'Supervisor', area: 'Compras', estado: 'ACTIVO' },
    { id: 3, nombre: 'Carlos López', email: 'carlos.lopez@empresa.com', perfil: 'Operador', area: 'Almacén', estado: 'ACTIVO' },
  ];

  showModal = false;
  isEdit = false;

  form: { id?: number; nombre: string; email: string; perfil: string; area: string; estado: string } = {
    nombre: '',
    email: '',
    perfil: '',
    area: '',
    estado: 'ACTIVO'
  };

  openCreate() {
    console.log('Nuevo usuario');
    this.isEdit = false;
    this.form.id = undefined;
    this.form.nombre = '';
    this.form.email = '';
    this.form.perfil = '';
    this.form.area = '';
    this.form.estado = 'ACTIVO';
    this.showModal = true;
  }

  openEdit(usuario: { id: number; nombre: string; email: string; perfil: string; area: string; estado: string }) {
    console.log('Editar usuario', usuario);
    this.isEdit = true;
    this.form.nombre = usuario.nombre;
    this.form.email = usuario.email;
    this.form.perfil = usuario.perfil;
    this.form.area = usuario.area;
    this.form.estado = usuario.estado;
    this.form.id = usuario.id;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  save() {
    if (!this.form.nombre.trim() || !this.form.email.trim()) return;

    if (this.isEdit) {
      const index = this.usuarios.findIndex(u => u.id === this.form.id);
      if (index >= 0) this.usuarios[index] = { id: this.form.id!, nombre: this.form.nombre, email: this.form.email, perfil: this.form.perfil, area: this.form.area, estado: this.form.estado };
    } else {
      this.form.id = Date.now();
      this.usuarios.push({ id: this.form.id, nombre: this.form.nombre, email: this.form.email, perfil: this.form.perfil, area: this.form.area, estado: this.form.estado });
    }

    this.closeModal();
  }
}