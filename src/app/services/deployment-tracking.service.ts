import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DeploymentRecord {
  id?: number;
  appName: string;
  environment: string;
  version: string;
  buildTime?: string | null;
  deployedAt?: string | null;
  deployedBy?: string | null;
  serverName?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface VersionAuditSnapshot {
  appName: string;
  environment: string;
  localVersion: string;
  serverVersion: string | null;
  apiVersion: string | null;
  apiDeployment: DeploymentRecord | null;
  confirmedUpdateVersion: string | null;
  promptDecisionReason: string;
  isLocalBehindServer: boolean;
  isServerOutOfSyncWithApi: boolean;
  isFullyAligned: boolean;
}

@Injectable({ providedIn: 'root' })
export class DeploymentTrackingService {
  private readonly baseUrl = environment.baseUrl;
  private readonly endpoint = `${this.baseUrl}/api/app-deployments`;
  private readonly appName = 'logistica';
  private readonly environmentName = environment.production ? 'production' : 'development';

  constructor(private http: HttpClient) {}

  getAppName(): string {
    return this.appName;
  }

  getEnvironmentName(): string {
    return this.environmentName;
  }

  async getCurrentDeployment(): Promise<DeploymentRecord | null> {
    try {
      const params = new HttpParams()
        .set('appName', this.appName)
        .set('environment', this.environmentName);

      return await lastValueFrom(
        this.http.get<DeploymentRecord>(`${this.endpoint}/current`, { params })
      );
    } catch (error) {
      console.warn('No se pudo consultar el despliegue actual en API:', error);
      return null;
    }
  }

  async buildVersionAudit(localVersion: string, serverVersion: string | null): Promise<VersionAuditSnapshot> {
    const apiDeployment = await this.getCurrentDeployment();
    const apiVersion = apiDeployment?.version ?? null;
    let promptDecisionReason = 'No hay una nueva version confirmada.';

    if (!serverVersion) {
      promptDecisionReason = 'No se pudo obtener version.json desde IIS.';
    } else if (!apiVersion) {
      promptDecisionReason = 'La API no devolvio una version activa para comparar.';
    } else if (serverVersion !== apiVersion) {
      promptDecisionReason = `IIS y API no coinciden (${serverVersion} vs ${apiVersion}).`;
    } else if (serverVersion === localVersion) {
      promptDecisionReason = `El usuario ya tiene la ultima version (${localVersion}).`;
    } else {
      promptDecisionReason = `Hay una nueva version confirmada (${serverVersion}).`;
    }

    const confirmedUpdateVersion =
      !!serverVersion &&
      !!apiVersion &&
      serverVersion === apiVersion &&
      serverVersion !== localVersion
        ? serverVersion
        : null;

    return {
      appName: this.appName,
      environment: this.environmentName,
      localVersion,
      serverVersion,
      apiVersion,
      apiDeployment,
      confirmedUpdateVersion,
      promptDecisionReason,
      isLocalBehindServer: !!serverVersion && serverVersion !== localVersion,
      isServerOutOfSyncWithApi: !!serverVersion && !!apiVersion && serverVersion !== apiVersion,
      isFullyAligned: !!serverVersion && !!apiVersion && localVersion === serverVersion && serverVersion === apiVersion
    };
  }

  shouldPromptForUpdate(snapshot: VersionAuditSnapshot): boolean {
    return !!snapshot.confirmedUpdateVersion;
  }

  logAuditResult(snapshot: VersionAuditSnapshot): void {
    console.log('Version audit:', snapshot);
    console.log(`Decision modal: ${snapshot.promptDecisionReason}`);

    if (snapshot.isFullyAligned) {
      console.log(
        `Versiones alineadas: local=${snapshot.localVersion}, iis=${snapshot.serverVersion}, api=${snapshot.apiVersion}`
      );
      return;
    }

    if (snapshot.isLocalBehindServer) {
      console.warn(
        `Cliente desactualizado: local=${snapshot.localVersion}, iis=${snapshot.serverVersion}`
      );
    }

    if (snapshot.isServerOutOfSyncWithApi) {
      console.warn(
        `IIS y API no coinciden: iis=${snapshot.serverVersion}, api=${snapshot.apiVersion}`
      );
    }

    if (snapshot.confirmedUpdateVersion) {
      console.log(
        `Nueva version confirmada para actualizar: ${snapshot.confirmedUpdateVersion}`
      );
    }

    if (!snapshot.apiVersion) {
      console.warn('La API no devolvio un despliegue activo para auditoria de version.');
    }
  }
}
