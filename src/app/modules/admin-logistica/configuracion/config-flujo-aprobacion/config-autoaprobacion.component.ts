import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import {
  AprobacionAmbitosService,
  ConfigAutoaprobacion,
  AmbitoOrganizacional,
  TipoRequerimientoAmbito,
} from '../../services/aprobacion-ambitos.service';
import { AdminLogisticaAuthService } from '../../auth/services/admin-logistica-auth.service';

interface AutoaprobForm {
  idConfig: number;
  tipoRequerimiento: TipoRequerimientoAmbito;
  idAreaAmbito: number;
  exigeNivel2: boolean;
  requiereMotivo: boolean;
  activo: boolean;
}

interface OpcionArea {
  idAreaAmbito: number;
  etiqueta: string;
}

@Component({
  selector: 'app-config-autoaprobacion',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DialogModule, TagModule],
  templateUrl: './config-autoaprobacion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigAutoaprobacionComponent implements OnInit, OnChanges {
  @Input() ruc = '';

  private svc = inject(AprobacionAmbitosService);
  private auth = inject(AdminLogisticaAuthService);

  filas = signal<ConfigAutoaprobacion[]>([]);
  opcionesArea = signal<OpcionArea[]>([]);
  loading = signal(false);
  busy = signal(false);
  error = signal('');
  mensaje = signal('');
  modal = signal(false);
  motivo = '';

  form: AutoaprobForm = this.nuevoForm();

  tipos: TipoRequerimientoAmbito[] = ['CONSUMO', 'COMPRA', 'SERVICIO'];

  ngOnInit(): void {
    this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ruc'] && !changes['ruc'].firstChange) this.cargar();
  }

  private nuevoForm(): AutoaprobForm {
    return {
      idConfig: 0,
      tipoRequerimiento: 'CONSUMO',
      idAreaAmbito: 0,
      exigeNivel2: false,
      requiereMotivo: true,
      activo: true,
    };
  }

  async cargar(): Promise<void> {
    if (!this.ruc) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const [config, estructura] = await Promise.all([
        firstValueFrom(this.svc.listarAutoaprobacion(this.ruc)).catch(() => [] as ConfigAutoaprobacion[]),
        firstValueFrom(this.svc.obtenerConfiguracion(this.ruc)).catch(() => null),
      ]);
      this.filas.set(Array.isArray(config) ? config : []);
      const ambitos = estructura?.ambitos ?? [];
      const opciones: OpcionArea[] = [{ idAreaAmbito: 0, etiqueta: 'Todas las áreas (global)' }];
      for (const a of (estructura?.areas ?? []).filter(x => x.activo)) {
        const ambito = ambitos.find((o: AmbitoOrganizacional) => o.idAmbito === a.idAmbito);
        opciones.push({
          idAreaAmbito: a.idAreaAmbito,
          etiqueta: `${ambito?.nombre ?? 'Ámbito ' + a.idAmbito} / ${a.nombre}`,
        });
      }
      this.opcionesArea.set(opciones);
    } catch (e: any) {
      this.error.set('No se pudo cargar la configuración de auto-aprobación.');
    } finally {
      this.loading.set(false);
    }
  }

  abrirNuevo(): void {
    this.form = this.nuevoForm();
    this.motivo = '';
    this.modal.set(true);
  }

  abrirEditar(fila: ConfigAutoaprobacion): void {
    this.form = {
      idConfig: fila.idConfig,
      tipoRequerimiento: fila.tipoRequerimiento,
      idAreaAmbito: fila.idAreaAmbito,
      exigeNivel2: !!fila.exigeNivel2,
      requiereMotivo: !!fila.requiereMotivo,
      activo: !!fila.activo,
    };
    this.motivo = '';
    this.modal.set(true);
  }

  onTipoChange(): void {
    // Sugerencia por defecto: CONSUMO no exige N2; COMPRA y SERVICIO sí.
    this.form.exigeNivel2 = this.form.tipoRequerimiento !== 'CONSUMO';
  }

  private metaCambio(): { ruc: string; usuario: string; motivo: string } | null {
    const usuario = this.auth.currentUser()?.usuario;
    if (!this.motivo.trim() || !usuario || !this.ruc) {
      this.error.set('Se requiere empresa, sesión administrativa y motivo del cambio.');
      return null;
    }
    return { ruc: this.ruc, usuario, motivo: this.motivo.trim() };
  }

  async guardar(): Promise<void> {
    const meta = this.metaCambio();
    if (!meta) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.svc.guardarAutoaprobacion({
        ...meta,
        tipoRequerimiento: this.form.tipoRequerimiento,
        idAreaAmbito: this.form.idAreaAmbito,
        exigeNivel2: this.form.exigeNivel2,
        requiereMotivo: this.form.requiereMotivo,
        activo: this.form.activo,
      }));
      this.modal.set(false);
      this.mensaje.set('Excepción guardada correctamente.');
      await this.cargar();
    } catch (e: any) {
      this.error.set(e?.error?.mensaje ?? 'No se pudo guardar la excepción.');
    } finally {
      this.busy.set(false);
    }
  }

  async eliminar(fila: ConfigAutoaprobacion): Promise<void> {
    const conf = await Swal.fire({
      title: 'Eliminar excepción',
      text: `Se desactivará la auto-aprobación para ${fila.tipoRequerimiento} (${fila.nombreAmbitoArea ?? 'ámbito seleccionado'}).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!conf.isConfirmed) return;

    const { value: motivo } = await Swal.fire({
      title: 'Motivo del cambio',
      input: 'text',
      inputPlaceholder: 'Obligatorio (queda auditado)',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      inputValidator: v => !v?.trim() ? 'El motivo es obligatorio' : null,
    });
    if (!motivo) return;

    const usuario = this.auth.currentUser()?.usuario;
    if (!usuario) {
      this.error.set('Se requiere sesión administrativa.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.svc.eliminarAutoaprobacion({
        ruc: this.ruc, usuario, motivo: String(motivo).trim(), idConfig: fila.idConfig,
      }));
      this.mensaje.set('Excepción eliminada.');
      await this.cargar();
    } catch (e: any) {
      this.error.set(e?.error?.mensaje ?? 'No se pudo eliminar la excepción.');
    } finally {
      this.busy.set(false);
    }
  }
}
