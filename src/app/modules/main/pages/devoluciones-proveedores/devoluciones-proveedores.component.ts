import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { DevolucionProveedorService } from '../../services/devolucion-proveedor.service';
import {
  DevolucionProveedor,
  DetalleDevolucion,
  RecepcionOrdenCompra,
  DetalleRecepcion,
  OrdenCompra,
  Usuario,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-devoluciones-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './devoluciones-proveedores.component.html',
  styleUrls: ['./devoluciones-proveedores.component.scss'],
})
export class DevolucionesProveedoresComponent implements OnInit {
  // Listas
  devoluciones: DevolucionProveedor[] = [];
  recepcionesNoConformes: RecepcionOrdenCompra[] = [];

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

  // Tabs
  tabActiva: 'recepciones' | 'devoluciones' = 'recepciones';

  // Formulario
  mostrarFormulario = false;
  devolucion: DevolucionProveedor = this.nuevaDevolucion();
  recepcionSeleccionada: RecepcionOrdenCompra | null = null;
  ordenCompra: OrdenCompra | null = null;

  // Filtros
  filtroEstado: string = 'TODOS';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Contadores
  totalDevoluciones = 0;
  devolucionesRegistradas = 0;
  devolucionesResueltas = 0;
  montoTotalDevoluciones = 0;

  // Modal detalle
  modalDetalleAbierto = false;
  devolucionDetalle: DevolucionProveedor | null = null;

  // Opciones
  tiposDevolucion = ['TOTAL', 'PARCIAL'];
  estados = ['REGISTRADA', 'ENVIADA', 'CONFIRMADA', 'RESUELTA'];
  resoluciones = ['REEMPLAZO', 'NOTA_CREDITO', 'DEVOLUCION_DINERO'];

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private devolucionService: DevolucionProveedorService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarDatos();
    this.calcularContadores();
  }

  async cargarUsuario() {
    const usuarioData = await this.dexieService.showUsuario();
    if (usuarioData) {
      this.usuario = usuarioData;
    }
  }

  async cargarDatos() {
    try {
      this.alertService.mostrarModalCarga();

      // Cargar recepciones no conformes desde backend
      this.recepcionesNoConformes = await this.devolucionService.listarRecepcionesNoConformes();
      
      // Cargar devoluciones desde backend
      this.devoluciones = await this.devolucionService.listarDevoluciones();

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.alertService.showAlert(
        'Error',
        'No se pudieron cargar los datos',
        'error'
      );
      this.alertService.cerrarModalCarga();
    }
  }

  calcularContadores() {
    this.totalDevoluciones = this.devoluciones.length;
    this.devolucionesRegistradas = this.devoluciones.filter(
      d => d.estado === 'REGISTRADA' || d.estado === 'ENVIADA' || d.estado === 'CONFIRMADA'
    ).length;
    this.devolucionesResueltas = this.devoluciones.filter(d => d.estado === 'RESUELTA').length;
    this.montoTotalDevoluciones = this.devoluciones.reduce((sum, d) => sum + d.montoTotal, 0);
  }

  nuevaDevolucion(): DevolucionProveedor {
    return {
      numeroDevolucion: '',
      recepcionId: 0,
      numeroRecepcion: '',
      ordenCompraId: 0,
      numeroOrden: '',
      proveedor: '',
      nombreProveedor: '',
      rucProveedor: '',
      fecha: new Date().toISOString().split('T')[0],
      motivo: '',
      tipoDevolucion: 'PARCIAL',
      detalle: [],
      montoTotal: 0,
      estado: 'REGISTRADA',
      usuarioRegistra: this.usuario.documentoidentidad || '',
    };
  }

  async generarDevolucionDesdeRecepcion(recepcion: RecepcionOrdenCompra) {
    try {
      this.alertService.mostrarModalCarga();

      // Generar devolución desde backend
      const resultado = await this.devolucionService.generarDevolucionDesdeRecepcion(
        recepcion.id || 0,
        this.usuario.documentoidentidad
      );

      if (resultado.resultado === 'OK') {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Éxito', 'Devolución generada correctamente.', 'success');
        
        // Abrir formulario con la devolución generada
        const devolucionGenerada = await this.devolucionService.obtenerDevolucionPorId(resultado.devolucionId);
        this.devolucion = devolucionGenerada;
        this.recepcionSeleccionada = recepcion;
        this.mostrarFormulario = true;
        
        await this.cargarDatos();
        this.calcularContadores();
      } else {
        this.alertService.cerrarModalCarga();
        this.alertService.showAlert('Error', resultado.mensaje, 'error');
      }
    } catch (error) {
      console.error('Error al generar devolución:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un error al generar la devolución.', 'error');
    }
  }

  calcularMontoTotal() {
    this.devolucion.montoTotal = this.devolucion.detalle.reduce(
      (sum, d) => sum + d.subtotal,
      0
    );
  }

  generarNumeroDevolucion(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const segundo = String(fecha.getSeconds()).padStart(2, '0');
    return `DEV-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
  }

  actualizarSubtotal(detalle: DetalleDevolucion) {
    detalle.subtotal = detalle.cantidadDevuelta * detalle.precioUnitario;
    this.calcularMontoTotal();
  }

  async guardarDevolucion() {
    // Validaciones
    if (!this.devolucion.motivo) {
      this.alertService.showAlert('Atención', 'Debe ingresar el motivo de la devolución.', 'warning');
      return;
    }

    if (this.devolucion.detalle.length === 0) {
      this.alertService.showAlert('Atención', 'Debe tener al menos un item para devolver.', 'warning');
      return;
    }

    try {
      this.alertService.mostrarModalCarga();

      this.devolucion.usuarioRegistra = this.usuario.documentoidentidad;
      
      // Guardar en backend
      await this.devolucionService.registrarDevolucion(this.devolucion);

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Éxito', 'Devolución registrada correctamente.', 'success');

      this.mostrarFormulario = false;
      await this.cargarDatos();
      this.calcularContadores();
    } catch (error) {
      console.error('Error al guardar devolución:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un error al guardar la devolución.', 'error');
    }
  }

  async generarMovimientoSalida() {
    // Generar movimiento de salida por cada item devuelto
    for (const item of this.devolucion.detalle) {
      const movimiento = {
        fecha: this.devolucion.fecha,
        tipo: 'SALIDA' as const,
        codigo: item.codigo,
        almacenOrigen: this.recepcionSeleccionada?.almacen || '',
        cantidad: item.cantidadDevuelta,
        referenciaDocumento: this.devolucion.numeroDevolucion,
        usuario: this.usuario.documentoidentidad,
        motivo: `Devolución a proveedor: ${this.devolucion.motivo}`,
      };

      await this.dexieService.saveMovimientoStock(movimiento);

      // Actualizar stock
      const stocks = await this.dexieService.showStock();
      const stock = stocks.find(
        s => s.codigo === item.codigo && s.almacen === this.recepcionSeleccionada?.almacen
      );

      if (stock) {
        stock.cantidad -= item.cantidadDevuelta;
        stock.ultimaActualizacion = new Date().toISOString();
        await this.dexieService.saveStock(stock);
      }
    }
  }

  async cambiarEstado(devolucion: DevolucionProveedor, nuevoEstado: string) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      `¿Desea cambiar el estado de la devolución a ${nuevoEstado}?`,
      'info'
    );

    if (!confirmacion) return;

    try {
      devolucion.estado = nuevoEstado as any;
      await this.dexieService.saveDevolucionProveedor(devolucion);
      this.alertService.showAlert('Éxito', 'Estado actualizado correctamente.', 'success');
      this.calcularContadores();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      this.alertService.showAlert('Error', 'Ocurrió un error al cambiar el estado.', 'error');
    }
  }

  async resolverDevolucion(devolucion: DevolucionProveedor, resolucion: string) {
    const confirmacion = await this.alertService.showConfirm(
      'Confirmación',
      `¿Confirma que la devolución se resolvió con: ${resolucion}?`,
      'info'
    );

    if (!confirmacion) return;

    try {
      devolucion.estado = 'RESUELTA';
      devolucion.resolucion = resolucion as any;
      devolucion.fechaResolucion = new Date().toISOString().split('T')[0];

      // Actualizar estado de items según resolución
      devolucion.detalle.forEach(item => {
        if (resolucion === 'REEMPLAZO') {
          item.estado = 'REEMPLAZADO';
        } else {
          item.estado = 'ACREDITADO';
        }
      });

      await this.dexieService.saveDevolucionProveedor(devolucion);
      this.alertService.showAlert('Éxito', 'Devolución resuelta correctamente.', 'success');
      this.calcularContadores();
    } catch (error) {
      console.error('Error al resolver devolución:', error);
      this.alertService.showAlert('Error', 'Ocurrió un error al resolver la devolución.', 'error');
    }
  }

  verDetalle(devolucion: DevolucionProveedor) {
    this.devolucionDetalle = devolucion;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.devolucionDetalle = null;
  }

  cancelarFormulario() {
    const confirmar = confirm('¿Seguro que deseas cancelar? Se perderán los cambios no guardados.');
    if (!confirmar) return;
    this.mostrarFormulario = false;
  }

  // Filtros
  devolucionesFiltradas(): DevolucionProveedor[] {
    let filtradas = [...this.devoluciones];

    if (this.filtroEstado !== 'TODOS') {
      filtradas = filtradas.filter(d => d.estado === this.filtroEstado);
    }

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(d => new Date(d.fecha) >= new Date(this.filtroFechaInicio));
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter(d => new Date(d.fecha) <= new Date(this.filtroFechaFin));
    }

    return filtradas;
  }

  limpiarFiltros() {
    this.filtroEstado = 'TODOS';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
  }

  // Utilidades
  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatearMoneda(monto: number): string {
    return `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      REGISTRADA: 'badge-info',
      ENVIADA: 'badge-warning',
      CONFIRMADA: 'badge-primary',
      RESUELTA: 'badge-success',
    };
    return clases[estado] || 'badge-secondary';
  }

  obtenerClaseResolucion(resolucion: string): string {
    const clases: { [key: string]: string } = {
      REEMPLAZO: 'badge-success',
      NOTA_CREDITO: 'badge-info',
      DEVOLUCION_DINERO: 'badge-warning',
    };
    return clases[resolucion] || 'badge-secondary';
  }

  obtenerEtiquetaResolucion(resolucion: string): string {
    const etiquetas: { [key: string]: string } = {
      REEMPLAZO: 'Reemplazo',
      NOTA_CREDITO: 'Nota de Crédito',
      DEVOLUCION_DINERO: 'Devolución de Dinero',
    };
    return etiquetas[resolucion] || resolucion;
  }

  contarItemsRechazados(recepcion: RecepcionOrdenCompra): number {
    if (!recepcion.detalle) return 0;
    return recepcion.detalle.filter(d => d.cantidadRechazada > 0).length;
  }

  calcularTotalRechazado(recepcion: RecepcionOrdenCompra): number {
    if (!recepcion.detalle) return 0;
    return recepcion.detalle.reduce((sum, d) => sum + d.cantidadRechazada, 0);
  }
}
