import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { AdminFlujosService } from '../../services/admin-flujos.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-flujos',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './admin-flujos.component.html',
  styleUrls: ['./admin-flujos.component.scss'],
})
export class AdminFlujosComponent implements OnInit, OnDestroy {

  flujos: any[] = [];
  loading = false;
  guardando = false;
  showModal = false;
  isEdit = false;
  private destroy$ = new Subject<void>();

  tiposFlujo = [
    { value: 'REQ', label: 'Requerimiento' },
    { value: 'OC',  label: 'Orden de Compra' },
    { value: 'OS',  label: 'Orden de Servicio' },
  ];

  tipoTexto(tipo: any): string {
    return this.tiposFlujo.find(t => t.value === tipo)?.label ?? (tipo ?? '');
  }

  form: {
    id?: number;
    nombre: string;
    descripcion: string;
    tipo: string;
  } = {
    nombre: '',
    descripcion: '',
    tipo: ''
  };

  constructor(
    private adminFlujosService: AdminFlujosService,
    private userService: UserService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarFlujos();

    this.userService.usuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuario => {
        if (usuario && usuario.ruc && usuario.documentoidentidad) {
          this.cargarFlujos();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarFlujos() {
    this.loading = true;
    const usuario = this.userService.getUsuario();

    const body = {
      ruc: usuario?.ruc || '',
      usuario: usuario?.documentoidentidad || ''
    };

    this.adminFlujosService.listarFlujos(body).subscribe({
      next: (response) => {
        this.flujos = this.parseLista(response);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar flujos:', error);
        this.alertService.showAlertError('Error', 'Error al cargar flujos');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private parseLista(response: any): any[] {
    let lista: any[] = [];

    if (Array.isArray(response)) {
      lista = response;
    } else if (response && typeof response === 'object') {
      const data = response.resultado ?? response.data ?? response.result ?? response.response;
      if (typeof data === 'string') {
        try { lista = JSON.parse(data); } catch { lista = []; }
      } else if (Array.isArray(data)) {
        lista = data;
      }
    }

    return Array.isArray(lista) ? lista : [];
  }

  estadoTexto(flujo: any): string {
    const e = flujo?.estado;
    if (e === true || e === 1) return 'ACTIVO';
    if (e === false || e === 0) return 'INACTIVO';
    return (e ?? 'ACTIVO').toString().toUpperCase();
  }

  openCreate() {
    this.isEdit = false;
    this.form = {
      nombre: '',
      descripcion: '',
      tipo: ''
    };
    this.showModal = true;
  }

  openEdit(flujo: any) {
    this.isEdit = true;
    this.form = {
      id: flujo.id,
      nombre: flujo.nombre ?? '',
      descripcion: flujo.descripcion ?? '',
      tipo: flujo.tipo ?? ''
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

    const usuario = this.userService.getUsuario();
    if (!usuario || !usuario.ruc || !usuario.documentoidentidad) {
      this.alertService.showAlertError('Error', 'No se encontró información del usuario. Por favor, recargue la página.');
      return;
    }

    const body = {
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion?.trim() || '',
      tipo: this.form.tipo || null,
      usuarioCreacion: usuario.documentoidentidad,
      usuarioModificacion: usuario.documentoidentidad,
      usuario: usuario.documentoidentidad,
      ruc: usuario.ruc
    };

    try {
      this.guardando = true;
      const res = this.isEdit
        ? await this.adminFlujosService.actualizarFlujo({ ...body, id: this.form.id })
        : await this.adminFlujosService.crearFlujo(body);

      let resultado = res;
      if (resultado && typeof resultado.resultado === 'string') {
        try { resultado = JSON.parse(resultado.resultado); } catch { /* dejar como está */ }
      }

      if (resultado && resultado.success === false) {
        this.alertService.showAlertError('Error', resultado.mensaje || 'No se pudo guardar el flujo');
        return;
      }

      this.alertService.showAlertAcept('Éxito', resultado?.mensaje || (this.isEdit ? 'Flujo actualizado exitosamente' : 'Flujo creado exitosamente'), 'success');
      this.closeModal();
      this.cargarFlujos();
    } catch (error) {
      console.error('Error al guardar flujo:', error);
      this.alertService.showAlertError('Error', 'Error al guardar flujo');
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  async eliminar(flujo: any) {
    const confirmacion = await this.alertService.showConfirm(
      '¿Está seguro de eliminar este flujo?',
      `${flujo.nombre}`,
      'warning'
    );

    if (!confirmacion) return;

    try {
      const res = await this.adminFlujosService.eliminarFlujo({ id: flujo.id });

      let resultado = res;
      if (resultado && typeof resultado.resultado === 'string') {
        try { resultado = JSON.parse(resultado.resultado); } catch { /* dejar como está */ }
      }

      if (resultado && resultado.success === false) {
        this.alertService.showAlertError('Error', resultado.mensaje || 'No se pudo eliminar el flujo');
        return;
      }

      this.alertService.showAlertAcept('Éxito', resultado?.mensaje || 'Flujo eliminado exitosamente', 'success');
      this.cargarFlujos();
    } catch (error) {
      console.error('Error al eliminar flujo:', error);
      this.alertService.showAlertError('Error', 'Error al eliminar flujo');
    }
  }
}
