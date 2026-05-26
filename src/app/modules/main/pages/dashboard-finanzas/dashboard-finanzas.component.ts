import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AprobacionOCService } from '@/app/services/aprobacion-oc.service';
import { AprobacionOSService } from '@/app/services/aprobacion-os.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

interface ContadoresOC {
  pendientes?: number;
  aprobadas?: number;
  rechazadas?: number;
  total?: number;
}

interface ContadoresOS {
  pendientes?: number;
  aprobadas?: number;
  rechazadas?: number;
  total?: number;
}

@Component({
  selector: 'app-dashboard-finanzas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-finanzas.component.html',
  styleUrl: './dashboard-finanzas.component.scss'
})
export class DashboardFinanzasComponent implements OnInit {
  usuario: any = {};
  contadoresOC: ContadoresOC = {};
  contadoresOS: ContadoresOS = {};
  cargando = false;

  constructor(
    private aprobacionOCService: AprobacionOCService,
    private aprobacionOSService: AprobacionOSService,
    private dexieService: DexieService,
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarContadores();
  }

  async cargarUsuario() {
    const usuarioGuardado = await this.dexieService.obtenerPrimerUsuario();
    if (usuarioGuardado) {
      this.usuario = usuarioGuardado;
    } else {
      this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    }
  }

  async cargarContadores() {
    this.cargando = true;
    try {
      // Cargar contadores de OC (sin filtro de usuario - muestra TODOS los pendientes)
      // Pasando body vacío {} para que el SP cuente todas las OC sin filtrar por aprobador
      const contadoresOC = await this.aprobacionOCService
        .obtenerContadores('')  // string vacío = body vacío = todos los pendientes
        .toPromise();
      this.contadoresOC = contadoresOC || {};

      // Cargar contadores de OS (sin filtro de usuario - muestra TODOS los pendientes)
      const contadoresOS = await this.aprobacionOSService
        .obtenerContadores('')  // string vacío = body vacío = todos los pendientes
        .toPromise();
      this.contadoresOS = contadoresOS || {};
    } catch (error) {
      console.error('Error al cargar contadores:', error);
      this.alertService.showAlert('Error', 'Error al cargar estadísticas', 'error');
    } finally {
      this.cargando = false;
    }
  }

  get totalPendientes(): number {
    return (this.contadoresOC.pendientes || 0) + (this.contadoresOS.pendientes || 0);
  }

  get totalAprobadas(): number {
    return (this.contadoresOC.aprobadas || 0) + (this.contadoresOS.aprobadas || 0);
  }
}
