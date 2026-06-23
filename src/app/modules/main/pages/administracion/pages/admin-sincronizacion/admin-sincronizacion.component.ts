import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  AdminSincronizacionService,
  SincronizacionLog,
  EstadoSincronizacion,
} from '../../services/admin-sincronizacion.service';

@Component({
  selector: 'app-admin-sincronizacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-sincronizacion.component.html',
  styleUrls: ['./admin-sincronizacion.component.scss'],
})
export class AdminSincronizacionComponent implements OnInit {
  private svc = inject(AdminSincronizacionService);

  logs: SincronizacionLog[] = [];
  estado: EstadoSincronizacion | null = null;
  isLoading = false;
  ejecutando = false;
  ultimas = 30;
  ultimasOpciones = [10, 30, 50, 100];
  expandedId: number | null = null;
  filtroEstado: string = 'TODOS';

  get logsFiltrados(): SincronizacionLog[] {
    if (this.filtroEstado === 'TODOS') return this.logs;
    return this.logs.filter(l => l.estado === this.filtroEstado);
  }

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.isLoading = true;
    try {
      this.logs = await this.svc.obtenerLogs(this.ultimas);
      this.estado = this.svc.calcularEstado(this.logs);
    } finally {
      this.isLoading = false;
    }
  }

  async ejecutarAhora() {
    const confirm = await Swal.fire({
      title: '¿Ejecutar sincronización ahora?',
      html: `<p>Se copiará el maestro de ítems desde el linked server <b>[HASS-DB1]</b> a la tabla local.<br>
             <small class="text-muted">Este proceso puede tardar varios minutos.</small></p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, ejecutar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#198754',
    });
    if (!confirm.isConfirmed) return;

    this.ejecutando = true;
    try {
      const result = await this.svc.ejecutarSincronizacion();
      if (result.ok) {
        await Swal.fire({ icon: 'success', title: 'Sincronización completada', text: result.mensaje, timer: 3000, showConfirmButton: false });
      } else {
        await Swal.fire({ icon: 'error', title: 'Error en sincronización', text: result.mensaje });
      }
      await this.cargar();
    } finally {
      this.ejecutando = false;
    }
  }

  toggleExpand(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  exportarCSV() {
    if (!this.logs.length) return;
    const headers = ['ID', 'Tabla', 'Operación', 'Estado', 'Filas', 'Duración (seg)', 'Fecha Inicio', 'Fecha Fin', 'Mensaje', 'Servidor'];
    const rows = this.logs.map(l => [
      l.id, l.tabla, l.operacion, l.estado, l.filas ?? '',
      l.duracionSegundos ?? '', l.fechaInicio, l.fechaFin ?? '',
      (l.mensaje ?? '').replace(/"/g, '""'), l.servidor ?? ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log-sincronizacion-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  formatDuracion(seg: number | null) { return this.svc.formatDuracion(seg); }
  tiempoTranscurrido(f: string | null) { return this.svc.tiempoTranscurrido(f); }

  tasaExito(): number {
    if (!this.estado || this.estado.totalEjecuciones === 0) return 0;
    return Math.round((this.estado.exitosos / this.estado.totalEjecuciones) * 100);
  }
}
