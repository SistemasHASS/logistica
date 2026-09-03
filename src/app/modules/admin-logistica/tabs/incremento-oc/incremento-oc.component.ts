import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';
import {
  IncrementoOcAuditoria,
  IncrementoOcConfiguracion,
  IncrementoOcService
} from './incremento-oc.service';

@Component({
  selector: 'app-incremento-oc',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './incremento-oc.component.html',
  styleUrl: './incremento-oc.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncrementoOcComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly incrementoService = inject(IncrementoOcService);
  private readonly authService = inject(AdminLogisticaAuthService);
  private readonly alerts = inject(AlertService);

  readonly loading = signal(true);
  readonly loadingHistory = signal(false);
  readonly loadingAudit = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly historyError = signal('');
  readonly auditError = signal('');
  readonly vigente = signal<IncrementoOcConfiguracion | null>(null);
  readonly historial = signal<IncrementoOcConfiguracion[]>([]);
  readonly auditoria = signal<IncrementoOcAuditoria[]>([]);
  readonly modalAuditoriaVisible = signal(false);
  readonly versionAuditoria = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    motivo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
  });

  readonly filtrosForm = this.fb.nonNullable.group({
    desde: [''],
    hasta: [''],
    estado: ['']
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      vigente: this.incrementoService.obtenerVigente(),
      historial: this.incrementoService.obtenerHistorial(this.crearFiltros())
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ vigente, historial }) => {
        this.vigente.set(vigente?.idConfigIncremento ? vigente : null);
        this.historial.set(historial || []);
        if (vigente?.idConfigIncremento) this.form.controls.porcentaje.setValue(Number(vigente.porcentaje));
      },
      error: () => this.error.set('No se pudo cargar la configuración de incremento de OC.')
    });
  }

  cargarHistorial(): void {
    if (this.rangoFechasInvalido) {
      this.historyError.set('La fecha desde no puede ser posterior a la fecha hasta.');
      return;
    }
    this.loadingHistory.set(true);
    this.historyError.set('');
    this.incrementoService.obtenerHistorial(this.crearFiltros())
      .pipe(finalize(() => this.loadingHistory.set(false)))
      .subscribe({
        next: historial => this.historial.set(historial || []),
        error: () => this.historyError.set('No se pudo cargar el historial.')
      });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({ desde: '', hasta: '', estado: '' });
    this.cargarHistorial();
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const user = this.authService.currentUser();
    if (!user) {
      this.error.set('No se encontró la información del usuario autenticado.');
      return;
    }
    const { porcentaje, motivo } = this.form.getRawValue();
    const anterior = this.vigente()?.porcentaje;
    const confirmed = await this.alerts.showConfirm(
      'Guardar nueva versión',
      `Se cambiará el incremento máximo de <strong>${anterior ?? 0}%</strong> a <strong>${porcentaje}%</strong>. Las OC existentes conservarán su configuración original.`,
      'question'
    );
    if (!confirmed) return;

    this.saving.set(true);
    this.error.set('');
    this.incrementoService.crear({
      porcentaje: Number(porcentaje),
      motivo: motivo.trim(),
      usuario: user.usuario,
      nombreUsuario: user.nombre
    }).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: response => {
        if (!response.success) {
          this.error.set(response.mensaje || 'No se pudo guardar la nueva versión.');
          return;
        }
        this.form.controls.motivo.reset('');
        this.alerts.showAlert('Configuración guardada', response.mensaje, 'success');
        this.cargarDatos();
      },
      error: () => this.error.set('No se pudo guardar la nueva versión. Inténtelo nuevamente.')
    });
  }

  verAuditoria(item: IncrementoOcConfiguracion): void {
    this.modalAuditoriaVisible.set(true);
    this.versionAuditoria.set(item.version);
    this.loadingAudit.set(true);
    this.auditError.set('');
    this.auditoria.set([]);
    this.incrementoService.obtenerAuditoria({ idConfigIncremento: item.idConfigIncremento })
      .pipe(finalize(() => this.loadingAudit.set(false)))
      .subscribe({
        next: auditoria => this.auditoria.set(auditoria || []),
        error: () => this.auditError.set('No se pudo cargar la auditoría de esta versión.')
      });
  }

  cerrarAuditoria(): void {
    this.modalAuditoriaVisible.set(false);
    this.auditoria.set([]);
  }

  formatoJson(value: string | null): string {
    if (!value) return 'Sin datos';
    try { return JSON.stringify(JSON.parse(value) as unknown, null, 2); } catch { return value; }
  }

  get porcentaje(): number {
    return Number(this.form.controls.porcentaje.value) || 0;
  }

  get rangoFechasInvalido(): boolean {
    const { desde, hasta } = this.filtrosForm.getRawValue();
    return Boolean(desde && hasta && desde > hasta);
  }

  private crearFiltros(): { desde?: string; hasta?: string; estado?: string } {
    const filtros = this.filtrosForm.getRawValue();
    return {
      ...(filtros.desde ? { desde: filtros.desde } : {}),
      ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
      ...(filtros.estado ? { estado: filtros.estado } : {})
    };
  }
}
