import { Injectable } from '@angular/core';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { SolicitudServicio } from '@/app/shared/interfaces/Tables';

@Injectable({
  providedIn: 'root',
})
export class SolicitudServicioLocalService {
  constructor(private dexieService: DexieService) {}

  async obtenerSolicitudesLocales(dniUsuario: string): Promise<SolicitudServicio[]> {
    const todas = await this.dexieService.solicitudesServicio.toArray();
    return todas.filter(
      (s) =>
        s.usuarioSolicita === dniUsuario &&
        s.numeroSolicitud != null &&
        s.numeroSolicitud !== ''
    );
  }

  async actualizarSolicitudLocal(
    id: number,
    campos: Partial<SolicitudServicio>
  ): Promise<number> {
    return await this.dexieService.solicitudesServicio.update(id, campos);
  }

  async eliminarSolicitudLocal(id: number): Promise<void> {
    await this.dexieService.solicitudesServicio.delete(id);
  }

  async eliminarSolicitudLocalPorNumero(numeroSolicitud: string): Promise<number> {
    return await this.dexieService.solicitudesServicio
      .where('numeroSolicitud')
      .equals(numeroSolicitud)
      .delete();
  }
}
