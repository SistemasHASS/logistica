import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { AprobacionesAreaService } from '../../services/aprobaciones-area.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Component({
  selector: 'app-dashboard-gerencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-gerencia.component.html',
  styleUrl: './dashboard-gerencia.component.scss',
})
export class DashboardGerenciaComponent implements OnInit {
  loading = true;
  kpis: any = {};
  porArea: any[] = [];

  constructor(
    private aprobacionesAreaService: AprobacionesAreaService,
    private dexieService: DexieService,
  ) {}

  async ngOnInit() {
    const usuario = await this.dexieService.showUsuario();
    if (!usuario) { this.loading = false; return; }
    try {
      const resp: any = await lastValueFrom(
        this.aprobacionesAreaService.dashboardGerencia({
          documentoidentidad: usuario.documentoidentidad,
          ruc: usuario.ruc,
        })
      );
      let data: any = resp;
      if (data?.response) {
        data = JSON.parse(data.response);
      } else if (Array.isArray(data)) {
        data = data[0];
      } else if (data?.resultado) {
        const r = data.resultado;
        data = Array.isArray(r) ? r[0] : r;
      }
      this.kpis = data || {};
      this.porArea = typeof this.kpis.porArea === 'string'
        ? JSON.parse(this.kpis.porArea)
        : (this.kpis.porArea || []);
    } catch {
      this.kpis = {};
      this.porArea = [];
    } finally {
      this.loading = false;
    }
  }
}
