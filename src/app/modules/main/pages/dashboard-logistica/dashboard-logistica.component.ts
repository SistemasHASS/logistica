import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { EmpresasService } from './services/empresas.service';
import { DashboardLogisticaService } from './services/dashboard-logistica.service';
import { take } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

/** Item de menú para accesos directos */
interface MenuShortcutItem {
  id: string;
  nombre: string;
  icono: string;
  ruta: string;
  color: string;
}

/** Grupo de accesos directos */
interface MenuShortcutGroup {
  id: string;
  label: string;
  icono: string;
  items: MenuShortcutItem[];
}

@Component({
  selector: 'app-dashboard-logistica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    CardModule,
    DialogModule,
    ChartModule,
    NumeroRequerimientoPipe
  ],
  providers: [DatePipe],
  templateUrl: './dashboard-logistica.component.html',
  styleUrls: ['./dashboard-logistica.component.scss']
})
export class DashboardLogisticaComponent implements OnInit {
  // Usuario
  usuario: any;

  // Empresas
  empresas: any[] = [];
  empresaSeleccionada: any = null;
  empresasRequeridasIds = ['000010', '000008', '000006']; // CAO, HP, BH

  // KPIs de Requerimientos (por empresa)
  requerimientosPendientes: number = 0;
  requerimientosConsolidados: number = 0;
  requerimientosDespachados: number = 0;
  requerimientosAprobados: number = 0;

  // Gráfica de Requerimientos por Mes (COMPRA vs CONSUMO)
  requerimientosPorMes: {
    mes: string;
    compra: number;
    consumo: number;
  }[] = [];

  // Datos para gráfica PrimeNG
  chartData: any;
  chartOptions: any;

  // Datos para tabs hijos
  ordenesCompraList: any[] = [];
  solicitudesCompraList: any[] = [];
  proveedoresList: any[] = [];

  // Seguimiento de Órdenes de Compra
  ordenesCompra: {
    pendiente: number;
    aprobada: number;
    enTransito: number;
    recibida: number;
  } = { pendiente: 0, aprobada: 0, enTransito: 0, recibida: 0 };

  // Seguimiento de Órdenes de Servicio
  ordenesServicio: {
    pendiente: number;
    aprobada: number;
    enTransito: number;
    recibida: number;
  } = { pendiente: 0, aprobada: 0, enTransito: 0, recibida: 0 };

  // Entregas de Hoy
  entregasHoy: {
    hora: string;
    fecha: string;
    estado: string;
    proveedor: string;
  }[] = [];

  // Estado de Almacén
  estadoAlmacen: {
    stockDisponible: number;
    stockCritico: number;
    sinStock: number;
  } = { stockDisponible: 0, stockCritico: 0, sinStock: 0 };

  // Resumen de Compras
  resumenCompras: {
    ordenesEmitidas: number;
    recepciones: number;
    totalCompras: number;
    montoTotal: number;
  } = { ordenesEmitidas: 0, recepciones: 0, totalCompras: 0, montoTotal: 0 };

  // Gastos Mensuales
  gastosMensuales: {
    mes: string;
    monto: number;
    detalle: any[];
  }[] = [];

  // Modal de gastos mensuales
  modalGastosAbierto: boolean = false;
  gastosSeleccionados: any[] = [];

  // Modal de requerimientos por estado (al hacer click en KPIs)
  modalRequerimientosAbierto: boolean = false;
  requerimientosLista: any[] = [];
  tituloModalRequerimientos: string = '';
  estadoSeleccionadoModal: string = '';
  loadingModalRequerimientos: boolean = false;
  requerimientoExpandido: number | null = null;
  // Paginación del modal
  paginaActualModal: number = 1;
  itemsPorPaginaModal: number = 10;

  // Navegación interna
  activeTab: number = 0;

  // Loading
  loading: boolean = false;

  // ==================== REPORTES ====================
  // Estado de modales de reportes
  modalReporteComprasAbierto: boolean = false;
  modalReporteInventarioAbierto: boolean = false;
  modalReporteProveedoresAbierto: boolean = false;
  modalReporteTiemposAbierto: boolean = false;
  modalReporteGastosAbierto: boolean = false;
  modalReporteConsolidadoAbierto: boolean = false;

  // Loading de reportes
  loadingReporte: boolean = false;

  // Datos de reportes
  reporteComprasData: any = null;
  reporteInventarioData: any = null;
  reporteProveedoresData: any[] = [];
  reporteTiemposData: any = null;
  reporteGastosData: any[] = [];
  reporteConsolidadoData: any = null;

  // ==================== ACCESOS DIRECTOS (JLOLOGIST / LOLOGIST) ====================
  /** Grupos de accesos directos basados en el menú layout - Ordenados por flujo operativo */
  readonly menuShortcuts: MenuShortcutGroup[] = [
    // {
    //   id: 'panel',
    //   label: 'Mi Panel',
    //   icono: 'bx bxs-dashboard',
    //   items: [
    //     { id: 'dashboard-jlologist', nombre: 'Dashboard Jef. Logística', icono: 'bx bx-line-chart', ruta: '/main/dashboard-jlologist', color: 'info' },
    //     { id: 'dashboard-logistica', nombre: 'Dashboard Logística', icono: 'bx bx-bar-chart-alt-2', ruta: '/main/dashboard-logistica', color: 'primary' },
    //     { id: 'dashboard-oplogist', nombre: 'Mi Dashboard', icono: 'bx bx-user-check', ruta: '/main/dashboard-oplogist', color: 'success' },
    //   ]
    // },
    {
      id: 'requerimientos',
      label: 'Requerimientos',
      icono: 'icon icon-stack',
      items: [
        { id: 'requerimientos', nombre: 'Requerimientos', icono: 'icon icon-stack', ruta: '/main/requerimientos', color: 'success' },
      ]
    },
    {
      id: 'compras',
      label: 'Compras & Órdenes',
      icono: 'bx bx-cart',
      items: [
        { id: 'consolidacion-compras', nombre: 'Consolidación Compras', icono: 'bx bx-cart', ruta: '/main/consolidacion-compras', color: 'success' },
        { id: 'ordenes-compra', nombre: 'Órdenes de Compra', icono: 'icon icon-file-text', ruta: '/main/ordenes-compra', color: 'primary' },
        { id: 'ordenes-servicio', nombre: 'Órdenes de Servicio', icono: 'bx bx-wrench', ruta: '/main/ordenes-servicio', color: 'secondary' },
      ]
    },
    {
      id: 'almacen',
      label: 'Almacén & Stock',
      icono: 'bx bx-package',
      items: [
        { id: 'despachos', nombre: 'Gestión de Despachos', icono: 'icon icon-stack', ruta: '/main/despachos', color: 'info' },
        { id: 'recepcion-mercaderia', nombre: 'Recepción de Mercadería', icono: 'icon icon-package', ruta: '/main/recepcion-mercaderia', color: 'success' },
        { id: 'kardex', nombre: 'Kardex e Inventario', icono: 'bx bx-container', ruta: '/main/kardex', color: 'primary' },
      ]
    },
    // {
    //   id: 'reportes',
    //   label: 'Reportes',
    //   icono: 'icon icon-file-text',
    //   items: [
    //     { id: 'reporte-requerimientos', nombre: 'Reporte Requerimientos', icono: 'icon icon-file-check', ruta: '/main/reporte-requerimientos', color: 'success' },
    //     { id: 'reportes-compras', nombre: 'Reportes Avanzados', icono: 'icon icon-pie-chart', ruta: '/main/reportes-compras', color: 'info' },
    //     { id: 'reporte-despachos', nombre: 'Reporte de Despachos', icono: 'icon icon-file-text', ruta: '/main/reporte-despachos', color: 'primary' },
    //   ]
    // },
  ];

  /** Verifica si el usuario es JLOLOGIST o LOLOGIST */
  esJefeLogistica(): boolean {
    const rol = this.usuario?.idrol || '';
    return rol.includes('JLOLOGIST') || rol.includes('LOLOGIST');
  }

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private router: Router,
    private empresasService: EmpresasService,
    private dashboardLogisticaService: DashboardLogisticaService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarEmpresas();
    if (this.empresas.length > 0) {
      this.empresaSeleccionada = this.empresas[0];
      await this.cargarDatosDashboard();
    }
  }

  async cargarEmpresas() {
    try {
      const empresasData = await this.empresasService.getEmpresas().toPromise();
      if (empresasData) {
        this.empresas = this.empresasService.filtrarEmpresasRequeridas(empresasData);
      }
    } catch (error) {
      console.error('Error al cargar empresas:', error);
      this.alertService.showAlert('Error', 'Error al cargar las empresas.', 'error');
    }
  }

  seleccionarEmpresa(empresa: any) {
    this.empresaSeleccionada = empresa;
    this.cargarDatosDashboard();
  }

  getEmpresaSigla(idEmpresa: string): string {
    const siglas: { [key: string]: string } = {
      '000010': 'CAO',
      '000008': 'HP',
      '000006': 'BH'
    };
    return siglas[idEmpresa] || '';
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    }
  }

  async cargarDatosDashboard() {
    try {
      this.loading = true;

      // TODO: Implementar llamadas reales a la API
      await this.calcularKPIsRequerimientos();
      await this.generarGraficaRequerimientos();
      await this.calcularSeguimientoOrdenes();
      await this.obtenerEntregasHoy();
      await this.calcularEstadoAlmacen();
      await this.calcularResumenCompras();
      await this.obtenerGastosMensuales();
      await this.cargarDatosTabsHijos();

      this.loading = false;
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      this.alertService.showAlert('Error', 'Error al cargar los datos del dashboard.', 'error');
      this.loading = false;
    }
  }

  async calcularKPIsRequerimientos() {
    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        fechaInicio: this.obtenerFechaInicio(),
        fechaFin: this.obtenerFechaFin()
      };

      const response = await this.dashboardLogisticaService.obtenerKPIsRequerimientos(payload).toPromise();

      if (response) {
        this.requerimientosPendientes = response.pendientes || 0;
        this.requerimientosConsolidados = response.consolidados || 0;
        this.requerimientosDespachados = response.despachados || 0;
        this.requerimientosAprobados = response.aprobados || 0;
      }
    } catch (error) {
      console.error('Error al obtener KPIs de requerimientos:', error);
      // Data simulada como fallback
      this.requerimientosPendientes = 0;
      this.requerimientosConsolidados = 0;
      this.requerimientosDespachados = 0;
      this.requerimientosAprobados = 0;
    }
  }

  // Data simulada original (comentada para referencia)
  /*
  async calcularKPIsRequerimientos() {
    const idEmpresa = this.empresaSeleccionada?.id || '000010';

    if (idEmpresa === '000010') { // CAO
      this.requerimientosPendientes = 25;
      this.requerimientosConsolidados = 40;
      this.requerimientosDespachados = 35;
      this.requerimientosAprobados = 55;
    } else if (idEmpresa === '000008') { // HP
      this.requerimientosPendientes = 18;
      this.requerimientosConsolidados = 32;
      this.requerimientosDespachados = 28;
      this.requerimientosAprobados = 45;
    } else if (idEmpresa === '000006') { // BH
      this.requerimientosPendientes = 12;
      this.requerimientosConsolidados = 22;
      this.requerimientosDespachados = 19;
      this.requerimientosAprobados = 30;
    }
  }
  */

  async generarGraficaRequerimientos() {
    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const anio = new Date().getFullYear();
      const payload = {
        idEmpresa: idEmpresa,
        anio: anio
      };

      const response = await this.dashboardLogisticaService.obtenerRequerimientosPorMes(payload).toPromise();

      if (response && response.length > 0) {
        this.requerimientosPorMes = response;
      } else {
        this.requerimientosPorMes = [];
      }

      // Configurar gráfica PrimeNG
      this.chartData = {
        labels: this.requerimientosPorMes.map(r => r.mes),
        datasets: [
          {
            label: 'Compra',
            data: this.requerimientosPorMes.map(r => r.compra),
            backgroundColor: '#0d6efd',
            borderColor: '#0d6efd',
            borderWidth: 1
          },
          {
            label: 'Consumo',
            data: this.requerimientosPorMes.map(r => r.consumo),
            backgroundColor: '#20c997',
            borderColor: '#20c997',
            borderWidth: 1
          }
        ]
      };

      this.chartOptions = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      };
    } catch (error) {
      console.error('Error al obtener requerimientos por mes:', error);
      // Data simulada como fallback
      this.requerimientosPorMes = [];
      this.chartData = {
        labels: [],
        datasets: []
      };
    }
  }

  // Data simulada original (comentada para referencia)
  /*
  async generarGraficaRequerimientos() {
    const idEmpresa = this.empresaSeleccionada?.id || '000010';

    if (idEmpresa === '000010') { // CAO
      this.requerimientosPorMes = [
        { mes: 'Ene', compra: 12, consumo: 8 },
        { mes: 'Feb', compra: 15, consumo: 10 },
        { mes: 'Mar', compra: 18, consumo: 12 },
        { mes: 'Abr', compra: 20, consumo: 15 },
        { mes: 'May', compra: 22, consumo: 18 },
        { mes: 'Jun', compra: 25, consumo: 20 }
      ];
    } else if (idEmpresa === '000008') { // HP
      this.requerimientosPorMes = [
        { mes: 'Ene', compra: 8, consumo: 5 },
        { mes: 'Feb', compra: 10, consumo: 7 },
        { mes: 'Mar', compra: 12, consumo: 8 },
        { mes: 'Abr', compra: 14, consumo: 10 },
        { mes: 'May', compra: 16, consumo: 12 },
        { mes: 'Jun', compra: 18, consumo: 14 }
      ];
    } else if (idEmpresa === '000006') { // BH
      this.requerimientosPorMes = [
        { mes: 'Ene', compra: 5, consumo: 3 },
        { mes: 'Feb', compra: 7, consumo: 4 },
        { mes: 'Mar', compra: 9, consumo: 5 },
        { mes: 'Abr', compra: 11, consumo: 7 },
        { mes: 'May', compra: 13, consumo: 8 },
        { mes: 'Jun', compra: 15, consumo: 9 }
      ];
    }

    // Configurar gráfica PrimeNG
    this.chartData = {
      labels: this.requerimientosPorMes.map(r => r.mes),
      datasets: [
        {
          label: 'Compra',
          data: this.requerimientosPorMes.map(r => r.compra),
          backgroundColor: '#0d6efd',
          borderColor: '#0d6efd',
          borderWidth: 1
        },
        {
          label: 'Consumo',
          data: this.requerimientosPorMes.map(r => r.consumo),
          backgroundColor: '#20c997',
          borderColor: '#20c997',
          borderWidth: 1
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  }
  */

  async calcularSeguimientoOrdenes() {
    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa
      };

      const response = await this.dashboardLogisticaService.obtenerSeguimientoOrdenes(payload).toPromise();

      if (response) {
        this.ordenesCompra = response.ordenesCompra || { pendiente: 0, aprobada: 0, enTransito: 0, recibida: 0 };
        this.ordenesServicio = response.ordenesServicio || { pendiente: 0, aprobada: 0, enTransito: 0, recibida: 0 };
      }
    } catch (error) {
      console.error('Error al obtener seguimiento de órdenes:', error);
      // Data simulada como fallback
      this.ordenesCompra = { pendiente: 0, aprobada: 0, enTransito: 0, recibida: 0 };
      this.ordenesServicio = { pendiente: 0, aprobada: 0, enTransito: 0, recibida: 0 };
    }
  }

  // Data simulada original (comentada para referencia)
  /*
  async calcularSeguimientoOrdenes() {
    const idEmpresa = this.empresaSeleccionada?.id || '000010';

    if (idEmpresa === '000010') { // CAO
      this.ordenesCompra = { pendiente: 8, aprobada: 12, enTransito: 5, recibida: 15 };
      this.ordenesServicio = { pendiente: 5, aprobada: 8, enTransito: 3, recibida: 10 };
    } else if (idEmpresa === '000008') { // HP
      this.ordenesCompra = { pendiente: 6, aprobada: 9, enTransito: 4, recibida: 12 };
      this.ordenesServicio = { pendiente: 4, aprobada: 6, enTransito: 2, recibida: 8 };
    } else if (idEmpresa === '000006') { // BH
      this.ordenesCompra = { pendiente: 4, aprobada: 6, enTransito: 3, recibida: 8 };
      this.ordenesServicio = { pendiente: 3, aprobada: 5, enTransito: 2, recibida: 6 };
    }
  }
  */

  async obtenerEntregasHoy() {
    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        fecha: this.obtenerFechaFin()
      };

      const response = await this.dashboardLogisticaService.obtenerEntregasHoy(payload).toPromise();

      if (response && response.length > 0) {
        this.entregasHoy = response;
      } else {
        this.entregasHoy = [];
      }
    } catch (error) {
      console.error('Error al obtener entregas de hoy:', error);
      this.entregasHoy = [];
    }
  }

  // Data simulada original (comentada para referencia)
  /*
  async obtenerEntregasHoy() {
    const idEmpresa = this.empresaSeleccionada?.id || '000010';

    if (idEmpresa === '000010') { // CAO
      this.entregasHoy = [
        { hora: '08:30', fecha: '23/04/2026', estado: 'Recibida', proveedor: 'Proveedor A' },
        { hora: '10:15', fecha: '23/04/2026', estado: 'En Tránsito', proveedor: 'Proveedor B' },
        { hora: '11:45', fecha: '23/04/2026', estado: 'Recibida', proveedor: 'Proveedor C' },
        { hora: '14:20', fecha: '23/04/2026', estado: 'Pendiente', proveedor: 'Proveedor D' },
        { hora: '16:00', fecha: '23/04/2026', estado: 'En Tránsito', proveedor: 'Proveedor E' }
      ];
    } else if (idEmpresa === '000008') { // HP
      this.entregasHoy = [
        { hora: '09:00', fecha: '23/04/2026', estado: 'Recibida', proveedor: 'Proveedor F' },
        { hora: '11:30', fecha: '23/04/2026', estado: 'En Tránsito', proveedor: 'Proveedor G' },
        { hora: '13:45', fecha: '23/04/2026', estado: 'Recibida', proveedor: 'Proveedor H' }
      ];
    } else if (idEmpresa === '000006') { // BH
      this.entregasHoy = [
        { hora: '08:00', fecha: '23/04/2026', estado: 'Recibida', proveedor: 'Proveedor I' },
        { hora: '12:30', fecha: '23/04/2026', estado: 'En Tránsito', proveedor: 'Proveedor J' }
      ];
    }
  }
  */

  async calcularEstadoAlmacen() {
    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        idAlmacen: null
      };

      const response = await this.dashboardLogisticaService.obtenerEstadoAlmacen(payload).toPromise();

      if (response) {
        this.estadoAlmacen = {
          stockDisponible: response.stockDisponible || 0,
          stockCritico: response.stockCritico || 0,
          sinStock: response.sinStock || 0
        };
      }
    } catch (error) {
      console.error('Error al obtener estado de almacén:', error);
      this.estadoAlmacen = { stockDisponible: 0, stockCritico: 0, sinStock: 0 };
    }
  }

  // Data simulada original (comentada para referencia)
  /*
  async calcularEstadoAlmacen() {
    const idEmpresa = this.empresaSeleccionada?.id || '000010';

    if (idEmpresa === '000010') { // CAO
      this.estadoAlmacen = { stockDisponible: 150, stockCritico: 25, sinStock: 8 };
    } else if (idEmpresa === '000008') { // HP
      this.estadoAlmacen = { stockDisponible: 120, stockCritico: 18, sinStock: 5 };
    } else if (idEmpresa === '000006') { // BH
      this.estadoAlmacen = { stockDisponible: 80, stockCritico: 12, sinStock: 3 };
    }
  }
  */

  async calcularResumenCompras() {
    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        fechaInicio: this.obtenerFechaInicio(),
        fechaFin: this.obtenerFechaFin()
      };

      const response = await this.dashboardLogisticaService.obtenerResumenCompras(payload).toPromise();

      if (response) {
        this.resumenCompras = {
          ordenesEmitidas: response.ordenesEmitidas || 0,
          recepciones: response.recepciones || 0,
          totalCompras: response.totalCompras || 0,
          montoTotal: response.montoTotal || 0
        };
      }
    } catch (error) {
      console.error('Error al obtener resumen de compras:', error);
      this.resumenCompras = { ordenesEmitidas: 0, recepciones: 0, totalCompras: 0, montoTotal: 0 };
    }
  }

  // Data simulada original (comentada para referencia)
  /*
  async calcularResumenCompras() {
    const idEmpresa = this.empresaSeleccionada?.id || '000010';

    if (idEmpresa === '000010') { // CAO
      this.resumenCompras = { ordenesEmitidas: 40, recepciones: 35, totalCompras: 40, montoTotal: 150000 };
    } else if (idEmpresa === '000008') { // HP
      this.resumenCompras = { ordenesEmitidas: 32, recepciones: 28, totalCompras: 32, montoTotal: 120000 };
    } else if (idEmpresa === '000006') { // BH
      this.resumenCompras = { ordenesEmitidas: 20, recepciones: 18, totalCompras: 20, montoTotal: 75000 };
    }
  }
  */

  async obtenerGastosMensuales() {
    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const anio = new Date().getFullYear();
      const payload = {
        idEmpresa: idEmpresa,
        anio: anio
      };

      const response = await this.dashboardLogisticaService.obtenerGastosMensuales(payload).toPromise();

      if (response && response.length > 0) {
        this.gastosMensuales = response;
      } else {
        this.gastosMensuales = [];
      }
    } catch (error) {
      console.error('Error al obtener gastos mensuales:', error);
      this.gastosMensuales = [];
    }
  }

  // Data simulada original (comentada para referencia)
  /*
  async obtenerGastosMensuales() {
    const idEmpresa = this.empresaSeleccionada?.id || '000010';

    if (idEmpresa === '000010') { // CAO
      this.gastosMensuales = [
        { mes: 'Enero', monto: 25000, detalle: [] },
        { mes: 'Febrero', monto: 30000, detalle: [] },
        { mes: 'Marzo', monto: 28000, detalle: [] },
        { mes: 'Abril', monto: 35000, detalle: [] },
        { mes: 'Mayo', monto: 32000, detalle: [] }
      ];
    } else if (idEmpresa === '000008') { // HP
      this.gastosMensuales = [
        { mes: 'Enero', monto: 18000, detalle: [] },
        { mes: 'Febrero', monto: 22000, detalle: [] },
        { mes: 'Marzo', monto: 20000, detalle: [] },
        { mes: 'Abril', monto: 25000, detalle: [] },
        { mes: 'Mayo', monto: 23000, detalle: [] }
      ];
    } else if (idEmpresa === '000006') { // BH
      this.gastosMensuales = [
        { mes: 'Enero', monto: 12000, detalle: [] },
        { mes: 'Febrero', monto: 15000, detalle: [] },
        { mes: 'Marzo', monto: 13000, detalle: [] },
        { mes: 'Abril', monto: 18000, detalle: [] },
        { mes: 'Mayo', monto: 16000, detalle: [] }
      ];
    }
  }
  */

  async cargarDatosTabsHijos() {
    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        pagina: 1,
        registrosPorPagina: 10
      };

      // Llamadas paralelas a los 3 endpoints
      const [ordenes, solicitudes, proveedores] = await Promise.all([
        this.dashboardLogisticaService.obtenerOrdenesCompra(payload).toPromise(),
        this.dashboardLogisticaService.obtenerSolicitudesCompra(payload).toPromise(),
        this.dashboardLogisticaService.obtenerProveedores(payload).toPromise()
      ]);

      this.ordenesCompraList = ordenes || [];
      this.solicitudesCompraList = solicitudes || [];
      this.proveedoresList = proveedores || [];
    } catch (error) {
      console.error('Error al cargar datos de tabs hijos:', error);
      this.ordenesCompraList = [];
      this.solicitudesCompraList = [];
      this.proveedoresList = [];
    }
  }

  // Data simulada original (comentada para referencia)
  /*
  async cargarDatosTabsHijos() {
    const idEmpresa = this.empresaSeleccionada?.id || '000010';

    if (idEmpresa === '000010') { // CAO
      this.ordenesCompraList = [
        { numero: 'OC-CAO-001', proveedor: 'Proveedor A', fecha: '15/04/2026', monto: 15000, estado: 'Aprobada' },
        { numero: 'OC-CAO-002', proveedor: 'Proveedor B', fecha: '18/04/2026', monto: 8500, estado: 'En Tránsito' },
        { numero: 'OC-CAO-003', proveedor: 'Proveedor C', fecha: '20/04/2026', monto: 12000, estado: 'Pendiente' },
        { numero: 'OC-CAO-004', proveedor: 'Proveedor D', fecha: '22/04/2026', monto: 6800, estado: 'Recibida' },
        { numero: 'OC-CAO-005', proveedor: 'Proveedor E', fecha: '23/04/2026', monto: 9500, estado: 'Aprobada' }
      ];

      this.solicitudesCompraList = [
        { numero: 'SC-CAO-001', solicitante: 'Juan Pérez', fecha: '10/04/2026', monto: 5000, estado: 'Consolidado' },
        { numero: 'SC-CAO-002', solicitante: 'María García', fecha: '12/04/2026', monto: 3500, estado: 'Pendiente' },
        { numero: 'SC-CAO-003', solicitante: 'Carlos López', fecha: '15/04/2026', monto: 7200, estado: 'Aprobado' },
        { numero: 'SC-CAO-004', solicitante: 'Ana Martínez', fecha: '18/04/2026', monto: 4100, estado: 'Pendiente' },
        { numero: 'SC-CAO-005', solicitante: 'Pedro Sánchez', fecha: '20/04/2026', monto: 6300, estado: 'Consolidado' }
      ];

      this.proveedoresList = [
        { ruc: '20123456789', razonSocial: 'Proveedor A S.A.C.', categoria: 'Materiales', estado: 'Activo', calificacion: 5 },
        { ruc: '20987654321', razonSocial: 'Proveedor B S.A.C.', categoria: 'Servicios', estado: 'Activo', calificacion: 4 },
        { ruc: '20555555555', razonSocial: 'Proveedor C S.A.C.', categoria: 'Materiales', estado: 'Inactivo', calificacion: 3 },
        { ruc: '20333333333', razonSocial: 'Proveedor D S.A.C.', categoria: 'Servicios', estado: 'Activo', calificacion: 5 },
        { ruc: '20777777777', razonSocial: 'Proveedor E S.A.C.', categoria: 'Materiales', estado: 'Activo', calificacion: 4 }
      ];
    } else if (idEmpresa === '000008') { // HP
      this.ordenesCompraList = [
        { numero: 'OC-HP-001', proveedor: 'Proveedor F', fecha: '16/04/2026', monto: 12000, estado: 'Aprobada' },
        { numero: 'OC-HP-002', proveedor: 'Proveedor G', fecha: '19/04/2026', monto: 7000, estado: 'En Tránsito' },
        { numero: 'OC-HP-003', proveedor: 'Proveedor H', fecha: '21/04/2026', monto: 9500, estado: 'Pendiente' }
      ];

      this.solicitudesCompraList = [
        { numero: 'SC-HP-001', solicitante: 'Luis Ruiz', fecha: '11/04/2026', monto: 4000, estado: 'Consolidado' },
        { numero: 'SC-HP-002', solicitante: 'Carmen Vega', fecha: '13/04/2026', monto: 2800, estado: 'Pendiente' },
        { numero: 'SC-HP-003', solicitante: 'Roberto Diaz', fecha: '16/04/2026', monto: 5500, estado: 'Aprobado' }
      ];

      this.proveedoresList = [
        { ruc: '20111111111', razonSocial: 'Proveedor F S.A.C.', categoria: 'Materiales', estado: 'Activo', calificacion: 4 },
        { ruc: '20222222222', razonSocial: 'Proveedor G S.A.C.', categoria: 'Servicios', estado: 'Activo', calificacion: 5 },
        { ruc: '20344444444', razonSocial: 'Proveedor H S.A.C.', categoria: 'Materiales', estado: 'Activo', calificacion: 4 }
      ];
    } else if (idEmpresa === '000006') { // BH
      this.ordenesCompraList = [
        { numero: 'OC-BH-001', proveedor: 'Proveedor I', fecha: '17/04/2026', monto: 8000, estado: 'Aprobada' },
        { numero: 'OC-BH-002', proveedor: 'Proveedor J', fecha: '20/04/2026', monto: 5000, estado: 'En Tránsito' }
      ];

      this.solicitudesCompraList = [
        { numero: 'SC-BH-001', solicitante: 'Diego Torres', fecha: '12/04/2026', monto: 3000, estado: 'Consolidado' },
        { numero: 'SC-BH-002', solicitante: 'Laura Flores', fecha: '14/04/2026', monto: 2200, estado: 'Pendiente' }
      ];

      this.proveedoresList = [
        { ruc: '20555555555', razonSocial: 'Proveedor I S.A.C.', categoria: 'Materiales', estado: 'Activo', calificacion: 5 },
        { ruc: '20666666666', razonSocial: 'Proveedor J S.A.C.', categoria: 'Servicios', estado: 'Activo', calificacion: 4 }
      ];
    }
  }
  */

  // Acciones rápidas
  nuevaOrdenCompraDirecta() {
    this.router.navigate(['main', 'ordenes-compra']);
  }

  nuevaSolicitudMateriales() {
    // Validar que tenga parámetros configurados antes de navegar
    if (!this.empresaSeleccionada) {
      this.alertService.showAlertError('Error', 'Debe seleccionar una empresa primero');
      return;
    }
    
    // Validar que la empresa tenga parámetros necesarios (almacenes, centros de costo, etc.)
    // Esta validación podría hacerse verificando si hay datos en Dexie o llamando a un servicio
    // Por ahora, navegamos directamente ya que el guard ConfigGuard en la ruta hará la validación
    this.router.navigate(['main', 'requerimientos']);
  }

  nuevaOrdenServicio() {
    this.router.navigate(['main', 'ordenes-servicio']);
  }

  irConsolidarRequerimientos() {
    this.router.navigate(['main', 'consolidacion-requerimientos']);
  }

  irCotizaciones() {
    this.router.navigate(['main', 'cotizaciones']);
  }

  irKardex() {
    this.router.navigate(['main', 'kardex']);
  }

  /**
   * Navega a una ruta desde los accesos directos del menú.
   * @param ruta Ruta de destino (ej: '/main/requerimientos')
   */
  navegarDesdeAccesoDirecto(ruta: string) {
    this.router.navigate([ruta]);
  }

  // Modal de gastos mensuales
  verDetallesGastos(mes: string) {
    const gastosMes = this.gastosMensuales.find(g => g.mes === mes);
    if (gastosMes) {
      this.gastosSeleccionados = gastosMes.detalle;
      this.modalGastosAbierto = true;
    }
  }

  cerrarModalGastos() {
    this.modalGastosAbierto = false;
    this.gastosSeleccionados = [];
  }

  /**
   * Abre el modal con la lista de requerimientos filtrados por estado.
   * Se llama al hacer click en cada tarjeta KPI (Pendientes, Consolidados, Despachados, Aprobados).
   * @param estado Estado del requerimiento: PENDIENTE | CONSOLIDADO | DESPACHADO | APROBADO
   */
  async abrirModalRequerimientos(estado: string) {
    try {
      this.estadoSeleccionadoModal = estado;
      this.tituloModalRequerimientos = `Requerimientos ${this.formatearTituloEstado(estado)}`;
      this.modalRequerimientosAbierto = true;
      this.loadingModalRequerimientos = true;
      this.requerimientosLista = [];
      this.requerimientoExpandido = null;
      this.paginaActualModal = 1;

      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        estado: estado,
        fechaInicio: this.obtenerFechaInicio(),
        fechaFin: this.obtenerFechaFin()
      };

      const response: any = await this.dashboardLogisticaService
        .obtenerRequerimientosPorEstado(payload)
        .toPromise();

      // El SP devuelve un array JSON o null. Parsear detalles si vienen como string.
      const lista = Array.isArray(response) ? response : (response ?? []);
      this.requerimientosLista = lista.map((r: any) => ({
        ...r,
        detalles: typeof r.detalles === 'string' ? JSON.parse(r.detalles) : (r.detalles || [])
      }));
    } catch (error) {
      console.error('Error al obtener requerimientos por estado:', error);
      this.requerimientosLista = [];
      this.alertService.showAlert('Error', 'Error al cargar la lista de requerimientos.', 'error');
    } finally {
      this.loadingModalRequerimientos = false;
    }
  }

  cerrarModalRequerimientos() {
    this.modalRequerimientosAbierto = false;
    this.requerimientosLista = [];
    this.estadoSeleccionadoModal = '';
    this.tituloModalRequerimientos = '';
    this.requerimientoExpandido = null;
    this.paginaActualModal = 1;
  }

  toggleDetalleRequerimiento(idRequerimiento: number) {
    this.requerimientoExpandido = this.requerimientoExpandido === idRequerimiento ? null : idRequerimiento;
  }

  // ===== Paginación del modal de requerimientos =====
  get totalPaginasModal(): number {
    return Math.max(1, Math.ceil(this.requerimientosLista.length / this.itemsPorPaginaModal));
  }

  get requerimientosPaginados(): any[] {
    const start = (this.paginaActualModal - 1) * this.itemsPorPaginaModal;
    return this.requerimientosLista.slice(start, start + this.itemsPorPaginaModal);
  }

  get rangoVisibleModal(): { desde: number; hasta: number } {
    const total = this.requerimientosLista.length;
    if (total === 0) return { desde: 0, hasta: 0 };
    const desde = (this.paginaActualModal - 1) * this.itemsPorPaginaModal + 1;
    const hasta = Math.min(this.paginaActualModal * this.itemsPorPaginaModal, total);
    return { desde, hasta };
  }

  irAPaginaModal(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginasModal) return;
    this.paginaActualModal = pagina;
    this.requerimientoExpandido = null;
  }

  /** Devuelve los números de página a mostrar (máx. 5 visibles, con la actual centrada). */
  get paginasVisiblesModal(): number[] {
    const total = this.totalPaginasModal;
    const actual = this.paginaActualModal;
    const ventana = 5;
    let start = Math.max(1, actual - Math.floor(ventana / 2));
    let end = Math.min(total, start + ventana - 1);
    if (end - start + 1 < ventana) start = Math.max(1, end - ventana + 1);
    const paginas: number[] = [];
    for (let i = start; i <= end; i++) paginas.push(i);
    return paginas;
  }

  private formatearTituloEstado(estado: string): string {
    const mapa: { [key: string]: string } = {
      PENDIENTE: 'Pendientes',
      CONSOLIDADO: 'Consolidados',
      DESPACHADO: 'Despachados',
      APROBADO: 'Aprobados'
    };
    return mapa[estado] || estado;
  }

  // Navegación interna de tabs hijos
  onTabChange(event: any) {
    const tabIndex = event.index;
    this.activeTab = tabIndex;
  }

  // Utilidades
  formatearMoneda(monto: number): string {
    return `S/ ${monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  obtenerFechaInicio(): string {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 6);
    return fecha.toISOString().split('T')[0];
  }

  obtenerFechaFin(): string {
    return new Date().toISOString().split('T')[0];
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      'Pendiente': 'badge-estado estado-pendiente',
      'Aprobada': 'badge-estado estado-confirmado',
      'En Tránsito': 'badge-estado estado-enprogreso',
      'Recibida': 'badge-estado estado-confirmado',
      'stockDisponible': 'badge-estado estado-confirmado',
      'stockCritico': 'badge-estado estado-advertencia',
      'sinStock': 'badge-estado estado-peligro',
      // Estados de requerimientos
      'PENDIENTE': 'badge-estado estado-pendiente',
      'CONSOLIDADO': 'badge-estado estado-confirmado',
      'DESPACHADO': 'badge-estado estado-primario',
      'APROBADO': 'badge-estado estado-advertencia',
      'RECHAZADO': 'badge-estado estado-inactivo',
      'ANULADO': 'badge-estado estado-inactivo'
    };
    return clases[estado] || 'badge-estado estado-inactivo';
  }

  /**
   * Suma total de ítems entre todos los requerimientos del modal.
   */
  getTotalItemsRequerimientos(): number {
    return this.requerimientosLista.reduce(
      (acc, r) => acc + (Number(r.totalItems) || 0),
      0
    );
  }

  // ==================== MÉTODOS DE REPORTES ====================

  /**
   * Abre el modal del reporte de compras
   */
  async abrirReporteCompras() {
    this.modalReporteComprasAbierto = true;
    this.loadingReporte = true;
    this.reporteComprasData = null;

    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        fechaInicio: this.obtenerFechaInicio(),
        fechaFin: this.obtenerFechaFin()
      };

      const response: any = await this.dashboardLogisticaService.obtenerReporteCompras(payload).toPromise();
      this.reporteComprasData = response;
    } catch (error) {
      console.error('Error al obtener reporte de compras:', error);
      this.alertService.showAlert('Error', 'Error al cargar el reporte de compras.', 'error');
    } finally {
      this.loadingReporte = false;
    }
  }

  cerrarReporteCompras() {
    this.modalReporteComprasAbierto = false;
    this.reporteComprasData = null;
  }

  /**
   * Abre el modal del reporte de inventario
   */
  async abrirReporteInventario() {
    this.modalReporteInventarioAbierto = true;
    this.loadingReporte = true;
    this.reporteInventarioData = null;

    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        idAlmacen: null
      };

      const response: any = await this.dashboardLogisticaService.obtenerReporteInventario(payload).toPromise();
      this.reporteInventarioData = response;
    } catch (error) {
      console.error('Error al obtener reporte de inventario:', error);
      this.alertService.showAlert('Error', 'Error al cargar el reporte de inventario.', 'error');
    } finally {
      this.loadingReporte = false;
    }
  }

  cerrarReporteInventario() {
    this.modalReporteInventarioAbierto = false;
    this.reporteInventarioData = null;
  }

  /**
   * Abre el modal del reporte de proveedores
   */
  async abrirReporteProveedores() {
    this.modalReporteProveedoresAbierto = true;
    this.loadingReporte = true;
    this.reporteProveedoresData = [];

    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        fechaInicio: this.obtenerFechaInicio(),
        fechaFin: this.obtenerFechaFin()
      };

      const response: any = await this.dashboardLogisticaService.obtenerReporteProveedores(payload).toPromise();
      this.reporteProveedoresData = Array.isArray(response) ? response : (response || []);
    } catch (error) {
      console.error('Error al obtener reporte de proveedores:', error);
      this.alertService.showAlert('Error', 'Error al cargar el reporte de proveedores.', 'error');
    } finally {
      this.loadingReporte = false;
    }
  }

  cerrarReporteProveedores() {
    this.modalReporteProveedoresAbierto = false;
    this.reporteProveedoresData = [];
  }

  /**
   * Abre el modal del reporte de tiempos
   */
  async abrirReporteTiempos() {
    this.modalReporteTiemposAbierto = true;
    this.loadingReporte = true;
    this.reporteTiemposData = null;

    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        fechaInicio: this.obtenerFechaInicio(),
        fechaFin: this.obtenerFechaFin()
      };

      const response: any = await this.dashboardLogisticaService.obtenerReporteTiempos(payload).toPromise();
      this.reporteTiemposData = response;
    } catch (error) {
      console.error('Error al obtener reporte de tiempos:', error);
      this.alertService.showAlert('Error', 'Error al cargar el reporte de tiempos.', 'error');
    } finally {
      this.loadingReporte = false;
    }
  }

  cerrarReporteTiempos() {
    this.modalReporteTiemposAbierto = false;
    this.reporteTiemposData = null;
  }

  /**
   * Abre el modal del reporte de gastos
   */
  async abrirReporteGastos() {
    this.modalReporteGastosAbierto = true;
    this.loadingReporte = true;
    this.reporteGastosData = [];

    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const anio = new Date().getFullYear();
      const payload = {
        idEmpresa: idEmpresa,
        anio: anio
      };

      const response: any = await this.dashboardLogisticaService.obtenerReporteGastos(payload).toPromise();
      this.reporteGastosData = Array.isArray(response) ? response : (response || []);
    } catch (error) {
      console.error('Error al obtener reporte de gastos:', error);
      this.alertService.showAlert('Error', 'Error al cargar el reporte de gastos.', 'error');
    } finally {
      this.loadingReporte = false;
    }
  }

  cerrarReporteGastos() {
    this.modalReporteGastosAbierto = false;
    this.reporteGastosData = [];
  }

  /**
   * Abre el modal del reporte consolidado
   */
  async abrirReporteConsolidado() {
    this.modalReporteConsolidadoAbierto = true;
    this.loadingReporte = true;
    this.reporteConsolidadoData = null;

    try {
      const idEmpresa = this.empresaSeleccionada?.id || '000010';
      const payload = {
        idEmpresa: idEmpresa,
        fechaInicio: this.obtenerFechaInicio(),
        fechaFin: this.obtenerFechaFin()
      };

      const response: any = await this.dashboardLogisticaService.obtenerReporteConsolidado(payload).toPromise();
      this.reporteConsolidadoData = response;
    } catch (error) {
      console.error('Error al obtener reporte consolidado:', error);
      this.alertService.showAlert('Error', 'Error al cargar el reporte consolidado.', 'error');
    } finally {
      this.loadingReporte = false;
    }
  }

  cerrarReporteConsolidado() {
    this.modalReporteConsolidadoAbierto = false;
    this.reporteConsolidadoData = null;
  }
}
