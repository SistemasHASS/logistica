import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminEmpresasService, Empresa } from '../../services/admin-empresas.service';
import { UserService } from '@/app/shared/services/user.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-empresas.component.html',
  styleUrls: ['./admin-empresas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEmpresasComponent implements OnInit, OnDestroy {

  empresas: Empresa[] = [];
  loading = false;
  showModal = false;
  isEdit = false;
  activeTab = 'general';
  logoPreview: string | null = null;
  private destroy$ = new Subject<void>();

  form: Empresa = {
    ruc: '',
    razonSocial: '',
    direccion: '',
    telefono: '',
    email: '',
    logoBase64: '',
    correoEnvio: '',
    correoNombre: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSeguro: true,
    activo: true,
  };

  constructor(
    private adminEmpresasService: AdminEmpresasService,
    private userService: UserService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEmpresas() {
    this.loading = true;
    this.adminEmpresasService.listarEmpresas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.resultado) {
            try {
              this.empresas = JSON.parse(response.resultado);
            } catch {
              this.empresas = response.resultado || [];
            }
          } else if (Array.isArray(response)) {
            this.empresas = response;
          } else {
            this.empresas = [];
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar empresas:', error);
          this.alertService.showAlertError('Error', 'Error al cargar empresas');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openCreate() {
    this.isEdit = false;
    this.activeTab = 'general';
    this.logoPreview = null;
    this.form = {
      ruc: '',
      razonSocial: '',
      direccion: '',
      telefono: '',
      email: '',
      logoBase64: '',
      correoEnvio: '',
      correoNombre: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      smtpSeguro: true,
      activo: true,
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEdit(empresa: Empresa) {
    this.isEdit = true;
    this.activeTab = 'general';
    this.form = { ...empresa };
    this.logoPreview = empresa.logoBase64 || null;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.logoPreview = null;
    this.cdr.detectChanges();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.showAlertError('Error', 'El logo no debe superar los 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.logoPreview = base64;
        this.form.logoBase64 = base64;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
    this.logoPreview = null;
    this.form.logoBase64 = '';
    this.cdr.detectChanges();
  }

  async save() {
    if (!this.form.ruc.trim() || this.form.ruc.length !== 11) {
      this.alertService.showAlertError('Error', 'El RUC es requerido y debe tener 11 dígitos');
      return;
    }
    if (!this.form.razonSocial.trim()) {
      this.alertService.showAlertError('Error', 'La razón social es requerida');
      return;
    }

    try {
      this.loading = true;
      this.cdr.detectChanges();

      const result = await this.adminEmpresasService.guardarEmpresa(this.form);

      if (result && (result.success || result.resultado)) {
        this.alertService.showAlertAcept(
          'Éxito',
          this.isEdit ? 'Empresa actualizada exitosamente' : 'Empresa creada exitosamente',
          'success'
        );
        this.closeModal();
        this.cargarEmpresas();
      } else {
        this.alertService.showAlertError('Error', 'Error al guardar la empresa');
        this.loading = false;
        this.cdr.detectChanges();
      }
    } catch (error: any) {
      console.error('Error al guardar empresa:', error);
      this.alertService.showAlertError('Error', error.message || 'Error al guardar empresa');
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async eliminar(empresa: Empresa) {
    if (!empresa.id) {
      this.alertService.showAlertError('Error', 'ID de empresa no válido');
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      '¿Está seguro de eliminar esta empresa?',
      'Esta acción desactivará la empresa',
      'warning'
    );

    if (!confirmacion) return;

    try {
      this.loading = true;
      this.cdr.detectChanges();
      await this.adminEmpresasService.eliminarEmpresa(empresa.id);
      this.alertService.showAlertAcept('Éxito', 'Empresa eliminada exitosamente', 'success');
      this.cargarEmpresas();
    } catch (error) {
      console.error('Error al eliminar empresa:', error);
      this.alertService.showAlertError('Error', 'Error al eliminar empresa');
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
