import { Component, OnInit } from '@angular/core';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-reporte-aprobados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TableModule],
  templateUrl: './reporte-aprobados.component.html',
  styleUrls: ['./reporte-aprobados.component.scss'],
})
export class ReporteAprobadosComponent implements OnInit {
  aprobados: any[] = [];
  rechazados: any[] = [];

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
        this.aprobados = resp.aprobados || [];
        this.ordenarRequerimientoAprobados();
        this.rechazados = resp.rechazados || [];
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
}
