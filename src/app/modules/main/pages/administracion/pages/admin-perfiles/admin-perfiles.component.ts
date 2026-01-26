import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-perfiles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-perfiles.component.html',
  styleUrls: ['./admin-perfiles.component.scss'],
})
export class AdminPerfilesComponent {

  perfiles: { id: number; nombre: string; descripcion: string; estado: string }[] = [
    { id: 1, nombre: 'Administrador', descripcion: 'Acceso total al sistema', estado: 'ACTIVO' },
    { id: 2, nombre: 'Supervisor', descripcion: 'Supervisión de operaciones', estado: 'ACTIVO' },
    { id: 3, nombre: 'Operador', descripcion: 'Operaciones básicas', estado: 'ACTIVO' },
  ];

  showModal = false;
  isEdit = false;

  form: { id?: number; nombre: string; descripcion: string; estado: string } = {
    nombre: '',
    descripcion: '',
    estado: 'ACTIVO'
  };

  openCreate() {
    console.log('Nuevo perfil');
    this.isEdit = false;
    this.form.id = undefined;
    this.form.nombre = '';
    this.form.descripcion = '';
    this.form.estado = 'ACTIVO';
    this.showModal = true;
  }

  openEdit(perfil: { id: number; nombre: string; descripcion: string; estado: string }) {
    console.log('Editar perfil', perfil);
    this.isEdit = true;
    this.form.nombre = perfil.nombre;
    this.form.descripcion = perfil.descripcion;
    this.form.estado = perfil.estado;
    this.form.id = perfil.id;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  save() {
    if (!this.form.nombre.trim()) return;

    if (this.isEdit) {
      const index = this.perfiles.findIndex(p => p.id === this.form.id);
      if (index >= 0) this.perfiles[index] = { id: this.form.id!, nombre: this.form.nombre, descripcion: this.form.descripcion, estado: this.form.estado };
    } else {
      this.form.id = Date.now();
      this.perfiles.push({ id: this.form.id, nombre: this.form.nombre, descripcion: this.form.descripcion, estado: this.form.estado });
    }

    this.closeModal();
  }
}