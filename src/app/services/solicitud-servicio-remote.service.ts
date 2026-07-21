import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { SolicitudServicioService } from './solicitud-servicio.service';

@Injectable({
  providedIn: 'root',
})
export class SolicitudServicioRemoteService extends SolicitudServicioService {
  constructor(http: HttpClient) {
    super(http);
  }

  async cargarSolicitudes(filtros: any = {}): Promise<any[]> {
    const raw = await lastValueFrom(this.listarSolicitudesServicio(filtros));
    let solicitudes = raw || [];
    if (Array.isArray(solicitudes) && solicitudes.length === 1 && Array.isArray(solicitudes[0])) {
      solicitudes = solicitudes[0];
    }
    return solicitudes;
  }

  async cargarContadores(documentoIdentidad?: string): Promise<any> {
    return await lastValueFrom(this.obtenerContadores(documentoIdentidad));
  }

  async obtenerSolicitudPorId(id?: number, numeroSolicitud?: string): Promise<any> {
    return await lastValueFrom(this.obtenerSolicitudServicioPorId(id, numeroSolicitud));
  }

  async guardarSolicitud(solicitud: any): Promise<any> {
    return await lastValueFrom(this.guardarSolicitudServicio(solicitud));
  }

  async enviarSolicitud(solicitud: any): Promise<any> {
    const resp = await lastValueFrom(this.enviarSolicitudServicio(solicitud.id));

    if (resp && (resp.status === 'success' || resp.success)) {
      try {
        await lastValueFrom(
          this.asignarAprobadoresSS(solicitud.id, solicitud.montoEstimado)
        );
      } catch (error) {
        console.warn('Error al asignar aprobadores:', error);
      }
    }

    return resp;
  }

  async anularSolicitud(id: number, motivo: string): Promise<any> {
    return await lastValueFrom(this.anularSolicitudServicio(id, motivo));
  }
}
