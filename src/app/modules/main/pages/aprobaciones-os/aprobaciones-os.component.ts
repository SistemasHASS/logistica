import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AprobacionOSService } from '../../../../services/aprobacion-os.service';
import { AlertService } from '../../../../shared/alertas/alerts.service';
import { UserService } from '../../../../shared/services/user.service';
import { DexieService } from '../../../../shared/dixiedb/dexie-db.service';
import { Usuario } from '../../../../shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { lastValueFrom } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-aprobaciones-os',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CardModule,
    TooltipModule
  ],
  templateUrl: './aprobaciones-os.component.html',
  styleUrls: ['./aprobaciones-os.component.scss'],
})
export class AprobacionesOSComponent implements OnInit {
  // Tabs
  tabActiva: number = 0;

  // Usuario
  usuario: Usuario = {
    id: '',
    sociedad: 0,
    idempresa: '',
    ruc: '',
    razonSocial: '',
    idProyecto: '',
    proyecto: '',
    documentoidentidad: '',
    usuario: '',
    clave: '',
    nombre: '',
    idrol: '',
    rol: '',
  };

  // Contadores
  contadores = {
    totalPendientes: 0,
    totalAprobadas: 0,
    totalRechazadas: 0,
    totalVencidas: 0,
  };

  // Control de permisos - roles que pueden aprobar OS
  get puedeAprobar(): boolean {
    const rol = (this.usuario?.idrol ?? '').toUpperCase();
    return rol.includes('FINANZAS');
  }

  get soloVisualizacion(): boolean {
    return !this.puedeAprobar;
  }

  // Rol usado para filtrar listados. Vacío para lectura = ver todas las OS.
  get rolFiltro(): string {
    return this.puedeAprobar ? this.usuario?.idrol ?? '' : '';
  }

  get documentoIdentidadFiltro(): string {
    return this.puedeAprobar ? this.usuario?.documentoidentidad ?? '' : '';
  }

  // OS Pendientes
  osPendientes: any[] = [];
  osPendientesFiltradas: any[] = [];

  // OS Aprobadas / Rechazadas
  osAprobadas: any[] = [];
  tabVistaActiva: 'PENDIENTES' | 'APROBADAS' | 'RECHAZADAS' = 'PENDIENTES';

  // Pagination
  rowsPerPageOptions = [10, 25, 50, 100];
  rows = 10;

  // Historial
  historialAprobaciones: any[] = [];

  // Usuarios Aprobadores
  usuariosAprobadores: any[] = [];
  usuarioAprobadorForm: any = null;
  modalUsuarioAprobador = false;

  // Flujos de Aprobación
  flujosAprobacion: any[] = [];
  flujoAprobacionForm: any = null;
  modalFlujoAprobacion = false;

  // Modal detalle OS
  modalDetalleOS = false;
  osDetalle: any = null;
  historialOS: any[] = [];

  // Modal aprobación/rechazo
  modalAprobacion = false;
  accionAprobacion: 'APROBAR' | 'RECHAZAR' = 'APROBAR';
  observacionesAprobacion = '';
  osSeleccionada: any = null;

  // Modal motivo anulacion OS
  modalMotivoAbierto = false;
  motivoTexto = '';
  osAccionPendiente: any = null;

  // Filtros
  filtroEstado = 'TODAS';
  filtroProveedor = '';
  filtroFechaInicio = '';
  filtroFechaFin = '';

  // Opciones
  opcionesEstado = [
    { label: 'Todas', value: 'TODAS' },
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Aprobadas', value: 'APROBADA' },
    { label: 'Rechazadas', value: 'RECHAZADA' },
  ];

  constructor(
    private aprobacionOSService: AprobacionOSService,
    private alertService: AlertService,
    private userService: UserService,
    private dexieService: DexieService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarContadores();
    await this.cargarOSPendientes();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarContadores() {
    try {
      const contadores = await this.aprobacionOSService
        .obtenerContadores(this.documentoIdentidadFiltro, this.rolFiltro)
        .toPromise();

      if (contadores) {
        this.contadores = contadores;
      }
    } catch (error) {
      console.error('Error al cargar contadores:', error);
    }
  }

  async cargarOSPendientes() {
    try {
      this.alertService.mostrarModalCarga();

      const respDetallado = await lastValueFrom(
        this.aprobacionOSService.listarOSPendientes(this.rolFiltro)
      );
      const pendientes = Array.isArray(respDetallado) ? respDetallado : [];

      this.osPendientes = pendientes;
      this.contadores.totalPendientes = pendientes.length;
      this.aplicarFiltros();
      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar OS pendientes:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'No se pudieron cargar las órdenes de servicio pendientes', 'error');
    }
  }

  async cambiarVista(tab: 'PENDIENTES' | 'APROBADAS' | 'RECHAZADAS') {
    this.tabVistaActiva = tab;
    if (tab === 'APROBADAS') {
      await this.cargarOSAprobadas('APROBADA');
    } else if (tab === 'RECHAZADAS') {
      await this.cargarOSAprobadas('RECHAZADA');
    }
  }

  async cargarOSAprobadas(estado: string) {
    try {
      this.alertService.mostrarModalCarga();
      const resp = await lastValueFrom(
        this.aprobacionOSService.listarHistorialAprobaciones(this.rolFiltro, estado)
      );
      this.osAprobadas = Array.isArray(resp) ? resp : [];
      this.alertService.cerrarModalCarga();
    } catch (error) {
      this.alertService.cerrarModalCarga();
      this.osAprobadas = [];
    }
  }

  async cargarHistorial() {
    try {
      const response = await this.aprobacionOSService
        .listarHistorialAprobaciones(this.rolFiltro)
        .toPromise();

      if (response) {
        this.historialAprobaciones = response;
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      this.alertService.showAlert('Error', 'No se pudo cargar el historial', 'error');
    }
  }

  aplicarFiltros() {
    this.osPendientesFiltradas = this.osPendientes.filter((os) => {
      let cumpleFiltro = true;

      if (this.filtroProveedor) {
        cumpleFiltro =
          cumpleFiltro &&
          (os.nombreProveedor || os.osNombreProveedor || '')
            ?.toLowerCase().includes(this.filtroProveedor.toLowerCase());
      }

      if (this.filtroFechaInicio) {
        cumpleFiltro =
          cumpleFiltro && new Date(os.fechaGeneracion) >= new Date(this.filtroFechaInicio);
      }

      if (this.filtroFechaFin) {
        cumpleFiltro =
          cumpleFiltro && new Date(os.fechaGeneracion) <= new Date(this.filtroFechaFin);
      }

      return cumpleFiltro;
    });
  }

  limpiarFiltros() {
    this.filtroProveedor = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.aplicarFiltros();
  }

  async verDetalleOS(os: any) {
    try {
      this.alertService.mostrarModalCarga();

      const detalle = await lastValueFrom(
        this.aprobacionOSService.obtenerOSDetalle({
          idAprobacion: os.IdAprobacion || os.idAprobacion,
          codigoOrden: os.CodigoOrden || os.codigoOrden,
        })
      );

      if (detalle) {
        const items = typeof detalle.items === 'string' ? JSON.parse(detalle.items) : (detalle.items || []);
        const niveles = typeof detalle.nivelesAprobacion === 'string' ? JSON.parse(detalle.nivelesAprobacion) : (detalle.nivelesAprobacion || []);
        this.osDetalle = { ...os, ...detalle, items, IdAprobacion: os.IdAprobacion || os.idAprobacion || detalle.idAprobacion };
        this.historialOS = niveles;
      } else {
        this.osDetalle = os;
        this.historialOS = [];
      }

      this.alertService.cerrarModalCarga();
      this.modalDetalleOS = true;
    } catch (error) {
      console.error('Error al cargar detalle de OS:', error);
      this.osDetalle = os;
      this.historialOS = [];
      this.alertService.cerrarModalCarga();
    }
  }

  abrirModalAprobacion(os: any, accion: 'APROBAR' | 'RECHAZAR') {
    this.osSeleccionada = os;
    this.accionAprobacion = accion;
    this.observacionesAprobacion = '';
    this.modalAprobacion = true;
  }

  async confirmarAprobacion() {
    if (this.accionAprobacion === 'RECHAZAR' && !this.observacionesAprobacion.trim()) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el motivo del rechazo',
        'warning'
      );
      return;
    }

    try {
      const response: any = await lastValueFrom(
        this.aprobacionOSService.aprobarRechazarOS({
          idAprobacion: this.osSeleccionada.idAprobacion,
          accion: this.accionAprobacion,
          usuarioAprueba: this.usuario.documentoidentidad,
          nombreUsuario: this.usuario.nombre,
          observaciones: this.observacionesAprobacion,
        })
      );

      if (response?.success) {
        this.alertService.showAlert(
          'Éxito',
          response?.mensaje || `Orden de servicio ${this.accionAprobacion === 'APROBAR' ? 'aprobada' : 'rechazada'} correctamente`,
          'success'
        );

        this.modalAprobacion = false;
        await this.cargarOSPendientes();
        await this.cargarContadores();
      } else {
        this.alertService.showAlert(
          'Error',
          response?.mensaje || response?.message || 'No se pudo procesar la aprobación',
          'error'
        );
      }
    } catch (error) {
      console.error('Error al aprobar/rechazar OS:', error);
      this.alertService.showAlert('Error', 'Ocurrió un error al procesar la aprobación', 'error');
    }
  }

  anularOS(os: any) {
    this.osAccionPendiente = os;
    this.motivoTexto = '';
    this.modalMotivoAbierto = true;
  }

  cerrarModalMotivo() {
    this.modalMotivoAbierto = false;
    this.osAccionPendiente = null;
    this.motivoTexto = '';
  }

  async confirmarAnulacionOS() {
    if (!this.motivoTexto || this.motivoTexto.trim() === '') {
      this.alertService.showAlert('Atención', 'El motivo de anulación es obligatorio.', 'warning');
      return;
    }

    const os = this.osAccionPendiente;
    this.modalMotivoAbierto = false;

    try {
      this.alertService.mostrarModalCarga();
      const respuesta = await lastValueFrom(
        this.aprobacionOSService.anularOS({
          idAprobacion: os.idAprobacion,
          dniAprobador: this.usuario.documentoidentidad,
          nombreAprobador: this.usuario.nombre,
          motivo: this.motivoTexto.trim(),
        })
      );
      this.alertService.cerrarModalCarga();
      if (respuesta?.success) {
        this.alertService.showAlert(
          'OS Anulada',
          respuesta?.mensaje || 'La OS fue anulada correctamente.',
          'success'
        );
        await this.cargarOSPendientes();
        await this.cargarContadores();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al anular.', 'error');
      }
    } catch (err: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', err?.message || 'Error inesperado.', 'error');
    }
  }

  onTabChange(event: any) {
    this.tabActiva = event.index ?? event;

    if (this.tabActiva === 1) {
      this.cargarHistorial();
    } else if (this.tabActiva === 2) {
      this.cargarUsuariosAprobadores();
    } else if (this.tabActiva === 3) {
      this.cargarFlujosAprobacion();
    }
  }

  async cargarUsuariosAprobadores() {
    try {
      const response = await this.aprobacionOSService
        .listarUsuariosAprobadores()
        .toPromise();

      if (response) {
        this.usuariosAprobadores = response;
      }
    } catch (error) {
      console.error('Error al cargar usuarios aprobadores:', error);
    }
  }

  async cargarFlujosAprobacion() {
    try {
      const response = await this.aprobacionOSService
        .listarFlujosAprobacion()
        .toPromise();

      if (response) {
        this.flujosAprobacion = response;
      }
    } catch (error) {
      console.error('Error al cargar flujos de aprobación:', error);
    }
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      PENDIENTE: 'badge-warning',
      PENDIENTE_APROBACION: 'badge-warning',
      APROBADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      EN_ESPERA: 'badge-secondary',
      ANULADA: 'badge-secondary',
      CANCELADA: 'badge-secondary',
    };
    return clases[estado] || 'badge-secondary';
  }

  getEstadoSeverity(estado: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null | undefined {
    switch (estado) {
      case 'PENDIENTE':
        return 'warn';
      case 'APROBADA':
        return 'success';
      case 'RECHAZADA':
        return 'danger';
      case 'EN_ESPERA':
        return 'info';
      default:
        return 'secondary';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto);
  }

  // Métodos para Usuarios Aprobadores
  nuevoUsuarioAprobador() {
    this.usuarioAprobadorForm = {
      idUsuarioAprobador: null,
      documentoIdentidad: '',
      nombreCompleto: '',
      email: '',
      rol: '',
      montoMinimo: 0,
      montoMaximo: 0,
      nivel: 1,
      activo: true,
    };
    this.modalUsuarioAprobador = true;
  }

  editarUsuarioAprobador(usuario: any) {
    this.usuarioAprobadorForm = { ...usuario };
    this.modalUsuarioAprobador = true;
  }

  async guardarUsuarioAprobador() {
    if (!this.usuarioAprobadorForm.documentoIdentidad) {
      this.alertService.showAlert('Atención', 'Debe ingresar el documento de identidad', 'warning');
      return;
    }

    if (!this.usuarioAprobadorForm.nombreCompleto) {
      this.alertService.showAlert('Atención', 'Debe ingresar el nombre completo', 'warning');
      return;
    }

    if (!this.usuarioAprobadorForm.rol) {
      this.alertService.showAlert('Atención', 'Debe seleccionar un rol', 'warning');
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const payload = {
        ...this.usuarioAprobadorForm,
        usuarioCreacion: this.usuario.documentoidentidad,
      };

      const respuesta = this.usuarioAprobadorForm.idUsuarioAprobador
        ? await this.aprobacionOSService.actualizarUsuarioAprobador(payload).toPromise()
        : await this.aprobacionOSService.crearUsuarioAprobador(payload).toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert('Éxito', 'Usuario aprobador guardado correctamente', 'success');
        this.modalUsuarioAprobador = false;
        await this.cargarUsuariosAprobadores();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al guardar usuario aprobador', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al guardar usuario aprobador', 'error');
    }
  }

  async eliminarUsuarioAprobador(usuario: any) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Eliminación',
      `¿Está seguro de eliminar al usuario aprobador ${usuario.nombreCompleto}?`,
      'warning'
    );

    if (!confirmacion) return;

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.aprobacionOSService
        .eliminarUsuarioAprobador(usuario.idUsuarioAprobador)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert('Éxito', 'Usuario aprobador eliminado correctamente', 'success');
        await this.cargarUsuariosAprobadores();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al eliminar usuario aprobador', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al eliminar usuario aprobador', 'error');
    }
  }

  // Métodos para Flujos de Aprobación
  nuevoFlujoAprobacion() {
    this.flujoAprobacionForm = {
      idFlujoAprobacion: null,
      nombre: '',
      descripcion: '',
      montoMinimo: 0,
      montoMaximo: 0,
      niveles: 1,
      activo: true,
    };
    this.modalFlujoAprobacion = true;
  }

  editarFlujoAprobacion(flujo: any) {
    this.flujoAprobacionForm = { ...flujo };
    this.modalFlujoAprobacion = true;
  }

  async guardarFlujoAprobacion() {
    if (!this.flujoAprobacionForm.nombre) {
      this.alertService.showAlert('Atención', 'Debe ingresar el nombre del flujo', 'warning');
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const payload = {
        ...this.flujoAprobacionForm,
        usuarioCreacion: this.usuario.documentoidentidad,
      };

      const respuesta = this.flujoAprobacionForm.idFlujoAprobacion
        ? await this.aprobacionOSService.actualizarFlujoAprobacion(payload).toPromise()
        : await this.aprobacionOSService.crearFlujoAprobacion(payload).toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert('Éxito', 'Flujo de aprobación guardado correctamente', 'success');
        this.modalFlujoAprobacion = false;
        await this.cargarFlujosAprobacion();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al guardar flujo de aprobación', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al guardar flujo de aprobación', 'error');
    }
  }

  async eliminarFlujoAprobacion(flujo: any) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Eliminación',
      `¿Está seguro de eliminar el flujo de aprobación ${flujo.nombre}?`,
      'warning'
    );

    if (!confirmacion) return;

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.aprobacionOSService
        .eliminarFlujoAprobacion(flujo.idFlujoAprobacion)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert('Éxito', 'Flujo de aprobación eliminado correctamente', 'success');
        await this.cargarFlujosAprobacion();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al eliminar flujo de aprobación', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al eliminar flujo de aprobación', 'error');
    }
  }
}
