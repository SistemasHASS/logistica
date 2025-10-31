import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { VersionService } from './services/version.service';
import { environment } from '../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'logistica';
  APP_VERSION = environment.appVersion;
  private checkInterval: any;
  private readonly CHECK_INTERVAL_MINUTES = 10;
  private lastPromptKey = 'last_update_prompt';

  constructor(private swUpdate: SwUpdate, private versionService: VersionService) {}

  ngOnInit() {
    this.checkVersionFromServer();
    this.scheduleVersionChecks();

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          console.log('Nueva versión detectada por SW');
          this.askUserToUpdate();
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  scheduleVersionChecks() {
    this.checkInterval = setInterval(() => {
      this.checkVersionFromServer();
    }, this.CHECK_INTERVAL_MINUTES * 60 * 1000);
  }

  async checkVersionFromServer() {
    const local = this.versionService.getLocalVersion();
    const remote = await this.versionService.getServerVersion();

    if (remote && remote !== local) {
      const lastPrompt = localStorage.getItem(this.lastPromptKey);
      const now = Date.now();

      // Evita mostrar el modal muchas veces
      if (!lastPrompt || now - parseInt(lastPrompt) > 15 * 60 * 1000) {
        this.askUserToUpdate(remote, local);
        localStorage.setItem(this.lastPromptKey, now.toString());
      }
    }
  }

  async askUserToUpdate(remote?: string, local?: string) {
    const result = await Swal.fire({
      title: '⚡ Nueva versión disponible',
      html: `
        <p>Versión actual: <b>${local ?? this.APP_VERSION}</b></p>
        <p>Versión nueva: <b>${remote ?? 'desconocida'}</b></p>
        <p>¿Deseas actualizar ahora?</p>
      `,
      icon: 'info',
      confirmButtonText: 'Actualizar ahora',
      cancelButtonText: 'Más tarde',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      allowOutsideClick: false
    });

    if (result.isConfirmed) {
      await this.clearDexieAndReload();
    }
  }

  async clearDexieAndReload() {
    try {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
    } catch (err) {
      console.error('Error limpiando Dexie:', err);
    } finally {
      Swal.fire({
        title: 'Actualizando...',
        text: 'La aplicación se recargará en un momento.',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });
      setTimeout(() => window.location.reload(), 1500);
    }
  }
}


// import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [RouterOutlet],
//   templateUrl: './app.component.html',
//   styleUrl: './app.component.scss'
// })
// export class AppComponent {
//   title = 'logistica';
// }
