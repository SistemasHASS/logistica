import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

interface ResumenAprobaciones {
  // Pendientes por tipo
  pendientesConsumo: number;
  pendientesCompra: number;
  totalPendientes: number;

  // Aprobados por tipo
  aprobadosConsumo: number;
  aprobadosCompra: number;
  totalAprobados: number;

  // Rechazados por tipo
  rechazadosConsumo: number;
  rechazadosCompra: number;
  totalRechazados: number;

  // Totales
  totalRequerimientos: number;
}

@Component({
  selector: 'app-dashboard-aprobaciones-area',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, TableModule, TagModule, ButtonModule, TooltipModule, DialogModule, ProgressBarModule, NumeroRequerimientoPipe],
  templateUrl: './dashboard-aprobaciones-area.component.html',
  styleUrls: ['./dashboard-aprobaciones-area.component.scss']
})
export class DashboardAprobacionesAreaComponent implements OnInit {
  usuario: any = null;
  loading = false;

  resumen: ResumenAprobaciones = {
    pendientesConsumo: 0,
    pendientesCompra: 0,
    totalPendientes: 0,
    aprobadosConsumo: 0,
    aprobadosCompra: 0,
    totalAprobados: 0,
    rechazadosConsumo: 0,
    rechazadosCompra: 0,
    totalRechazados: 0,
    totalRequerimientos: 0
  };

  requerimientosPendientes: any[] = [];
  misAprobaciones: any[] = [];
  filtroTipo: 'TODOS' | 'CONSUMO' | 'COMPRA' = 'TODOS';
  filtroEstado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'TODOS' = 'PENDIENTE';

  modalDetalleAbierto = false;
  requerimientoSeleccionado: any = null;

  // Estados para badges
  readonly estados = [
    { valor: 'PENDIENTE', label: 'Pendiente', clase: 'warning' },
    { valor: 'APROBADO', label: 'Aprobado', clase: 'success' },
    { valor: 'RECHAZADO', label: 'Rechazado', clase: 'danger' },
    { valor: 'ENVIADO', label: 'Enviado', clase: 'info' },
  ];

  constructor(
    private dexieService: DexieService,
    private aprobacionesAreaService: AprobacionesAreaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.usuario = await this.dexieService.showUsuario();
    await this.cargarDashboard();
  }

  async cargarDashboard(): Promise<void> {
    this.loading = true;
    try {
      // Cargar requerimientos pendientes
      await this.cargarRequerimientosPendientes();

      // Cargar mis aprobaciones (reporte)
      await this.cargarMisAprobaciones();

      // Calcular resumen
      this.calcularResumen();

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async cargarRequerimientosPendientes(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.aprobacionesAreaService.obtenerRequerimientosPendientesArea({
          documentoidentidad: this.usuario?.documentoidentidad || this.usuario?.dni || '',
          ruc: this.usuario?.ruc
        })
      );
      this.requerimientosPendientes = response?.resultado || response?.data || [];
    } catch (error) {
      console.error('Error cargando pendientes:', error);
      this.requerimientosPendientes = [];
    }
  }

  async cargarMisAprobaciones(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.aprobacionesAreaService.obtenerReporteAprobacionesArea({
          documentoidentidad: this.usuario?.documentoidentidad || this.usuario?.dni || '',
          ruc: this.usuario?.ruc
        })
      );
      this.misAprobaciones = response?.resultado || response?.data || [];
    } catch (error) {
      console.error('Error cargando aprobaciones:', error);
      this.misAprobaciones = [];
    }
  }

  calcularResumen(): void {
    // Calcular pendientes por tipo
    const pendientesConsumo = this.requerimientosPendientes.filter(
      (r: any) => (r.tipo === 'CONSUMO' || !r.tipo)
    ).length;
    const pendientesCompra = this.requerimientosPendientes.filter(
      (r: any) => r.tipo === 'COMPRA'
    ).length;

    // Calcular aprobados/rechazados por tipo del reporte
    const aprobadosConsumo = this.misAprobaciones.filter(
      (a: any) => a.accion === 'APROBADO' && (a.tipo === 'CONSUMO' || !a.tipo)
    ).length;
    const aprobadosCompra = this.misAprobaciones.filter(
      (a: any) => a.accion === 'APROBADO' && a.tipo === 'COMPRA'
    ).length;

    const rechazadosConsumo = this.misAprobaciones.filter(
      (a: any) => a.accion === 'RECHAZADO' && (a.tipo === 'CONSUMO' || !a.tipo)
    ).length;
    const rechazadosCompra = this.misAprobaciones.filter(
      (a: any) => a.accion === 'RECHAZADO' && a.tipo === 'COMPRA'
    ).length;

    this.resumen = {
      pendientesConsumo,
      pendientesCompra,
      totalPendientes: pendientesConsumo + pendientesCompra,
      aprobadosConsumo,
      aprobadosCompra,
      totalAprobados: aprobadosConsumo + aprobadosCompra,
      rechazadosConsumo,
      rechazadosCompra,
      totalRechazados: rechazadosConsumo + rechazadosCompra,
      totalRequerimientos: this.requerimientosPendientes.length + this.misAprobaciones.length
    };
  }

  // Filtros computados
  get requerimientosFiltrados(): any[] {
    let filtrados = this.requerimientosPendientes;

    if (this.filtroTipo !== 'TODOS') {
      filtrados = filtrados.filter(r => r.tipo === this.filtroTipo);
    }

    return filtrados;
  }

  get misAprobacionesFiltradas(): any[] {
    let filtrados = this.misAprobaciones;

    if (this.filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(r => r.estadoAprobacion === this.filtroEstado);
    }

    if (this.filtroTipo !== 'TODOS') {
      filtrados = filtrados.filter(r => r.tipo === this.filtroTipo);
    }

    return filtrados;
  }

  // Calcular porcentajes para barras de progreso
  get porcentajePendientesConsumo(): number {
    return this.resumen.totalPendientes > 0
      ? Math.round((this.resumen.pendientesConsumo / this.resumen.totalPendientes) * 100)
      : 0;
  }

  get porcentajePendientesCompra(): number {
    return this.resumen.totalPendientes > 0
      ? Math.round((this.resumen.pendientesCompra / this.resumen.totalPendientes) * 100)
      : 0;
  }

  get porcentajeAprobadosConsumo(): number {
    return this.resumen.totalAprobados > 0
      ? Math.round((this.resumen.aprobadosConsumo / this.resumen.totalAprobados) * 100)
      : 0;
  }

  get porcentajeAprobadosCompra(): number {
    return this.resumen.totalAprobados > 0
      ? Math.round((this.resumen.aprobadosCompra / this.resumen.totalAprobados) * 100)
      : 0;
  }

  // Navegación
  irAAprobaciones(): void {
    this.router.navigate(['/main/aprobaciones-area']);
  }

  verDetalle(req: any): void {
    this.requerimientoSeleccionado = req;
    this.modalDetalleAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    this.modalDetalleAbierto = false;
    this.requerimientoSeleccionado = null;
    this.cdr.markForCheck();
  }

  setFiltroTipo(tipo: 'TODOS' | 'CONSUMO' | 'COMPRA'): void {
    this.filtroTipo = tipo;
    this.cdr.markForCheck();
  }

  setFiltroEstado(estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'TODOS'): void {
    this.filtroEstado = estado;
    this.cdr.markForCheck();
  }

  refresh(): void {
    this.cargarDashboard();
  }
}
