import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import {
  SolicitudCompra,
  Cotizacion,
  OrdenCompra,
  RecepcionOrdenCompra,
  Usuario,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-dashboard-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './dashboard-compras.component.html',
  styleUrls: ['./dashboard-compras.component.scss'],
})
export class DashboardComprasComponent implements OnInit {
  // Datos
  solicitudes: SolicitudCompra[] = [];
  cotizaciones: Cotizacion[] = [];
  ordenesCompra: OrdenCompra[] = [];
  recepciones: RecepcionOrdenCompra[] = [];

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

  // KPIs Generales
  totalSolicitudes = 0;
  totalCotizaciones = 0;
  totalOrdenes = 0;
  totalRecepciones = 0;

  // KPIs por Estado - Solicitudes
  solicitudesGeneradas = 0;
  solicitudesEnviadas = 0;
  solicitudesAprobadas = 0;
  solicitudesEnCotizacion = 0;

  // KPIs por Estado - Cotizaciones
  cotizacionesRecibidas = 0;
  cotizacionesEnEvaluacion = 0;
  cotizacionesSeleccionadas = 0;

  // KPIs por Estado - Órdenes
  ordenesGeneradas = 0;
  ordenesEnviadas = 0;
  ordenesConfirmadas = 0;
  ordenesEnProceso = 0;
  ordenesRecibidas = 0;

  // KPIs por Estado - Recepciones
  recepcionesParciales = 0;
  recepcionesCompletas = 0;
  recepcionesConformes = 0;
  recepcionesNoConformes = 0;

  // Montos
  montoTotalSolicitudes = 0;
  montoTotalOrdenes = 0;
  montoTotalCotizaciones = 0;

  // Análisis de Tiempo
  tiempoPromedioSolicitudACotizacion = 0;
  tiempoPromedioCotizacionAOrden = 0;
  tiempoPromedioOrdenARecepcion = 0;

  // Top Proveedores
  topProveedores: { nombre: string; ordenes: number; monto: number }[] = [];

  // Últimas Actividades
  ultimasSolicitudes: SolicitudCompra[] = [];
  ultimasOrdenes: OrdenCompra[] = [];
  ultimasRecepciones: RecepcionOrdenCompra[] = [];

  // Filtros
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Gráficos (datos simplificados)
  solicitudesPorEstado: { estado: string; cantidad: number }[] = [];
  ordenesPorEstado: { estado: string; cantidad: number }[] = [];
  recepcionesPorMes: { mes: string; cantidad: number }[] = [];

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarDatos();
    this.calcularKPIs();
    this.calcularAnalisis();
    this.prepararDatosGraficos();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarDatos() {
    try {
      this.alertService.mostrarModalCarga();

      // Cargar todos los datos
      this.solicitudes = await this.dexieService.showSolicitudesCompra();
      this.cotizaciones = await this.dexieService.showCotizaciones();
      this.ordenesCompra = await this.dexieService.showOrdenesCompra();
      this.recepciones = await this.dexieService.showRecepcionesOrdenCompra();

      // Aplicar filtros de fecha si existen
      if (this.filtroFechaInicio || this.filtroFechaFin) {
        this.aplicarFiltrosFecha();
      }

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar los datos del dashboard.', 'error');
    }
  }

  aplicarFiltrosFecha() {
    if (this.filtroFechaInicio) {
      const fechaInicio = new Date(this.filtroFechaInicio);
      this.solicitudes = this.solicitudes.filter(s => new Date(s.fecha) >= fechaInicio);
      this.cotizaciones = this.cotizaciones.filter(c => new Date(c.fecha) >= fechaInicio);
      this.ordenesCompra = this.ordenesCompra.filter(o => new Date(o.fecha) >= fechaInicio);
      this.recepciones = this.recepciones.filter(r => new Date(r.fecha) >= fechaInicio);
    }

    if (this.filtroFechaFin) {
      const fechaFin = new Date(this.filtroFechaFin);
      this.solicitudes = this.solicitudes.filter(s => new Date(s.fecha) <= fechaFin);
      this.cotizaciones = this.cotizaciones.filter(c => new Date(c.fecha) <= fechaFin);
      this.ordenesCompra = this.ordenesCompra.filter(o => new Date(o.fecha) <= fechaFin);
      this.recepciones = this.recepciones.filter(r => new Date(r.fecha) <= fechaFin);
    }
  }

  calcularKPIs() {
    // Totales generales
    this.totalSolicitudes = this.solicitudes.length;
    this.totalCotizaciones = this.cotizaciones.length;
    this.totalOrdenes = this.ordenesCompra.length;
    this.totalRecepciones = this.recepciones.length;

    // Solicitudes por estado
    this.solicitudesGeneradas = this.solicitudes.filter(s => s.estado === 'GENERADA').length;
    this.solicitudesEnviadas = this.solicitudes.filter(s => s.estado === 'ENVIADA').length;
    this.solicitudesAprobadas = this.solicitudes.filter(s => s.estado === 'APROBADA').length;
    this.solicitudesEnCotizacion = this.solicitudes.filter(s => s.estado === 'EN_COTIZACION').length;

    // Cotizaciones por estado
    this.cotizacionesRecibidas = this.cotizaciones.filter(c => c.estado === 'RECIBIDA').length;
    this.cotizacionesEnEvaluacion = this.cotizaciones.filter(c => c.estado === 'EN_EVALUACION').length;
    this.cotizacionesSeleccionadas = this.cotizaciones.filter(c => c.estado === 'SELECCIONADA').length;

    // Órdenes por estado
    this.ordenesGeneradas = this.ordenesCompra.filter(o => o.estado === 'GENERADA').length;
    this.ordenesEnviadas = this.ordenesCompra.filter(o => o.estado === 'ENVIADA').length;
    this.ordenesConfirmadas = this.ordenesCompra.filter(o => o.estado === 'CONFIRMADA').length;
    this.ordenesEnProceso = this.ordenesCompra.filter(o => o.estado === 'EN_PROCESO').length;
    this.ordenesRecibidas = this.ordenesCompra.filter(
      o => o.estado === 'RECIBIDA_PARCIAL' || o.estado === 'RECIBIDA_TOTAL'
    ).length;

    // Recepciones por estado
    this.recepcionesParciales = this.recepciones.filter(r => r.estado === 'PARCIAL').length;
    this.recepcionesCompletas = this.recepciones.filter(r => r.estado === 'COMPLETA').length;
    this.recepcionesConformes = this.recepciones.filter(r => r.conformidad === true).length;
    this.recepcionesNoConformes = this.recepciones.filter(r => r.conformidad === false).length;

    // Montos
    this.montoTotalSolicitudes = this.solicitudes.reduce((sum, s) => sum + (s.montoEstimado || 0), 0);
    this.montoTotalOrdenes = this.ordenesCompra.reduce((sum, o) => sum + o.montoTotal, 0);
    this.montoTotalCotizaciones = this.cotizaciones.reduce((sum, c) => sum + c.montoTotal, 0);
  }

  calcularAnalisis() {
    // Últimas actividades (últimas 5)
    this.ultimasSolicitudes = [...this.solicitudes]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);

    this.ultimasOrdenes = [...this.ordenesCompra]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);

    this.ultimasRecepciones = [...this.recepciones]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);

    // Top Proveedores
    const proveedoresMap = new Map<string, { ordenes: number; monto: number }>();
    
    this.ordenesCompra.forEach(orden => {
      const key = orden.nombreProveedor;
      if (proveedoresMap.has(key)) {
        const data = proveedoresMap.get(key)!;
        data.ordenes++;
        data.monto += orden.montoTotal;
      } else {
        proveedoresMap.set(key, { ordenes: 1, monto: orden.montoTotal });
      }
    });

    this.topProveedores = Array.from(proveedoresMap.entries())
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);
  }

  prepararDatosGraficos() {
    // Solicitudes por estado
    this.solicitudesPorEstado = [
      { estado: 'GENERADA', cantidad: this.solicitudesGeneradas },
      { estado: 'ENVIADA', cantidad: this.solicitudesEnviadas },
      { estado: 'APROBADA', cantidad: this.solicitudesAprobadas },
      { estado: 'EN_COTIZACION', cantidad: this.solicitudesEnCotizacion },
    ];

    // Órdenes por estado
    this.ordenesPorEstado = [
      { estado: 'GENERADA', cantidad: this.ordenesGeneradas },
      { estado: 'ENVIADA', cantidad: this.ordenesEnviadas },
      { estado: 'CONFIRMADA', cantidad: this.ordenesConfirmadas },
      { estado: 'EN_PROCESO', cantidad: this.ordenesEnProceso },
      { estado: 'RECIBIDAS', cantidad: this.ordenesRecibidas },
    ];

    // Recepciones por mes (últimos 6 meses)
    this.calcularRecepcionesPorMes();
  }

  calcularRecepcionesPorMes() {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const recepcionesPorMes = new Map<string, number>();

    this.recepciones.forEach(recep => {
      const fecha = new Date(recep.fecha);
      const mesAño = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
      recepcionesPorMes.set(mesAño, (recepcionesPorMes.get(mesAño) || 0) + 1);
    });

    this.recepcionesPorMes = Array.from(recepcionesPorMes.entries())
      .map(([mes, cantidad]) => ({ mes, cantidad }))
      .slice(-6);
  }

  async aplicarFiltros() {
    await this.cargarDatos();
    this.calcularKPIs();
    this.calcularAnalisis();
    this.prepararDatosGraficos();
  }

  async limpiarFiltros() {
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    await this.aplicarFiltros();
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

  formatearMoneda(monto: number, moneda: string = 'PEN'): string {
    const simbolo = moneda === 'PEN' ? 'S/' : '$';
    return `${simbolo} ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      GENERADA: 'badge-info',
      ENVIADA: 'badge-warning',
      APROBADA: 'badge-success',
      EN_COTIZACION: 'badge-primary',
      RECIBIDA: 'badge-info',
      EN_EVALUACION: 'badge-warning',
      SELECCIONADA: 'badge-success',
      CONFIRMADA: 'badge-primary',
      EN_PROCESO: 'badge-secondary',
      RECIBIDA_PARCIAL: 'badge-warning',
      RECIBIDA_TOTAL: 'badge-success',
      PARCIAL: 'badge-warning',
      COMPLETA: 'badge-success',
    };
    return clases[estado] || 'badge-secondary';
  }

  calcularPorcentaje(parte: number, total: number): number {
    return total > 0 ? (parte / total) * 100 : 0;
  }

  calcularEficienciaCompras(): number {
    // Eficiencia = (Órdenes Recibidas / Total Órdenes) * 100
    return this.calcularPorcentaje(this.ordenesRecibidas, this.totalOrdenes);
  }

  calcularTasaConformidad(): number {
    // Tasa de Conformidad = (Recepciones Conformes / Total Recepciones) * 100
    return this.calcularPorcentaje(this.recepcionesConformes, this.totalRecepciones);
  }

  calcularAhorro(): number {
    // Ahorro estimado = Monto Cotizaciones - Monto Órdenes
    return this.montoTotalCotizaciones - this.montoTotalOrdenes;
  }
}
