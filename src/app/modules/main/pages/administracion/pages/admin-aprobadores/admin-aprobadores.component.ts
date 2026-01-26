import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-aprobadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-aprobadores.component.html',
  styleUrls: ['./admin-aprobadores.component.scss'],
})
export class AdminAprobadoresComponent {

  aprobadores: { id: number; usuario: string; email: string; flujo: string; nivel: number; estado: string }[] = [
    { id: 1, usuario: 'Juan Pérez', email: 'juan.perez@empresa.com', flujo: 'Flujo de Compras', nivel: 1, estado: 'ACTIVO' },
    { id: 2, usuario: 'María García', email: 'maria.garcia@empresa.com', flujo: 'Flujo de Compras', nivel: 2, estado: 'ACTIVO' },
    { id: 3, usuario: 'Carlos López', email: 'carlos.lopez@empresa.com', flujo: 'Flujo de Logística', nivel: 1, estado: 'ACTIVO' },
  ];

  showModal = false;
  isEdit = false;

  form: { id?: number; usuario: string; email: string; flujo: string; nivel: number; estado: string } = {
    usuario: '',
    email: '',
    flujo: '',
    nivel: 1,
    estado: 'ACTIVO'
  };

  openCreate() {
    console.log('Nuevo aprobador');
    this.isEdit = false;
    this.form.id = undefined;
    this.form.usuario = '';
    this.form.email = '';
    this.form.flujo = '';
    this.form.nivel = 1;
    this.form.estado = 'ACTIVO';
    this.showModal = true;
  }

  openEdit(aprobador: { id: number; usuario: string; email: string; flujo: string; nivel: number; estado: string }) {
    console.log('Editar aprobador', aprobador);
    this.isEdit = true;
    this.form.usuario = aprobador.usuario;
    this.form.email = aprobador.email;
    this.form.flujo = aprobador.flujo;
    this.form.nivel = aprobador.nivel;
    this.form.estado = aprobador.estado;
    this.form.id = aprobador.id;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  save() {
    if (!this.form.usuario.trim() || !this.form.email.trim() || !this.form.flujo.trim()) return;

    if (this.isEdit) {
      const index = this.aprobadores.findIndex(a => a.id === this.form.id);
      if (index >= 0) this.aprobadores[index] = { id: this.form.id!, usuario: this.form.usuario, email: this.form.email, flujo: this.form.flujo, nivel: this.form.nivel, estado: this.form.estado };
    } else {
      this.form.id = Date.now();
      this.aprobadores.push({ id: this.form.id, usuario: this.form.usuario, email: this.form.email, flujo: this.form.flujo, nivel: this.form.nivel, estado: this.form.estado });
    }

    this.closeModal();
  }
}