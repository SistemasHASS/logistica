import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { VersionService } from './services/version.service';
import { StockNotificationService } from './shared/services/stock-notification.service';
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

  constructor(
    private swUpdate: SwUpdate, 
    private versionService: VersionService,
    private stockNotificationService: StockNotificationService
  ) { }

  ngOnInit() {

    const mode = this.versionService.getMode();

    /** 💤 SIN EFECTO */
    if (mode === 'DISABLED') {
      console.log('🔕 Actualizaciones desactivadas');
      return;
    }

    /** 🔄 AUTOMÁTICO */
    if (mode === 'AUTO') {
      this.checkVersionFromServer();
      this.scheduleVersionChecks();

      if (this.swUpdate.isEnabled) {
        this.swUpdate.versionUpdates.subscribe(event => {
          if (event.type === 'VERSION_READY') {
            this.handleUpdate();
          }
        });
      }
    }
    /** 🔥 MANUAL → no hace nada al iniciar */

    // this.checkVersionFromServer();
    // this.scheduleVersionChecks();

    // if (this.swUpdate.isEnabled) {
    //   this.swUpdate.versionUpdates.subscribe(event => {
    //     if (event.type === 'VERSION_READY') {
    //       console.log('Nueva versión detectada por SW');
    //       this.askUserToUpdate();
    //     }
    //   });
    // }
  }

  ngOnDestroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  /** 🔄 automático */
  scheduleVersionChecks() {
    this.checkInterval = setInterval(() => {
      this.checkVersionFromServer();
    }, this.CHECK_INTERVAL_MINUTES * 60 * 1000);
  }

  async checkVersionFromServer() {
    if (this.versionService.getMode() !== 'AUTO') return;
    
    const remote = await this.versionService.getServerVersion();
    const local = this.versionService.getLocalVersion();
    const updated = this.versionService.getUpdatedVersion();

    // Si ya se actualizó a esta versión, no mostrar el modal
    if (remote && updated && remote === updated) {
      console.log('✅ La aplicación ya está actualizada a la versión', remote);
      return;
    }

    if (remote && remote !== local) {
      const lastPrompt = localStorage.getItem(this.lastPromptKey);
      const now = Date.now();

      // Evita mostrar el modal muchas veces (cada 15 minutos máximo)
      if (!lastPrompt || now - parseInt(lastPrompt) > 15 * 60 * 1000) {
        this.handleUpdate();
        localStorage.setItem(this.lastPromptKey, now.toString());
      }
    }
  }

  /** 🔥 manual */
  triggerManualUpdate() {
    if (this.versionService.getMode() !== 'MANUAL') return;
    this.handleUpdate();
  }

  /** 🎯 punto único de decisión */
  async handleUpdate() {
    const remote = await this.versionService.getServerVersion();
    const local = this.versionService.getLocalVersion();

    if (!remote || remote === local) return;

    if (this.versionService.canShowModal()) {
      this.askUserToUpdate(remote, local);
    } else {
      await this.clearDexieAndReload();
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
      // Guardar la versión que se está actualizando
      const remote = await this.versionService.getServerVersion();
      if (remote) {
        this.versionService.setUpdatedVersion(remote);
        console.log('💾 Guardando versión actualizada:', remote);
      }

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

