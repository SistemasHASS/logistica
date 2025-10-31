// import { Injectable } from '@angular/core';
// import { SwUpdate } from '@angular/service-worker';
// import { DexieService } from '../shared/dixiedb/dexie-db.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class VersionCheckService {
//   constructor(
//     private updates: SwUpdate,
//     private db: DexieService // Inyectamos el servicio, no usamos new
//   ) {
//     this.checkForUpdates();
//   }

//   async checkForUpdates() {
//     if (this.updates.isEnabled) {
//       this.updates.versionUpdates.subscribe(async event => {
//         if (event.type === 'VERSION_READY') {
//           console.log('⚡ Nueva versión disponible');
//           await this.db.clearAll(); // ✅ Usamos la instancia ya creada
//           window.location.reload();
//         }
//       });
//     }
//   }
// }

import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { DexieService } from '../shared/dixiedb/dexie-db.service';

@Injectable({
  providedIn: 'root'
})
export class VersionCheckService {
  constructor(private updates: SwUpdate) {
    this.checkForUpdates();
  }

  async checkForUpdates() {
    if (this.updates.isEnabled) {
      this.updates.versionUpdates.subscribe(async event => {
        if (event.type === 'VERSION_READY') {
          console.log('⚡ Nueva versión disponible');
          const db = new DexieService();
          await db.clearAll();
          window.location.reload();
        }
      });
    }
  }
}
