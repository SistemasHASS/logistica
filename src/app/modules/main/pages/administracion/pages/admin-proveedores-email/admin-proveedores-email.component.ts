import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminProveedoresEmailService } from '../../services/admin-proveedores-email.service';

interface ProveedorEmail {
  id?: number;
  idEmpresa: string;
  empresa: string;
  ruc: string;
  nombreProveedor: string;
  email: string;
  emailCopia: string;
  tipoDocumento: string;
  estado: string;
}

@Component({
  selector: 'app-admin-proveedores-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-proveedores-email.component.html',
  styleUrls: ['./admin-proveedores-email.component.scss'],
})
export class AdminProveedoresEmailComponent implements OnInit {

  proveedores: ProveedorEmail[] = [
    { id: 1, idEmpresa: 'EMP001', empresa: 'Hass Perú', ruc: '20123456789', nombreProveedor: 'Proveedor Alpha SAC', email: 'compras@alpha.com', emailCopia: 'gerencia@alpha.com', tipoDocumento: 'OC', estado: 'ACTIVO' },
    { id: 2, idEmpresa: 'EMP001', empresa: 'Hass Perú', ruc: '20987654321', nombreProveedor: 'Servicios Beta EIRL', email: 'admin@beta.pe', emailCopia: '', tipoDocumento: 'OS', estado: 'ACTIVO' },
    { id: 3, idEmpresa: 'EMP001', empresa: 'Hass Perú', ruc: '20555444333', nombreProveedor: 'Logística Gamma SA', email: 'pedidos@gamma.com', emailCopia: 'soporte@gamma.com', tipoDocumento: 'OC,OS', estado: 'ACTIVO' },
  ];

  filteredProveedores: ProveedorEmail[] = [];
  searchText = '';
  showModal = false;
  isEdit = false;
  loading = false;

  empresas = ['Hass Perú', 'Hass Agro', 'Hass International'];
  tiposDocumento = [
    { value: 'OC', label: 'Orden de Compra (OC)' },
    { value: 'OS', label: 'Orden de Servicio (OS)' },
    { value: 'OC,OS', label: 'OC y OS' },
  ];

  form: ProveedorEmail = {
    idEmpresa: 'EMP001',
    empresa: 'Hass Perú',
    ruc: '',
    nombreProveedor: '',
    email: '',
    emailCopia: '',
    tipoDocumento: 'OC',
    estado: 'ACTIVO',
  };

  constructor(private svc: AdminProveedoresEmailService) {}

  ngOnInit(): void {
    this.filteredProveedores = [...this.proveedores];
  }

  filtrar() {
    const q = this.searchText.toLowerCase();
    this.filteredProveedores = this.proveedores.filter(p =>
      p.nombreProveedor.toLowerCase().includes(q) ||
      p.ruc.includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.empresa.toLowerCase().includes(q)
    );
  }

  openCreate() {
    this.isEdit = false;
    this.form = { idEmpresa: 'EMP001', empresa: 'Hass Perú', ruc: '', nombreProveedor: '', email: '', emailCopia: '', tipoDocumento: 'OC', estado: 'ACTIVO' };
    this.showModal = true;
  }

  openEdit(p: ProveedorEmail) {
    this.isEdit = true;
    this.form = { ...p };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  save() {
    if (!this.form.nombreProveedor.trim() || !this.form.email.trim() || !this.form.ruc.trim()) return;

    if (this.isEdit) {
      const idx = this.proveedores.findIndex(p => p.id === this.form.id);
      if (idx >= 0) this.proveedores[idx] = { ...this.form };
    } else {
      this.form.id = Date.now();
      this.proveedores.push({ ...this.form });
    }
    this.filtrar();
    this.closeModal();
  }

  toggleEstado(p: ProveedorEmail) {
    p.estado = p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.filtrar();
  }
}
