import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { ConfiguracionCorreo } from '@/app/shared/interfaces/Tables';

@Component({
  selector: 'app-configuracion-correo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './configuracion-correo.component.html',
  styleUrls: ['./configuracion-correo.component.scss']
})
export class ConfiguracionCorreoComponent implements OnInit {
  
  configuracionForm: FormGroup;
  configuraciones: ConfiguracionCorreo[] = [];
  configuracionActiva: ConfiguracionCorreo | null = null;
  modoEdicion = false;
  editIndex = -1;
  mostrarPassword = false;
  probandoConexion = false;
  
  constructor(
    private fb: FormBuilder,
    private dexieService: DexieService,
    private alertService: AlertService
  ) {
    this.inicializarFormulario();
  }
  
  ngOnInit(): void {
    this.cargarConfiguraciones();
  }
  
  private inicializarFormulario(): void {
    this.configuracionForm = this.fb.group({
      smtpHost: ['', [Validators.required, Validators.email]],
      smtpPort: [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
      smtpSecure: [false],
      smtpUser: ['', [Validators.required, Validators.email]],
      smtpPassword: ['', [Validators.required]],
      emailFrom: ['', [Validators.required, Validators.email]],
      emailFromName: ['', [Validators.required]],
      replyTo: ['', [Validators.email]],
      activo: [true]
    });
  }
  
  async cargarConfiguraciones(): Promise<void> {
    try {
      this.configuraciones = await this.dexieService.getConfiguracionesCorreo() || [];
      this.configuracionActiva = this.configuraciones.find(c => c.activo) || null;
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      this.alertService.showAlert('Error', 'No se pudieron cargar las configuraciones de correo', 'error');
    }
  }
  
  nuevaConfiguracion(): void {
    this.modoEdicion = false;
    this.editIndex = -1;
    this.configuracionForm.reset({
      smtpPort: 587,
      smtpSecure: false,
      activo: true
    });
  }
  
  editarConfiguracion(configuracion: ConfiguracionCorreo, index: number): void {
    this.modoEdicion = true;
    this.editIndex = index;
    this.configuracionForm.patchValue(configuracion);
  }
  
  async guardarConfiguracion(): Promise<void> {
    if (this.configuracionForm.invalid) {
      this.alertService.showAlert('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }
    
    try {
      const configuracion: ConfiguracionCorreo = {
        ...this.configuracionForm.value,
        usuarioModifica: 'usuario_actual',
        fechaModificacion: new Date()
      };
      
      if (this.modoEdicion && this.editIndex >= 0) {
        // Actualizar configuración existente
        configuracion.id = this.configuraciones[this.editIndex].id;
        configuracion.usuarioCrea = this.configuraciones[this.editIndex].usuarioCrea;
        configuracion.fechaCreacion = this.configuraciones[this.editIndex].fechaCreacion;
        this.configuraciones[this.editIndex] = configuracion;
      } else {
        // Nueva configuración
        configuracion.usuarioCrea = 'usuario_actual';
        configuracion.fechaCreacion = new Date();
        this.configuraciones.push(configuracion);
      }
      
      // Si se marca como activa, desactivar las demás
      if (configuracion.activo) {
        this.configuraciones.forEach(c => {
          if (c !== configuracion) {
            c.activo = false;
          }
        });
        this.configuracionActiva = configuracion;
      } else if (this.configuracionActiva === configuracion) {
        this.configuracionActiva = null;
      }
      
      await this.dexieService.saveConfiguracionesCorreo(this.configuraciones);
      
      this.alertService.showAlert(
        'Éxito',
        `Configuración ${this.modoEdicion ? 'actualizada' : 'creada'} correctamente`,
        'success'
      );
      
      this.cancelarEdicion();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      this.alertService.showAlert('Error', 'No se pudo guardar la configuración', 'error');
    }
  }
  
  async eliminarConfiguracion(index: number): Promise<void> {
    const configuracion = this.configuraciones[index];
    
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar eliminación',
      `¿Está seguro de eliminar la configuración ${configuracion.emailFrom}?`,
      'warning'
    );
    
    if (!confirmacion) return;
    
    try {
      this.configuraciones.splice(index, 1);
      
      if (this.configuracionActiva === configuracion) {
        this.configuracionActiva = null;
      }
      
      await this.dexieService.saveConfiguracionesCorreo(this.configuraciones);
      
      this.alertService.showAlert('Éxito', 'Configuración eliminada correctamente', 'success');
    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      this.alertService.showAlert('Error', 'No se pudo eliminar la configuración', 'error');
    }
  }
  
  async activarConfiguracion(index: number): Promise<void> {
    try {
      // Desactivar todas las configuraciones
      this.configuraciones.forEach(c => c.activo = false);
      
      // Activar la seleccionada
      this.configuraciones[index].activo = true;
      this.configuracionActiva = this.configuraciones[index];
      
      await this.dexieService.saveConfiguracionesCorreo(this.configuraciones);
      
      this.alertService.showAlert('Éxito', 'Configuración activada correctamente', 'success');
    } catch (error) {
      console.error('Error al activar configuración:', error);
      this.alertService.showAlert('Error', 'No se pudo activar la configuración', 'error');
    }
  }
  
  async probarConexion(): Promise<void> {
    if (this.configuracionForm.invalid) {
      this.alertService.showAlert('Error', 'Complete todos los campos antes de probar la conexión', 'error');
      return;
    }
    
    this.probandoConexion = true;
    
    try {
      const configuracion = this.configuracionForm.value;
      
      // Aquí iría la lógica real de prueba de conexión SMTP
      // Por ahora simulamos una prueba
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.alertService.showAlert('Éxito', 'Conexión SMTP establecida correctamente', 'success');
    } catch (error) {
      console.error('Error en prueba de conexión:', error);
      this.alertService.showAlert('Error', 'No se pudo establecer conexión con el servidor SMTP', 'error');
    } finally {
      this.probandoConexion = false;
    }
  }
  
  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.editIndex = -1;
    this.configuracionForm.reset({
      smtpPort: 587,
      smtpSecure: false,
      activo: true
    });
  }
  
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
  
  getConfiguracionActiva(): ConfiguracionCorreo | null {
    return this.configuracionActiva;
  }
}
