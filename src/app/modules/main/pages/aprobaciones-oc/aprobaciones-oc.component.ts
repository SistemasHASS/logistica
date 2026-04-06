import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AprobacionOCService } from '@/app/services/aprobacion-oc.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-aprobaciones-oc',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './aprobaciones-oc.component.html',
  styleUrls: ['./aprobaciones-oc.component.scss'],
})
export class AprobacionesOCComponent implements OnInit {
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

  // OC Pendientes
  ocPendientes: any[] = [];
  ocPendientesFiltradas: any[] = [];

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

  // Modal detalle OC
  modalDetalleOC = false;
  ocDetalle: any = null;
  historialOC: any[] = [];

  // Filtros
  filtroEstado = 'TODAS';
  filtroProveedor = '';
  filtroFechaInicio = '';
  filtroFechaFin = '';

  constructor(
    private aprobacionOCService: AprobacionOCService,
    private alertService: AlertService,
    private userService: UserService,
    private dexieService: DexieService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarContadores();
    await this.cargarOCPendientes();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarContadores() {
    try {
      const contadores = await this.aprobacionOCService
        .obtenerContadores(this.usuario.documentoidentidad)
        .toPromise();

      if (contadores) {
        this.contadores = contadores;
      }
    } catch (error) {
      console.error('Error al cargar contadores:', error);
    }
  }

  async cargarOCPendientes() {
    try {
      this.alertService.mostrarModalCarga();

      const pendientes = await this.aprobacionOCService
        .listarPendientes(this.usuario.documentoidentidad, this.usuario.idrol)
        .toPromise();

      this.ocPendientes = pendientes || [];
      this.aplicarFiltros();

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar OC pendientes:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Error al cargar órdenes de compra pendientes',
        'error'
      );
    }
  }

  aplicarFiltros() {
    let filtradas = [...this.ocPendientes];

    if (this.filtroProveedor) {
      filtradas = filtradas.filter(
        (oc) =>
          oc.nombreProveedor
            ?.toLowerCase()
            .includes(this.filtroProveedor.toLowerCase()) ||
          oc.proveedor?.toLowerCase().includes(this.filtroProveedor.toLowerCase())
      );
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(
        (oc) => new Date(oc.fechaOrden) >= new Date(this.filtroFechaInicio)
      );
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter(
        (oc) => new Date(oc.fechaOrden) <= new Date(this.filtroFechaFin)
      );
    }

    this.ocPendientesFiltradas = filtradas;
  }

  limpiarFiltros() {
    this.filtroProveedor = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.aplicarFiltros();
  }

  async verDetalleOC(oc: any) {
    try {
      this.ocDetalle = oc;

      // Cargar historial de aprobaciones
      const historial = await this.aprobacionOCService
        .obtenerHistorial(oc.idOrdenCompra)
        .toPromise();

      this.historialOC = historial || [];
      this.modalDetalleOC = true;
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      this.alertService.showAlert(
        'Error',
        'Error al cargar detalle de la orden',
        'error'
      );
    }
  }

  cerrarModalDetalleOC() {
    this.modalDetalleOC = false;
    this.ocDetalle = null;
    this.historialOC = [];
  }

  async aprobarOC(oc: any) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Aprobación',
      `¿Está seguro de aprobar la Orden de Compra ${oc.numeroOrden} por un monto de S/ ${this.formatearMoneda(oc.montoTotal)}?`,
      'question'
    );

    if (!confirmacion) return;

    // Solicitar observaciones (opcional)
    const observaciones = await this.solicitarObservaciones('Aprobación');

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.aprobacionOCService
        .aprobarRechazar(
          oc.idAprobacion,
          'APROBAR',
          this.usuario.documentoidentidad,
          this.usuario.nombre,
          observaciones
        )
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          respuesta.mensaje || 'Orden de compra aprobada correctamente',
          'success'
        );

        // Recargar datos
        await this.cargarContadores();
        await this.cargarOCPendientes();

        if (this.modalDetalleOC) {
          this.cerrarModalDetalleOC();
        }
      } else {
        this.alertService.showAlert(
          'Error',
          respuesta?.mensaje || 'Error al aprobar la orden de compra',
          'error'
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        error.message || 'Error al aprobar la orden de compra',
        'error'
      );
    }
  }

  async rechazarOC(oc: any) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Rechazo',
      `¿Está seguro de rechazar la Orden de Compra ${oc.numeroOrden}?`,
      'warning'
    );

    if (!confirmacion) return;

    // Solicitar motivo de rechazo (obligatorio)
    const motivo = await this.solicitarObservaciones('Rechazo', true);

    if (!motivo) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar un motivo de rechazo',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.aprobacionOCService
        .aprobarRechazar(
          oc.idAprobacion,
          'RECHAZAR',
          this.usuario.documentoidentidad,
          this.usuario.nombre,
          motivo
        )
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          respuesta.mensaje || 'Orden de compra rechazada',
          'success'
        );

        // Recargar datos
        await this.cargarContadores();
        await this.cargarOCPendientes();

        if (this.modalDetalleOC) {
          this.cerrarModalDetalleOC();
        }
      } else {
        this.alertService.showAlert(
          'Error',
          respuesta?.mensaje || 'Error al rechazar la orden de compra',
          'error'
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        error.message || 'Error al rechazar la orden de compra',
        'error'
      );
    }
  }

  async solicitarObservaciones(
    tipo: string,
    obligatorio: boolean = false
  ): Promise<string> {
    return new Promise((resolve) => {
      const mensaje = obligatorio
        ? `Ingrese el motivo de ${tipo.toLowerCase()} (obligatorio):`
        : `Ingrese observaciones de ${tipo.toLowerCase()} (opcional):`;

      const observaciones = prompt(mensaje);
      resolve(observaciones || '');
    });
  }

  // =============================================
  // TAB 2: CONFIGURACIÓN - USUARIOS APROBADORES
  // =============================================

  async cargarUsuariosAprobadores() {
    try {
      const usuarios = await this.aprobacionOCService
        .listarUsuariosAprobadores()
        .toPromise();

      this.usuariosAprobadores = usuarios || [];
    } catch (error) {
      console.error('Error al cargar usuarios aprobadores:', error);
      this.usuariosAprobadores = [];
    }
  }

  nuevoUsuarioAprobador() {
    console.log('Abriendo modal de nuevo usuario aprobador');
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
    console.log('Modal usuario aprobador:', this.modalUsuarioAprobador);
    console.log('Form:', this.usuarioAprobadorForm);
  }

  editarUsuarioAprobador(usuario: any) {
    this.usuarioAprobadorForm = { ...usuario };
    this.modalUsuarioAprobador = true;
  }

  async guardarUsuarioAprobador() {
    if (!this.usuarioAprobadorForm.documentoIdentidad) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el documento de identidad',
        'warning'
      );
      return;
    }

    if (!this.usuarioAprobadorForm.nombreCompleto) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el nombre completo',
        'warning'
      );
      return;
    }

    if (!this.usuarioAprobadorForm.rol) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar un rol',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.aprobacionOCService
        .guardarUsuarioAprobador({
          ...this.usuarioAprobadorForm,
          usuarioCreacion: this.usuario.documentoidentidad,
        })
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          'Usuario aprobador guardado correctamente',
          'success'
        );

        this.modalUsuarioAprobador = false;
        await this.cargarUsuariosAprobadores();
      } else {
        this.alertService.showAlert(
          'Error',
          respuesta?.mensaje || 'Error al guardar usuario aprobador',
          'error'
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        error.message || 'Error al guardar usuario aprobador',
        'error'
      );
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

      const respuesta = await this.aprobacionOCService
        .eliminarUsuarioAprobador(usuario.idUsuarioAprobador)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          'Usuario aprobador eliminado correctamente',
          'success'
        );

        await this.cargarUsuariosAprobadores();
      } else {
        this.alertService.showAlert(
          'Error',
          respuesta?.mensaje || 'Error al eliminar usuario aprobador',
          'error'
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        error.message || 'Error al eliminar usuario aprobador',
        'error'
      );
    }
  }

  // =============================================
  // UTILIDADES
  // =============================================

  cambiarTab(tab: number) {
    this.tabActiva = tab;

    if (tab === 1) {
      this.cargarUsuariosAprobadores();
    } else if (tab === 2) {
      this.cargarFlujosAprobacion();
    }
  }

  // =============================================
  // TAB 3: FLUJOS DE APROBACIÓN
  // =============================================

  async cargarFlujosAprobacion() {
    try {
      const flujos = await this.aprobacionOCService
        .listarFlujosAprobacion()
        .toPromise();

      this.flujosAprobacion = flujos || [];
    } catch (error) {
      console.error('Error al cargar flujos de aprobación:', error);
      this.flujosAprobacion = [];
    }
  }

  nuevoFlujoAprobacion() {
    console.log('Abriendo modal de nuevo flujo de aprobación');
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
    console.log('Modal flujo aprobación:', this.modalFlujoAprobacion);
    console.log('Form:', this.flujoAprobacionForm);
  }

  editarFlujoAprobacion(flujo: any) {
    this.flujoAprobacionForm = { ...flujo };
    this.modalFlujoAprobacion = true;
  }

  async guardarFlujoAprobacion() {
    if (!this.flujoAprobacionForm.nombre) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el nombre del flujo',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const payload = {
        ...this.flujoAprobacionForm,
        usuarioCreacion: this.usuario.documentoidentidad,
      };

      const respuesta = this.flujoAprobacionForm.idFlujoAprobacion
        ? await this.aprobacionOCService.actualizarFlujoAprobacion(payload).toPromise()
        : await this.aprobacionOCService.crearFlujoAprobacion(payload).toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          'Flujo de aprobación guardado correctamente',
          'success'
        );

        this.modalFlujoAprobacion = false;
        await this.cargarFlujosAprobacion();
      } else {
        this.alertService.showAlert(
          'Error',
          respuesta?.mensaje || 'Error al guardar flujo de aprobación',
          'error'
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        error.message || 'Error al guardar flujo de aprobación',
        'error'
      );
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

      const respuesta = await this.aprobacionOCService
        .eliminarFlujoAprobacion(flujo.idFlujoAprobacion)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert(
          'Éxito',
          'Flujo de aprobación eliminado correctamente',
          'success'
        );

        await this.cargarFlujosAprobacion();
      } else {
        this.alertService.showAlert(
          'Error',
          respuesta?.mensaje || 'Error al eliminar flujo de aprobación',
          'error'
        );
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        error.message || 'Error al eliminar flujo de aprobación',
        'error'
      );
    }
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monto);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      PENDIENTE: 'badge-warning',
      APROBADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      EN_ESPERA: 'badge-secondary',
    };
    return clases[estado] || 'badge-secondary';
  }

  obtenerClaseDiasPendiente(dias: number): string {
    if (dias <= 1) return 'text-success';
    if (dias <= 3) return 'text-warning';
    return 'text-danger';
  }
}
