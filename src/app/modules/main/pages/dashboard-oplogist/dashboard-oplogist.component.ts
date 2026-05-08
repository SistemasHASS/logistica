import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { RequerimientosService } from '../../services/requerimientos.service';
import { DashboardLogisticaService } from '../dashboard-logistica/services/dashboard-logistica.service';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { NumeroRequerimientoPipe } from '@/app/shared/pipes/numero-requerimiento.pipe';

interface ResumenRequerimiento {
  total: number;
  pendiente: number;
  enviado: number;
  aprobado: number;
  rechazado: number;
  despachado: number;
  completado: number;
  consolidado: number;
}

@Component({
  selector: 'app-dashboard-oplogist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, TableModule, TagModule, ButtonModule, TooltipModule, DialogModule, NumeroRequerimientoPipe],
  templateUrl: './dashboard-oplogist.component.html',
  styleUrls: ['./dashboard-oplogist.component.scss']
})
export class DashboardOplogistComponent implements OnInit {
  usuario: any = null;
  loading = false;

  resumen: ResumenRequerimiento = {
    total: 0, pendiente: 0, enviado: 0, aprobado: 0,
    rechazado: 0, despachado: 0, completado: 0, consolidado: 0
  };

  requerimientos: any[] = [];
  requerimientosFiltrados: any[] = [];
  filtroEstado = '';
  tabTipo: 'CONSUMO' | 'COMPRA' = 'CONSUMO';
  filtroSubEstado = '';

  // Propiedades computadas para contadores
  get contadorConsumo(): number {
    return this.requerimientos.filter((r: any) => r.itemtipo === 'CONSUMO').length;
  }

  get contadorCompra(): number {
    return this.requerimientos.filter((r: any) => r.itemtipo === 'COMPRA').length;
  }

  modalDetalleAbierto = false;
  requerimientoSeleccionado: any = null;

  readonly estados = [
    { valor: '', label: 'Todos', clase: 'secondary' },
    { valor: 'PENDIENTE', label: 'Pendiente', clase: 'warning' },
    { valor: 'ENVIADO', label: 'Enviado', clase: 'info' },
    { valor: 'APROBADO', label: 'Aprobado', clase: 'success' },
    { valor: 'RECHAZADO', label: 'Rechazado', clase: 'danger' },
    { valor: 'CONSOLIDADO', label: 'Consolidado', clase: 'primary' },
    { valor: 'DESPACHADO', label: 'Despachado', clase: 'dark' },
    { valor: 'DESPACHADO_COMPLETO', label: 'Completado', clase: 'success' },
  ];

  constructor(
    private dexieService: DexieService,
    private requerimientosService: RequerimientosService,
    private dashboardLogisticaService: DashboardLogisticaService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.usuario = await this.dexieService.obtenerPrimerUsuario();
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.loading = true;
    try {
      // NUEVO: Usar endpoint dedicado para dashboard de usuario (todos los estados)
      const payloadDashboard = [{
        ruc: this.usuario?.ruc,
        nrodocumento: this.usuario?.documentoidentidad
      }];

      // Llamar al nuevo endpoint que trae TODOS los estados del usuario
      const resp = await firstValueFrom(this.requerimientosService.getRequerimientosUsuarioDashboard(payloadDashboard));
      let todos: any[] = resp || [];

      // Fallback a Dexie si el backend no devuelve nada
      if (!todos.length) {
        const dexieData = await this.dexieService.showRequerimiento();
        todos = dexieData.filter((r: any) => r.nrodocumento === this.usuario?.documentoidentidad);
      }

      this.requerimientos = todos.sort((a: any, b: any) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      // Calcular todos los KPIs desde el array local (consistente)
      this.calcularResumen();
      this.aplicarFiltro();
    } catch (e) {
      console.error('Error al cargar desde backend, usando Dexie:', e);
      try {
        const todos = await this.dexieService.showRequerimiento();
        this.requerimientos = todos
          .filter((r: any) => r.nrodocumento === this.usuario?.documentoidentidad)
          .sort((a: any, b: any) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
        this.calcularResumen();
        this.aplicarFiltro();
      } catch (e2) {
        console.error('Error al cargar desde Dexie:', e2);
      }
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  calcularResumen() {
    const r = this.requerimientos;
    this.resumen = {
      total: r.length,
      pendiente: r.filter((x: any) => x.estados === 'PENDIENTE').length,
      enviado: r.filter((x: any) => x.estados === 'ENVIADO' || x.estados === 'APROBADO_AREA').length,
      aprobado: r.filter((x: any) => x.estados === 'APROBADO').length,
      rechazado: r.filter((x: any) => x.estados === 'RECHAZADO' || x.estados === 'ANULADO').length,
      consolidado: r.filter((x: any) => x.estados === 'CONSOLIDADO').length,
      despachado: r.filter((x: any) => x.estados === 'DESPACHADO' || x.estados === 'DESPACHADO_PARCIAL').length,
      completado: r.filter((x: any) => x.estados === 'DESPACHADO_COMPLETO' || x.estados === 'COMPLETADO').length,
    };
  }

  aplicarFiltro() {
    let filtrados = this.requerimientos.filter((r: any) => r.itemtipo === this.tabTipo);

    if (this.filtroSubEstado) {
      filtrados = filtrados.filter((r: any) => r.estados === this.filtroSubEstado);
    } else if (this.filtroEstado) {
      filtrados = filtrados.filter((r: any) => r.estados === this.filtroEstado);
    }

    this.requerimientosFiltrados = filtrados;
    this.cdr.markForCheck();
  }

  seleccionarTabTipo(tipo: 'CONSUMO' | 'COMPRA') {
    this.tabTipo = tipo;
    this.filtroSubEstado = '';
    this.aplicarFiltro();
  }

  seleccionarSubEstado(estado: string) {
    this.filtroSubEstado = this.filtroSubEstado === estado ? '' : estado;
    this.aplicarFiltro();
  }

  seleccionarFiltro(estado: string) {
    this.filtroEstado = this.filtroEstado === estado ? '' : estado;
    this.aplicarFiltro();
  }

  obtenerSubEstados(): { valor: string; label: string; count: number; severity: string }[] {
    const porTipo = this.requerimientos.filter((r: any) => r.itemtipo === this.tabTipo);
    const orden = ['PENDIENTE', 'ENVIADO', 'APROBADO', 'CONSOLIDADO', 'DESPACHADO', 'DESPACHADO_PARCIAL', 'DESPACHADO_COMPLETO', 'RECHAZADO'];
    const severities: Record<string, string> = {
      PENDIENTE: 'warn', ENVIADO: 'info', APROBADO: 'success',
      CONSOLIDADO: 'info', DESPACHADO: 'contrast', DESPACHADO_PARCIAL: 'secondary',
      DESPACHADO_COMPLETO: 'success', RECHAZADO: 'danger',
    };
    const resultado: { valor: string; label: string; count: number; severity: string }[] = [];
    for (const valor of orden) {
      const count = porTipo.filter((r: any) => r.estados === valor).length;
      if (count > 0) {
        resultado.push({ valor, label: this.obtenerTextoEstado(valor), count, severity: severities[valor] ?? 'secondary' });
      }
    }
    return resultado;
  }

  verDetalle(req: any) {
    this.requerimientoSeleccionado = req;
    this.modalDetalleAbierto = true;
  }

  cerrarDetalle() {
    this.modalDetalleAbierto = false;
    this.requerimientoSeleccionado = null;
  }

  irRequerimientos() {
    this.router.navigate(['main', 'requerimientos']);
  }

  obtenerClaseEstado(estado: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const clases: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      PENDIENTE: 'warn',
      ENVIADO: 'info',
      APROBADO: 'success',
      RECHAZADO: 'danger',
      CONSOLIDADO: 'info',
      DESPACHADO: 'contrast',
      DESPACHADO_PARCIAL: 'secondary',
      DESPACHADO_COMPLETO: 'success',
      COMPLETADO: 'success',
    };
    return clases[estado] ?? 'secondary';
  }

  obtenerTextoEstado(estado: string): string {
    const textos: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      ENVIADO: 'Enviado',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
      CONSOLIDADO: 'Consolidado',
      DESPACHADO: 'Despachado',
      DESPACHADO_PARCIAL: 'Desp. Parcial',
      DESPACHADO_COMPLETO: 'Completado',
      COMPLETADO: 'Completado',
    };
    return textos[estado] || estado;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
