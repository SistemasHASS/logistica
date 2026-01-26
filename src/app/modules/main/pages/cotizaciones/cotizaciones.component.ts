import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import {
  Cotizacion,
  DetalleCotizacion,
  SolicitudCompra,
  DetalleSolicitudCompra,
  Usuario,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.scss'],
})
export class CotizacionesComponent implements OnInit {
  // Listas principales
  cotizaciones: Cotizacion[] = [];
  solicitudesCompra: SolicitudCompra[] = [];

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  // Cotización actual
  cotizacion: Cotizacion = this.nuevaCotizacion();
  detalleCotizacion: DetalleCotizacion[] = [];

  // Línea temporal para edición de detalle
  lineaTemporal: DetalleCotizacion = this.nuevoDetalle();
  modalDetalleAbierto = false;
  detalleEditIndex = -1;

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

  // Solicitud seleccionada
  solicitudSeleccionada: SolicitudCompra | null = null;

  // Filtros
  filtroEstado: string = 'TODAS';
  filtroProveedor: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalRecibidas = 0;
  totalEnEvaluacion = 0;
  totalSeleccionadas = 0;
  totalRechazadas = 0;

  // Modal comparativo
  modalComparativoAbierto = false;
  cotizacionesComparativo: Cotizacion[] = [];

  // Modal detalle cotización
  modalDetalleCotizacionAbierto = false;
  cotizacionDetalle: Cotizacion | null = null;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarCotizaciones();
    await this.cargarSolicitudesCompra();
    this.actualizarContadores();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarCotizaciones() {
    this.cotizaciones = await this.dexieService.showCotizaciones();
    this.actualizarContadores();
  }

  async cargarSolicitudesCompra() {
    const todas = await this.dexieService.showSolicitudesCompra();
    // Filtrar solo solicitudes enviadas o aprobadas
    this.solicitudesCompra = todas.filter(
      (s: SolicitudCompra) => s.estado === 'ENVIADA' || s.estado === 'APROBADA'
    );
  }

  actualizarContadores() {
    this.totalRecibidas = this.cotizaciones.filter(
      (c) => c.estado === 'RECIBIDA'
    ).length;
    this.totalEnEvaluacion = this.cotizaciones.filter(
      (c) => c.estado === 'EN_EVALUACION'
    ).length;
    this.totalSeleccionadas = this.cotizaciones.filter(
      (c) => c.estado === 'SELECCIONADA'
    ).length;
    this.totalRechazadas = this.cotizaciones.filter(
      (c) => c.estado === 'RECHAZADA'
    ).length;
  }

  nuevaCotizacion(): Cotizacion {
    return {
      numeroCotizacion: '',
      solicitudCompraId: 0,
      numeroSolicitud: '',
      proveedor: '',
      nombreProveedor: '',
      rucProveedor: '',
      fecha: new Date().toISOString(),
      fechaVencimiento: '',
      montoTotal: 0,
      moneda: 'PEN',
      plazoEntrega: 0,
      condicionesPago: '',
      validezOferta: 30,
      formaPago: 'CONTADO',
      lugarEntrega: '',
      detalle: [],
      estado: 'RECIBIDA',
      seleccionada: false,
      usuarioRegistra: this.usuario?.documentoidentidad || '',
    };
  }

  nuevoDetalle(): DetalleCotizacion {
    return {
      cotizacionId: 0,
      codigo: '',
      descripcion: '',
      cantidad: 0,
      unidadMedida: 'UND',
      precioUnitario: 0,
      descuento: 0,
      porcentajeDescuento: 0,
      subtotal: 0,
      impuesto: 0,
      porcentajeImpuesto: 18,
      total: 0,
    };
  }

  nuevaCotizacionForm() {
    this.cotizacion = this.nuevaCotizacion();
    this.detalleCotizacion = [];
    this.solicitudSeleccionada = null;
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  async onSolicitudChange() {
    if (!this.cotizacion.solicitudCompraId) return;

    const solicitud = this.solicitudesCompra.find(
      (s) => s.id === this.cotizacion.solicitudCompraId
    );

    if (solicitud) {
      this.solicitudSeleccionada = solicitud;
      this.cotizacion.numeroSolicitud = solicitud.numeroSolicitud;

      // Cargar items de la solicitud como base para la cotización
      this.detalleCotizacion = solicitud.detalle.map((item) => ({
        cotizacionId: 0,
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        unidadMedida: item.unidadMedida,
        precioUnitario: 0,
        descuento: 0,
        porcentajeDescuento: 0,
        subtotal: 0,
        impuesto: 0,
        porcentajeImpuesto: 18,
        total: 0,
      }));
    }
  }

  agregarDetalle() {
    if (!this.lineaTemporal.codigo) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el código del item.',
        'warning'
      );
      return;
    }

    if (this.lineaTemporal.cantidad <= 0) {
      this.alertService.showAlert(
        'Atención',
        'La cantidad debe ser mayor a 0.',
        'warning'
      );
      return;
    }

    if (this.lineaTemporal.precioUnitario <= 0) {
      this.alertService.showAlert(
        'Atención',
        'El precio unitario debe ser mayor a 0.',
        'warning'
      );
      return;
    }

    // Calcular montos
    this.calcularMontos(this.lineaTemporal);

    if (this.detalleEditIndex >= 0) {
      // Editar
      this.detalleCotizacion[this.detalleEditIndex] = { ...this.lineaTemporal };
      this.detalleEditIndex = -1;
    } else {
      // Agregar nuevo
      this.detalleCotizacion.push({ ...this.lineaTemporal });
    }

    this.lineaTemporal = this.nuevoDetalle();
    this.modalDetalleAbierto = false;
    this.calcularTotales();
  }

  calcularMontos(detalle: DetalleCotizacion) {
    // Subtotal
    detalle.subtotal = detalle.cantidad * detalle.precioUnitario;

    // Descuento
    if (detalle.porcentajeDescuento > 0) {
      detalle.descuento = (detalle.subtotal * detalle.porcentajeDescuento) / 100;
    }

    // Base imponible
    const baseImponible = detalle.subtotal - detalle.descuento;

    // Impuesto
    detalle.impuesto = (baseImponible * detalle.porcentajeImpuesto) / 100;

    // Total
    detalle.total = baseImponible + detalle.impuesto;
  }

  calcularTotales() {
    this.cotizacion.montoTotal = this.detalleCotizacion.reduce(
      (sum, d) => sum + d.total,
      0
    );
  }

  editarDetalle(index: number) {
    this.lineaTemporal = { ...this.detalleCotizacion[index] };
    this.detalleEditIndex = index;
    this.modalDetalleAbierto = true;
  }

  eliminarDetalle(index: number) {
    this.detalleCotizacion.splice(index, 1);
    this.calcularTotales();
  }

  abrirModalDetalle() {
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.lineaTemporal = this.nuevoDetalle();
    this.detalleEditIndex = -1;
  }

  async guardarCotizacion() {
    if (!this.cotizacion.solicitudCompraId) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar una solicitud de compra.',
        'warning'
      );
      return;
    }

    if (!this.cotizacion.proveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el código del proveedor.',
        'warning'
      );
      return;
    }

    if (!this.cotizacion.nombreProveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el nombre del proveedor.',
        'warning'
      );
      return;
    }

    if (this.detalleCotizacion.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un item a la cotización.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      if (!this.modoEdicion) {
        this.cotizacion.numeroCotizacion = this.generarNumeroCotizacion();
      }

      this.cotizacion.detalle = [...this.detalleCotizacion];
      this.cotizacion.usuarioRegistra = this.usuario.documentoidentidad;

      await this.dexieService.saveCotizacion(this.cotizacion);

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Cotización guardada correctamente.',
        'success'
      );

      this.mostrarFormulario = false;
      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la cotización.',
        'error'
      );
    }
  }

  generarNumeroCotizacion(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const seg = String(fecha.getSeconds()).padStart(2, '0');
    return `COT-${año}${mes}${dia}-${hora}${min}${seg}`;
  }

  editarCotizacion(index: number) {
    const cotizacion = this.cotizacionesFiltradas()[index];
    if (!cotizacion) return;

    this.cotizacion = { ...cotizacion };
    this.detalleCotizacion = [...(cotizacion.detalle || [])];
    this.modoEdicion = true;
    this.editIndex = index;
    this.mostrarFormulario = true;

    // Cargar solicitud
    this.solicitudSeleccionada =
      this.solicitudesCompra.find((s) => s.id === cotizacion.solicitudCompraId) ||
      null;
  }

  async eliminarCotizacion(index: number) {
    const cotizacion = this.cotizacionesFiltradas()[index];
    if (!cotizacion) return;

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Está seguro de eliminar esta cotización?',
      'warning'
    );

    if (!confirmacion) return;

    try {
      await this.dexieService.cotizaciones.delete(cotizacion.id!);

      this.alertService.showAlert(
        'Éxito',
        'Cotización eliminada correctamente.',
        'success'
      );

      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al eliminar cotización:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar la cotización.',
        'error'
      );
    }
  }

  async seleccionarCotizacion(cotizacion: Cotizacion) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea seleccionar esta cotización como ganadora?',
      'info'
    );

    if (!confirmacion) return;

    try {
      // Marcar como seleccionada
      cotizacion.estado = 'SELECCIONADA';
      cotizacion.seleccionada = true;
      cotizacion.usuarioEvalua = this.usuario.documentoidentidad;
      cotizacion.fechaEvaluacion = new Date().toISOString();

      await this.dexieService.saveCotizacion(cotizacion);

      // Actualizar solicitud de compra a EN_COTIZACION
      const solicitud = this.solicitudesCompra.find(
        (s) => s.id === cotizacion.solicitudCompraId
      );
      if (solicitud) {
        solicitud.estado = 'EN_COTIZACION';
        await this.dexieService.saveSolicitudCompra(solicitud);
      }

      this.alertService.showAlert(
        'Éxito',
        'Cotización seleccionada correctamente.',
        'success'
      );

      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al seleccionar cotización:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al seleccionar la cotización.',
        'error'
      );
    }
  }

  async rechazarCotizacion(cotizacion: Cotizacion) {
    const motivo = await this.alertService.showPrompt(
      'Rechazar Cotización',
      'Ingrese el motivo del rechazo:'
    );

    if (!motivo) return;

    try {
      cotizacion.estado = 'RECHAZADA';
      cotizacion.motivoRechazo = motivo;
      cotizacion.usuarioEvalua = this.usuario.documentoidentidad;
      cotizacion.fechaEvaluacion = new Date().toISOString();

      await this.dexieService.saveCotizacion(cotizacion);

      this.alertService.showAlert(
        'Éxito',
        'Cotización rechazada correctamente.',
        'success'
      );

      await this.cargarCotizaciones();
    } catch (error) {
      console.error('Error al rechazar cotización:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al rechazar la cotización.',
        'error'
      );
    }
  }

  verDetalle(cotizacion: Cotizacion) {
    this.cotizacionDetalle = cotizacion;
    this.modalDetalleCotizacionAbierto = true;
  }

  cerrarModalDetalleCotizacion() {
    this.modalDetalleCotizacionAbierto = false;
    this.cotizacionDetalle = null;
  }

  abrirComparativo(solicitudId: number) {
    this.cotizacionesComparativo = this.cotizaciones.filter(
      (c) => c.solicitudCompraId === solicitudId
    );
    this.modalComparativoAbierto = true;
  }

  cerrarModalComparativo() {
    this.modalComparativoAbierto = false;
    this.cotizacionesComparativo = [];
  }

  cancelarFormulario() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar? Se perderán los cambios no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormulario = false;
  }

  // Filtros
  cotizacionesFiltradas(): Cotizacion[] {
    let filtradas = [...this.cotizaciones];

    if (this.filtroEstado !== 'TODAS') {
      filtradas = filtradas.filter((c) => c.estado === this.filtroEstado);
    }

    if (this.filtroProveedor) {
      filtradas = filtradas.filter(
        (c) =>
          c.nombreProveedor
            .toLowerCase()
            .includes(this.filtroProveedor.toLowerCase()) ||
          c.proveedor.toLowerCase().includes(this.filtroProveedor.toLowerCase())
      );
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(
        (c) => new Date(c.fecha) >= new Date(this.filtroFechaInicio)
      );
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter(
        (c) => new Date(c.fecha) <= new Date(this.filtroFechaFin)
      );
    }

    return filtradas;
  }

  limpiarFiltros() {
    this.filtroEstado = 'TODAS';
    this.filtroProveedor = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
  }

  // Utilidades
  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      RECIBIDA: 'badge-info',
      EN_EVALUACION: 'badge-warning',
      SELECCIONADA: 'badge-success',
      RECHAZADA: 'badge-danger',
    };
    return clases[estado] || 'badge-secondary';
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

  formatearMoneda(monto: number, moneda: string = 'PEN'): string {
    const simbolo = moneda === 'PEN' ? 'S/' : '$';
    return `${simbolo} ${monto.toFixed(2)}`;
  }

  obtenerMejorPrecio(solicitudId: number): number {
    const cotizacionesSolicitud = this.cotizaciones.filter(
      (c) => c.solicitudCompraId === solicitudId && c.estado !== 'RECHAZADA'
    );

    if (cotizacionesSolicitud.length === 0) return 0;

    return Math.min(...cotizacionesSolicitud.map((c) => c.montoTotal));
  }
}
