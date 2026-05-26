import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { AuditoriaService, AuditoriaLog } from './services/auditoria.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, DatePickerModule, FormsModule],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss',
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);

  loading = signal(true);
  error = signal('');
  logs = signal<AuditoriaLog[]>([]);

  fechaInicio: Date = new Date();
  fechaFin: Date = new Date();
  filtroTipo: string = '';
  filtroUsuario: string = '';

  tipos = [
    { value: '', label: 'Todos' },
    { value: 'LOGIN', label: 'Inicio de Sesión' },
    { value: 'CREATE', label: 'Creación' },
    { value: 'UPDATE', label: 'Actualización' },
    { value: 'DELETE', label: 'Eliminación' },
    { value: 'APROVE', label: 'Aprobación' },
    { value: 'REJECT', label: 'Rechazo' },
  ];

  ngOnInit() {
    // Inicializar fechas (últimos 7 días)
    this.fechaInicio.setDate(this.fechaInicio.getDate() - 7);
    this.cargarLogs();
  }

  private cargarLogs() {
    this.loading.set(true);
    
    const filtros = {
      fechaInicio: this.fechaInicio.toISOString().split('T')[0],
      fechaFin: this.fechaFin.toISOString().split('T')[0],
      tipo: this.filtroTipo,
      usuario: this.filtroUsuario
    };

    this.auditoriaService.getLogs(filtros).subscribe({
      next: (data) => {
        this.logs.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar logs de auditoría');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  buscar() {
    this.cargarLogs();
  }

  getTipoSeverity(tipo: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (tipo) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'danger';
      case 'APROVE': return 'success';
      case 'REJECT': return 'warn';
      case 'LOGIN': return 'secondary';
      default: return 'info';
    }
  }

  getTipoLabel(tipo: string): string {
    return this.tipos.find(t => t.value === tipo)?.label || tipo;
  }

  exportar() {
    this.auditoriaService.exportarLogs().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al exportar:', err);
      }
    });
  }
}
