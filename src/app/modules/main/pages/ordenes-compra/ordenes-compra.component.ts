import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import {
  OrdenCompra,
  DetalleOrdenCompra,
  Cotizacion,
  SolicitudCompra,
  Usuario,
  Almacen,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-ordenes-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './ordenes-compra.component.html',
  styleUrls: ['./ordenes-compra.component.scss'],
})
export class OrdenesCompraComponent implements OnInit {
  // Listas principales
  ordenesCompra: OrdenCompra[] = [];
  cotizaciones: Cotizacion[] = [];
  almacenes: Almacen[] = [];

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  // Orden actual
  ordenCompra: OrdenCompra = this.nuevaOrdenCompra();
  detalleOrden: DetalleOrdenCompra[] = [];

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

  // Cotización seleccionada
  cotizacionSeleccionada: Cotizacion | null = null;

  // Filtros
  filtroEstado: string = 'TODAS';
  filtroProveedor: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalGeneradas = 0;
  totalEnviadas = 0;
  totalConfirmadas = 0;
  totalEnProceso = 0;
  totalRecibidas = 0;

  // Modal detalle orden
  modalDetalleOrdenAbierto = false;
  ordenDetalle: OrdenCompra | null = null;

  // Modal seguimiento
  modalSeguimientoAbierto = false;
  ordenSeguimiento: OrdenCompra | null = null;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarOrdenesCompra();
    await this.cargarCotizaciones();
    await this.cargarAlmacenes();
    this.actualizarContadores();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarOrdenesCompra() {
    this.ordenesCompra = await this.dexieService.showOrdenesCompra();
    this.actualizarContadores();
  }

  async cargarCotizaciones() {
    const todas = await this.dexieService.showCotizaciones();
    // Filtrar solo cotizaciones seleccionadas
    this.cotizaciones = todas.filter((c: Cotizacion) => c.estado === 'SELECCIONADA');
  }

  async cargarAlmacenes() {
    this.almacenes = await this.dexieService.showAlmacenes();
  }

  actualizarContadores() {
    this.totalGeneradas = this.ordenesCompra.filter((o) => o.estado === 'GENERADA').length;
    this.totalEnviadas = this.ordenesCompra.filter((o) => o.estado === 'ENVIADA').length;
    this.totalConfirmadas = this.ordenesCompra.filter((o) => o.estado === 'CONFIRMADA').length;
    this.totalEnProceso = this.ordenesCompra.filter((o) => o.estado === 'EN_PROCESO').length;
    this.totalRecibidas = this.ordenesCompra.filter(
      (o) => o.estado === 'RECIBIDA_PARCIAL' || o.estado === 'RECIBIDA_TOTAL'
    ).length;
  }

  nuevaOrdenCompra(): OrdenCompra {
    return {
      numeroOrden: '',
      solicitudCompraId: 0,
      fecha: new Date().toISOString(),
      fechaEntrega: '',
      proveedor: '',
      nombreProveedor: '',
      rucProveedor: '',
      direccionEntrega: '',
      montoTotal: 0,
      moneda: 'PEN',
      formaPago: 'CONTADO',
      condicionesPago: '',
      plazoEntrega: 0,
      detalle: [],
      estado: 'GENERADA',
      usuarioGenera: this.usuario.documentoidentidad || '',
    };
  }

  nuevaOrdenCompraForm() {
    this.ordenCompra = this.nuevaOrdenCompra();
    this.detalleOrden = [];
    this.cotizacionSeleccionada = null;
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  async generarDesdeCotizacion(cotizacion: Cotizacion) {
    try {
      this.alertService.mostrarModalCarga();

      // Cargar solicitud de compra
      const solicitud = await this.dexieService.solicitudesCompra.get(
        cotizacion.solicitudCompraId
      );

      if (!solicitud) {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert(
          'Error',
          'No se encontró la solicitud de compra asociada.',
          'error'
        );
        return;
      }

      // Crear orden desde cotización
      this.ordenCompra = {
        numeroOrden: this.generarNumeroOrden(),
        solicitudCompraId: cotizacion.solicitudCompraId,
        cotizacionId: cotizacion.id,
        fecha: new Date().toISOString(),
        fechaEntrega: this.calcularFechaEntrega(cotizacion.plazoEntrega),
        proveedor: cotizacion.proveedor,
        nombreProveedor: cotizacion.nombreProveedor,
        rucProveedor: cotizacion.rucProveedor,
        direccionEntrega: cotizacion.lugarEntrega || '',
        montoTotal: cotizacion.montoTotal,
        moneda: cotizacion.moneda,
        formaPago: cotizacion.formaPago,
        condicionesPago: cotizacion.condicionesPago,
        plazoEntrega: cotizacion.plazoEntrega,
        garantia: cotizacion.garantia,
        observaciones: cotizacion.observaciones,
        detalle: [],
        estado: 'GENERADA',
        usuarioGenera: this.usuario.documentoidentidad,
      };

      // Convertir detalle de cotización a detalle de orden
      this.detalleOrden = cotizacion.detalle.map((det) => ({
        ordenCompraId: 0,
        codigo: det.codigo,
        descripcion: det.descripcion,
        cantidad: det.cantidad,
        cantidadRecibida: 0,
        cantidadPendiente: det.cantidad,
        unidadMedida: det.unidadMedida,
        precioUnitario: det.precioUnitario,
        descuento: det.descuento,
        subtotal: det.subtotal,
        impuesto: det.impuesto,
        total: det.total,
        marca: det.marca,
        modelo: det.modelo,
        especificaciones: det.especificaciones,
        estado: 'PENDIENTE',
      }));

      this.cotizacionSeleccionada = cotizacion;
      this.mostrarFormulario = true;
      this.modoEdicion = false;

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Orden de compra generada desde cotización.',
        'success'
      );
    } catch (error) {
      console.error('Error al generar orden desde cotización:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al generar la orden de compra.',
        'error'
      );
    }
  }

  calcularFechaEntrega(plazoEntrega: number): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + plazoEntrega);
    return fecha.toISOString();
  }

  async guardarOrdenCompra() {
    if (!this.ordenCompra.proveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el código del proveedor.',
        'warning'
      );
      return;
    }

    if (!this.ordenCompra.nombreProveedor) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar el nombre del proveedor.',
        'warning'
      );
      return;
    }

    if (!this.ordenCompra.direccionEntrega) {
      this.alertService.showAlert(
        'Atención',
        'Debe ingresar la dirección de entrega.',
        'warning'
      );
      return;
    }

    if (this.detalleOrden.length === 0) {
      this.alertService.showAlert(
        'Atención',
        'Debe agregar al menos un item a la orden de compra.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      if (!this.modoEdicion) {
        this.ordenCompra.numeroOrden = this.generarNumeroOrden();
      }

      this.ordenCompra.detalle = [...this.detalleOrden];
      this.ordenCompra.usuarioGenera = this.usuario.documentoidentidad;

      await this.dexieService.saveOrdenCompra(this.ordenCompra);

      // Si se generó desde cotización, actualizar solicitud
      if (this.ordenCompra.solicitudCompraId) {
        const solicitud = await this.dexieService.solicitudesCompra.get(
          this.ordenCompra.solicitudCompraId
        );
        if (solicitud) {
          solicitud.estado = 'ORDEN_GENERADA';
          await this.dexieService.saveSolicitudCompra(solicitud);
        }
      }

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Éxito',
        'Orden de compra guardada correctamente.',
        'success'
      );

      this.mostrarFormulario = false;
      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al guardar orden de compra:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la orden de compra.',
        'error'
      );
    }
  }

  generarNumeroOrden(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const seg = String(fecha.getSeconds()).padStart(2, '0');
    return `OC-${año}${mes}${dia}-${hora}${min}${seg}`;
  }

  editarOrdenCompra(index: number) {
    const orden = this.ordenesCompraFiltradas()[index];
    if (!orden) return;

    if (orden.estado !== 'GENERADA') {
      this.alertService.showAlert(
        'Atención',
        'Solo se pueden editar órdenes en estado GENERADA.',
        'warning'
      );
      return;
    }

    this.ordenCompra = { ...orden };
    this.detalleOrden = [...(orden.detalle || [])];
    this.modoEdicion = true;
    this.editIndex = index;
    this.mostrarFormulario = true;
  }

  async eliminarOrdenCompra(index: number) {
    const orden = this.ordenesCompraFiltradas()[index];
    if (!orden) return;

    if (orden.estado !== 'GENERADA') {
      this.alertService.showAlert(
        'Atención',
        'Solo se pueden eliminar órdenes en estado GENERADA.',
        'warning'
      );
      return;
    }

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Está seguro de eliminar esta orden de compra?',
      'warning'
    );

    if (!confirmacion) return;

    try {
      await this.dexieService.ordenesCompra.delete(orden.id!);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra eliminada correctamente.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al eliminar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar la orden de compra.',
        'error'
      );
    }
  }

  async enviarOrdenCompra(orden: OrdenCompra) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Desea enviar esta orden de compra al proveedor?',
      'info'
    );

    if (!confirmacion) return;

    try {
      orden.estado = 'ENVIADA';
      await this.dexieService.saveOrdenCompra(orden);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra enviada correctamente.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al enviar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al enviar la orden de compra.',
        'error'
      );
    }
  }

  async confirmarOrdenCompra(orden: OrdenCompra) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿El proveedor ha confirmado esta orden de compra?',
      'info'
    );

    if (!confirmacion) return;

    try {
      orden.estado = 'CONFIRMADA';
      orden.usuarioAprueba = this.usuario.documentoidentidad;
      orden.fechaAprobacion = new Date().toISOString();
      await this.dexieService.saveOrdenCompra(orden);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra confirmada correctamente.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al confirmar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al confirmar la orden de compra.',
        'error'
      );
    }
  }

  async iniciarProcesoOrden(orden: OrdenCompra) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Marcar esta orden como EN PROCESO?',
      'info'
    );

    if (!confirmacion) return;

    try {
      orden.estado = 'EN_PROCESO';
      await this.dexieService.saveOrdenCompra(orden);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra marcada como EN PROCESO.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al actualizar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al actualizar la orden de compra.',
        'error'
      );
    }
  }

  async cancelarOrdenCompra(orden: OrdenCompra) {
    const motivo = await this.alertService.showPrompt(
      'Cancelar Orden de Compra',
      'Ingrese el motivo de la cancelación:'
    );

    if (!motivo) return;

    try {
      orden.estado = 'CANCELADA';
      orden.observaciones = (orden.observaciones || '') + '\nCANCELADA: ' + motivo;
      await this.dexieService.saveOrdenCompra(orden);

      this.alertService.showAlert(
        'Éxito',
        'Orden de compra cancelada correctamente.',
        'success'
      );

      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al cancelar orden de compra:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al cancelar la orden de compra.',
        'error'
      );
    }
  }

  verDetalle(orden: OrdenCompra) {
    this.ordenDetalle = orden;
    this.modalDetalleOrdenAbierto = true;
  }

  cerrarModalDetalleOrden() {
    this.modalDetalleOrdenAbierto = false;
    this.ordenDetalle = null;
  }

  verSeguimiento(orden: OrdenCompra) {
    this.ordenSeguimiento = orden;
    this.modalSeguimientoAbierto = true;
  }

  cerrarModalSeguimiento() {
    this.modalSeguimientoAbierto = false;
    this.ordenSeguimiento = null;
  }

  cancelarFormulario() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar? Se perderán los cambios no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormulario = false;
  }

  // Filtros
  ordenesCompraFiltradas(): OrdenCompra[] {
    let filtradas = [...this.ordenesCompra];

    if (this.filtroEstado !== 'TODAS') {
      filtradas = filtradas.filter((o) => o.estado === this.filtroEstado);
    }

    if (this.filtroProveedor) {
      filtradas = filtradas.filter(
        (o) =>
          o.nombreProveedor.toLowerCase().includes(this.filtroProveedor.toLowerCase()) ||
          o.proveedor.toLowerCase().includes(this.filtroProveedor.toLowerCase())
      );
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(
        (o) => new Date(o.fecha) >= new Date(this.filtroFechaInicio)
      );
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter((o) => new Date(o.fecha) <= new Date(this.filtroFechaFin));
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
      GENERADA: 'badge-info',
      ENVIADA: 'badge-warning',
      CONFIRMADA: 'badge-primary',
      EN_PROCESO: 'badge-secondary',
      RECIBIDA_PARCIAL: 'badge-warning',
      RECIBIDA_TOTAL: 'badge-success',
      CANCELADA: 'badge-danger',
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

  calcularPorcentajeRecibido(orden: OrdenCompra): number {
    if (!orden.detalle || orden.detalle.length === 0) return 0;

    const totalOrdenado = orden.detalle.reduce((sum, d) => sum + d.cantidad, 0);
    const totalRecibido = orden.detalle.reduce((sum, d) => sum + d.cantidadRecibida, 0);

    return totalOrdenado > 0 ? (totalRecibido / totalOrdenado) * 100 : 0;
  }

  obtenerEstadoDetalle(detalle: DetalleOrdenCompra): string {
    if (detalle.cantidadRecibida === 0) return 'PENDIENTE';
    if (detalle.cantidadRecibida >= detalle.cantidad) return 'COMPLETO';
    return 'PARCIAL';
  }
}
