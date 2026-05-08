import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudServicioService } from '@/app/services/solicitud-servicio.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-solicitudes-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DialogModule, ButtonModule, TooltipModule],
  templateUrl: './solicitudes-servicio.component.html',
  styleUrls: ['./solicitudes-servicio.component.scss'],
})
export class SolicitudesServicioComponent implements OnInit {
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

  solicitudesServicio: any[] = [];
  solicitudesLocales: any[] = [];
  solicitudActual: any = this.nuevaSolicitud();
  detalleServicio: any[] = [];
  
  mostrarFormulario = false;
  modoEdicion = false;
  tabActiva: string = 'LOCALES';
  modalDetalleLocalAbierto: boolean = false;
  solicitudLocalDetalle: any = null;
  modalEdicionLocalAbierto: boolean = false;
  solicitudLocalEdicion: any = null;

  contadores = {
    totalGeneradas: 0,
    totalEnviadas: 0,
    totalAprobadas: 0,
    totalRechazadas: 0,
    totalConOrden: 0,
  };

  tiposServicio = [
    { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
    { label: 'Consultoría', value: 'CONSULTORIA' },
    { label: 'Transporte', value: 'TRANSPORTE' },
    { label: 'Limpieza', value: 'LIMPIEZA' },
    { label: 'Seguridad', value: 'SEGURIDAD' },
    { label: 'Otros', value: 'OTROS' },
  ];

  prioridades = [
    { label: 'Baja', value: 'BAJA' },
    { label: 'Media', value: 'MEDIA' },
    { label: 'Alta', value: 'ALTA' },
    { label: 'Urgente', value: 'URGENTE' },
  ];

  unidadesMedida = [
    { label: 'Hora', value: 'HORA' },
    { label: 'Día', value: 'DIA' },
    { label: 'Mes', value: 'MES' },
    { label: 'Servicio', value: 'SERVICIO' },
    { label: 'Unidad', value: 'UNIDAD' },
  ];

  filtroEstado = '';
  filtroTipoServicio = '';

  constructor(
    private solicitudServicioService: SolicitudServicioService,
    private alertService: AlertService,
    private userService: UserService,
    private dexieService: DexieService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarContadores();
    await this.cargarSolicitudes();
    await this.cargarSolicitudesLocales();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarContadores() {
    try {
      const contadores = await this.solicitudServicioService
        .obtenerContadores(this.usuario.documentoidentidad)
        .toPromise();

      if (contadores) {
        this.contadores = contadores;
      }
    } catch (error) {
      console.error('Error al cargar contadores:', error);
    }
  }

  async cargarSolicitudes() {
    try {
      this.alertService.mostrarModalCarga();

      const filtros: any = {};
      if (this.filtroEstado) filtros.estado = this.filtroEstado;
      if (this.filtroTipoServicio) filtros.tipoServicio = this.filtroTipoServicio;
      filtros.usuarioSolicita = this.usuario.documentoidentidad;

      const rawResponse = await this.solicitudServicioService
        .listarSolicitudesServicio(filtros)
        .toPromise();

      // El SP usa FOR JSON PATH → backend retorna [ [array] ] o [ {obj} ]
      // Desenvolver si el primer elemento es un array
      let solicitudes = rawResponse || [];
      if (Array.isArray(solicitudes) && solicitudes.length === 1 && Array.isArray(solicitudes[0])) {
        solicitudes = solicitudes[0];
      }

      this.solicitudesServicio = solicitudes;
      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar solicitudes de servicio', 'error');
    }
  }

  async cargarSolicitudesLocales() {
    try {
      const todasLasSolicitudes = await this.dexieService.solicitudesServicio.toArray();
      this.solicitudesLocales = todasLasSolicitudes.filter(s => 
        s.usuarioSolicita === this.usuario.documentoidentidad &&
        s.numeroSolicitud != null && s.numeroSolicitud !== ''
      );
      console.log('📋 Solicitudes locales cargadas:', this.solicitudesLocales.length);
    } catch (error) {
      console.error('Error al cargar solicitudes locales:', error);
    }
  }

  async cambiarTabLocales() {
    this.tabActiva = 'LOCALES';
    await this.cargarSolicitudesLocales();
  }

  verDetalleSolicitudLocal(solicitud: any) {
    this.solicitudLocalDetalle = solicitud;
    this.modalDetalleLocalAbierto = true;
  }

  cerrarModalDetalleLocal() {
    this.modalDetalleLocalAbierto = false;
    this.solicitudLocalDetalle = null;
  }

  editarSolicitudLocal(solicitud: any) {
    // Clonar la solicitud para edición
    this.solicitudLocalEdicion = { ...solicitud };
    this.modalEdicionLocalAbierto = true;
  }

  cerrarModalEdicionLocal() {
    this.modalEdicionLocalAbierto = false;
    this.solicitudLocalEdicion = null;
  }

  async guardarEdicionLocal() {
    try {
      // Actualizar en Dexie
      await this.dexieService.solicitudesServicio.update(this.solicitudLocalEdicion.id, {
        descripcionServicio: this.solicitudLocalEdicion.descripcionServicio,
        montoEstimado: this.solicitudLocalEdicion.montoEstimado,
        fechaRequerida: this.solicitudLocalEdicion.fechaRequerida,
        observaciones: this.solicitudLocalEdicion.observaciones
      });
      
      this.alertService.showAlert('Éxito', 'Solicitud actualizada correctamente', 'success');
      await this.cargarSolicitudesLocales();
      this.cerrarModalEdicionLocal();
    } catch (error) {
      console.error('Error al actualizar solicitud:', error);
      this.alertService.showAlert('Error', 'No se pudo actualizar la solicitud', 'error');
    }
  }

  async enviarSolicitudLocal(solicitud: any) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Envío',
      `¿Está seguro de enviar la solicitud ${solicitud.numeroSolicitud} al sistema?`,
      'question'
    );

    if (confirmacion) {
      try {
        // Preparar datos para enviar al backend
        const solicitudParaEnviar = {
          numeroSolicitud: solicitud.numeroSolicitud,
          fecha: solicitud.fecha,
          tipo: solicitud.tipo || 'SERVICIO',
          descripcionServicio: solicitud.descripcionServicio,
          empresa: solicitud.empresa,
          rucEmpresa: solicitud.rucEmpresa,
          moneda: solicitud.moneda || 'PEN',
          montoEstimado: solicitud.montoEstimado,
          fechaRequerida: solicitud.fechaRequerida,
          usuarioSolicita: solicitud.usuarioSolicita,
          nombreSolicita: solicitud.nombreSolicita,
          observaciones: solicitud.observaciones,
          estado: 'GENERADA'
        };

        // Enviar al backend
        const response = await this.solicitudServicioService.guardarSolicitudServicio(solicitudParaEnviar).toPromise();
        
        if (response && (response.success || response.status === 'success')) {
          // Eliminar de Dexie — intentar por id y por numeroSolicitud
          if (solicitud.id != null) {
            await this.dexieService.solicitudesServicio.delete(solicitud.id);
          }
          if (solicitud.numeroSolicitud) {
            await this.dexieService.solicitudesServicio
              .where('numeroSolicitud').equals(solicitud.numeroSolicitud).delete();
          }
          
          // Cambiar al tab de solicitudes procesadas ANTES de recargar
          this.tabActiva = 'BACKEND';

          // Recargar ambas listas
          await this.cargarSolicitudesLocales();
          await this.cargarSolicitudes();

          this.alertService.showAlert(
            'Éxito', 
            `Solicitud ${solicitud.numeroSolicitud} enviada al sistema correctamente. Ahora aparecerá en "Solicitudes Procesadas".`,
            'success'
          );
        } else {
          throw new Error(response?.message || 'Error al enviar la solicitud');
        }
      } catch (error: any) {
        console.error('Error al enviar solicitud:', error);
        this.alertService.showAlert(
          'Error', 
          error?.message || 'No se pudo enviar la solicitud al sistema',
          'error'
        );
      }
    }
  }

  async eliminarSolicitudLocal(solicitud: any) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Eliminación',
      `¿Está seguro de eliminar la solicitud ${solicitud.numeroSolicitud}?`,
      'warning'
    );

    if (confirmacion) {
      try {
        await this.dexieService.solicitudesServicio.delete(solicitud.id);
        this.alertService.showAlert('Éxito', 'Solicitud eliminada correctamente', 'success');
        await this.cargarSolicitudesLocales();
      } catch (error) {
        console.error('Error al eliminar solicitud:', error);
        this.alertService.showAlert('Error', 'No se pudo eliminar la solicitud', 'error');
      }
    }
  }

  nuevaSolicitud() {
    return {
      id: null,
      numeroSolicitud: this.generarNumeroSolicitud(),
      fecha: new Date().toISOString().split('T')[0],
      tipoServicio: '',
      descripcion: '',
      justificacion: '',
      alcance: '',
      entregables: '',
      plazoEjecucion: 0,
      fechaInicioRequerida: '',
      fechaFinRequerida: '',
      ubicacionServicio: '',
      montoEstimado: 0,
      moneda: 'PEN',
      centroCosto: '',
      proyecto: '',
      prioridad: 'MEDIA',
      observaciones: '',
      estado: 'GENERADA',
      usuarioSolicita: this.usuario.documentoidentidad,
      nombreSolicita: this.usuario.nombre,
      areaSolicita: '',
      detalle: [],
    };
  }

  generarNumeroSolicitud(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const segundo = String(fecha.getSeconds()).padStart(2, '0');
    return `SS-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
  }

  nuevaSolicitudServicio() {
    this.solicitudActual = this.nuevaSolicitud();
    this.detalleServicio = [];
    this.modoEdicion = false;
    this.mostrarFormulario = true;
  }

  async editarSolicitud(solicitud: any) {
    try {
      this.alertService.mostrarModalCarga();

      const solicitudCompleta = await this.solicitudServicioService
        .obtenerSolicitudServicioPorId(solicitud.id)
        .toPromise();

      if (solicitudCompleta) {
        this.solicitudActual = { ...solicitudCompleta };
        this.detalleServicio = solicitudCompleta.detalle ? JSON.parse(solicitudCompleta.detalle) : [];
        this.modoEdicion = true;
        this.mostrarFormulario = true;
      }

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar solicitud de servicio', 'error');
    }
  }

  agregarDetalleServicio() {
    this.detalleServicio.push({
      item: this.detalleServicio.length + 1,
      descripcionServicio: '',
      especificaciones: '',
      unidadMedida: 'SERVICIO',
      cantidad: 1,
      precioUnitarioEstimado: 0,
      subtotal: 0,
      observaciones: '',
    });
  }

  eliminarDetalleServicio(index: number) {
    this.detalleServicio.splice(index, 1);
    this.reordenarItems();
  }

  reordenarItems() {
    this.detalleServicio.forEach((item, index) => {
      item.item = index + 1;
    });
  }

  calcularSubtotal(detalle: any) {
    detalle.subtotal = (detalle.cantidad || 0) * (detalle.precioUnitarioEstimado || 0);
    this.calcularMontoTotal();
  }

  calcularMontoTotal() {
    this.solicitudActual.montoEstimado = this.detalleServicio.reduce(
      (sum, item) => sum + (item.subtotal || 0),
      0
    );
  }

  async guardarSolicitud() {
    if (!this.validarSolicitud()) {
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      this.solicitudActual.detalle = this.detalleServicio;

      const respuesta = await this.solicitudServicioService
        .guardarSolicitudServicio(this.solicitudActual)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert('Éxito', respuesta.mensaje, 'success');
        this.mostrarFormulario = false;
        await this.cargarContadores();
        await this.cargarSolicitudes();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al guardar', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al guardar solicitud', 'error');
    }
  }

  validarSolicitud(): boolean {
    if (!this.solicitudActual.tipoServicio) {
      this.alertService.showAlert('Atención', 'Debe seleccionar el tipo de servicio', 'warning');
      return false;
    }

    if (!this.solicitudActual.descripcion) {
      this.alertService.showAlert('Atención', 'Debe ingresar la descripción del servicio', 'warning');
      return false;
    }

    if (this.detalleServicio.length === 0) {
      this.alertService.showAlert('Atención', 'Debe agregar al menos un detalle de servicio', 'warning');
      return false;
    }

    return true;
  }

  async enviarSolicitud(solicitud: any) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Envío',
      `¿Está seguro de enviar la solicitud ${solicitud.numeroSolicitud} a aprobación?`,
      'question'
    );

    if (!confirmacion) return;

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.solicitudServicioService
        .enviarSolicitudServicio(solicitud.id)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        // Asignar aprobadores automáticamente
        try {
          await this.solicitudServicioService
            .asignarAprobadoresSS(solicitud.id, solicitud.montoEstimado)
            .toPromise();
        } catch (error) {
          console.warn('Error al asignar aprobadores:', error);
        }

        this.alertService.showAlert('Éxito', 'Solicitud enviada a aprobación correctamente', 'success');
        await this.cargarContadores();
        await this.cargarSolicitudes();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al enviar', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al enviar solicitud', 'error');
    }
  }

  async anularSolicitud(solicitud: any) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmar Anulación',
      `¿Está seguro de anular la solicitud ${solicitud.numeroSolicitud}?`,
      'warning'
    );

    if (!confirmacion) return;

    const motivo = prompt('Ingrese el motivo de anulación:');
    if (!motivo) {
      this.alertService.showAlert('Atención', 'Debe ingresar un motivo de anulación', 'warning');
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.solicitudServicioService
        .anularSolicitudServicio(solicitud.id, motivo)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert('Éxito', 'Solicitud anulada correctamente', 'success');
        await this.cargarContadores();
        await this.cargarSolicitudes();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al anular', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al anular solicitud', 'error');
    }
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.solicitudActual = this.nuevaSolicitud();
    this.detalleServicio = [];
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
      GENERADA: 'badge-secondary',
      ENVIADA: 'badge-info',
      APROBADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      COTIZADA: 'badge-warning',
      ORDEN_GENERADA: 'badge-primary',
      CANCELADA: 'badge-dark',
    };
    return clases[estado] || 'badge-secondary';
  }

  obtenerClasePrioridad(prioridad: string): string {
    const clases: { [key: string]: string } = {
      BAJA: 'badge-secondary',
      MEDIA: 'badge-info',
      ALTA: 'badge-warning',
      URGENTE: 'badge-danger',
    };
    return clases[prioridad] || 'badge-secondary';
  }
}
