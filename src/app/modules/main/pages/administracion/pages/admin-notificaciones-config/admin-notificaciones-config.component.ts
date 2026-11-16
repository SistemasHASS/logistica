import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNotificacionesService } from '../../services/admin-notificaciones.service';
import { AdminRolesService } from '../../services/admin-roles.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { ACCORDION_DEFAULT } from '../../../../services/layout-config.service';

interface TipoNotificacion {
  tipo_notificacion: string;
  descripcion: string;
  modulo: string;
  activo: boolean;
}

interface FilaConfig {
  tipo_notificacion: string;
  descripcion: string;
  modulo: string;
  canal: string;
  activo: boolean;
  configurado: boolean;
}

@Component({
  selector: 'app-admin-notificaciones-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-notificaciones-config.component.html',
  styleUrls: ['./admin-notificaciones-config.component.scss'],
})
export class AdminNotificacionesConfigComponent implements OnInit {
  // ── Catálogo de tipos ─────────────────────────────────────────────────────
  tipos: TipoNotificacion[] = [];
  loadingTipos = false;
  modalTipoVisible = false;
  tipoEditando: TipoNotificacion | null = null;
  tipoForm: TipoNotificacion = { tipo_notificacion: '', descripcion: '', modulo: '', activo: true };
  moduloOtro = false; // true cuando se elige "Otro..." en el select de módulo

  /** Todos los módulos configurables: ids del menú dinámico + los del catálogo. */
  get modulosExistentes(): string[] {
    const menuIds = ACCORDION_DEFAULT.flatMap((g) => g.items.map((i) => i.id));
    return [...new Set([...menuIds, ...this.tipos.map((t) => t.modulo).filter(Boolean)])].sort();
  }

  /** Auto-formato SNAKE_CASE en el código del tipo. */
  onTipoCodigoInput(valor: string) {
    this.tipoForm.tipo_notificacion = valor
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_/, '');
  }

  // ── Config por rol ────────────────────────────────────────────────────────
  roles: any[] = [];
  rolSeleccionado = '';
  filas: FilaConfig[] = [];
  loadingConfig = false;
  guardando = false;
  canales = ['AMBOS', 'BANDEJA', 'TOAST'];

  // ── Parámetros globales ───────────────────────────────────────────────────
  pollSegundos = 60;
  guardandoParam = false;

  get modulosAgrupados(): string[] {
    return [...new Set(this.filas.map((f) => f.modulo))];
  }

  filasPorModulo(modulo: string): FilaConfig[] {
    return this.filas.filter((f) => f.modulo === modulo);
  }

  constructor(
    private svc: AdminNotificacionesService,
    private rolesSvc: AdminRolesService,
    private alertService: AlertService,
    private dexieService: DexieService,
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.cargarTipos(), this.cargarRoles(), this.cargarParams()]);
  }

  // ── Roles ─────────────────────────────────────────────────────────────────
  async cargarRoles() {
    try {
      const resp: any = await this.rolesSvc.listarRoles({}).toPromise();
      let lista = resp?.resultado ?? resp;
      if (typeof lista === 'string') lista = JSON.parse(lista);
      const data = Array.isArray(lista) ? lista : [];
      // Normalizar campos: los roles pueden venir como idrol/id/RolId/nombre/RolNombre
      this.roles = data.map((r: any) => ({
        idrol: r.idrol ?? r.id ?? r.RolId ?? r.RolCodigo ?? r.codigo ?? r.nombre,
        nombre: r.nombre ?? r.RolNombre ?? r.descripcion ?? r.Descripcion ?? '',
      }));
    } catch (e) {
      console.error('Error al cargar roles:', e);
    }
  }

  // ── Catálogo de tipos ─────────────────────────────────────────────────────
  async cargarTipos() {
    try {
      this.loadingTipos = true;
      this.tipos = (await this.svc.listarTipos()) || [];
    } catch (e) {
      console.error('Error al cargar tipos:', e);
    } finally {
      this.loadingTipos = false;
    }
  }

  abrirModalTipo(tipo?: TipoNotificacion) {
    this.tipoEditando = tipo ?? null;
    this.tipoForm = tipo
      ? { ...tipo }
      : { tipo_notificacion: '', descripcion: '', modulo: '', activo: true };
    // Si el módulo no está en la lista, activar el input libre
    this.moduloOtro = !!tipo && !this.modulosExistentes.includes(tipo.modulo);
    this.modalTipoVisible = true;
  }

  onModuloSelect(valor: string) {
    this.moduloOtro = valor === '__OTRO__';
    if (this.moduloOtro) this.tipoForm.modulo = '';
    else this.tipoForm.modulo = valor;
  }

  async guardarTipo() {
    if (!this.tipoForm.tipo_notificacion?.trim() || !this.tipoForm.modulo?.trim()) {
      this.alertService.showAlert('Campos requeridos', 'Tipo y módulo son obligatorios.', 'warning');
      return;
    }
    try {
      const resp: any = await this.svc.guardarTipo(this.tipoForm);
      if (resp?.success === false) {
        this.alertService.showAlertError('Error', resp?.mensaje || 'No se pudo guardar');
        return;
      }
      this.alertService.mostrarInfo('Tipo de notificación guardado');
      this.modalTipoVisible = false;
      await this.cargarTipos();
      if (this.rolSeleccionado) await this.cargarConfig();
    } catch (e) {
      this.alertService.showAlertError('Error', 'No se pudo guardar el tipo');
    }
  }

  async eliminarTipo(tipo: TipoNotificacion) {
    const res = await this.alertService.showConfirmWithCancel(
      'Eliminar tipo',
      `¿Eliminar el tipo "${tipo.tipo_notificacion}"? Se quitará también de la configuración de todos los roles.`,
      'warning', 'Eliminar', 'Cancelar',
    );
    if (res !== 'confirm') return;
    try {
      await this.svc.eliminarTipo(tipo.tipo_notificacion);
      this.alertService.mostrarInfo('Tipo eliminado');
      await this.cargarTipos();
      if (this.rolSeleccionado) await this.cargarConfig();
    } catch (e) {
      this.alertService.showAlertError('Error', 'No se pudo eliminar el tipo');
    }
  }

  // ── Config por rol ────────────────────────────────────────────────────────
  async cargarConfig() {
    if (!this.rolSeleccionado) { this.filas = []; return; }
    try {
      this.loadingConfig = true;
      const config = (await this.svc.listarConfig(this.rolSeleccionado)) || [];
      // Todas las filas del catálogo activo + las ya configuradas
      this.filas = this.tipos
        .filter((t) => t.activo)
        .map((t) => {
          const cfg = config.find((c: any) => c.tipo_notificacion === t.tipo_notificacion);
          return {
            tipo_notificacion: t.tipo_notificacion,
            descripcion: t.descripcion,
            modulo: t.modulo,
            canal: cfg?.canal ?? 'AMBOS',
            activo: cfg ? !!cfg.activo : false,
            configurado: !!cfg,
          };
        });
    } catch (e) {
      console.error('Error al cargar config:', e);
    } finally {
      this.loadingConfig = false;
    }
  }

  async guardarConfig() {
    if (!this.rolSeleccionado) return;
    try {
      this.guardando = true;
      const usuario = await this.dexieService.showUsuario();
      const items = this.filas
        .filter((f) => f.activo)
        .map((f) => ({ tipo_notificacion: f.tipo_notificacion, canal: f.canal, activo: true }));
      const resp: any = await this.svc.guardarConfig(
        this.rolSeleccionado, items, usuario?.documentoidentidad,
      );
      if (resp?.success === false) {
        this.alertService.showAlertError('Error', resp?.mensaje || 'No se pudo guardar');
        return;
      }
      this.alertService.mostrarInfo('Configuración de notificaciones guardada');
      await this.cargarConfig();
    } catch (e) {
      this.alertService.showAlertError('Error', 'No se pudo guardar la configuración');
    } finally {
      this.guardando = false;
    }
  }

  // ── Parámetros ────────────────────────────────────────────────────────────
  async cargarParams() {
    try {
      const params = (await this.svc.listarParams()) || [];
      const poll = params.find((p: any) => p.clave === 'NOTIF_POLL_SEGUNDOS');
      if (poll) this.pollSegundos = Number(poll.valor) || 60;
    } catch (e) {
      console.error('Error al cargar parámetros:', e);
    }
  }

  async guardarParam() {
    if (!this.pollSegundos || this.pollSegundos < 10) {
      this.alertService.showAlert('Valor inválido', 'El intervalo debe ser al menos 10 segundos.', 'warning');
      return;
    }
    try {
      this.guardandoParam = true;
      const usuario = await this.dexieService.showUsuario();
      await this.svc.guardarParam(
        'NOTIF_POLL_SEGUNDOS', String(this.pollSegundos), usuario?.documentoidentidad,
      );
      this.alertService.mostrarInfo('Intervalo de verificación guardado');
    } catch (e) {
      this.alertService.showAlertError('Error', 'No se pudo guardar el parámetro');
    } finally {
      this.guardandoParam = false;
    }
  }
}
