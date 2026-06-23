import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom } from 'rxjs';

export interface SincronizacionLog {
  id: number;
  tabla: string;
  operacion: string;
  estado: 'EXITOSO' | 'FALLIDO' | 'EN_PROCESO';
  filas: number | null;
  duracionSegundos: number | null;
  fechaInicio: string;
  fechaFin: string | null;
  mensaje: string | null;
  servidor: string | null;
}

export interface EstadoSincronizacion {
  totalEjecuciones: number;
  ultimaEjecucion: SincronizacionLog | null;
  exitosos: number;
  fallidos: number;
  promedioSegundos: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminSincronizacionService {
  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  async obtenerLogs(ultimas: number = 30): Promise<SincronizacionLog[]> {
    try {
      const url = `${this.baseUrl}/api/logistica/ver-log-sincronizacion`;
      const resp: any = await lastValueFrom(this.http.post<any>(url, { ultimas }));
      if (Array.isArray(resp)) return resp;
      if (resp?.resultado) {
        try { return JSON.parse(resp.resultado); } catch { return []; }
      }
      return [];
    } catch {
      return [];
    }
  }

  async ejecutarSincronizacion(): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const url = `${this.baseUrl}/api/logistica/ejecutar-sincronizacion-items`;
      const resp: any = await lastValueFrom(this.http.post<any>(url, {}));
      return { ok: true, mensaje: resp?.mensaje || 'Sincronización ejecutada correctamente' };
    } catch (error: any) {
      return { ok: false, mensaje: error?.error?.message || 'Error al ejecutar sincronización' };
    }
  }

  calcularEstado(logs: SincronizacionLog[]): EstadoSincronizacion {
    const exitosos = logs.filter(l => l.estado === 'EXITOSO').length;
    const fallidos = logs.filter(l => l.estado === 'FALLIDO').length;
    const conDuracion = logs.filter(l => l.duracionSegundos != null);
    const promedio = conDuracion.length
      ? Math.round(conDuracion.reduce((s, l) => s + (l.duracionSegundos ?? 0), 0) / conDuracion.length)
      : 0;
    return {
      totalEjecuciones: logs.length,
      ultimaEjecucion: logs[0] ?? null,
      exitosos,
      fallidos,
      promedioSegundos: promedio,
    };
  }

  formatDuracion(seg: number | null): string {
    if (seg == null) return '-';
    if (seg < 60) return `${seg}s`;
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}m ${s}s`;
  }

  tiempoTranscurrido(fecha: string | null): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '-';
    const ms = Date.now() - d.getTime();
    const seg = Math.floor(ms / 1000);
    const min = Math.floor(seg / 60);
    const hor = Math.floor(min / 60);
    const dia = Math.floor(hor / 24);
    if (dia > 0) return `hace ${dia} día${dia > 1 ? 's' : ''}`;
    if (hor > 0) return `hace ${hor}h`;
    if (min > 0) return `hace ${min}min`;
    return 'hace un momento';
  }
}
