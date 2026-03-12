import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAreasService } from '../../services/admin-areas.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-areas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-areas.component.html',
  styleUrls: ['./admin-areas.component.scss'],
})
export class AdminAreasComponent implements OnInit, OnDestroy {

  areas: any[] = [];
  loading = false;
  showModal = false;
  isEdit = false;
  private destroy$ = new Subject<void>();

  form: { 
    id?: number; 
    nombre: string; 
    descripcion: string; 
    codigo?: string;
    estado: string 
  } = {
    nombre: '',
    descripcion: '',
    codigo: '',
    estado: 'ACTIVO'
  };

  constructor(
    private adminAreasService: AdminAreasService,
    private userService: UserService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('AdminAreasComponent initialized');
    console.log('UserService:', this.userService);
    console.log('Usuario inicial:', this.userService.getUsuario());
    
    // Try to load immediately
    this.cargarAreas();
    
    // Also subscribe to user changes
    this.userService.usuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        console.log('User data received:', usuario);
        if (usuario && usuario.ruc && usuario.documentoidentidad) {
          console.log('User data is complete, loading areas...');
          this.cargarAreas();
        } else {
          console.log('User data incomplete:', usuario);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async cargarAreas() {
    console.log('cargarAreas() called');
    try {
      this.loading = true;
      const usuario = this.userService.getUsuario();
      console.log('Getting usuario for API call:', usuario);
      
      // Prepare body - use default values if no user data
      const body = {
        ruc: usuario?.ruc || '20481121966',  // Default RUC
        usuario: usuario?.documentoidentidad || ''  // Can be empty
      };
      console.log('Request body:', body);

      // Make the API call
      this.adminAreasService.listarAreas(body).subscribe({
        next: (response) => {
          console.log('Response from API:', response);
          console.log('Response type:', typeof response);
          console.log('Is array?', Array.isArray(response));
          
          // Check if response is wrapped in an object
          if (response && typeof response === 'object' && !Array.isArray(response)) {
            console.log('Response is an object, checking properties:');
            console.log('Response keys:', Object.keys(response));
            
            // Try common response wrappers
            if (response.data && Array.isArray(response.data)) {
              console.log('Found data property:', response.data);
              this.areas = response.data;
            } else if (response.result && Array.isArray(response.result)) {
              console.log('Found result property:', response.result);
              this.areas = response.result;
            } else if (response.response && Array.isArray(response.response)) {
              console.log('Found response property:', response.response);
              this.areas = response.response;
            } else {
              // If it's an object but we can't find an array, check if it's a single item
              console.log('Could not find array property in response object');
              // Try to use the response directly if it has area properties
              if (response.idarea || response.descripcion) {
                this.areas = [response];  // Wrap single item in array
              } else {
                this.areas = [];
              }
            }
          } else {
            // The response is the array directly, not wrapped in a data property
            this.areas = response || [];
          }
          
          console.log('Final areas assigned:', this.areas);
          console.log('Areas length:', this.areas.length);
          
          // Force change detection
          this.cdr.detectChanges();
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar áreas:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error error:', error.error);
          this.alertService.showAlertError('Error', `Error al cargar áreas: ${error.status || 'Unknown'}`);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.loading = false;
    }
  }

  openCreate() {
    this.isEdit = false;
    this.form = {
      nombre: '',
      descripcion: '',
      codigo: '',
      estado: 'ACTIVO'
    };
    this.showModal = true;
  }

  openEdit(area: any) {
    this.isEdit = true;
    this.form = {
      id: area.idarea,
      nombre: area.descripcion,
      descripcion: area.descripcion,
      codigo: area.codigo || '',
      estado: area.estado ? 'ACTIVO' : 'INACTIVO'
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async save() {
    if (!this.form.nombre.trim()) {
      this.alertService.showAlertError('Error', 'El nombre es requerido');
      return;
    }

    try {
      const usuario = this.userService.getUsuario();
      
      // Check if user data is available
      if (!usuario || !usuario.ruc || !usuario.documentoidentidad) {
        console.error('Usuario no disponible o datos incompletos:', usuario);
        this.alertService.showAlertError('Error', 'No se encontró información del usuario. Por favor, recargue la página.');
        return;
      }
      
      const body = {
        ...this.form,
        usuario: usuario.documentoidentidad,
        ruc: usuario.ruc
      };

      if (this.isEdit) {
        await this.adminAreasService.actualizarArea(body);
        this.alertService.showAlertAcept('Éxito', 'Área actualizada exitosamente', 'success');
      } else {
        await this.adminAreasService.crearArea(body);
        this.alertService.showAlertAcept('Éxito', 'Área creada exitosamente', 'success');
      }

      this.closeModal();
      this.cargarAreas();
    } catch (error) {
      console.error('Error al guardar área:', error);
      this.alertService.showAlertError('Error', 'Error al guardar área');
    }
  }

  async eliminar(area: any) {
    const confirmacion = await this.alertService.showConfirm(
      '¿Está seguro de eliminar esta área?',
      'Esta acción no se puede deshacer',
      'warning'
    );

    if (!confirmacion) return;

    try {
      const usuario = this.userService.getUsuario();
      
      // Check if user data is available
      if (!usuario || !usuario.ruc || !usuario.documentoidentidad) {
        console.error('Usuario no disponible o datos incompletos:', usuario);
        this.alertService.showAlertError('Error', 'No se encontró información del usuario. Por favor, recargue la página.');
        return;
      }
      
      const body = {
        id: area.idarea,
        usuario: usuario.documentoidentidad,
        ruc: usuario.ruc
      };

      await this.adminAreasService.eliminarArea(body);
      this.alertService.showAlertAcept('Éxito', 'Área eliminada exitosamente', 'success');
      this.cargarAreas();
    } catch (error) {
      console.error('Error al eliminar área:', error);
      this.alertService.showAlertError('Error', 'Error al eliminar área');
    }
  }
}

