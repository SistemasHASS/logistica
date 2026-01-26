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
  DevolucionProveedor,
  Usuario,
} from '@/app/shared/interfaces/Tables';
import { TableModule } from 'primeng/table';

interface ReporteGastoProveedor {
  proveedor: string;
  nombreProveedor: string;
  totalOrdenes: number;
  montoTotal: number;
  porcentaje: number;
}

interface ReporteGastoCategoria {
  categoria: string;
  cantidad: number;
  monto: number;
  porcentaje: number;
}

interface ReporteTendencia {
  mes: string;
  solicitudes: number;
  ordenes: number;
  monto: number;
}

interface ReporteAhorro {
  item: string;
  montoCotizado: number;
  montoOrden: number;
  ahorro: number;
  porcentajeAhorro: number;
}

@Component({
  selector: 'app-reportes-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './reportes-compras.component.html',
  styleUrls: ['./reportes-compras.component.scss'],
})
export class ReportesComprasComponent implements OnInit {
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

  // Datos
  solicitudes: SolicitudCompra[] = [];
  cotizaciones: Cotizacion[] = [];
  ordenesCompra: OrdenCompra[] = [];
  recepciones: RecepcionOrdenCompra[] = [];
  devoluciones: DevolucionProveedor[] = [];

  // Tipo de reporte
  tipoReporte: 'proveedores' | 'categorias' | 'tendencias' | 'ahorro' | 'devoluciones' = 'proveedores';

  // Filtros
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroProveedor: string = '';
  filtroMoneda: string = 'TODOS';

  // Reportes
  reporteProveedores: ReporteGastoProveedor[] = [];
  reporteCategorias: ReporteGastoCategoria[] = [];
  reporteTendencias: ReporteTendencia[] = [];
  reporteAhorro: ReporteAhorro[] = [];

  // Totales
  totalGasto = 0;
  totalOrdenes = 0;
  totalProveedores = 0;
  totalDevoluciones = 0;

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarDatos();
    this.generarReporte();
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

      this.solicitudes = await this.dexieService.showSolicitudesCompra();
      this.cotizaciones = await this.dexieService.showCotizaciones();
      this.ordenesCompra = await this.dexieService.showOrdenesCompra();
      this.recepciones = await this.dexieService.showRecepcionesOrdenCompra();
      
      // Cargar devoluciones si existen
      try {
        this.devoluciones = await this.dexieService.showDevolucionesProveedor();
      } catch {
        this.devoluciones = [];
      }

      this.alertService.cerrarModalCarga();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.alertService.cerrarModalCarga();
      this.alertService.showAlert('Error', 'Error al cargar los datos.', 'error');
    }
  }

  generarReporte() {
    this.aplicarFiltros();
    
    switch (this.tipoReporte) {
      case 'proveedores':
        this.generarReporteProveedores();
        break;
      case 'categorias':
        this.generarReporteCategorias();
        break;
      case 'tendencias':
        this.generarReporteTendencias();
        break;
      case 'ahorro':
        this.generarReporteAhorro();
        break;
      case 'devoluciones':
        this.calcularTotales();
        break;
    }
  }

  aplicarFiltros() {
    let ordenesFiltradas = [...this.ordenesCompra];

    if (this.filtroFechaInicio) {
      ordenesFiltradas = ordenesFiltradas.filter(
        o => new Date(o.fecha) >= new Date(this.filtroFechaInicio)
      );
    }

    if (this.filtroFechaFin) {
      ordenesFiltradas = ordenesFiltradas.filter(
        o => new Date(o.fecha) <= new Date(this.filtroFechaFin)
      );
    }

    if (this.filtroProveedor) {
      ordenesFiltradas = ordenesFiltradas.filter(
        o => o.nombreProveedor.toLowerCase().includes(this.filtroProveedor.toLowerCase())
      );
    }

    if (this.filtroMoneda !== 'TODOS') {
      ordenesFiltradas = ordenesFiltradas.filter(o => o.moneda === this.filtroMoneda);
    }

    this.ordenesCompra = ordenesFiltradas;
  }

  generarReporteProveedores() {
    const proveedoresMap = new Map<string, { ordenes: number; monto: number }>();

    this.ordenesCompra.forEach(orden => {
      const key = orden.proveedor;
      if (proveedoresMap.has(key)) {
        const data = proveedoresMap.get(key)!;
        data.ordenes++;
        data.monto += orden.montoTotal;
      } else {
        proveedoresMap.set(key, {
          ordenes: 1,
          monto: orden.montoTotal,
        });
      }
    });

    this.totalGasto = Array.from(proveedoresMap.values()).reduce((sum, p) => sum + p.monto, 0);

    this.reporteProveedores = Array.from(proveedoresMap.entries())
      .map(([proveedor, data]) => {
        const orden = this.ordenesCompra.find(o => o.proveedor === proveedor);
        return {
          proveedor,
          nombreProveedor: orden?.nombreProveedor || proveedor,
          totalOrdenes: data.ordenes,
          montoTotal: data.monto,
          porcentaje: this.totalGasto > 0 ? (data.monto / this.totalGasto) * 100 : 0,
        };
      })
      .sort((a, b) => b.montoTotal - a.montoTotal);

    this.totalOrdenes = this.ordenesCompra.length;
    this.totalProveedores = this.reporteProveedores.length;
  }

  generarReporteCategorias() {
    // Agrupar por tipo de servicio o categoría
    const categoriasMap = new Map<string, { cantidad: number; monto: number }>();

    this.ordenesCompra.forEach(orden => {
      orden.detalle.forEach(item => {
        const categoria = item.descripcion.split(' ')[0] || 'OTROS'; // Simplificado
        if (categoriasMap.has(categoria)) {
          const data = categoriasMap.get(categoria)!;
          data.cantidad += item.cantidad;
          data.monto += item.total;
        } else {
          categoriasMap.set(categoria, {
            cantidad: item.cantidad,
            monto: item.total,
          });
        }
      });
    });

    const totalMonto = Array.from(categoriasMap.values()).reduce((sum, c) => sum + c.monto, 0);

    this.reporteCategorias = Array.from(categoriasMap.entries())
      .map(([categoria, data]) => ({
        categoria,
        cantidad: data.cantidad,
        monto: data.monto,
        porcentaje: totalMonto > 0 ? (data.monto / totalMonto) * 100 : 0,
      }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 10); // Top 10
  }

  generarReporteTendencias() {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const tendenciasMap = new Map<string, { solicitudes: number; ordenes: number; monto: number }>();

    // Solicitudes por mes
    this.solicitudes.forEach(sol => {
      const fecha = new Date(sol.fecha);
      const mesAño = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
      if (tendenciasMap.has(mesAño)) {
        tendenciasMap.get(mesAño)!.solicitudes++;
      } else {
        tendenciasMap.set(mesAño, { solicitudes: 1, ordenes: 0, monto: 0 });
      }
    });

    // Órdenes por mes
    this.ordenesCompra.forEach(orden => {
      const fecha = new Date(orden.fecha);
      const mesAño = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
      if (tendenciasMap.has(mesAño)) {
        const data = tendenciasMap.get(mesAño)!;
        data.ordenes++;
        data.monto += orden.montoTotal;
      } else {
        tendenciasMap.set(mesAño, { solicitudes: 0, ordenes: 1, monto: orden.montoTotal });
      }
    });

    this.reporteTendencias = Array.from(tendenciasMap.entries())
      .map(([mes, data]) => ({
        mes,
        solicitudes: data.solicitudes,
        ordenes: data.ordenes,
        monto: data.monto,
      }))
      .slice(-12); // Últimos 12 meses
  }

  generarReporteAhorro() {
    const ahorroMap = new Map<string, { cotizado: number; orden: number }>();

    // Comparar cotizaciones vs órdenes
    this.cotizaciones.forEach(cot => {
      if (cot.seleccionada) {
        cot.detalle.forEach(item => {
          const key = item.codigo;
          if (ahorroMap.has(key)) {
            ahorroMap.get(key)!.cotizado += item.total;
          } else {
            ahorroMap.set(key, { cotizado: item.total, orden: 0 });
          }
        });
      }
    });

    this.ordenesCompra.forEach(orden => {
      orden.detalle.forEach(item => {
        const key = item.codigo;
        if (ahorroMap.has(key)) {
          ahorroMap.get(key)!.orden += item.total;
        }
      });
    });

    this.reporteAhorro = Array.from(ahorroMap.entries())
      .map(([item, data]) => {
        const ahorro = data.cotizado - data.orden;
        return {
          item,
          montoCotizado: data.cotizado,
          montoOrden: data.orden,
          ahorro,
          porcentajeAhorro: data.cotizado > 0 ? (ahorro / data.cotizado) * 100 : 0,
        };
      })
      .filter(a => a.ahorro !== 0)
      .sort((a, b) => b.ahorro - a.ahorro)
      .slice(0, 20); // Top 20
  }

  calcularTotales() {
    this.totalGasto = this.ordenesCompra.reduce((sum, o) => sum + o.montoTotal, 0);
    this.totalOrdenes = this.ordenesCompra.length;
    this.totalDevoluciones = this.devoluciones.length;
  }

  limpiarFiltros() {
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.filtroProveedor = '';
    this.filtroMoneda = 'TODOS';
    this.cargarDatos().then(() => this.generarReporte());
  }

  exportarExcel() {
    this.alertService.showAlert(
      'Exportar',
      'Funcionalidad de exportación a Excel en desarrollo.',
      'info'
    );
  }

  exportarPDF() {
    this.alertService.showAlert(
      'Exportar',
      'Funcionalidad de exportación a PDF en desarrollo.',
      'info'
    );
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

  obtenerColorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 30) return '#e74c3c';
    if (porcentaje >= 20) return '#f39c12';
    if (porcentaje >= 10) return '#3498db';
    return '#27ae60';
  }

  devolucionesFiltradas(): DevolucionProveedor[] {
    let filtradas = [...this.devoluciones];

    if (this.filtroFechaInicio) {
      filtradas = filtradas.filter(d => new Date(d.fecha) >= new Date(this.filtroFechaInicio));
    }

    if (this.filtroFechaFin) {
      filtradas = filtradas.filter(d => new Date(d.fecha) <= new Date(this.filtroFechaFin));
    }

    if (this.filtroProveedor) {
      filtradas = filtradas.filter(
        d => d.nombreProveedor.toLowerCase().includes(this.filtroProveedor.toLowerCase())
      );
    }

    return filtradas;
  }
}
