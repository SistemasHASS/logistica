import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reportes-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes-dashboard.component.html',
  styleUrls: ['./reportes-dashboard.component.scss']
})
export class ReportesDashboardComponent {

  reportes = [
    {
      id: 1,
      titulo: 'Reporte de Requerimientos',
      descripcion: 'Reporte detallado de todos los requerimientos del sistema',
      icono: 'icon-file-text',
      ruta: '/main/reporte-requerimientos',
      color: '#3f51b5'
    },
    {
      id: 2,
      titulo: 'Reporte Logístico',
      descripcion: 'Análisis completo de operaciones logísticas',
      icono: 'icon-truck',
      ruta: '/main/reporte_logistico',
      color: '#4caf50'
    },
    {
      id: 3,
      titulo: 'Reporte de Aprobados',
      descripcion: 'Listado de requerimientos aprobados',
      icono: 'icon-check-circle',
      ruta: '/main/reporte/aprobados',
      color: '#2196f3'
    },
    {
      id: 4,
      titulo: 'Reporte de Saldos',
      descripcion: 'Estado de saldos y disponibilidad',
      icono: 'icon-dollar-sign',
      ruta: '/main/reporte/saldos',
      color: '#ff9800'
    },
    {
      id: 5,
      titulo: 'Reporte de Despachos',
      descripcion: 'Historial y estado de despachos',
      icono: 'icon-package',
      ruta: '/main/despachos',
      color: '#9c27b0'
    },
    {
      id: 6,
      titulo: 'Reporte de Stock',
      descripcion: 'Inventario y listas de stock',
      icono: 'icon-database',
      ruta: '/main/listas-stock',
      color: '#f44336'
    }
  ];

  constructor(private router: Router) {}

  navegarReporte(ruta: string) {
    console.log('Navegando a:', ruta);
    this.router.navigate([ruta]);
  }

  exportarPDF(reporte: any) {
    console.log('Exportando PDF:', reporte.titulo);
  }

  exportarExcel(reporte: any) {
    console.log('Exportando Excel:', reporte.titulo);
  }
}
