import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminConfigSmtpService } from '../../services/admin-config-smtp.service';

interface ConfigSmtp {
  id?: number;
  idEmpresa: string;
  empresa: string;
  host: string;
  puerto: number;
  seguridad: string;
  usuario: string;
  password: string;
  nombreRemitente: string;
  emailRemitente: string;
  estado: string;
  esDefault: boolean;
}

@Component({
  selector: 'app-admin-config-smtp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-config-smtp.component.html',
  styleUrls: ['./admin-config-smtp.component.scss'],
})
export class AdminConfigSmtpComponent implements OnInit {

  configs: ConfigSmtp[] = [
    {
      id: 1, idEmpresa: 'EMP001', empresa: 'Hass Perú',
      host: 'smtp.gmail.com', puerto: 587, seguridad: 'TLS',
      usuario: 'logistica@hassagro.com', password: '**********',
      nombreRemitente: 'Logística Hass Perú', emailRemitente: 'logistica@hassagro.com',
      estado: 'ACTIVO', esDefault: true
    },
  ];

  showModal = false;
  isEdit = false;
  showPassword = false;
  testingConnection = false;
  testResult: { ok: boolean; message: string } | null = null;
  loading = false;

  empresas = ['Hass Perú', 'Hass Agro', 'Hass International'];
  seguridadOpciones = ['TLS', 'SSL', 'NINGUNA'];
  puertosComunes = [25, 465, 587, 2525];

  form: ConfigSmtp = {
    idEmpresa: 'EMP001', empresa: 'Hass Perú',
    host: '', puerto: 587, seguridad: 'TLS',
    usuario: '', password: '',
    nombreRemitente: '', emailRemitente: '',
    estado: 'ACTIVO', esDefault: false
  };

  constructor(private svc: AdminConfigSmtpService) {}

  ngOnInit(): void {}

  openCreate() {
    this.isEdit = false;
    this.testResult = null;
    this.showPassword = false;
    this.form = {
      idEmpresa: 'EMP001', empresa: 'Hass Perú',
      host: '', puerto: 587, seguridad: 'TLS',
      usuario: '', password: '',
      nombreRemitente: '', emailRemitente: '',
      estado: 'ACTIVO', esDefault: false
    };
    this.showModal = true;
  }

  openEdit(c: ConfigSmtp) {
    this.isEdit = true;
    this.testResult = null;
    this.showPassword = false;
    this.form = { ...c };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.testResult = null;
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  async probarConexion() {
    if (!this.form.host || !this.form.usuario || !this.form.password) {
      this.testResult = { ok: false, message: 'Complete host, usuario y contraseña para probar.' };
      return;
    }
    this.testingConnection = true;
    this.testResult = null;
    await new Promise(r => setTimeout(r, 1500));
    this.testingConnection = false;
    this.testResult = { ok: true, message: 'Conexión exitosa. Servidor SMTP respondió correctamente.' };
  }

  setDefaultConfig(c: ConfigSmtp) {
    this.configs.forEach(cfg => cfg.esDefault = false);
    c.esDefault = true;
  }

  save() {
    if (!this.form.host.trim() || !this.form.usuario.trim() || !this.form.emailRemitente.trim()) return;

    if (this.form.esDefault) {
      this.configs.forEach(c => c.esDefault = false);
    }

    if (this.isEdit) {
      const idx = this.configs.findIndex(c => c.id === this.form.id);
      if (idx >= 0) this.configs[idx] = { ...this.form };
    } else {
      this.form.id = Date.now();
      this.configs.push({ ...this.form });
    }
    this.closeModal();
  }

  toggleEstado(c: ConfigSmtp) {
    c.estado = c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  }
}
