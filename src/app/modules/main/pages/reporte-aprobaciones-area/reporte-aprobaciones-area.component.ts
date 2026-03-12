import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { AprobacionesAreaService } from '@/app/modules/main/services/aprobaciones-area.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reporte-aprobaciones-area',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    InputTextModule,
    DialogModule
  ],
  templateUrl: './reporte-aprobaciones-area.component.html',
  styleUrl: './reporte-aprobaciones-area.component.scss'
})
export class ReporteAprobacionesAreaComponent implements OnInit {
  usuario: any;
  aprobaciones: any[] = [];
  loading = false;
  
  // Filtros
  fechaInicio: string = '';
  fechaFin: string = '';
  
  // Estadísticas
  totalAprobados = 0;
  totalRechazados = 0;
  totalPendientes = 0;
  
  // Modal de detalle
  mostrarModalDetalle = false;
  requerimientoDetalle: any = null;

  constructor(
    private aprobacionesAreaService: AprobacionesAreaService,
    private dexieService: DexieService
  ) {}

  async ngOnInit() {
    this.usuario = await this.dexieService.showUsuario();
    
    if (!this.usuario) {
      Swal.fire('Error', 'No se encontró información del usuario', 'error');
      return;
    }
    
    // Cargar datos del último mes por defecto
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
    this.fechaFin = this.formatFechaInput(hoy);
    this.fechaInicio = this.formatFechaInput(hace30Dias);
    
    this.cargarReporte();
  }

  cargarReporte() {
    if (!this.usuario) return;
    
    this.loading = true;
    this.aprobaciones = [];
    
    const data = {
      documentoidentidad: this.usuario.documentoidentidad,
      ruc: '20481121966',
      fechaInicio: this.fechaInicio || undefined,
      fechaFin: this.fechaFin || undefined
    };
    
    this.aprobacionesAreaService
      .obtenerReporteAprobacionesArea(data)
      .subscribe({
        next: (response) => {
          console.log('📊 Respuesta del reporte:', response);
          
          if (Array.isArray(response)) {
            this.aprobaciones = response;
          } else if (response && typeof response === 'object' && 'resultado' in response) {
            this.aprobaciones = response.resultado || [];
          } else {
            this.aprobaciones = [];
          }
          
          this.calcularEstadisticas();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar reporte:', error);
          this.aprobaciones = [];
          this.loading = false;
          if (error.status !== 500) {
            Swal.fire('Error', 'Error al cargar el reporte', 'error');
          }
        }
      });
  }

  calcularEstadisticas() {
    this.totalAprobados = this.aprobaciones.filter(a => a.estado === 'APROBADO').length;
    this.totalRechazados = this.aprobaciones.filter(a => a.estado === 'RECHAZADO').length;
    this.totalPendientes = this.aprobaciones.filter(a => a.estado === 'PENDIENTE').length;
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE');
  }

  formatFechaInput(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getEstadoBadge(estado: string): { severity: 'success' | 'danger' | 'warn' | 'info', label: string } {
    switch (estado?.toUpperCase()) {
      case 'APROBADO':
        return { severity: 'success', label: 'APROBADO' };
      case 'RECHAZADO':
        return { severity: 'danger', label: 'RECHAZADO' };
      case 'PENDIENTE':
        return { severity: 'warn', label: 'PENDIENTE' };
      default:
        return { severity: 'info', label: estado || 'N/A' };
    }
  }

  verDetalle(aprobacion: any) {
    this.requerimientoDetalle = aprobacion;
    this.mostrarModalDetalle = true;
  }

  getDetalleItems(requerimiento: any): any[] {
    try {
      // Si el detalle es un string JSON, parsearlo
      if (typeof requerimiento['detalles'] === 'string') {
        return JSON.parse(requerimiento['detalles']);
      }
      // Si ya es un array, devolverlo directamente
      else if (Array.isArray(requerimiento['detalles'])) {
        return requerimiento['detalles'];
      }
      // Si no hay detalle, devolver array vacío
      return [];
    } catch (error) {
      console.error('Error parseando detalle:', error);
      return [];
    }
  }

  exportarExcel() {
    // TODO: Implementar exportación a Excel
    Swal.fire('Información', 'Función de exportación en desarrollo', 'info');
  }

  limpiarFiltros() {
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
    this.fechaFin = this.formatFechaInput(hoy);
    this.fechaInicio = this.formatFechaInput(hace30Dias);
    this.cargarReporte();
  }
}
