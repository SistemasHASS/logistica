import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenServicioService } from '@/app/services/orden-servicio.service';
import { SolicitudServicioService } from '@/app/services/solicitud-servicio.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { Usuario } from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-ordenes-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './ordenes-servicio.component.html',
  styleUrls: ['./ordenes-servicio.component.scss'],
})
export class OrdenesServicioComponent implements OnInit {
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

  ordenesServicio: any[] = [];
  ordenActual: any = null;
  
  mostrarFormulario = false;
  mostrarModalConformidad = false;
  
  solicitudesAprobadas: any[] = [];
  cotizacionesDisponibles: any[] = [];

  conformidad: any = {
    numeroConformidad: '',
    ordenServicioId: null,
    fechaInicioReal: '',
    fechaFinReal: '',
    conformidad: 'CONFORME',
    calificacion: 5,
    entregablesRecibidos: '',
    observaciones: '',
    incidencias: '',
    recomendaciones: '',
    usuarioConformidad: '',
    nombreUsuario: '',
    cargoUsuario: '',
  };

  tiposConformidad = [
    { label: 'Conforme', value: 'CONFORME' },
    { label: 'No Conforme', value: 'NO_CONFORME' },
    { label: 'Conforme con Observaciones', value: 'CONFORME_CON_OBSERVACIONES' },
  ];

  filtroEstado = '';
  filtroTipoServicio = '';

  constructor(
    private ordenServicioService: OrdenServicioService,
    private solicitudServicioService: SolicitudServicioService,
    private alertService: AlertService,
    private userService: UserService,
    private dexieService: DexieService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarOrdenes();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarOrdenes() {
    try {
      this.alertService.mostrarModalCarga();

      const filtros: any = {};
      if (this.filtroEstado) filtros.estado = this.filtroEstado;
      if (this.filtroTipoServicio) filtros.tipoServicio = this.filtroTipoServicio;

      const ordenes = await this.ordenServicioService
        .listarOrdenesServicio(filtros)
        .toPromise();

      this.ordenesServicio = ordenes || [];
      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar órdenes de servicio', 'error');
    }
  }

  async nuevaOrdenServicio() {
    try {
      this.alertService.mostrarModalCarga();

      // Cargar solicitudes aprobadas
      const solicitudes = await this.solicitudServicioService
        .listarSolicitudesServicio({ estado: 'APROBADA' })
        .toPromise();

      this.solicitudesAprobadas = solicitudes || [];

      if (this.solicitudesAprobadas.length === 0) {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Atención',
          'No hay solicitudes de servicio aprobadas disponibles',
          'warning'
        );
        return;
      }

      this.alertService.cerrarModalCarga();
      this.mostrarFormulario = true;
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar solicitudes aprobadas', 'error');
    }
  }

  async seleccionarSolicitud(solicitudId: number) {
    try {
      this.alertService.mostrarModalCarga();

      const solicitud = await this.solicitudServicioService
        .obtenerSolicitudServicioPorId(solicitudId)
        .toPromise();

      if (solicitud) {
        // Cargar cotizaciones de esta solicitud
        const cotizaciones = await this.solicitudServicioService
          .listarCotizacionesServicio({ solicitudServicioId: solicitudId })
          .toPromise();

        this.cotizacionesDisponibles = cotizaciones || [];

        // Crear orden desde solicitud
        this.ordenActual = {
          numeroOrden: this.generarNumeroOrden(),
          solicitudServicioId: solicitud.id,
          cotizacionServicioId: null,
          fecha: new Date().toISOString().split('T')[0],
          tipoServicio: solicitud.tipoServicio,
          descripcion: solicitud.descripcion,
          alcance: solicitud.alcance,
          entregables: solicitud.entregables,
          proveedor: '',
          nombreProveedor: '',
          rucProveedor: '',
          contactoProveedor: '',
          telefonoProveedor: '',
          emailProveedor: '',
          fechaInicioServicio: solicitud.fechaInicioRequerida || '',
          fechaFinServicio: solicitud.fechaFinRequerida || '',
          plazoEjecucion: solicitud.plazoEjecucion,
          ubicacionServicio: solicitud.ubicacionServicio,
          montoTotal: solicitud.montoEstimado,
          moneda: solicitud.moneda,
          formaPago: '',
          condicionesPago: '',
          garantia: '',
          penalidades: '',
          centroCosto: solicitud.centroCosto,
          proyecto: solicitud.proyecto,
          observaciones: '',
          usuarioGenera: this.usuario.documentoidentidad,
          detalle: solicitud.detalle ? JSON.parse(solicitud.detalle) : [],
        };
      }

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar solicitud:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar solicitud', 'error');
    }
  }

  async seleccionarCotizacion(cotizacionId: number) {
    try {
      const cotizacion = this.cotizacionesDisponibles.find(c => c.id === cotizacionId);
      
      if (cotizacion && this.ordenActual) {
        this.ordenActual.cotizacionServicioId = cotizacion.id;
        this.ordenActual.proveedor = cotizacion.proveedor;
        this.ordenActual.nombreProveedor = cotizacion.nombreProveedor;
        this.ordenActual.rucProveedor = cotizacion.rucProveedor;
        this.ordenActual.contactoProveedor = cotizacion.contactoProveedor;
        this.ordenActual.telefonoProveedor = cotizacion.telefonoProveedor;
        this.ordenActual.emailProveedor = cotizacion.emailProveedor;
        this.ordenActual.montoTotal = cotizacion.montoTotal;
        this.ordenActual.formaPago = cotizacion.formaPago;
        this.ordenActual.plazoEjecucion = cotizacion.plazoEjecucion;
        this.ordenActual.garantia = cotizacion.garantia;
        this.ordenActual.penalidades = cotizacion.penalidades;
      }
    } catch (error) {
      console.error('Error al seleccionar cotización:', error);
    }
  }

  generarNumeroOrden(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const segundo = String(fecha.getSeconds()).padStart(2, '0');
    return `OS-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
  }

  async guardarOrden() {
    if (!this.validarOrden()) {
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.ordenServicioService
        .generarOrdenServicio(this.ordenActual)
        .toPromise();

      if (respuesta?.status === 'success') {
        // Asignar aprobadores automáticamente
        try {
          await this.ordenServicioService
            .asignarAprobadoresOS(respuesta.id, this.ordenActual.montoTotal)
            .toPromise();
        } catch (error) {
          console.warn('Error al asignar aprobadores:', error);
        }

        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Éxito', respuesta.mensaje, 'success');
        this.mostrarFormulario = false;
        this.ordenActual = null;
        await this.cargarOrdenes();
      } else {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al guardar', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al guardar orden', 'error');
    }
  }

  validarOrden(): boolean {
    if (!this.ordenActual.proveedor) {
      this.alertService.showAlert('Atención', 'Debe ingresar el proveedor', 'warning');
      return false;
    }

    if (!this.ordenActual.nombreProveedor) {
      this.alertService.showAlert('Atención', 'Debe ingresar el nombre del proveedor', 'warning');
      return false;
    }

    if (!this.ordenActual.formaPago) {
      this.alertService.showAlert('Atención', 'Debe ingresar la forma de pago', 'warning');
      return false;
    }

    return true;
  }

  async verDetalleOrden(orden: any) {
    try {
      this.alertService.mostrarModalCarga();

      const ordenCompleta = await this.ordenServicioService
        .obtenerOrdenServicioPorId(orden.id)
        .toPromise();

      if (ordenCompleta) {
        this.ordenActual = ordenCompleta;
        // Mostrar modal de detalle (implementar según necesidad)
      }

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar orden:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar orden', 'error');
    }
  }

  abrirModalConformidad(orden: any) {
    this.conformidad = {
      numeroConformidad: this.generarNumeroConformidad(),
      ordenServicioId: orden.id,
      fechaInicioReal: '',
      fechaFinReal: '',
      conformidad: 'CONFORME',
      calificacion: 5,
      entregablesRecibidos: '',
      observaciones: '',
      incidencias: '',
      recomendaciones: '',
      usuarioConformidad: this.usuario.documentoidentidad,
      nombreUsuario: this.usuario.nombre,
      cargoUsuario: this.usuario.rol,
    };
    this.mostrarModalConformidad = true;
  }

  generarNumeroConformidad(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    return `CONF-${año}${mes}${dia}-${hora}${minuto}`;
  }

  async guardarConformidad() {
    if (!this.conformidad.fechaInicioReal || !this.conformidad.fechaFinReal) {
      this.alertService.showAlert('Atención', 'Debe ingresar las fechas de ejecución', 'warning');
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      const respuesta = await this.ordenServicioService
        .registrarConformidadServicio(this.conformidad)
        .toPromise();

      this.alertService.cerrarModalCarga();

      if (respuesta?.status === 'success') {
        this.alertService.showAlert('Éxito', respuesta.mensaje, 'success');
        this.mostrarModalConformidad = false;
        await this.cargarOrdenes();
      } else {
        this.alertService.showAlert('Error', respuesta?.mensaje || 'Error al registrar', 'error');
      }
    } catch (error: any) {
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', error.message || 'Error al registrar conformidad', 'error');
    }
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.ordenActual = null;
    this.solicitudesAprobadas = [];
    this.cotizacionesDisponibles = [];
  }

  cerrarModalConformidad() {
    this.mostrarModalConformidad = false;
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
      APROBADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      ENVIADA: 'badge-info',
      EN_EJECUCION: 'badge-warning',
      FINALIZADA: 'badge-primary',
      CONFORME: 'badge-success',
      NO_CONFORME: 'badge-danger',
      CANCELADA: 'badge-dark',
    };
    return clases[estado] || 'badge-secondary';
  }
}
