import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { UsuarioAreaService, UsuarioPorArea } from '../../services/usuario-area.service';
import { AreasService, Area, SubArea } from '../../services/areas.service';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import { EmpresasMaestrasService, Empresa } from '../../services/empresas-maestras.service';

@Component({
  selector: 'app-usuario-area',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TableModule, ButtonModule, DialogModule, TagModule],
  templateUrl: './usuario-area.component.html',
  styleUrls: ['./usuario-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioAreaComponent implements OnInit {
  private usuarioAreaSvc = inject(UsuarioAreaService);
  private areasSvc = inject(AreasService);
  private authSvc = inject(AdminLogisticaAuthService);
  private empresasSvc = inject(EmpresasMaestrasService);
  private fb = inject(FormBuilder);

  usuarios = signal<UsuarioPorArea[]>([]);
  areas = signal<Area[]>([]);
  subAreas = signal<SubArea[]>([]);
  roles = this.usuarioAreaSvc.getRolesDisponibles();
  loading = signal(false);
  modalVisible = signal(false);
  isEditing = signal(false);

  // Empresas cargadas desde API maestra
  empresas = this.empresasSvc.empresas;
  cargandoEmpresas = this.empresasSvc.cargando;

  rucSeleccionado = signal<string>('20481121966');

  filtroArea = signal('');
  filtroRol = signal('');

  form: FormGroup = this.fb.group({
    idUsuarioArea: [0],
    documentoidentidad: ['', Validators.required],
    nombreCompleto: ['', Validators.required],
    email: [''],
    telefono: [''],
    ruc: ['', Validators.required],
    idarea: ['', Validators.required],
    idsubarea: [null],
    rol: ['', Validators.required],
    esJefeArea: [false],
    esAprobador: [false],
    activo: [true]
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
    this.cargarDatos();
  }

  get user() {
    return this.userSignal();
  }

  onEmpresaChange(ruc: string) {
    this.rucSeleccionado.set(ruc);
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargarAreas();
    this.cargarUsuarios();
  }

  cargarAreas() {
    this.areasSvc.listarAreas(this.rucSeleccionado()).subscribe({
      next: (res) => {
        this.areas.set(Array.isArray(res) ? res : res?.resultado || []);
      },
      error: () => alert('Error al cargar áreas')
    });
  }

  cargarSubAreas(idarea: number) {
    this.areasSvc.listarSubAreas(this.rucSeleccionado(), idarea).subscribe({
      next: (res) => {
        this.subAreas.set(Array.isArray(res) ? res : res?.resultado || []);
      },
      error: () => console.error('Error al cargar subáreas')
    });
  }

  onAreaChange() {
    const idarea = this.form.get('idarea')?.value;
    if (idarea) {
      this.cargarSubAreas(Number(idarea));
    } else {
      this.subAreas.set([]);
    }
  }

  cargarUsuarios() {
    this.loading.set(true);
    const filtros: any = { ruc: this.rucSeleccionado() };
    if (this.filtroArea()) filtros.idarea = Number(this.filtroArea());
    if (this.filtroRol()) filtros.rol = this.filtroRol();

    this.usuarioAreaSvc.listarUsuariosPorArea(filtros).subscribe({
      next: (res) => {
        this.usuarios.set(Array.isArray(res) ? res : res?.resultado || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        alert('Error al cargar usuarios');
      }
    });
  }

  aplicarFiltros() {
    this.cargarUsuarios();
  }

  limpiarFiltros() {
    this.filtroArea.set('');
    this.filtroRol.set('');
    this.cargarUsuarios();
  }

  abrirCrear() {
    this.isEditing.set(false);
    this.subAreas.set([]);
    this.form.reset({
      ruc: this.rucSeleccionado(),
      esJefeArea: false,
      esAprobador: false,
      activo: true
    });
    this.modalVisible.set(true);
  }

  abrirEditar(usuario: UsuarioPorArea) {
    this.isEditing.set(true);
    this.form.patchValue({
      idUsuarioArea: usuario.idUsuarioArea,
      documentoidentidad: usuario.documentoidentidad,
      nombreCompleto: usuario.nombreCompleto,
      email: usuario.email,
      telefono: usuario.telefono,
      ruc: usuario.ruc,
      idarea: usuario.idarea,
      idsubarea: usuario.idsubarea,
      rol: usuario.rol,
      esJefeArea: usuario.esJefeArea,
      esAprobador: usuario.esAprobador,
      activo: usuario.activo
    });

    this.cargarSubAreas(usuario.idarea);
    this.modalVisible.set(true);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = { ...this.form.value, usuarioCreacion: this.user?.usuario };
    const operacion = this.isEditing()
      ? this.usuarioAreaSvc.actualizarUsuarioPorArea(data)
      : this.usuarioAreaSvc.crearUsuarioPorArea(data);

    operacion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarUsuarios();
      },
      error: (err) => alert(err.error?.message || 'Error al guardar')
    });
  }

  eliminar(usuario: UsuarioPorArea) {
    if (!confirm(`¿Eliminar la asignación de "${usuario.nombreCompleto}"?`)) return;

    this.usuarioAreaSvc.eliminarUsuarioPorArea(usuario.idUsuarioArea!).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => alert(err.error?.message || 'Error al eliminar')
    });
  }

  sincronizarDesdeERP() {
    if (!confirm('¿Sincronizar usuarios desde ERP?')) return;

    this.usuarioAreaSvc.sincronizarUsuariosDesdeERP(this.rucSeleccionado(), this.user?.usuario || '').subscribe({
      next: () => {
        alert('Sincronización completada');
        this.cargarUsuarios();
      },
      error: (err) => alert(err.error?.message || 'Error al sincronizar')
    });
  }

  cerrarModal() {
    this.modalVisible.set(false);
    this.form.reset();
    this.subAreas.set([]);
  }

  refresh() {
    this.cargarUsuarios();
  }

  getNombreArea(idarea: number): string {
    const area = this.areas().find(a => a.idarea === idarea);
    return area?.descripcion || 'Sin área';
  }

  getNombreRol(rolId: string): string {
    const rol = this.roles.find(r => r.id === rolId);
    return rol?.nombre || rolId;
  }
}
