import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { AreasService, Area } from '../../services/areas.service';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import { EmpresasMaestrasService, Empresa } from '../../services/empresas-maestras.service';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TableModule, ButtonModule, DialogModule, TagModule],
  templateUrl: './areas.component.html',
  styleUrls: ['./areas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AreasComponent implements OnInit {
  private areasSvc = inject(AreasService);
  private authSvc = inject(AdminLogisticaAuthService);
  private empresasSvc = inject(EmpresasMaestrasService);
  private fb = inject(FormBuilder);

  areas = signal<Area[]>([]);
  loading = signal(false);
  modalVisible = signal(false);
  isEditing = signal(false);

  // Empresas cargadas desde API maestra
  empresas = this.empresasSvc.empresas;
  cargandoEmpresas = this.empresasSvc.cargando;

  rucSeleccionado = signal<string>('20481121966');

  form: FormGroup = this.fb.group({
    idarea: [0],
    ruc: ['', Validators.required],
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    estado: [true],
    mostrarAdmision: [false]
  });

  private userSignal = this.authSvc.currentUser;

  async ngOnInit() {
    // Cargar empresas desde API maestra
    await this.empresasSvc.cargarEmpresas();

    const userRuc = this.userSignal()?.ruc;
    if (userRuc) {
      this.rucSeleccionado.set(userRuc);
    } else if (this.empresas().length > 0) {
      // Si no hay RUC de usuario, usar el primero de la lista
      this.rucSeleccionado.set(this.empresas()[0].ruc);
    }
    this.cargarAreas();
  }

  get user() {
    return this.userSignal();
  }

  onEmpresaChange(ruc: string) {
    this.rucSeleccionado.set(ruc);
    this.cargarAreas();
  }

  cargarAreas() {
    this.loading.set(true);
    this.areasSvc.listarAreas(this.rucSeleccionado()).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : res?.resultado || [];
        this.areas.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        alert('Error al cargar áreas');
      }
    });
  }

  abrirCrear() {
    this.isEditing.set(false);
    this.form.reset({
      ruc: this.rucSeleccionado(),
      estado: true,
      mostrarAdmision: false
    });
    this.modalVisible.set(true);
  }

  abrirEditar(area: Area) {
    this.isEditing.set(true);
    this.form.patchValue({
      idarea: area.idarea,
      ruc: area.ruc,
      nombre: area.nombre,
      descripcion: area.descripcion,
      estado: area.activo,
      mostrarAdmision: area.mostrarAdmision
    });
    this.modalVisible.set(true);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.isEditing()
      ? this.form.value
      : { ...this.form.value, usuarioCreacion: this.user?.usuario || 'SYSTEM' };

    const operacion = this.isEditing()
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
    const nombreArea = area.nombre || area.descripcion || 'Sin nombre';
    if (!confirm(`¿Eliminar el área "${nombreArea}"?`)) return;

    this.areasSvc.eliminarArea(area.idarea, area.ruc).subscribe({
      next: () => this.cargarAreas(),
      error: (err) => alert(err.error?.message || 'Error al eliminar área')
    });
  }

  cerrarModal() {
    this.modalVisible.set(false);
    this.form.reset();
  }

  sincronizarDesdeCatalogo() {
    if (!confirm('¿Sincronizar áreas desde el catálogo? Esto creará las áreas que no existan.')) return;

    this.areasSvc.sincronizarAreasDesdeCatalogo(this.rucSeleccionado(), this.user?.usuario || 'SYSTEM').subscribe({
      next: () => {
        alert('Sincronización completada');
        this.cargarAreas();
      },
      error: (err) => alert(err.error?.message || 'Error al sincronizar')
    });
  }

  refresh() {
    this.cargarAreas();
  }
}
