import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { FlujoAprobacionAreaService, FlujoAprobacionArea, Area } from '../../services/flujo-aprobacion-area.service';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import { EmpresasMaestrasService, Empresa } from '../../services/empresas-maestras.service';

@Component({
  selector: 'app-flujo-aprobacion-area',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    DialogModule,
    TagModule
  ],
  templateUrl: './flujo-aprobacion-area.component.html',
  styleUrls: ['./flujo-aprobacion-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlujoAprobacionAreaComponent implements OnInit {
  private flujoSvc = inject(FlujoAprobacionAreaService);
  private authSvc = inject(AdminLogisticaAuthService);
  private empresasSvc = inject(EmpresasMaestrasService);
  private fb = inject(FormBuilder);

  flujos = signal<FlujoAprobacionArea[]>([]);
  areas = signal<Area[]>([]);
  loading = signal(false);
  modalVisible = signal(false);
  isEditing = signal(false);

  // Empresas cargadas desde API maestra
  empresas = this.empresasSvc.empresas;
  cargandoEmpresas = this.empresasSvc.cargando;

  rucSeleccionado = signal<string>('20481121966');
  idareaSeleccionado = signal<number | undefined>(undefined);

  tiposRequerimiento = [
    { label: 'CONSUMO', value: 'CONSUMO' },
    { label: 'COMPRA', value: 'COMPRA' },
    { label: 'SERVICIO', value: 'SERVICIO' },
    { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA' }
  ];

  rolesAprobador = [
    { label: 'JEFE_AREA', value: 'JEFE_AREA' },
    { label: 'APLOGIST', value: 'APLOGIST' },
    { label: 'JLOLOGIST', value: 'JLOLOGIST' },
    { label: 'JEMLOGIST', value: 'JEMLOGIST' }
  ];

  form: FormGroup = this.fb.group({
    idFlujo: [0],
    ruc: ['', Validators.required],
    idarea: [null, Validators.required],
    tipoRequerimiento: ['', Validators.required],
    rolAprobador: ['', Validators.required],
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
    this.cargarAreas();
    this.cargarFlujos();
  }

  get user() {
    return this.userSignal();
  }

  onEmpresaChange(ruc: string) {
    this.rucSeleccionado.set(ruc);
    this.idareaSeleccionado.set(undefined);
    this.cargarAreas();
    this.cargarFlujos();
  }

  onAreaChange(idarea: number | undefined) {
    this.idareaSeleccionado.set(idarea);
    this.cargarFlujos();
  }

  cargarAreas() {
    this.flujoSvc.listarAreas(this.rucSeleccionado()).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : res?.resultado || [];
        this.areas.set(data);
      },
      error: () => {
        alert('Error al cargar áreas');
      }
    });
  }

  cargarFlujos() {
    this.loading.set(true);
    this.flujoSvc.listarFlujoAprobacionArea(this.rucSeleccionado(), this.idareaSeleccionado()).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : res?.resultado || [];
        this.flujos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        alert('Error al cargar flujo de aprobaciones');
      }
    });
  }

  abrirCrear() {
    this.isEditing.set(false);
    this.form.reset({
      ruc: this.rucSeleccionado(),
      idarea: this.idareaSeleccionado(),
      activo: true
    });
    this.modalVisible.set(true);
  }

  abrirEditar(flujo: FlujoAprobacionArea) {
    this.isEditing.set(true);
    this.form.patchValue({
      idFlujo: flujo.idFlujo,
      ruc: flujo.ruc,
      idarea: flujo.idarea,
      tipoRequerimiento: flujo.tipoRequerimiento,
      rolAprobador: flujo.rolAprobador,
      activo: flujo.activo
    });
    this.modalVisible.set(true);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.value;
    this.flujoSvc.guardarFlujoAprobacionArea(data).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarFlujos();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar flujo de aprobación');
      }
    });
  }

  eliminar(flujo: FlujoAprobacionArea) {
    if (!confirm(`¿Eliminar la regla de aprobación para ${flujo.tipoRequerimiento} en área ${flujo.nombreArea || flujo.idarea}?`)) return;

    this.flujoSvc.eliminarFlujoAprobacionArea(flujo.idFlujo).subscribe({
      next: () => this.cargarFlujos(),
      error: (err) => alert(err.error?.message || 'Error al eliminar flujo de aprobación')
    });
  }

  cerrarModal() {
    this.modalVisible.set(false);
    this.form.reset();
  }

  refresh() {
    this.cargarFlujos();
  }
}
