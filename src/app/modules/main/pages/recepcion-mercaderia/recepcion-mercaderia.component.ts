import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import { UtilsService } from '@/app/shared/utils/utils.service';
import {
  RecepcionOrdenCompra,
  DetalleRecepcion,
  OrdenCompra,
  DetalleOrdenCompra,
  Usuario,
  Almacen,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-recepcion-mercaderia',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './recepcion-mercaderia.component.html',
  styleUrls: ['./recepcion-mercaderia.component.scss'],
})
export class RecepcionMercaderiaComponent implements OnInit {
  // Listas principales
  recepciones: RecepcionOrdenCompra[] = [];
  ordenesCompra: OrdenCompra[] = [];
  almacenes: Almacen[] = [];

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  editIndex = -1;

  // Recepción actual
  recepcion: RecepcionOrdenCompra = this.nuevaRecepcion();
  detalleRecepcion: DetalleRecepcion[] = [];

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

  // Orden seleccionada
  ordenSeleccionada: OrdenCompra | null = null;

  // Filtros
  filtroEstado: string = 'TODAS';
  filtroAlmacen: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalParciales = 0;
  totalCompletas = 0;
  totalConformes = 0;
  totalNoConformes = 0;

  // Modal detalle recepción
  modalDetalleRecepcionAbierto = false;
  recepcionDetalle: RecepcionOrdenCompra | null = null;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService,
    private utilsService: UtilsService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarRecepciones();
    await this.cargarOrdenesCompra();
    await this.cargarAlmacenes();
    this.actualizarContadores();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarRecepciones() {
    this.recepciones = await this.dexieService.showRecepcionesOrdenCompra();
    this.actualizarContadores();
  }

  async cargarOrdenesCompra() {
    const todas = await this.dexieService.showOrdenesCompra();
    // Filtrar solo órdenes confirmadas o en proceso
    this.ordenesCompra = todas.filter(
      (o: OrdenCompra) =>
        o.estado === 'CONFIRMADA' ||
        o.estado === 'EN_PROCESO' ||
        o.estado === 'RECIBIDA_PARCIAL'
    );
  }

  async cargarAlmacenes() {
    this.almacenes = await this.dexieService.showAlmacenes();
  }

  actualizarContadores() {
    this.totalParciales = this.recepciones.filter((r) => r.estado === 'PARCIAL').length;
    this.totalCompletas = this.recepciones.filter((r) => r.estado === 'COMPLETA').length;
    this.totalConformes = this.recepciones.filter((r) => r.conformidad === true).length;
    this.totalNoConformes = this.recepciones.filter((r) => r.conformidad === false).length;
  }

  nuevaRecepcion(): RecepcionOrdenCompra {
    return {
      numeroRecepcion: '',
      ordenCompraId: 0,
      numeroOrden: '',
      fecha: new Date().toISOString(),
      almacen: '',
      detalle: [],
      conformidad: true,
      usuarioRecibe: this.usuario.documentoidentidad || '',
      estado: 'PARCIAL',
    };
  }

  nuevaRecepcionForm() {
    this.recepcion = this.nuevaRecepcion();
    this.detalleRecepcion = [];
    this.ordenSeleccionada = null;
    this.mostrarFormulario = true;
    this.modoEdicion = false;
  }

  async onOrdenChange() {
    if (!this.recepcion.ordenCompraId) return;

    const orden = this.ordenesCompra.find((o) => o.id === this.recepcion.ordenCompraId);

    if (orden) {
      this.ordenSeleccionada = orden;
      this.recepcion.numeroOrden = orden.numeroOrden;

      // Cargar items pendientes de la orden
      this.detalleRecepcion = orden.detalle.map((item) => ({
        recepcionId: 0,
        detalleOrdenCompraId: item.id || 0,
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidadOrdenada: item.cantidad,
        cantidadRecibida: 0,
        cantidadAceptada: 0,
        cantidadRechazada: 0,
        estado: 'CONFORME',
      }));
    }
  }

  actualizarCantidades(detalle: DetalleRecepcion) {
    // Validar que cantidades sean coherentes
    if (detalle.cantidadRecibida < 0) detalle.cantidadRecibida = 0;
    if (detalle.cantidadAceptada < 0) detalle.cantidadAceptada = 0;
    if (detalle.cantidadRechazada < 0) detalle.cantidadRechazada = 0;

    // Calcular cantidades automáticamente
    const total = detalle.cantidadAceptada + detalle.cantidadRechazada;
    if (total > detalle.cantidadRecibida) {
      // Ajustar si la suma excede lo recibido
      detalle.cantidadAceptada = detalle.cantidadRecibida - detalle.cantidadRechazada;
      if (detalle.cantidadAceptada < 0) {
        detalle.cantidadAceptada = 0;
        detalle.cantidadRechazada = detalle.cantidadRecibida;
      }
    }

    // Determinar estado
    if (detalle.cantidadRechazada > 0) {
      detalle.estado = 'NO_CONFORME';
    } else {
      detalle.estado = 'CONFORME';
    }

    // Actualizar conformidad general
    this.actualizarConformidadGeneral();
  }

  actualizarConformidadGeneral() {
    const hayNoConformes = this.detalleRecepcion.some((d) => d.estado === 'NO_CONFORME');
    this.recepcion.conformidad = !hayNoConformes;
  }

  async guardarRecepcion() {
    if (!this.recepcion.ordenCompraId) {
      this.alertService.showAlert(
        'Atención',
        'Debe seleccionar una orden de compra.',
        'warning'
      );
      return;
    }

    if (!this.recepcion.almacen) {
      this.alertService.showAlert('Atención', 'Debe seleccionar un almacén.', 'warning');
      return;
    }

    // Validar que al menos un item tenga cantidad recibida
    const hayRecepcion = this.detalleRecepcion.some((d) => d.cantidadRecibida > 0);
    if (!hayRecepcion) {
      this.alertService.showAlert(
        'Atención',
        'Debe registrar al menos una cantidad recibida.',
        'warning'
      );
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      if (!this.modoEdicion) {
        this.recepcion.numeroRecepcion = this.generarNumeroRecepcion();
      }

      // Filtrar solo items con cantidad recibida
      this.recepcion.detalle = this.detalleRecepcion.filter((d) => d.cantidadRecibida > 0);
      this.recepcion.usuarioRecibe = this.usuario.documentoidentidad;

      // Determinar si es parcial o completa
      const todosCompletos = this.detalleRecepcion.every(
        (d) => d.cantidadRecibida >= d.cantidadOrdenada
      );
      this.recepcion.estado = todosCompletos ? 'COMPLETA' : 'PARCIAL';

      await this.dexieService.saveRecepcionOrdenCompra(this.recepcion);

      // Actualizar orden de compra
      await this.actualizarOrdenCompra();

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Éxito', 'Recepción guardada correctamente.', 'success');

      this.mostrarFormulario = false;
      await this.cargarRecepciones();
      await this.cargarOrdenesCompra();
    } catch (error) {
      console.error('Error al guardar recepción:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al guardar la recepción.',
        'error'
      );
    }
  }

  async actualizarOrdenCompra() {
    if (!this.ordenSeleccionada) return;

    // Actualizar cantidades recibidas en la orden
    for (const detRecep of this.recepcion.detalle) {
      const itemOrden = this.ordenSeleccionada.detalle.find(
        (d) => d.id === detRecep.detalleOrdenCompraId
      );
      if (itemOrden) {
        itemOrden.cantidadRecibida += detRecep.cantidadAceptada;
        itemOrden.cantidadPendiente = itemOrden.cantidad - itemOrden.cantidadRecibida;

        // Actualizar estado del item
        if (itemOrden.cantidadRecibida >= itemOrden.cantidad) {
          itemOrden.estado = 'COMPLETO';
        } else if (itemOrden.cantidadRecibida > 0) {
          itemOrden.estado = 'PARCIAL';
        }
      }
    }

    // Actualizar estado de la orden
    const todosCompletos = this.ordenSeleccionada.detalle.every(
      (d) => d.estado === 'COMPLETO'
    );
    const algunoParcial = this.ordenSeleccionada.detalle.some((d) => d.estado === 'PARCIAL');

    if (todosCompletos) {
      this.ordenSeleccionada.estado = 'RECIBIDA_TOTAL';
    } else if (algunoParcial) {
      this.ordenSeleccionada.estado = 'RECIBIDA_PARCIAL';
    }

    await this.dexieService.saveOrdenCompra(this.ordenSeleccionada);
  }

  generarNumeroRecepcion(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    const seg = String(fecha.getSeconds()).padStart(2, '0');
    return `REC-${año}${mes}${dia}-${hora}${min}${seg}`;
  }

  async eliminarRecepcion(index: number) {
    const recepcion = this.recepcionesFiltradas()[index];
    if (!recepcion) return;

    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      '¿Está seguro de eliminar esta recepción? Esta acción no se puede deshacer.',
      'warning'
    );

    if (!confirmacion) return;

    try {
      await this.dexieService.recepcionesOrdenCompra.delete(recepcion.id!);

      this.alertService.showAlert('Éxito', 'Recepción eliminada correctamente.', 'success');

      await this.cargarRecepciones();
    } catch (error) {
      console.error('Error al eliminar recepción:', error);
      this.alertService.showAlert(
        'Error',
        'Ocurrió un error al eliminar la recepción.',
        'error'
      );
    }
  }

  verDetalle(recepcion: RecepcionOrdenCompra) {
    this.recepcionDetalle = recepcion;
    this.modalDetalleRecepcionAbierto = true;
  }

  cerrarModalDetalleRecepcion() {
    this.modalDetalleRecepcionAbierto = false;
    this.recepcionDetalle = null;
  }

  cancelarFormulario() {
    const confirmar = confirm(
      '¿Seguro que deseas cancelar? Se perderán los cambios no guardados.'
    );
    if (!confirmar) return;
    this.mostrarFormulario = false;
  }

  // Filtros
  recepcionesFiltradas(): RecepcionOrdenCompra[] {
    let filtradas = [...this.recepciones];

    if (this.filtroEstado !== 'TODAS') {
      filtradas = filtradas.filter((r) => r.estado === this.filtroEstado);
    }

    if (this.filtroAlmacen) {
      filtradas = filtradas.filter((r) =>
        r.almacen.toLowerCase().includes(this.filtroAlmacen.toLowerCase())
      );
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(
        (r) => new Date(r.fecha) >= new Date(this.filtroFechaInicio)
      );
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter((r) => new Date(r.fecha) <= new Date(this.filtroFechaFin));
    }

    return filtradas;
  }

  limpiarFiltros() {
    this.filtroEstado = 'TODAS';
    this.filtroAlmacen = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
  }

  // Utilidades
  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      PARCIAL: 'badge-warning',
      COMPLETA: 'badge-success',
      CONFORME: 'badge-success',
      NO_CONFORME: 'badge-danger',
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

  calcularPorcentajeRecepcion(recepcion: RecepcionOrdenCompra): number {
    if (!recepcion.detalle || recepcion.detalle.length === 0) return 0;

    const totalOrdenado = recepcion.detalle.reduce((sum, d) => sum + d.cantidadOrdenada, 0);
    const totalRecibido = recepcion.detalle.reduce((sum, d) => sum + d.cantidadRecibida, 0);

    return totalOrdenado > 0 ? (totalRecibido / totalOrdenado) * 100 : 0;
  }

  calcularTotalAceptado(recepcion: RecepcionOrdenCompra): number {
    return recepcion.detalle.reduce((sum, d) => sum + d.cantidadAceptada, 0);
  }

  calcularTotalRechazado(recepcion: RecepcionOrdenCompra): number {
    return recepcion.detalle.reduce((sum, d) => sum + d.cantidadRechazada, 0);
  }
}
