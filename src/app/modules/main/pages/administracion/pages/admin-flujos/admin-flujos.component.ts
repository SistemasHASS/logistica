import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-flujos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-flujos.component.html',
  styleUrls: ['./admin-flujos.component.scss'],
})
export class AdminFlujosComponent {

  flujos: { id: number; nombre: string; descripcion: string; niveles: number; estado: string }[] = [
    { id: 1, nombre: 'Flujo de Compras', descripcion: 'Aprobación de órdenes de compra', niveles: 3, estado: 'ACTIVO' },
    { id: 2, nombre: 'Flujo de Logística', descripcion: 'Aprobación de despachos', niveles: 2, estado: 'ACTIVO' },
    { id: 3, nombre: 'Flujo de Almacén', descripcion: 'Aprobación de inventarios', niveles: 2, estado: 'ACTIVO' },
  ];

  showModal = false;
  isEdit = false;

  form: { id?: number; nombre: string; descripcion: string; niveles: number; estado: string } = {
    nombre: '',
    descripcion: '',
    niveles: 1,
    estado: 'ACTIVO'
  };

  openCreate() {
    console.log('Nuevo flujo');
    this.isEdit = false;
    this.form.id = undefined;
    this.form.nombre = '';
    this.form.descripcion = '';
    this.form.niveles = 1;
    this.form.estado = 'ACTIVO';
    this.showModal = true;
  }

  openEdit(flujo: { id: number; nombre: string; descripcion: string; niveles: number; estado: string }) {
    console.log('Editar flujo', flujo);
    this.isEdit = true;
    this.form.nombre = flujo.nombre;
    this.form.descripcion = flujo.descripcion;
    this.form.niveles = flujo.niveles;
    this.form.estado = flujo.estado;
    this.form.id = flujo.id;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  save() {
    if (!this.form.nombre.trim()) return;

    if (this.isEdit) {
      const index = this.flujos.findIndex(f => f.id === this.form.id);
      if (index >= 0) this.flujos[index] = { id: this.form.id!, nombre: this.form.nombre, descripcion: this.form.descripcion, niveles: this.form.niveles, estado: this.form.estado };
    } else {
      this.form.id = Date.now();
      this.flujos.push({ id: this.form.id, nombre: this.form.nombre, descripcion: this.form.descripcion, niveles: this.form.niveles, estado: this.form.estado });
    }

    this.closeModal();
  }
}