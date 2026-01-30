import { AlertService } from '@/app/shared/alertas/alerts.service';
import { Component, OnInit } from '@angular/core';
import { DespachosService } from '@/app/modules/main/services/despachos.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-reporte-despachos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    DatePickerModule,
    DialogModule,
  ],
  templateUrl: './reporte-despachos.component.html',
  styleUrls: ['./reporte-despachos.component.scss'],
})
export class ReporteDespachosComponent implements OnInit {
  despachos: any[] = [];
  despachosFiltrados: any[] = [];
  filtroNS: string = '';
  filtroRequisicion: string = '';
  fechaInicio?: Date;
  fechaFin?: Date;
  loading: boolean = false;

  // Modal detalle
  displayDetalle: boolean = false;
  despachoSeleccionado: any = null;
  detalleDespacho: any[] = [];

  constructor(
    private despachosService: DespachosService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.listarDespachos();
  }

  listarDespachos() {
    this.loading = true;
    this.despachosService.listarDespachosRealizados([{}]).subscribe({
      next: (data: any) => {
        // this.despachos = Array.isArray(data) ? data : [];
        // this.despachos = data?.resultado || [];
        // this.despachos = data?.id ? JSON.parse(data.id) : [];
        if (Array.isArray(data)) {
          // Caso A: backend ya devolvió array
          this.despachos = data;
        } else if (data?.id) {
          // Caso B: viene string JSON desde SQL
          this.despachos = JSON.parse(data.id);
        } else {
          this.despachos = [];
        }
        this.aplicarFiltro();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.alertService.showAlertError(
          'Error',
          'Error al cargar reporte de despachos',
        );
      },
    });
  }

  aplicarFiltro() {
    this.despachosFiltrados = this.despachos.filter((x) => {
      const matchNS =
        !this.filtroNS ||
        (x.numeroNS || '').toLowerCase().includes(this.filtroNS.toLowerCase());
      const matchRequisicion =
        !this.filtroRequisicion ||
        (x.numeroRequisicion || '')
          .toLowerCase()
          .includes(this.filtroRequisicion.toLowerCase());

      let matchFecha = true;
      if (this.fechaInicio || this.fechaFin) {
        const fecha = new Date(x.fechaDespacho);
        if (this.fechaInicio && fecha < this.fechaInicio) matchFecha = false;
        if (this.fechaFin && fecha > this.fechaFin) matchFecha = false;
      }

      return matchNS && matchRequisicion && matchFecha;
    });
  }

  limpiarFiltros() {
    this.filtroNS = '';
    this.filtroRequisicion = '';
    this.fechaInicio = undefined;
    this.fechaFin = undefined;
    this.aplicarFiltro();
  }

  verDetalle(despacho: any) {
    this.despachoSeleccionado = despacho;
    this.detalleDespacho = despacho.detalle || [];
    this.displayDetalle = true;
  }

  cerrarDetalle() {
    this.displayDetalle = false;
    this.despachoSeleccionado = null;
    this.detalleDespacho = [];
  }

  getEstadoClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'DESPACHADO':
      case 'COMPLETO':
        return 'bg-success';
      case 'PARCIAL':
      case 'ATENCION_PARCIAL':
        return 'bg-warning text-dark';
      case 'PENDIENTE':
        return 'bg-secondary';
      case 'ANULADO':
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  }
}
