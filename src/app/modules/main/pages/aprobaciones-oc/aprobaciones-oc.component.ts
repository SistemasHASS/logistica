import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AprobacionOCService } from '@/app/services/aprobacion-oc.service';
import { AprobacionOrdenService } from '@/app/services/aprobacion-orden.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { lastValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

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

  // OC Aprobadas / Rechazadas (historial del aprobador)
  ocAprobadas: any[] = [];
  tabVistaActiva: 'PENDIENTES' | 'APROBADAS' | 'RECHAZADAS' = 'PENDIENTES';

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
  adjuntosOC: any[] = [];

  // Filtros
  filtroEstado = 'TODAS';
  filtroProveedor = '';
  filtroFechaInicio = '';
  filtroFechaFin = '';

  // Modal motivo rechazo/anulacion
  modalMotivoAbierto = false;
  accionMotivo: 'RECHAZAR' | 'ANULAR' = 'RECHAZAR';
  motivoTexto = '';
  ocAccionPendiente: any = null;

  // Pagination
  rowsPerPageOptions = [10, 25, 50, 100];
  rows = 10;

  constructor(
    private aprobacionOCService: AprobacionOCService,
    private aprobacionOrdenService: AprobacionOrdenService,
    private alertService: AlertService,
    private userService: UserService,
    private dexieService: DexieService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarContadores();
    await this.cargarOCPendientes();
  }

  async cambiarVista(tab: 'PENDIENTES' | 'APROBADAS' | 'RECHAZADAS') {
    this.tabVistaActiva = tab;
    if (tab === 'APROBADAS') {
      await this.cargarOCAprobadas('APROBADA');
    } else if (tab === 'RECHAZADAS') {
      await this.cargarOCAprobadas('RECHAZADA');
    }
  }

  async cargarOCAprobadas(estado: string) {
    try {
      this.alertService.mostrarModalCarga();
      const resp = await lastValueFrom(
        this.aprobacionOrdenService.listarAprobacionesPorRol(this.usuario.idrol, 'OC', estado)
      );
      this.ocAprobadas = Array.isArray(resp) ? resp : [];
      this.alertService.cerrarModalCarga();
    } catch (error) {
      this.alertService.cerrarModalCarga();
      this.ocAprobadas = [];
    }
  }

  async reintentarSyncSpring(oc: any) {
    const ok = await this.alertService.showConfirm(
      'Reintentar sincronización',
      `¿Reintentar el envío de la OC ${oc.numeroOrden} a SPRING?`,
      'question'
    );
    if (!ok) return;
    try {
      this.alertService.mostrarModalCarga();
      const resp: any = await lastValueFrom(
        this.aprobacionOrdenService.reintentarSyncSpring(oc.idOrden)
      );
      this.alertService.cerrarModalCarga();
      if (resp?.fallidas === 0) {
        this.alertService.showAlert('Éxito', `OC ${oc.numeroOrden} sincronizada con SPRING correctamente.`, 'success');
        oc.estadoSpring = 'SINCRONIZADO';
      } else {
        const detalle = resp?.detalle ? JSON.parse(resp.detalle) : [];
        const msg = detalle[0]?.mensaje || 'Error desconocido en SPRING';
        this.alertService.showAlert('Error SPRING', msg, 'error');
        oc.estadoSpring = 'ERROR_SYNC';
      }
    } catch (e: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', e?.message || 'Error al conectar con el servidor.', 'error');
    }
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

      // Usar endpoint unificado que lista OCs de ambos flujos (antiguo + nuevo)
      const resp = await lastValueFrom(
        this.aprobacionOrdenService.listarOCPendientesUnificado(
          this.usuario.documentoidentidad,
          this.usuario.idrol
        )
      );

      this.ocPendientes = Array.isArray(resp) ? resp : [];
      this.contadores.totalPendientes = this.ocPendientes.length;
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
          (oc.nombreProveedor || oc.ocNombreProveedor || '')
            ?.toLowerCase()
            .includes(this.filtroProveedor.toLowerCase()) ||
          (oc.proveedor || oc.CodigoOrden || '')
            ?.toLowerCase().includes(this.filtroProveedor.toLowerCase())
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
      this.alertService.mostrarModalCarga();

      // Intentar cargar OC completa con ítems reales
      if (oc.idAprobacion || oc.numeroOrden || oc.CodigoOrden) {
        try {
          const detalle = await lastValueFrom(
            this.aprobacionOrdenService.obtenerOCDesdeConsolidacion({
              idAprobacion: oc.idAprobacion || oc.IdAprobacion,
              codigoOrden: oc.numeroOrden || oc.CodigoOrden || oc.codigoOrden,
            })
          );
          if (detalle) {
            // items y nivelesAprobacion pueden venir como string JSON (subquery FOR JSON)
            const items = typeof detalle.items === 'string' ? JSON.parse(detalle.items) : (detalle.items || []);
            const niveles = typeof detalle.nivelesAprobacion === 'string' ? JSON.parse(detalle.nivelesAprobacion) : (detalle.nivelesAprobacion || []);
            this.ocDetalle = { ...oc, ...detalle, items, IdAprobacion: oc.IdAprobacion || oc.idAprobacion || detalle.IdAprobacion || detalle.idAprobacion };
            this.historialOC = niveles;
            await this.cargarAdjuntosOC(detalle.idOrden || oc.idOrden || oc.IdOrden);
            this.alertService.cerrarModalCarga();
            this.modalDetalleOC = true;
            return;
          }
        } catch (error) {
          console.error('Error al cargar detalle desde consolidación:', error);
          // fallback al historial anterior
        }
      }

      this.ocDetalle = oc;
      const historial = await this.aprobacionOCService
        .obtenerHistorial(oc.idOrdenCompra)
        .toPromise();
      this.historialOC = historial || [];
      await this.cargarAdjuntosOC(oc.idOrden || oc.IdOrden);
      this.alertService.cerrarModalCarga();
      this.modalDetalleOC = true;
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Error al cargar detalle de la orden',
        'error'
      );
    }
  }

  async cargarAdjuntosOC(idOrden: string | number) {
    if (!idOrden) return;
    try {
      const resp: any = await lastValueFrom(
        this.http.post(`${environment.baseUrl}/api/logistica/listar-adjuntos-oc`, { 
          idOrden: idOrden.toString(),
          tipoOrden: 'OC' 
        })
      );
      this.adjuntosOC = Array.isArray(resp) ? resp : [];
    } catch {
      this.adjuntosOC = [];
    }
  }

  cerrarModalDetalleOC() {
    console.log('Cerrando modal detalle OC');
    this.modalDetalleOC = false;
    this.ocDetalle = null;
    this.historialOC = [];
  }

  async aprobarOC(oc: any) {
    console.log('[aprobarOC] oc.IdAprobacion=', oc.IdAprobacion, '| oc.idAprobacion=', oc.idAprobacion, '| oc.numeroOrden=', oc.numeroOrden);
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Aprobación',
      `¿Está seguro de aprobar la Orden de Compra ${oc.numeroOrden} por un monto de S/ ${this.formatearMoneda(oc.montoTotal)}?`,
      'question'
    );

    if (!confirmacion) return;

    if (!oc.idAprobacion && !oc.IdAprobacion) {
      this.alertService.showAlert(
        'Sin registro de aprobación',
        'Esta OC no tiene un registro de aprobación activo. Verifique que fue guardada correctamente desde el módulo de Órdenes de Compra.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      // Ambos flujos (ANTIGUO y NUEVO) usan LOGISTICA_AprobacionOrden → mismo endpoint
      const respuesta = await lastValueFrom(
        this.aprobacionOrdenService.aprobar({
          idAprobacion: oc.IdAprobacion || oc.idAprobacion,
          dniAprobador: this.usuario.documentoidentidad,
          nombreAprobador: this.usuario.nombre,
          observacion: '',
        })
      );

      this.alertService.cerrarModalCarga();

      if (respuesta?.errorgeneral === 0 || respuesta?.errorgeneral === '0' || respuesta?.success) {
        this.alertService.showAlert(
          'Éxito',
          respuesta?.mensaje || respuesta?.message || 'Orden de compra aprobada correctamente',
          'success'
        );
        await this.cargarContadores();
        await this.cargarOCPendientes();
        if (this.modalDetalleOC) this.cerrarModalDetalleOC();
      } else {
        this.alertService.showAlert(
          'Error',
          respuesta?.mensaje || respuesta?.message || 'Error al aprobar la orden de compra',
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
    this.ocAccionPendiente = oc;
    this.accionMotivo = 'RECHAZAR';
    this.motivoTexto = '';
    this.modalMotivoAbierto = true;
  }

  async anularOC(oc: any) {
    this.ocAccionPendiente = oc;
    this.accionMotivo = 'ANULAR';
    this.motivoTexto = '';
    this.modalMotivoAbierto = true;
  }

  cerrarModalMotivo() {
    this.modalMotivoAbierto = false;
    this.ocAccionPendiente = null;
    this.motivoTexto = '';
  }

  async confirmarAccionMotivo() {
    if (!this.motivoTexto || this.motivoTexto.trim() === '') {
      this.alertService.showAlert('Atención', 'El motivo es obligatorio.', 'warning');
      return;
    }

    const oc = this.ocAccionPendiente;
    this.modalMotivoAbierto = false;

    try {
      this.alertService.mostrarModalCarga();

      if (this.accionMotivo === 'RECHAZAR') {
        const respuesta = await lastValueFrom(
          this.aprobacionOrdenService.rechazar({
            idAprobacion: oc.idAprobacion,
            dniAprobador: this.usuario.documentoidentidad,
            nombreAprobador: this.usuario.nombre,
            motivo: this.motivoTexto.trim(),
          })
        );
        this.alertService.cerrarModalCarga();
        if (respuesta?.errorgeneral === 0 || respuesta?.errorgeneral === '0' || respuesta?.success) {
          this.alertService.showAlert('Éxito', respuesta?.mensaje || 'Orden de compra rechazada. Puede generarse una nueva OC desde el historial de consolidación.', 'success');
        } else {
          this.alertService.showAlert('Error', respuesta?.mensaje || respuesta?.message || 'Error al rechazar.', 'error');
        }
      } else {
        const respuesta = await lastValueFrom(
          this.aprobacionOrdenService.anular({
            idAprobacion: oc.idAprobacion,
            dniAprobador: this.usuario.documentoidentidad,
            nombreAprobador: this.usuario.nombre,
            motivo: this.motivoTexto.trim(),
          })
        );
        this.alertService.cerrarModalCarga();
        if (respuesta?.errorgeneral === 0 || respuesta?.errorgeneral === '0' || respuesta?.success) {
          this.alertService.showAlert(
            'Orden Anulada',
            respuesta?.mensaje || `La consolidación fue liberada. Los ítems volvieron a estado pendiente en Consolidación de Requerimientos.`,
            'success'
          );
        } else {
          this.alertService.showAlert('Error', respuesta?.mensaje || respuesta?.message || 'Error al anular.', 'error');
        }
      }

      await this.cargarContadores();
      await this.cargarOCPendientes();
      if (this.modalDetalleOC) this.cerrarModalDetalleOC();
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error inesperado.', 'error');
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

  tituloModalMotivo(): string {
    return this.accionMotivo === 'RECHAZAR' ? 'Motivo de Rechazo' : 'Motivo de Anulación';
  }

  descripcionModalMotivo(): string {
    if (this.accionMotivo === 'RECHAZAR') {
      return 'La OC quedará en estado RECHAZADA. Podrá generarse una nueva OC desde el historial de consolidación.';
    }
    return 'La OC será ANULADA y la consolidación será LIBERADA. Los ítems volverán a estado pendiente en Consolidación de Requerimientos.';
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

  esImagen(tipoArchivo: string): boolean {
    if (!tipoArchivo) return false;
    const tiposImagen = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    return tiposImagen.includes(tipoArchivo.toLowerCase());
  }

  async descargarAdjunto(adj: any) {
    try {
      this.alertService.mostrarModalCarga();
      const resp: any = await lastValueFrom(
        this.aprobacionOrdenService.obtenerAdjuntoOC(adj.idAdjunto)
      );
      this.alertService.cerrarModalCarga();

      if (resp?.contenidoB64) {
        const binaryString = atob(resp.contenidoB64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: resp.tipoArchivo || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = adj.nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        this.alertService.showAlert('Error', 'No se pudo obtener el contenido del archivo', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al descargar el archivo', 'error');
    }
  }

  async previsualizarAdjunto(adj: any) {
    try {
      this.alertService.mostrarModalCarga();
      const resp: any = await lastValueFrom(
        this.aprobacionOrdenService.obtenerAdjuntoOC(adj.idAdjunto)
      );
      this.alertService.cerrarModalCarga();

      if (resp?.contenidoB64) {
        const url = `data:${resp.tipoArchivo};base64,${resp.contenidoB64}`;
        window.open(url, '_blank');
      } else {
        this.alertService.showAlert('Error', 'No se pudo obtener el contenido del archivo', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al previsualizar el archivo', 'error');
    }
  }
}
