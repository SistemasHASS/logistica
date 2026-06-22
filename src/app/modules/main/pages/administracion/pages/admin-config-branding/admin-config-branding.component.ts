import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminBrandingService,
  BrandingData,
  BRANDING_DEFAULTS,
} from '../../services/admin-branding.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Component({
  selector: 'app-admin-config-branding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-config-branding.component.html',
  styleUrls: ['./admin-config-branding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminConfigBrandingComponent implements OnInit {
  loading = false;
  guardando = false;

  logoLoginPreview: string = '';
  iconAppPreview: string = '';
  tituloLogin: string = BRANDING_DEFAULTS.tituloLogin;
  subtituloLogin: string = BRANDING_DEFAULTS.subtituloLogin;

  logoLoginNuevo: string = '';
  iconAppNuevo: string = '';

  usuario: any;

  constructor(
    private brandingService: AdminBrandingService,
    private alertService: AlertService,
    private dexieService: DexieService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.usuario = await this.dexieService.showUsuario();
    await this.cargarBranding();
  }

  async cargarBranding(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.brandingService.invalidarCache();
      const data = await this.brandingService.obtenerBranding();
      this.logoLoginPreview = data.logoLogin || '';
      this.iconAppPreview = data.iconApp || '';
      this.tituloLogin = data.tituloLogin || BRANDING_DEFAULTS.tituloLogin;
      this.subtituloLogin = data.subtituloLogin || BRANDING_DEFAULTS.subtituloLogin;
      this.logoLoginNuevo = '';
      this.iconAppNuevo = '';
    } catch {
      this.alertService.showAlertError('Error', 'No se pudo cargar la configuración de branding');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onLogoLoginSelected(event: Event): void {
    this.onFileSelected(event, 'logo');
  }

  onIconAppSelected(event: Event): void {
    this.onFileSelected(event, 'icon');
  }

  private onFileSelected(event: Event, tipo: 'logo' | 'icon'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const maxSize = tipo === 'icon' ? 512 * 1024 : 2 * 1024 * 1024;
    const label = tipo === 'icon' ? 'El ícono' : 'El logo';

    if (file.size > maxSize) {
      this.alertService.showAlertError(
        'Archivo muy grande',
        `${label} no debe superar los ${tipo === 'icon' ? '512KB' : '2MB'}`
      );
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (tipo === 'logo') {
        this.logoLoginPreview = base64;
        this.logoLoginNuevo = base64;
      } else {
        this.iconAppPreview = base64;
        this.iconAppNuevo = base64;
      }
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  quitarLogoLogin(): void {
    this.logoLoginPreview = '';
    this.logoLoginNuevo = 'REMOVE';
    this.cdr.detectChanges();
  }

  quitarIconApp(): void {
    this.iconAppPreview = '';
    this.iconAppNuevo = 'REMOVE';
    this.cdr.detectChanges();
  }

  async guardar(): Promise<void> {
    if (!this.tituloLogin.trim()) {
      this.alertService.showAlertError('Error', 'El título del login es requerido');
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    try {
      const usuario = this.usuario?.usuario || 'ADMIN';
      const data: Partial<BrandingData> = {
        tituloLogin: this.tituloLogin.trim(),
        subtituloLogin: this.subtituloLogin.trim(),
      };

      if (this.logoLoginNuevo === 'REMOVE') {
        data.logoLogin = '';
      } else if (this.logoLoginNuevo) {
        data.logoLogin = this.logoLoginNuevo;
      }

      if (this.iconAppNuevo === 'REMOVE') {
        data.iconApp = '';
      } else if (this.iconAppNuevo) {
        data.iconApp = this.iconAppNuevo;
      }

      await this.brandingService.guardarTodoBranding(data, usuario);

      this.alertService.showAlertAcept(
        'Guardado',
        'Configuración de branding actualizada correctamente',
        'success'
      );
      this.logoLoginNuevo = '';
      this.iconAppNuevo = '';
    } catch (error: any) {
      this.alertService.showAlertError('Error', error.message || 'Error al guardar');
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  async restaurarDefaults(): Promise<void> {
    const confirm = await this.alertService.showConfirm(
      '¿Restaurar valores por defecto?',
      'Se eliminarán el logo e ícono personalizados y se restaurarán los textos originales.',
      'warning'
    );
    if (!confirm) return;

    this.tituloLogin = BRANDING_DEFAULTS.tituloLogin;
    this.subtituloLogin = BRANDING_DEFAULTS.subtituloLogin;
    this.logoLoginPreview = '';
    this.iconAppPreview = '';
    this.logoLoginNuevo = 'REMOVE';
    this.iconAppNuevo = 'REMOVE';
    this.cdr.detectChanges();

    await this.guardar();
  }
}
