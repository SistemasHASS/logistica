import { Injectable, OnDestroy } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { RequerimientosService } from '@/app/modules/main/services/requerimientos.service';
import { ConnectivityService } from '@/app/modules/main/services/connectivity.service';
import { Usuario } from '@/app/shared/interfaces/Tables';

/**
 * Servicio encargado de mantener los estados de los requerimientos del creador
 * sincronizados con el backend, de modo que una vez aprobados por el jefe de área
 * desaparezcan de la lista local (tanto online como al restaurar conectividad).
 *
 * Cubre: CONSUMO, COMPRA, SERVICIO, ACTIVO FIJO y ACTIVO FIJO MENOR.
 */
@Injectable({ providedIn: 'root' })
export class RequerimientosSyncService implements OnDestroy {
  private syncEnProgreso = false;
  private conectividadSub: Subscription | null = null;
  private readonly ESTADOS_OCULTAR = ['APROBADO'];

  constructor(
    private dexieService: DexieService,
    private requerimientosService: RequerimientosService,
    private connectivityService: ConnectivityService,
  ) {}

  ngOnDestroy(): void {
    this.conectividadSub?.unsubscribe();
  }

  /**
   * Devuelve true si el requerimiento debe ocultarse de la lista del creador.
   */
  debeOcultar(estado: string | undefined | null): boolean {
    if (!estado) return false;
    return this.ESTADOS_OCULTAR.includes(estado.toUpperCase());
  }

  /**
   * Sincroniza los estados de los requerimientos del usuario contra el endpoint
   * de dashboard del backend. Si no hay conexión, no hace nada.
   */
  async sincronizarEstados(usuario: Usuario | null | undefined): Promise<void> {
    if (!usuario?.ruc || !usuario?.documentoidentidad) return;
    if (!navigator.onLine) return;
    if (this.syncEnProgreso) return;

    this.syncEnProgreso = true;
    try {
      const payload = [{
        ruc: usuario.ruc,
        nrodocumento: usuario.documentoidentidad,
      }];

      const resp: any = await firstValueFrom(
        this.requerimientosService.getRequerimientosUsuarioDashboard(payload),
      );

      const listaServidor = Array.isArray(resp)
        ? resp
        : Array.isArray(resp?.resultado)
          ? resp.resultado
          : [];

      if (!listaServidor.length) return;

      await this.aplicarEstadosDesdeServidor(listaServidor);
    } catch (error) {
      console.error('❌ Error sincronizando estados de requerimientos:', error);
    } finally {
      this.syncEnProgreso = false;
    }
  }

  /**
   * Escucha cambios de conectividad y, al volver online, sincroniza estados.
   * @param onSyncCompleta callback opcional invocado tras una sincronización exitosa.
   */
  escucharConectividad(
    usuario: Usuario | null | undefined,
    onSyncCompleta?: () => void | Promise<void>,
  ): void {
    this.conectividadSub?.unsubscribe();
    this.conectividadSub = this.connectivityService.isOnline.subscribe(async (online) => {
      if (online && usuario) {
        await this.sincronizarEstados(usuario);
        if (onSyncCompleta) {
          await onSyncCompleta();
        }
      }
    });
  }

  /**
   * Detiene la escucha de eventos de conectividad.
   */
  detenerEscucha(): void {
    this.conectividadSub?.unsubscribe();
    this.conectividadSub = null;
  }

  /**
   * Filtra los requerimientos que no deben mostrarse al creador.
   */
  filtrarVisibles(lista: any[]): any[] {
    return lista.filter((r) => !this.debeOcultar(r.estados));
  }

  /**
   * Marca un requerimiento como APROBADO en las tablas locales de Dexie.
   * Se usa tras aprobar en otro módulo para que, al volver a la lista del
   * creador, el registro ya esté oculto sin depender de la sincronización
   * con el servidor.
   */
  async marcarAprobadoLocalmente(idrequerimiento: string | undefined | null): Promise<void> {
    if (!idrequerimiento) return;
    const now = new Date().toISOString();
    const tablas: any[] = [
      this.dexieService.requerimientos,
      this.dexieService.requerimientosCommodity,
      this.dexieService.requerimientosActivoFijo,
      this.dexieService.requerimientosActivoFijoMenor,
    ];

    for (const tabla of tablas) {
      try {
        const registros = await tabla.where('idrequerimiento').equals(idrequerimiento).toArray();
        for (const local of registros) {
          if (local.estado !== 1) continue;
          await tabla.update(local.id!, { estados: 'APROBADO', fechaAprobacion: now });
        }
      } catch (error) {
        console.error(`❌ Error marcando aprobado localmente en tabla ${tabla.name}:`, error);
      }
    }
  }

  /**
   * Aplica los estados recibidos del servidor a los registros locales de Dexie.
   * Solo actualiza requerimientos que ya fueron enviados (estado === 1) para no
   * sobrescribir cambios pendientes de sincronización (estado === 0).
   */
  private async aplicarEstadosDesdeServidor(listaServidor: any[]): Promise<void> {
    const estadosPorId = new Map<string, string>();
    const fechaAprobacionPorId = new Map<string, any>();

    for (const req of listaServidor) {
      const id = req.idrequerimiento || req.Idrequerimiento;
      const estado = req.estados || req.Estados || req.estado || req.Estado;
      if (!id || !estado) continue;
      estadosPorId.set(String(id), String(estado).toUpperCase());
      if (req.fechaAprobacion || req.FechaAprobacion) {
        fechaAprobacionPorId.set(String(id), req.fechaAprobacion || req.FechaAprobacion);
      }
    }

    if (estadosPorId.size === 0) return;

    const ids = Array.from(estadosPorId.keys());

    // Actualizar ITEMs (CONSUMO, COMPRA, TRANSFERENCIA)
    const itemsLocales = await this.dexieService.requerimientos
      .where('idrequerimiento')
      .anyOf(ids)
      .toArray();
    for (const local of itemsLocales) {
      if (local.estado !== 1) continue;
      const nuevoEstado = estadosPorId.get(local.idrequerimiento);
      if (!nuevoEstado || local.estados === nuevoEstado) continue;
      const update: any = { estados: nuevoEstado };
      if (fechaAprobacionPorId.has(local.idrequerimiento)) {
        update.fechaAprobacion = fechaAprobacionPorId.get(local.idrequerimiento);
      }
      await this.dexieService.requerimientos.update(local.id!, update);
    }

    // Actualizar COMMODITY / SERVICIO
    const commodityLocales = await this.dexieService.requerimientosCommodity
      .where('idrequerimiento')
      .anyOf(ids)
      .toArray();
    for (const local of commodityLocales) {
      if (local.estado !== 1) continue;
      const nuevoEstado = estadosPorId.get(local.idrequerimiento);
      if (!nuevoEstado || local.estados === nuevoEstado) continue;
      const update: any = { estados: nuevoEstado };
      if (fechaAprobacionPorId.has(local.idrequerimiento)) {
        update.fechaAprobacion = fechaAprobacionPorId.get(local.idrequerimiento);
      }
      await this.dexieService.requerimientosCommodity.update(local.id!, update);
    }

    // Actualizar ACTIVO FIJO
    const activoFijoLocales = await this.dexieService.requerimientosActivoFijo
      .where('idrequerimiento')
      .anyOf(ids)
      .toArray();
    for (const local of activoFijoLocales) {
      if (local.estado !== 1) continue;
      const nuevoEstado = estadosPorId.get(local.idrequerimiento);
      if (!nuevoEstado || local.estados === nuevoEstado) continue;
      const update: any = { estados: nuevoEstado };
      if (fechaAprobacionPorId.has(local.idrequerimiento)) {
        update.fechaAprobacion = fechaAprobacionPorId.get(local.idrequerimiento);
      }
      await this.dexieService.requerimientosActivoFijo.update(local.id!, update);
    }

    // Actualizar ACTIVO FIJO MENOR
    const activoFijoMenorLocales = await this.dexieService.requerimientosActivoFijoMenor
      .where('idrequerimiento')
      .anyOf(ids)
      .toArray();
    for (const local of activoFijoMenorLocales) {
      if (local.estado !== 1) continue;
      const nuevoEstado = estadosPorId.get(local.idrequerimiento);
      if (!nuevoEstado || local.estados === nuevoEstado) continue;
      const update: any = { estados: nuevoEstado };
      if (fechaAprobacionPorId.has(local.idrequerimiento)) {
        update.fechaAprobacion = fechaAprobacionPorId.get(local.idrequerimiento);
      }
      await this.dexieService.requerimientosActivoFijoMenor.update(local.id!, update);
    }
  }
}
