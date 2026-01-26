import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UserService } from '@/app/shared/services/user.service';
import {
  Stock,
  MovimientoStock,
  Almacen,
  Usuario,
  RecepcionOrdenCompra,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-gestion-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './gestion-inventario.component.html',
  styleUrls: ['./gestion-inventario.component.scss'],
})
export class GestionInventarioComponent implements OnInit {
  // Listas principales
  stock: Stock[] = [];
  movimientos: MovimientoStock[] = [];
  almacenes: Almacen[] = [];

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
  tabActiva: 'stock' | 'kardex' | 'movimientos' = 'stock';

  // Filtros Stock
  filtroAlmacen: string = '';
  filtroCodigo: string = '';
  filtroStockBajo: boolean = false;

  // Filtros Kardex
  kardexCodigo: string = '';
  kardexAlmacen: string = '';
  kardexFechaInicio: string = '';
  kardexFechaFin: string = '';
  movimientosKardex: MovimientoStock[] = [];

  // Nuevo Movimiento
  mostrarFormMovimiento = false;
  nuevoMovimiento: MovimientoStock = this.inicializarMovimiento();

  // Contadores
  totalItems = 0;
  totalAlmacenes = 0;
  itemsBajoStock = 0;
  valorInventario = 0;

  // Modal detalle stock
  modalDetalleStockAbierto = false;
  stockDetalle: Stock | null = null;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private userService: UserService
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

      this.stock = await this.dexieService.showStock();
      this.movimientos = await this.dexieService.showMovimientosStock();
      this.almacenes = await this.dexieService.showAlmacenes();

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar los datos del inventario.', 'error');
    }
  }

  calcularContadores() {
    this.totalItems = this.stock.length;
    this.totalAlmacenes = new Set(this.stock.map(s => s.almacen)).size;
    this.itemsBajoStock = this.stock.filter(s => s.cantidad < 10).length; // Umbral ejemplo
    this.valorInventario = this.stock.reduce((sum, s) => sum + (s.cantidad * 100), 0); // Precio ejemplo
  }

  inicializarMovimiento(): MovimientoStock {
    return {
      fecha: new Date().toISOString(),
      tipo: 'ENTRADA',
      codigo: '',
      cantidad: 0,
      usuario: this.usuario.documentoidentidad || '',
    };
  }

  // Gestión de Stock
  stockFiltrado(): Stock[] {
    let filtrado = [...this.stock];

    if (this.filtroAlmacen) {
      filtrado = filtrado.filter(s => s.almacen === this.filtroAlmacen);
    }

    if (this.filtroCodigo) {
      filtrado = filtrado.filter(s => 
        s.codigo.toLowerCase().includes(this.filtroCodigo.toLowerCase()) ||
        s.descripcion.toLowerCase().includes(this.filtroCodigo.toLowerCase())
      );
    }

    if (this.filtroStockBajo) {
      filtrado = filtrado.filter(s => s.cantidad < 10);
    }

    return filtrado;
  }

  limpiarFiltrosStock() {
    this.filtroAlmacen = '';
    this.filtroCodigo = '';
    this.filtroStockBajo = false;
  }

  verDetalleStock(stock: Stock) {
    this.stockDetalle = stock;
    this.modalDetalleStockAbierto = true;
  }

  cerrarModalDetalleStock() {
    this.modalDetalleStockAbierto = false;
    this.stockDetalle = null;
  }

  // Kardex
  async buscarKardex() {
    if (!this.kardexCodigo) {
      this.alertService.showAlert('Atención', 'Debe ingresar un código de producto.', 'warning');
      return;
    }

    let movimientos = this.movimientos.filter(m => m.codigo === this.kardexCodigo);

    if (this.kardexAlmacen) {
      movimientos = movimientos.filter(m => 
        m.almacenOrigen === this.kardexAlmacen || m.almacenDestino === this.kardexAlmacen
      );
    }

    if (this.kardexFechaInicio) {
      movimientos = movimientos.filter(m => new Date(m.fecha) >= new Date(this.kardexFechaInicio));
    }

    if (this.kardexFechaFin) {
      movimientos = movimientos.filter(m => new Date(m.fecha) <= new Date(this.kardexFechaFin));
    }

    this.movimientosKardex = movimientos.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }

  limpiarKardex() {
    this.kardexCodigo = '';
    this.kardexAlmacen = '';
    this.kardexFechaInicio = '';
    this.kardexFechaFin = '';
    this.movimientosKardex = [];
  }

  calcularSaldoKardex(index: number): number {
    let saldo = 0;
    for (let i = this.movimientosKardex.length - 1; i >= index; i--) {
      const mov = this.movimientosKardex[i];
      if (mov.tipo === 'ENTRADA') {
        saldo += mov.cantidad;
      } else if (mov.tipo === 'SALIDA') {
        saldo -= mov.cantidad;
      }
    }
    return saldo;
  }

  // Nuevo Movimiento
  abrirFormMovimiento() {
    this.nuevoMovimiento = this.inicializarMovimiento();
    this.mostrarFormMovimiento = true;
  }

  async guardarMovimiento() {
    if (!this.nuevoMovimiento.codigo) {
      this.alertService.showAlert('Atención', 'Debe ingresar el código del producto.', 'warning');
      return;
    }

    if (this.nuevoMovimiento.cantidad <= 0) {
      this.alertService.showAlert('Atención', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }

    if (this.nuevoMovimiento.tipo === 'ENTRADA' && !this.nuevoMovimiento.almacenDestino) {
      this.alertService.showAlert('Atención', 'Debe seleccionar el almacén de destino.', 'warning');
      return;
    }

    if (this.nuevoMovimiento.tipo === 'SALIDA' && !this.nuevoMovimiento.almacenOrigen) {
      this.alertService.showAlert('Atención', 'Debe seleccionar el almacén de origen.', 'warning');
      return;
    }

    if (this.nuevoMovimiento.tipo === 'TRANSFERENCIA') {
      if (!this.nuevoMovimiento.almacenOrigen || !this.nuevoMovimiento.almacenDestino) {
        this.alertService.showAlert('Atención', 'Debe seleccionar almacén de origen y destino.', 'warning');
        return;
      }
    }

    try {
      this.alertService.mostrarModalCarga();

      this.nuevoMovimiento.usuario = this.usuario.documentoidentidad;
      await this.dexieService.saveMovimientoStock(this.nuevoMovimiento);

      // Actualizar stock
      await this.actualizarStock(this.nuevoMovimiento);

      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Éxito', 'Movimiento registrado correctamente.', 'success');

      this.mostrarFormMovimiento = false;
      await this.cargarDatos();
      this.calcularContadores();
    } catch (error) {
      console.error('Error al guardar movimiento:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Ocurrió un error al registrar el movimiento.', 'error');
    }
  }

  async actualizarStock(movimiento: MovimientoStock) {
    const { tipo, codigo, cantidad, almacenOrigen, almacenDestino } = movimiento;

    if (tipo === 'ENTRADA' && almacenDestino) {
      await this.actualizarStockAlmacen(codigo, almacenDestino, cantidad);
    } else if (tipo === 'SALIDA' && almacenOrigen) {
      await this.actualizarStockAlmacen(codigo, almacenOrigen, -cantidad);
    } else if (tipo === 'TRANSFERENCIA' && almacenOrigen && almacenDestino) {
      await this.actualizarStockAlmacen(codigo, almacenOrigen, -cantidad);
      await this.actualizarStockAlmacen(codigo, almacenDestino, cantidad);
    } else if (tipo === 'AJUSTE' && almacenDestino) {
      // Para ajustes, la cantidad puede ser positiva o negativa
      await this.actualizarStockAlmacen(codigo, almacenDestino, cantidad);
    }
  }

  async actualizarStockAlmacen(codigo: string, almacen: string, cantidad: number) {
    const stockExistente = this.stock.find(s => s.codigo === codigo && s.almacen === almacen);

    if (stockExistente) {
      stockExistente.cantidad += cantidad;
      stockExistente.ultimaActualizacion = new Date().toISOString();
      await this.dexieService.saveStock(stockExistente);
    } else if (cantidad > 0) {
      // Crear nuevo registro de stock si no existe y la cantidad es positiva
      const nuevoStock: Stock = {
        codigo,
        almacen,
        cantidad,
        descripcion: 'Producto', // Idealmente obtener de maestro de productos
        unidadMedida: 'UND',
        ultimaActualizacion: new Date().toISOString(),
      };
      await this.dexieService.saveStock(nuevoStock);
    }
  }

  cancelarMovimiento() {
    this.mostrarFormMovimiento = false;
  }

  // Utilidades
  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  obtenerClaseTipoMovimiento(tipo: string): string {
    const clases: { [key: string]: string } = {
      ENTRADA: 'badge-success',
      SALIDA: 'badge-danger',
      TRANSFERENCIA: 'badge-info',
      AJUSTE: 'badge-warning',
    };
    return clases[tipo] || 'badge-secondary';
  }

  obtenerIconoTipoMovimiento(tipo: string): string {
    const iconos: { [key: string]: string } = {
      ENTRADA: 'icon-arrow-down',
      SALIDA: 'icon-arrow-up',
      TRANSFERENCIA: 'icon-repeat',
      AJUSTE: 'icon-edit',
    };
    return iconos[tipo] || 'icon-circle';
  }

  esStockBajo(cantidad: number): boolean {
    return cantidad < 10; // Umbral configurable
  }

  calcularPorcentajeStock(cantidad: number): number {
    const max = 100; // Máximo ejemplo
    return Math.min((cantidad / max) * 100, 100);
  }
}
