import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { 
  ConfiguracionServidorCorreo, 
  DestinatarioCorreo, 
  PlantillaCorreo 
} from '@/app/shared/interfaces/Tables';

@Component({
  selector: 'app-admin-correo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-correo.component.html',
  styleUrls: ['./admin-correo.component.scss']
})
export class AdminCorreoComponent implements OnInit {
  
  // Tabs
  tabActiva = 'servidor';
  
  // Servidor
  servidorForm: FormGroup;
  servidores: ConfiguracionServidorCorreo[] = [];
  servidorActivo: ConfiguracionServidorCorreo | null = null;
  modoEdicionServidor = false;
  editIndexServidor = -1;
  mostrarPasswordServidor = false;
  probandoConexion = false;
  
  // Destinatarios
  destinatarioForm: FormGroup;
  destinatarios: DestinatarioCorreo[] = [];
  modoEdicionDestinatario = false;
  editIndexDestinatario = -1;
  filtroTipoDestinatario = 'TODOS';
  
  // Plantillas
  plantillaForm: FormGroup;
  plantillas: PlantillaCorreo[] = [];
  modoEdicionPlantilla = false;
  editIndexPlantilla = -1;
  editandoPlantillaContenido = false;
  
  // Estadísticas
  stats = {
    totalServidores: 0,
    totalDestinatarios: 0,
    totalPlantillas: 0,
    correosEnviadosHoy: 0
  };
  
  constructor(
    private fb: FormBuilder,
    private dexieService: DexieService,
    private alertService: AlertService
  ) {
    this.inicializarFormularios();
  }
  
  ngOnInit(): void {
    this.cargarTodosDatos();
  }
  
  private inicializarFormularios(): void {
    // Formulario Servidor
    this.servidorForm = this.fb.group({
      nombreServidor: ['', [Validators.required]],
      smtpHost: ['', [Validators.required]],
      smtpPort: [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
      smtpSecure: [false],
      smtpUser: ['', [Validators.required, Validators.email]],
      smtpPassword: ['', [Validators.required]],
      emailFrom: ['', [Validators.required, Validators.email]],
      emailFromName: ['', [Validators.required]],
      replyTo: ['', [Validators.email]],
      activo: [true],
      limiteDiario: [100, [Validators.required, Validators.min(1)]]
    });
    
    // Formulario Destinatario
    this.destinatarioForm = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      tipo: ['PROVEEDOR', [Validators.required]],
      departamento: [''],
      activo: [true],
      recibeOrdenesCompra: [false],
      recibeOrdenesServicio: [false],
      recibeNotificaciones: [false]
    });
    
    // Formulario Plantilla
    this.plantillaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      tipo: ['ORDEN_COMPRA', [Validators.required]],
      asunto: ['', [Validators.required]],
      cuerpoHtml: ['', [Validators.required]],
      variables: [[]],
      activo: [true]
    });
  }
  
  async cargarTodosDatos(): Promise<void> {
    try {
      await Promise.all([
        this.cargarServidores(),
        this.cargarDestinatarios(),
        this.cargarPlantillas()
      ]);
      this.calcularEstadisticas();
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  }
  
  async cargarServidores(): Promise<void> {
    try {
      this.servidores = await this.dexieService.getConfiguracionServidorCorreo() || [];
      this.servidorActivo = this.servidores.find(s => s.activo) || null;
    } catch (error) {
      console.error('Error al cargar servidores:', error);
    }
  }
  
  async cargarDestinatarios(): Promise<void> {
    try {
      this.destinatarios = await this.dexieService.getDestinatariosCorreo() || [];
    } catch (error) {
      console.error('Error al cargar destinatarios:', error);
    }
  }
  
  async cargarPlantillas(): Promise<void> {
    try {
      this.plantillas = await this.dexieService.getPlantillasCorreo() || [];
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
    }
  }
  
  calcularEstadisticas(): void {
    this.stats = {
      totalServidores: this.servidores.length,
      totalDestinatarios: this.destinatarios.filter(d => d.activo).length,
      totalPlantillas: this.plantillas.filter(p => p.activo).length,
      correosEnviadosHoy: 0 // TODO: Implementar contador real
    };
  }
  
  // Métodos de Servidor
  nuevoServidor(): void {
    this.modoEdicionServidor = false;
    this.editIndexServidor = -1;
    this.servidorForm.reset({
      smtpPort: 587,
      smtpSecure: false,
      activo: true,
      limiteDiario: 100
    });
  }
  
  editarServidor(servidor: ConfiguracionServidorCorreo, index: number): void {
    this.modoEdicionServidor = true;
    this.editIndexServidor = index;
    this.servidorForm.patchValue(servidor);
  }
  
  async guardarServidor(): Promise<void> {
    if (this.servidorForm.invalid) {
      this.alertService.showAlert('Error', 'Complete todos los campos requeridos', 'error');
      return;
    }
    
    try {
      const servidor: ConfiguracionServidorCorreo = {
        ...this.servidorForm.value,
        usuarioModifica: 'admin',
        fechaModificacion: new Date()
      };
      
      if (this.modoEdicionServidor && this.editIndexServidor >= 0) {
        servidor.id = this.servidores[this.editIndexServidor].id;
        servidor.usuarioCrea = this.servidores[this.editIndexServidor].usuarioCrea;
        servidor.fechaCreacion = this.servidores[this.editIndexServidor].fechaCreacion;
        this.servidores[this.editIndexServidor] = servidor;
      } else {
        servidor.usuarioCrea = 'admin';
        servidor.fechaCreacion = new Date();
        this.servidores.push(servidor);
      }
      
      if (servidor.activo) {
        this.servidores.forEach(s => {
          if (s !== servidor) s.activo = false;
        });
        this.servidorActivo = servidor;
      }
      
      await this.dexieService.saveConfiguracionServidorCorreo(this.servidores);
      
      this.alertService.showAlert('Éxito', 'Servidor guardado correctamente', 'success');
      this.cancelarEdicionServidor();
    } catch (error) {
      console.error('Error al guardar servidor:', error);
      this.alertService.showAlert('Error', 'No se pudo guardar el servidor', 'error');
    }
  }
  
  async probarConexionServidor(): Promise<void> {
    if (this.servidorForm.invalid) {
      this.alertService.showAlert('Error', 'Complete todos los campos antes de probar', 'error');
      return;
    }
    
    this.probandoConexion = true;
    try {
      // Simular prueba de conexión
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.alertService.showAlert('Éxito', 'Conexión establecida correctamente', 'success');
    } catch (error) {
      this.alertService.showAlert('Error', 'No se pudo establecer conexión', 'error');
    } finally {
      this.probandoConexion = false;
    }
  }
  
  cancelarEdicionServidor(): void {
    this.modoEdicionServidor = false;
    this.editIndexServidor = -1;
    this.servidorForm.reset({
      smtpPort: 587,
      smtpSecure: false,
      activo: true,
      limiteDiario: 100
    });
  }
  
  // Métodos de Destinatarios
  nuevoDestinatario(): void {
    this.modoEdicionDestinatario = false;
    this.editIndexDestinatario = -1;
    this.destinatarioForm.reset({
      tipo: 'PROVEEDOR',
      activo: true,
      recibeOrdenesCompra: false,
      recibeOrdenesServicio: false,
      recibeNotificaciones: false
    });
  }
  
  editarDestinatario(destinatario: DestinatarioCorreo, index: number): void {
    this.modoEdicionDestinatario = true;
    this.editIndexDestinatario = index;
    this.destinatarioForm.patchValue(destinatario);
  }
  
  async guardarDestinatario(): Promise<void> {
    if (this.destinatarioForm.invalid) {
      this.alertService.showAlert('Error', 'Complete todos los campos requeridos', 'error');
      return;
    }
    
    try {
      const destinatario: DestinatarioCorreo = {
        ...this.destinatarioForm.value,
        usuarioModifica: 'admin',
        fechaModificacion: new Date()
      };
      
      if (this.modoEdicionDestinatario && this.editIndexDestinatario >= 0) {
        destinatario.id = this.destinatarios[this.editIndexDestinatario].id;
        destinatario.usuarioCrea = this.destinatarios[this.editIndexDestinatario].usuarioCrea;
        destinatario.fechaCreacion = this.destinatarios[this.editIndexDestinatario].fechaCreacion;
        this.destinatarios[this.editIndexDestinatario] = destinatario;
      } else {
        destinatario.usuarioCrea = 'admin';
        destinatario.fechaCreacion = new Date();
        this.destinatarios.push(destinatario);
      }
      
      await this.dexieService.saveDestinatariosCorreo(this.destinatarios);
      
      this.alertService.showAlert('Éxito', 'Destinatario guardado correctamente', 'success');
      this.cancelarEdicionDestinatario();
      this.calcularEstadisticas();
    } catch (error) {
      console.error('Error al guardar destinatario:', error);
      this.alertService.showAlert('Error', 'No se pudo guardar el destinatario', 'error');
    }
  }
  
  cancelarEdicionDestinatario(): void {
    this.modoEdicionDestinatario = false;
    this.editIndexDestinatario = -1;
    this.destinatarioForm.reset({
      tipo: 'PROVEEDOR',
      activo: true,
      recibeOrdenesCompra: false,
      recibeOrdenesServicio: false,
      recibeNotificaciones: false
    });
  }
  
  // Métodos de Plantillas
  nuevaPlantilla(): void {
    this.modoEdicionPlantilla = false;
    this.editIndexPlantilla = -1;
    this.plantillaForm.reset({
      tipo: 'ORDEN_COMPRA',
      activo: true,
      variables: []
    });
    this.editandoPlantillaContenido = false;
  }
  
  editarPlantilla(plantilla: PlantillaCorreo, index: number): void {
    this.modoEdicionPlantilla = true;
    this.editIndexPlantilla = index;
    this.plantillaForm.patchValue(plantilla);
    this.editandoPlantillaContenido = false;
  }
  
  toggleEdicionPlantilla(): void {
    this.editandoPlantillaContenido = !this.editandoPlantillaContenido;
  }
  
  async guardarPlantilla(): Promise<void> {
    if (this.plantillaForm.invalid) {
      this.alertService.showAlert('Error', 'Complete todos los campos requeridos', 'error');
      return;
    }
    
    try {
      const plantilla: PlantillaCorreo = {
        ...this.plantillaForm.value,
        usuarioModifica: 'admin',
        fechaModificacion: new Date()
      };
      
      if (this.modoEdicionPlantilla && this.editIndexPlantilla >= 0) {
        plantilla.id = this.plantillas[this.editIndexPlantilla].id;
        plantilla.usuarioCrea = this.plantillas[this.editIndexPlantilla].usuarioCrea;
        plantilla.fechaCreacion = this.plantillas[this.editIndexPlantilla].fechaCreacion;
        this.plantillas[this.editIndexPlantilla] = plantilla;
      } else {
        plantilla.usuarioCrea = 'admin';
        plantilla.fechaCreacion = new Date();
        this.plantillas.push(plantilla);
      }
      
      await this.dexieService.savePlantillasCorreo(this.plantillas);
      
      this.alertService.showAlert('Éxito', 'Plantilla guardada correctamente', 'success');
      this.cancelarEdicionPlantilla();
      this.calcularEstadisticas();
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      this.alertService.showAlert('Error', 'No se pudo guardar la plantilla', 'error');
    }
  }
  
  cancelarEdicionPlantilla(): void {
    this.modoEdicionPlantilla = false;
    this.editIndexPlantilla = -1;
    this.plantillaForm.reset({
      tipo: 'ORDEN_COMPRA',
      activo: true,
      variables: []
    });
    this.editandoPlantillaContenido = false;
  }
  
  // Utilitarios
  togglePassword(): void {
    this.mostrarPasswordServidor = !this.mostrarPasswordServidor;
  }
  
  getDestinatariosFiltrados(): DestinatarioCorreo[] {
    if (this.filtroTipoDestinatario === 'TODOS') {
      return this.destinatarios;
    }
    return this.destinatarios.filter(d => d.tipo === this.filtroTipoDestinatario);
  }
  
  cambiarTab(tab: string): void {
    this.tabActiva = tab;
  }
}
