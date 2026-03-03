import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type UpdateMode = 'AUTO' | 'MANUAL' | 'DISABLED';

@Injectable({ providedIn: 'root' })
export class VersionService {

  private versionUrl = '/assets/version.json'; // 🔍 archivo con versión del servidor

  /** 🔥 NUEVO: configuración */
  private updateMode: UpdateMode = 'AUTO';
  private showModal = true;

  /** 🔧 setters */
  setMode(mode: UpdateMode) {
    this.updateMode = mode;
  }

  setShowModal(show: boolean) {
    this.showModal = show;
  }

  /** 🔍 getters */
  getMode(): UpdateMode {
    return this.updateMode;
  }

  canShowModal(): boolean {
    return this.showModal;
  }

  async getServerVersion(): Promise<string | null> {
    try {
      const response = await fetch(this.versionUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('Error al obtener version.json');
      const data = await response.json();
      return data.version;
    } catch (err) {
      console.error('❌ No se pudo obtener la versión del servidor:', err);
      return null;
    }
  }

  getLocalVersion(): string {
    return environment.appVersion;
  }

  setLocalVersion(version: string) {
    localStorage.setItem('app_version', version);
  }

  getStoredVersion(): string | null {
    return localStorage.getItem('app_version');
  }

  /** Guardar la versión actualizada para no volver a mostrar el modal */
  setUpdatedVersion(version: string) {
    localStorage.setItem('app_updated_version', version);
  }

  getUpdatedVersion(): string | null {
    return localStorage.getItem('app_updated_version');
  }
}
