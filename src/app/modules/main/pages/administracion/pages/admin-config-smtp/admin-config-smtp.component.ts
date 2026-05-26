import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminConfigSmtpService } from '../../services/admin-config-smtp.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

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

  configs: ConfigSmtp[] = [];

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

  constructor(private svc: AdminConfigSmtpService, private alertService: AlertService) {}

  async ngOnInit(): Promise<void> {
    await this.cargarConfiguraciones();
  }

  async cargarConfiguraciones() {
    try {
      this.loading = true;
      const respuesta = await this.svc.listarConfigSmtp({}).toPromise();

      // El backend retorna un array de configuraciones SMTP
      if (Array.isArray(respuesta) && respuesta.length > 0) {
        this.configs = respuesta.map((c: any) => ({
          id: c.id,
          idEmpresa: c.idEmpresa || 'EMP001',
          empresa: c.empresa || 'Hass Perú',
          host: c.host || '',
          puerto: c.puerto || 587,
          seguridad: c.seguridad || 'TLS',
          usuario: c.usuario || '',
          password: c.password || '',
          nombreRemitente: c.nombreRemitente || '',
          emailRemitente: c.emailRemitente || '',
          estado: c.estado || 'ACTIVO',
          esDefault: c.esDefault || false
        }));
      } else {
        this.configs = [];
      }
    } catch (error) {
      console.error('Error cargando configuraciones SMTP:', error);
      this.configs = [];
    } finally {
      this.loading = false;
    }
  }

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
    
    try {
      const datos = {
        host: this.form.host,
        puerto: this.form.puerto,
        usuario: this.form.usuario,
        password: this.form.password,
        seguridad: this.form.seguridad
      };
      
      const resultado = await this.svc.probarConexionSmtp(datos);
      this.testResult = { 
        ok: resultado?.success || false, 
        message: resultado?.message || 'Error en la prueba' 
      };
    } catch (error) {
      this.testResult = { ok: false, message: 'Error al probar conexión' };
    }
    
    this.testingConnection = false;
  }

  setDefaultConfig(c: ConfigSmtp) {
    this.configs.forEach(cfg => cfg.esDefault = false);
    c.esDefault = true;
  }

  async save() {
    if (!this.form.host.trim() || !this.form.usuario.trim() || !this.form.emailRemitente.trim()) {
      this.alertService.showAlert('Error', 'Complete los campos requeridos', 'error');
      return;
    }

    this.alertService.mostrarModalCarga();
    
    try {
      const datos = {
        id: this.form.id,
        idEmpresa: this.form.idEmpresa,
        empresa: this.form.empresa,
        host: this.form.host,
        puerto: this.form.puerto,
        seguridad: this.form.seguridad,
        usuario: this.form.usuario,
        password: this.form.password,
        nombreRemitente: this.form.nombreRemitente,
        emailRemitente: this.form.emailRemitente,
        esDefault: this.form.esDefault,
        estado: this.form.estado,
        usuarioSession: localStorage.getItem('usuario') || 'sistema'
      };

      const resultado = await this.svc.guardarConfigSmtp(datos);
      
      if (resultado?.status === 'OK') {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Éxito', resultado?.message || 'Configuración SMTP guardada correctamente', 'success');
        this.closeModal();
        await this.cargarConfiguraciones();
      } else {
        throw new Error(resultado?.message || 'Error al guardar');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al guardar configuración', 'error');
    }
  }

  async toggleEstado(c: ConfigSmtp) {
    try {
      const datos = {
        id: c.id,
        idEmpresa: c.idEmpresa,
        empresa: c.empresa,
        host: c.host,
        puerto: c.puerto,
        seguridad: c.seguridad,
        usuario: c.usuario,
        password: c.password,
        nombreRemitente: c.nombreRemitente,
        emailRemitente: c.emailRemitente,
        esDefault: c.esDefault,
        estado: c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO',
        usuarioSession: localStorage.getItem('usuario') || 'sistema'
      };

      await this.svc.guardarConfigSmtp(datos);
      c.estado = c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }
}
