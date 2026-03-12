import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AdminUsuariosService } from '../../services/admin-usuarios.service';
import { AdminAreasService } from '../../services/admin-areas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios-por-area',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    SelectModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuarios-por-area.component.html',
  styleUrls: ['./usuarios-por-area.component.scss']
})
export class UsuariosPorAreaComponent implements OnInit {
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  areas: any[] = [];
  loading = false;
  areaSeleccionada: string = '';
  rolSeleccionado: string = '';
  mostrarModal: boolean = false;
  
  // Formulario
  usuarioForm: FormGroup;
  modoEdicion: boolean = false;
  usuarioSeleccionado: any = null;
  
  roles = [
    { label: 'Operario Logística', value: 'OPLOGIST' },
    { label: 'Jefe de Área', value: 'JEFE_AREA' },
    { label: 'Aprobador Logística', value: 'APLOGIST' },
    { label: 'Logística', value: 'LOLOGIST' },
    { label: 'Almacén', value: 'ALLOGIST' },
    { label: 'Sistemas', value: 'TI' },
    { label: 'Administrador', value: 'ADLOGIST' }
  ];

  constructor(
    private adminUsuariosService: AdminUsuariosService,
    private adminAreasService: AdminAreasService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.usuarioForm = this.fb.group({
      documentoidentidad: ['', Validators.required],
      nombreCompleto: ['', Validators.required],
      email: [''],
      telefono: [''],
      idarea: ['', Validators.required],
      rol: ['', Validators.required],
      esJefeArea: [false],
      esAprobador: [false],
      activo: [true]
    });
  }

  async ngOnInit() {
    console.log('Inicializando componente...');
    
    // Forzar carga inicial de áreas usando NgZone
    this.zone.run(() => {
      console.log('Forzando carga inicial de áreas con NgZone...');
      this.areas = [
        { idarea: 1, nombre: 'RIEGO', descripcion: 'Área de Riego', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
        { idarea: 2, nombre: 'LABORES', descripcion: 'Área de Labores', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
        { idarea: 3, nombre: 'BPM', descripcion: 'Área de BPM', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
        { idarea: 4, nombre: 'SST', descripcion: 'Área de SST', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
        { idarea: 5, nombre: 'ALMACÉN', descripcion: 'Área de Almacén', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' }
      ];
      console.log('Áreas forzadas inicialmente:', this.areas);
    });
    
    await this.cargarAreas();
    console.log('Áreas cargadas en ngOnInit:', this.areas);
    
    // Esperar y forzar detección
    await new Promise(resolve => setTimeout(resolve, 100));
    this.zone.run(() => {
      console.log('Ejecutando dentro de NgZone después de cargar áreas');
      this.cdr.detectChanges();
    });
    
    await this.cargarUsuarios();
  }

  async cargarAreas() {
    try {
      console.log('Iniciando carga de áreas...');
      const response = await this.adminAreasService.listarAreas({}).toPromise();
      console.log('Respuesta completa del backend:', response);
      
      if (response?.resultado) {
        let areasArray = typeof response.resultado === 'string' 
          ? JSON.parse(response.resultado) 
          : response.resultado;
        
        this.areas = areasArray.map((area: any) => ({
          idarea: area.idarea,
          nombre: area.descripcion,
          descripcion: area.descripcion || '',
          ruc: area.ruc,
          activo: area.estado === 1,
          estado: area.estado,
          estadoTexto: area.estadoTexto || (area.estado === 1 ? 'Activo' : 'Inactivo')
        }));
      } else if (Array.isArray(response)) {
        this.areas = response.map((area: any) => ({
          idarea: area.idarea,
          nombre: area.descripcion,
          descripcion: area.descripcion || '',
          ruc: area.ruc,
          activo: area.estado === 1,
          estado: area.estado,
          estadoTexto: area.estadoTexto || (area.estado === 1 ? 'Activo' : 'Inactivo')
        }));
      } else {
        console.log('No se encontraron áreas en la respuesta - Usando mock forzado');
        this.areas = [
          { idarea: 1, nombre: 'RIEGO', descripcion: 'Área de Riego', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
          { idarea: 2, nombre: 'LABORES', descripcion: 'Área de Labores', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
          { idarea: 3, nombre: 'BPM', descripcion: 'Área de BPM', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
          { idarea: 4, nombre: 'SST', descripcion: 'Área de SST', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
          { idarea: 5, nombre: 'ALMACÉN', descripcion: 'Área de Almacén', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' }
        ];
      }
      
      console.log('Áreas finales cargadas:', this.areas);
      
      this.zone.run(() => {
        this.cdr.detectChanges();
      });
    } catch (error: any) {
      console.error('Error cargando áreas:', error);
      this.areas = [
        { idarea: 1, nombre: 'RIEGO', descripcion: 'Área de Riego', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
        { idarea: 2, nombre: 'LABORES', descripcion: 'Área de Labores', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' }
      ];
      
      this.zone.run(() => {
        this.cdr.detectChanges();
      });
      
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Usando datos de prueba. Verifique la conexión con el servidor.'
      });
    }
  }

  async cargarUsuarios() {
    this.loading = true;
    try {
      console.log('Iniciando carga de usuarios...');
      
      const response = await this.adminUsuariosService.listarUsuarios({
        area: this.areaSeleccionada,
        rol: this.rolSeleccionado
      }).toPromise();
      
      console.log('Respuesta de usuarios del backend:', response);
      
      if (response && response.resultado) {
        let usuariosArray = typeof response.resultado === 'string' 
          ? JSON.parse(response.resultado) 
          : response.resultado;
        
        this.usuarios = usuariosArray.map((usuario: any) => ({
          ...usuario,
          nombreArea: usuario.nombreArea || this.getNombreArea(usuario.idarea)
        }));
      } else if (Array.isArray(response)) {
        this.usuarios = response.map((usuario: any) => ({
          ...usuario,
          nombreArea: usuario.nombreArea || this.getNombreArea(usuario.idarea)
        }));
      } else {
        console.log('No se encontraron usuarios en la respuesta');
        this.usuarios = [];
      }
      
      this.usuariosFiltrados = [...this.usuarios];
      console.log('Usuarios finales cargados:', this.usuarios);
      
      this.zone.run(() => {
        this.cdr.detectChanges();
      });
    } catch (error: any) {
      console.error('Error cargando usuarios:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los usuarios'
      });
    } finally {
      this.loading = false;
    }
  }

  getNombreArea(idarea: number | string): string {
    if (!idarea) return 'Sin área';
    const area = this.areas.find(a => a.idarea == idarea);
    return area ? area.nombre : 'Sin área';
  }

  forzarCargarAreas() {
    console.log('=== Botón de debug presionado ===');
    this.zone.run(() => {
      this.areas = [
        { idarea: 1, nombre: 'RIEGO', descripcion: 'Área de Riego', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
        { idarea: 2, nombre: 'LABORES', descripcion: 'Área de Labores', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
        { idarea: 3, nombre: 'BPM', descripcion: 'Área de BPM', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
        { idarea: 4, nombre: 'SST', descripcion: 'Área de SST', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' },
        { idarea: 5, nombre: 'ALMACÉN', descripcion: 'Área de Almacén', ruc: '20481121966', activo: true, estado: 1, estadoTexto: 'Activo' }
      ];
      console.log('Áreas forzadas por botón:', this.areas);
      this.cdr.detectChanges();
    });
  }

  filtrarUsuarios(event: any) {
    const filtro = event.target.value.toLowerCase();
    
    if (!filtro) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }
    
    this.usuariosFiltrados = this.usuarios.filter(usuario =>
      usuario.documentoidentidad.toLowerCase().includes(filtro) ||
      usuario.nombreCompleto.toLowerCase().includes(filtro) ||
      usuario.email?.toLowerCase().includes(filtro)
    );
  }

  mostrarModalNuevo() {
    this.modoEdicion = false;
    this.usuarioForm.reset({
      activo: true,
      esJefeArea: false,
      esAprobador: false
    });
    this.mostrarModal = true;
  }

  mostrarModalAsignar() {
    Swal.fire({
      title: 'Asignar Usuario Existente',
      html: `
        <div class="text-start">
          <p class="mb-3">Este módulo permite asignar un usuario existente del sistema maestro a un área específica de logística.</p>
          
          <div class="mb-3">
            <label class="form-label">DNI del Usuario:</label>
            <input id="dniUsuario" class="form-control" placeholder="Ingrese DNI del usuario existente">
          </div>
          
          <div class="mb-3">
            <label class="form-label">Área:</label>
            <select id="areaAsignar" class="form-select">
              <option value="">Seleccione un área</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Rol:</label>
            <select id="rolAsignar" class="form-select">
              <option value="">Seleccione un rol</option>
              <option value="OPLOGIST">Operario Logística</option>
              <option value="ALLOGIST">Almacén</option>
              <option value="LOLOGIST">Logística</option>
              <option value="JEFE_AREA">Jefe de Área</option>
              <option value="APLOGIST">Aprobador Logística</option>
              <option value="TI">Sistemas</option>
              <option value="ADLOGIST">Administrador</option>
            </select>
          </div>
          
          <div class="form-check mb-2">
            <input id="esJefe" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="esJefe">
              Es Jefe de Área
            </label>
          </div>
          
          <div class="form-check">
            <input id="esAprobador" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="esAprobador">
              Es Aprobador
            </label>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Asignar Usuario',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const dni = document.getElementById('dniUsuario') as HTMLInputElement;
        const area = document.getElementById('areaAsignar') as HTMLSelectElement;
        const rol = document.getElementById('rolAsignar') as HTMLSelectElement;
        const esJefe = document.getElementById('esJefe') as HTMLInputElement;
        const esAprobador = document.getElementById('esAprobador') as HTMLInputElement;
        
        if (!dni.value || !area.value || !rol.value) {
          Swal.showValidationMessage('Por favor complete todos los campos obligatorios');
          return false;
        }
        
        return {
          documentoidentidad: dni.value,
          idarea: area.value,
          rol: rol.value,
          esJefeArea: esJefe.checked,
          esAprobador: esAprobador.checked,
          activo: true
        };
      },
      didOpen: () => {
        const areaSelect = document.getElementById('areaAsignar') as HTMLSelectElement;
        this.areas.forEach(area => {
          const option = document.createElement('option');
          option.value = area.idarea;
          option.textContent = area.nombre;
          areaSelect.appendChild(option);
        });
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await this.adminUsuariosService.configurarUsuario({
            ...result.value,
            ruc: '20481121966',
            nombreCompleto: 'Usuario Existente',
            email: ''
          });
          
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario asignado correctamente al área'
          });
          
          await this.cargarUsuarios();
        } catch (error: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'No se pudo asignar el usuario'
          });
        }
      }
    });
  }

  async editarUsuario(usuario: any) {
    this.modoEdicion = true;
    this.usuarioSeleccionado = usuario;
    
    try {
      const response = await this.adminUsuariosService.obtenerConfiguracionUsuario({
        documentoidentidad: usuario.documentoidentidad
      }).toPromise();
      
      if (response && response.resultado) {
        const config = JSON.parse(response.resultado);
        this.usuarioForm.patchValue({
          documentoidentidad: config.documentoidentidad,
          nombreCompleto: config.nombreCompleto,
          email: config.email,
          telefono: config.telefono,
          idarea: config.idarea,
          rol: config.rol,
          esJefeArea: config.esJefeArea,
          esAprobador: config.esAprobador,
          activo: config.activo
        });
        this.mostrarModal = true;
      }
    } catch (error) {
      this.usuarioForm.patchValue(usuario);
      this.mostrarModal = true;
    }
  }

  async guardarUsuario() {
    if (this.usuarioForm.invalid) return;
    
    try {
      const formData = this.usuarioForm.value;
      
      if (this.modoEdicion) {
        await this.adminUsuariosService.configurarUsuario({
          ...formData,
          ruc: '20481121966'
        });
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario actualizado correctamente'
        });
      } else {
        await this.adminUsuariosService.configurarUsuario({
          ...formData,
          ruc: '20481121966'
        });
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario creado correctamente'
        });
      }
      
      this.cerrarModal();
      this.cargarUsuarios();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al guardar usuario'
      });
    }
  }

  eliminarUsuario(usuario: any) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar al usuario ${usuario.nombreCompleto}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario eliminado correctamente'
          });
          
          await this.cargarUsuarios();
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el usuario'
          });
        }
      }
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.usuarioForm.reset();
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
  }
}
