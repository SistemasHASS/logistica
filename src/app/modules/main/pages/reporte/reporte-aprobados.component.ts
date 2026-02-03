import { Component, OnInit } from '@angular/core';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-reporte-aprobados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TableModule, DialogModule],
  templateUrl: './reporte-aprobados.component.html',
  styleUrls: ['./reporte-aprobados.component.scss'],
})
export class ReporteAprobadosComponent implements OnInit {
  aprobados: any[] = [];
  rechazados: any[] = [];
  aprobadosOriginal: any[] = [];
  rechazadosOriginal: any[] = [];

  // Filtros
  filtroNombre: string = '';
  filtroDocumento: string = '';

  // Modal detalle
  displayDetalle: boolean = false;
  requerimientoSeleccionado: any = null;
  detalleRequerimiento: any[] = [];
  loadingDetalle: boolean = false;

  constructor(
    private requerimientoService: RequerimientosService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.cargarReporte();
  }

  async cargarReporte() {
    const requerimmientos = this.requerimientoService
      .getReporteAprobarRequerimiento([{}])
      .subscribe(async (resp) => {
        // if (resp?.[0]?.errorgeneral === 0) {
        this.aprobadosOriginal = resp.aprobados || [];
        this.rechazadosOriginal = resp.rechazados || [];
        this.aprobados = [...this.aprobadosOriginal];
        this.rechazados = [...this.rechazadosOriginal];
        this.ordenarRequerimientoAprobados();
        this.ordenarRequerimientoRechazados();
        // }
      });
  }

  ordenarRequerimientoAprobados() {
    this.aprobados.sort((a, b) => {
      // 1️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  ordenarRequerimientoRechazados() {
    this.rechazados.sort((a, b) => {
      // 1️⃣ Fecha más reciente primero
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }

  obtenerIdReq(idReq: string): string {
    if (!idReq) return '';
    return idReq.slice(-12); // YYMMDDhhmmss
  }

  verDetalle(row: any) {
    this.requerimientoSeleccionado = row;
    this.loadingDetalle = true;
    this.displayDetalle = true;

    this.requerimientoService.listarDetalleRequerimiento(row.idrequerimiento).subscribe({
      next: (data: any) => {
        this.detalleRequerimiento = Array.isArray(data) ? data : [];
        this.loadingDetalle = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.detalleRequerimiento = [];
        this.loadingDetalle = false;
        this.alertService.showAlertError('Error', 'Error al cargar detalle del requerimiento');
      }
    });
  }

  cerrarDetalle() {
    this.displayDetalle = false;
    this.requerimientoSeleccionado = null;
    this.detalleRequerimiento = [];
  }

  filtrar() {
    const nombre = this.filtroNombre.toLowerCase().trim();
    const documento = this.filtroDocumento.toLowerCase().trim();

    this.aprobados = this.aprobadosOriginal.filter(item => {
      const matchNombre = !nombre || (item.nombreCreador?.toLowerCase().includes(nombre));
      const matchDocumento = !documento || (item.nrodocumento?.toLowerCase().includes(documento));
      return matchNombre && matchDocumento;
    });

    this.rechazados = this.rechazadosOriginal.filter(item => {
      const matchNombre = !nombre || (item.nombreCreador?.toLowerCase().includes(nombre));
      const matchDocumento = !documento || (item.nrodocumento?.toLowerCase().includes(documento));
      return matchNombre && matchDocumento;
    });
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroDocumento = '';
    this.aprobados = [...this.aprobadosOriginal];
    this.rechazados = [...this.rechazadosOriginal];
  }
}
