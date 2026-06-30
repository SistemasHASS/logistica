import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-bandeja-aprobaciones',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, TableModule, ProgressBarModule],
  templateUrl: './bandeja-aprobaciones.component.html',
  styleUrl: './bandeja-aprobaciones.component.scss',
})
export class BandejaAprobacionesComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dexieService = inject(DexieService);

  usuario = signal<any>(null);
  soloConsumo = computed(() => this.usuario()?.idrol === 'JLOLOGIST');
  loading = signal(true);

  // KPIs
  kpiPendientesConsumo = signal(0);
  kpiPendientesSC = signal(0);
  kpiTotalPendientes = signal(0);
  kpiAprobadosHoy = signal(0);
  kpiMontoPendiente = signal(0);

  // Lista unificada
  aprobacionesPendientes: any[] = [];

  ngOnInit() {
    this.loadUsuario();
    this.loadKPIs();
  }

  async loadUsuario() {
    const user = await this.dexieService.showUsuario();
    this.usuario.set(user);
  }

  async loadKPIs() {
    this.loading.set(true);
    
    // TODO: Implementar llamadas a servicios reales
    // Simulación de datos
    setTimeout(() => {
      this.kpiPendientesConsumo.set(5);
      this.kpiPendientesSC.set(3);
      this.kpiTotalPendientes.set(8);
      this.kpiAprobadosHoy.set(12);
      this.kpiMontoPendiente.set(45000);
      
      this.aprobacionesPendientes = [
        { id: 1, tipo: 'CONSUMO', numero: 'REQ-2024-001', fecha: '2024-05-20', solicitante: 'Juan Pérez', monto: 5000, estado: 'PENDIENTE' },
        { id: 2, tipo: 'SC', numero: 'SC-2024-002', fecha: '2024-05-21', solicitante: 'María López', monto: 15000, estado: 'PENDIENTE' },
        { id: 3, tipo: 'CONSUMO', numero: 'REQ-2024-003', fecha: '2024-05-21', solicitante: 'Carlos Ruiz', monto: 3000, estado: 'PENDIENTE' },
      ];
      
      this.loading.set(false);
    }, 500);
  }

  irAConsumo() {
    this.router.navigate(['aprobar-consumo'], { relativeTo: this.route });
  }

  irASC() {
    this.router.navigate(['aprobar-sc'], { relativeTo: this.route });
  }

  verDetalle(item: any) {
    if (item.tipo === 'CONSUMO') {
      this.router.navigate(['aprobar-consumo'], { relativeTo: this.route });
    } else if (item.tipo === 'SC') {
      this.router.navigate(['aprobar-sc'], { relativeTo: this.route });
    }
  }

  getSeverity(estado: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null {
    switch (estado) {
      case 'PENDIENTE': return 'warn';
      case 'APROBADO': return 'success';
      case 'RECHAZADO': return 'danger';
      default: return 'info';
    }
  }
}
