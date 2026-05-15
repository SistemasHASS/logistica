import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { DespachosService } from '@/app/modules/main/services/despachos.service';

interface KpiData {
  label: string;
  value: number;
  icon: string;
  color: string;
  route?: string;
}

interface DespachoResumen {
  id: number;
  numeroRequerimiento: string;
  area: string;
  fundo: string;
  fechaDespacho: string;
  cantidadItems: number;
  estado: string;
}

@Component({
  selector: 'app-dashboard-despacho',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    ChartModule,
    DialogModule,
    TooltipModule
  ],
  templateUrl: './dashboard-despacho.component.html',
  styleUrls: ['./dashboard-despacho.component.scss']
})
export class DashboardDespachoComponent implements OnInit {
  router = inject(Router);
  private dexieService = inject(DexieService);
  private alertService = inject(AlertService);
  private despachosService = inject(DespachosService);

  // Usuario actual
  usuario: any = null;

  // KPIs
  kpis: KpiData[] = [];

  // Datos para gráficos
  despachosPorMes: any[] = [];
  chartData: any;
  chartOptions: any;

  // Últimos despachos
  ultimosDespachos: DespachoResumen[] = [];
  loadingDespachos = false;

  // Filtros de fecha
  fechaInicio: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  fechaFin: Date = new Date();

  // Modal de KPI
  modalKpiVisible = false;
  modalKpiTitulo = '';
  modalKpiData: DespachoResumen[] = [];
  loadingModalKpi = false;

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarKpis();
    this.cargarGraficoDespachos();
    this.cargarUltimosDespachos();
  }

  private async cargarUsuario(): Promise<void> {
    try {
      this.usuario = await this.dexieService.getUsuarioLogueado();
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  }

  private cargarKpis(): void {
    // KPIs estáticos por ahora - pueden conectarse a servicios reales
    this.kpis = [
      {
        label: 'Despachos Hoy',
        value: 12,
        icon: 'bx bx-package',
        color: 'primary',
        route: './despachos'
      },
      {
        label: 'Pendientes',
        value: 8,
        icon: 'bx bx-time',
        color: 'warning',
        route: './despachos'
      },
      {
        label: 'Completados',
        value: 145,
        icon: 'bx bx-check-circle',
        color: 'success',
        route: './reporte-despachos'
      },
      {
        label: 'Devoluciones',
        value: 3,
        icon: 'bx bx-undo',
        color: 'danger',
        route: './devoluciones-consumo'
      }
    ];
  }

  private cargarGraficoDespachos(): void {
    // Datos de ejemplo para el gráfico
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');

    this.chartData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Despachos',
          data: [65, 59, 80, 81, 56, 55],
          fill: false,
          borderColor: documentStyle.getPropertyValue('--blue-500'),
          tension: 0.4
        },
        {
          label: 'Devoluciones',
          data: [28, 48, 40, 19, 86, 27],
          fill: false,
          borderColor: documentStyle.getPropertyValue('--red-500'),
          tension: 0.4
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: documentStyle.getPropertyValue('--surface-border'),
            drawBorder: false
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: documentStyle.getPropertyValue('--surface-border'),
            drawBorder: false
          }
        }
      }
    };
  }

  private cargarUltimosDespachos(): void {
    this.loadingDespachos = true;

    // Datos de ejemplo - reemplazar con llamada real al servicio
    setTimeout(() => {
      this.ultimosDespachos = [
        {
          id: 1,
          numeroRequerimiento: 'REQ-2024-001',
          area: 'Almacén Central',
          fundo: 'CAO',
          fechaDespacho: '2024-06-15',
          cantidadItems: 5,
          estado: 'COMPLETADO'
        },
        {
          id: 2,
          numeroRequerimiento: 'REQ-2024-002',
          area: 'Producción',
          fundo: 'HP',
          fechaDespacho: '2024-06-14',
          cantidadItems: 3,
          estado: 'PENDIENTE'
        },
        {
          id: 3,
          numeroRequerimiento: 'REQ-2024-003',
          area: 'Mantenimiento',
          fundo: 'BH',
          fechaDespacho: '2024-06-14',
          cantidadItems: 8,
          estado: 'COMPLETADO'
        },
        {
          id: 4,
          numeroRequerimiento: 'REQ-2024-004',
          area: 'Almacén Central',
          fundo: 'CAO',
          fechaDespacho: '2024-06-13',
          cantidadItems: 2,
          estado: 'PARCIAL'
        },
        {
          id: 5,
          numeroRequerimiento: 'REQ-2024-005',
          area: 'Producción',
          fundo: 'HP',
          fechaDespacho: '2024-06-12',
          cantidadItems: 6,
          estado: 'COMPLETADO'
        }
      ];
      this.loadingDespachos = false;
    }, 500);
  }

  navegarAKpi(route: string | undefined): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  verDetalleDespacho(despacho: DespachoResumen): void {
    // Cerrar el modal primero si está abierto
    this.modalKpiVisible = false;

    // Navegar a la página de despachos (ruta absoluta desde /main/)
    this.router.navigate(['/main/despachos'], {
      queryParams: { id: despacho.id, req: despacho.numeroRequerimiento }
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'COMPLETADO':
        return 'badge-estado estado-confirmado';
      case 'PENDIENTE':
        return 'badge-estado estado-pendiente';
      case 'PARCIAL':
        return 'badge-estado estado-parcial';
      default:
        return 'badge-estado estado-inactivo';
    }
  }

  abrirModalKpi(kpi: KpiData): void {
    this.modalKpiTitulo = kpi.label;
    this.modalKpiVisible = true;
    this.loadingModalKpi = true;

    // Simular carga de datos según el tipo de KPI
    setTimeout(() => {
      this.modalKpiData = this.generarDataParaKpi(kpi.label);
      this.loadingModalKpi = false;
    }, 500);
  }

  private generarDataParaKpi(tipoKpi: string): DespachoResumen[] {
    // Generar data de ejemplo según el tipo de KPI
    const baseData = [
      { id: 101, numeroRequerimiento: 'REQ-2024-101', area: 'Almacén Central', fundo: 'CAO', fechaDespacho: '2024-06-15', cantidadItems: 5, estado: 'COMPLETADO' },
      { id: 102, numeroRequerimiento: 'REQ-2024-102', area: 'Producción', fundo: 'HP', fechaDespacho: '2024-06-14', cantidadItems: 3, estado: 'PENDIENTE' },
      { id: 103, numeroRequerimiento: 'REQ-2024-103', area: 'Mantenimiento', fundo: 'BH', fechaDespacho: '2024-06-14', cantidadItems: 8, estado: 'COMPLETADO' },
      { id: 104, numeroRequerimiento: 'REQ-2024-104', area: 'Almacén Central', fundo: 'CAO', fechaDespacho: '2024-06-13', cantidadItems: 2, estado: 'PARCIAL' },
      { id: 105, numeroRequerimiento: 'REQ-2024-105', area: 'Producción', fundo: 'HP', fechaDespacho: '2024-06-12', cantidadItems: 6, estado: 'COMPLETADO' },
    ];

    // Filtrar según el tipo de KPI
    switch (tipoKpi) {
      case 'Despachos Hoy':
        return baseData.filter(d => d.fechaDespacho === '2024-06-15');
      case 'Pendientes':
        return baseData.filter(d => d.estado === 'PENDIENTE');
      case 'Completados':
        return baseData.filter(d => d.estado === 'COMPLETADO');
      case 'Devoluciones':
        return baseData.slice(0, 3);
      default:
        return baseData;
    }
  }

  cerrarModalKpi(): void {
    this.modalKpiVisible = false;
    this.modalKpiData = [];
  }
}
