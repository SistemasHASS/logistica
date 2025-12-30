import { Injectable } from '@angular/core';
import { DexieService } from 'src/app/shared/dixiedb/dexie-db.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  constructor(private dexieService: DexieService) {}

  // 🔴 Verifica si existen requerimientos pendientes
  async tienePendientes(): Promise<boolean> {
    const count = await this.dexieService.requerimientos
      .where('estado')
      .equals(0)
      .count();

    return count > 0;
  }
}
