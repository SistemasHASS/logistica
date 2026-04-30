import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { RequerimientosService } from '../../services/requerimientos.service';
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
      const payload = [{ ruc: this.usuario?.ruc, idrol: this.usuario?.idrol }];

      // Llamar en paralelo al SP general y al SP de aprobados
      const [respPendientes, respAprobados] = await Promise.allSettled([
        firstValueFrom(this.requerimientosService.getRequerimientos(payload)),
        firstValueFrom(this.requerimientosService.getRequerimientosAprobados(payload)),
      ]);

      const pendientes: any[] = (respPendientes.status === 'fulfilled' && respPendientes.value?.length)
        ? respPendientes.value : [];
      const aprobados: any[] = (respAprobados.status === 'fulfilled' && respAprobados.value?.length)
        ? respAprobados.value : [];

      // Combinar y deduplicar por idrequerimiento
      const mapaIds = new Map<string, any>();
      [...pendientes, ...aprobados].forEach((r: any) => {
        if (!mapaIds.has(r.idrequerimiento)) mapaIds.set(r.idrequerimiento, r);
      });
      let todos: any[] = Array.from(mapaIds.values());

      // Fallback a Dexie si el backend no devuelve nada
      if (!todos.length) {
        todos = await this.dexieService.showRequerimiento();
      }

      this.requerimientos = todos
        .filter((r: any) => r.nrodocumento === this.usuario?.documentoidentidad)
        .sort((a: any, b: any) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

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
    this.requerimientosFiltrados = this.filtroEstado
      ? this.requerimientos.filter((r: any) => r.estados === this.filtroEstado)
      : [...this.requerimientos];
    this.cdr.markForCheck();
  }

  seleccionarFiltro(estado: string) {
    this.filtroEstado = this.filtroEstado === estado ? '' : estado;
    this.aplicarFiltro();
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
