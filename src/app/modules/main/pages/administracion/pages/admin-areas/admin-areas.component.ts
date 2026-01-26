import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAreasService } from '../../services/admin-areas.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Component({
  selector: 'app-admin-areas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-areas.component.html',
  styleUrls: ['./admin-areas.component.scss'],
})
export class AdminAreasComponent implements OnInit {

  areas: any[] = [];
  loading = false;
  showModal = false;
  isEdit = false;

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
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.cargarAreas();
  }

  async cargarAreas() {
    try {
      this.loading = true;
      const usuario = this.userService.getUsuario();
      const body = {
        ruc: usuario?.ruc || '',
        usuario: usuario?.documentoidentidad || ''
      };

      this.adminAreasService.listarAreas(body).subscribe({
        next: (response) => {
          this.areas = response?.data || response || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar áreas:', error);
          this.alertService.showAlertError('Error', 'Error al cargar áreas');
          this.loading = false;
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
      id: area.id,
      nombre: area.nombre,
      descripcion: area.descripcion,
      codigo: area.codigo,
      estado: area.estado
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
      const body = {
        ...this.form,
        usuario: usuario?.documentoidentidad || '',
        ruc: usuario?.ruc || ''
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
      const body = {
        id: area.id,
        usuario: usuario?.documentoidentidad || '',
        ruc: usuario?.ruc || ''
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

