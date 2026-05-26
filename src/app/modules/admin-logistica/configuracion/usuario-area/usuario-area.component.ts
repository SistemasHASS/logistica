import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UsuarioAreaService, UsuarioPorArea } from '../../services/usuario-area.service';
import { AreasService, Area, SubArea } from '../../services/areas.service';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';

@Component({
  selector: 'app-usuario-area',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './usuario-area.component.html',
  styleUrls: ['./usuario-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioAreaComponent implements OnInit {
  private usuarioAreaSvc = inject(UsuarioAreaService);
  private areasSvc = inject(AreasService);
  private authSvc = inject(AdminLogisticaAuthService);
  private fb = inject(FormBuilder);

  usuarios: UsuarioPorArea[] = [];
  areas: Area[] = [];
  subAreas: SubArea[] = [];
  roles = this.usuarioAreaSvc.getRolesDisponibles();
  loading = false;
  modalVisible = false;
  isEditing = false;

  filtroArea = '';
  filtroRol = '';

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
  rucEmpresa = this.userSignal()?.ruc || '20481121966';

  get user() {
    return this.userSignal();
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargarAreas();
    this.cargarUsuarios();
  }

  cargarAreas() {
    this.areasSvc.listarAreas(this.rucEmpresa).subscribe({
      next: (res) => {
        this.areas = Array.isArray(res) ? res : res?.resultado || [];
      },
      error: () => alert('Error al cargar áreas')
    });
  }

  cargarSubAreas(idarea: number) {
    this.areasSvc.listarSubAreas(this.rucEmpresa, idarea).subscribe({
      next: (res) => {
        this.subAreas = Array.isArray(res) ? res : res?.resultado || [];
      },
      error: () => console.error('Error al cargar subáreas')
    });
  }

  onAreaChange() {
    const idarea = this.form.get('idarea')?.value;
    if (idarea) {
      this.cargarSubAreas(Number(idarea));
    } else {
      this.subAreas = [];
    }
  }

  cargarUsuarios() {
    this.loading = true;
    const filtros: any = { ruc: this.rucEmpresa };
    if (this.filtroArea) filtros.idarea = Number(this.filtroArea);
    if (this.filtroRol) filtros.rol = this.filtroRol;

    this.usuarioAreaSvc.listarUsuariosPorArea(filtros).subscribe({
      next: (res) => {
        this.usuarios = Array.isArray(res) ? res : res?.resultado || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Error al cargar usuarios');
      }
    });
  }

  aplicarFiltros() {
    this.cargarUsuarios();
  }

  limpiarFiltros() {
    this.filtroArea = '';
    this.filtroRol = '';
    this.cargarUsuarios();
  }

  abrirCrear() {
    this.isEditing = false;
    this.subAreas = [];
    this.form.reset({
      ruc: this.rucEmpresa,
      esJefeArea: false,
      esAprobador: false,
      activo: true
    });
    this.modalVisible = true;
  }

  abrirEditar(usuario: UsuarioPorArea) {
    this.isEditing = true;
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
    this.modalVisible = true;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = { ...this.form.value, usuarioCreacion: this.user?.usuario };
    const operacion = this.isEditing
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

    this.usuarioAreaSvc.sincronizarUsuariosDesdeERP(this.rucEmpresa, this.user?.usuario || '').subscribe({
      next: () => {
        alert('Sincronización completada');
        this.cargarUsuarios();
      },
      error: (err) => alert(err.error?.message || 'Error al sincronizar')
    });
  }

  cerrarModal() {
    this.modalVisible = false;
    this.form.reset();
    this.subAreas = [];
  }

  getNombreArea(idarea: number): string {
    const area = this.areas.find(a => a.idarea === idarea);
    return area?.descripcion || 'Sin área';
  }

  getNombreRol(rolId: string): string {
    const rol = this.roles.find(r => r.id === rolId);
    return rol?.nombre || rolId;
  }
}
