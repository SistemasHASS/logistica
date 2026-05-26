import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AreasService, Area } from '../../services/areas.service';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';

interface UserData {
  ruc?: string;
  documentoidentidad?: string;
}

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './areas.component.html',
  styleUrls: ['./areas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AreasComponent implements OnInit {
  private areasSvc = inject(AreasService);
  private authSvc = inject(AdminLogisticaAuthService);
  private fb = inject(FormBuilder);

  areas: Area[] = [];
  loading = false;
  modalVisible = false;
  isEditing = false;
  areaSeleccionada: Area | null = null;

  form: FormGroup = this.fb.group({
    idarea: [0],
    ruc: ['', Validators.required],
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    estado: [true],
    mostrarAdmision: [false]
  });

  private userSignal = this.authSvc.currentUser;
  rucEmpresa = this.userSignal()?.ruc || '20481121966';

  ngOnInit() {
    this.cargarAreas();
  }

  get user() {
    return this.userSignal();
  }

  cargarAreas() {
    this.loading = true;
    this.areasSvc.listarAreas(this.rucEmpresa).subscribe({
      next: (res) => {
        this.areas = Array.isArray(res) ? res : res?.resultado || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Error al cargar áreas');
      }
    });
  }

  abrirCrear() {
    this.isEditing = false;
    this.areaSeleccionada = null;
    this.form.reset({
      ruc: this.rucEmpresa,
      estado: true,
      mostrarAdmision: false
    });
    this.modalVisible = true;
  }

  abrirEditar(area: Area) {
    this.isEditing = true;
    this.areaSeleccionada = area;
    this.form.patchValue({
      idarea: area.idarea,
      ruc: area.ruc,
      nombre: area.nombre,
      descripcion: area.descripcion,
      estado: area.estado,
      mostrarAdmision: area.mostrarAdmision
    });
    this.modalVisible = true;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.isEditing
      ? this.form.value
      : { ...this.form.value, usuarioCreacion: this.user?.usuario || 'SYSTEM' };

    const operacion = this.isEditing
      ? this.areasSvc.actualizarArea(data)
      : this.areasSvc.crearArea(data);

    operacion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarAreas();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar área');
      }
    });
  }

  eliminar(area: Area) {
    if (!confirm(`¿Eliminar el área "${area.descripcion}"?`)) return;

    this.areasSvc.eliminarArea(area.idarea, area.ruc).subscribe({
      next: () => this.cargarAreas(),
      error: (err) => alert(err.error?.message || 'Error al eliminar área')
    });
  }

  cerrarModal() {
    this.modalVisible = false;
    this.form.reset();
    this.areaSeleccionada = null;
  }

  sincronizarDesdeCatalogo() {
    if (!confirm('¿Sincronizar áreas desde el catálogo? Esto creará las áreas que no existan.')) return;

    this.areasSvc.sincronizarAreasDesdeCatalogo(this.rucEmpresa, this.user?.usuario || 'SYSTEM').subscribe({
      next: () => {
        alert('Sincronización completada');
        this.cargarAreas();
      },
      error: (err) => alert(err.error?.message || 'Error al sincronizar')
    });
  }
}
