import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import {
  DeploymentTrackingService,
  DeploymentRecord,
  VersionAuditSnapshot,
  VersionControlApi
} from '../../../../../../services/deployment-tracking.service';
import { VersionService } from '../../../../../../services/version.service';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-admin-version-api',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-version-api.component.html',
  styleUrls: ['./admin-version-api.component.scss']
})
export class AdminVersionApiComponent implements OnInit, OnDestroy {
  private deploymentSvc = inject(DeploymentTrackingService);
  private versionSvc = inject(VersionService);

  activeApi: VersionControlApi = 'LOGISTICA';
  defaultApi: VersionControlApi = ((environment as any).versionControlApi as VersionControlApi) || 'LOGISTICA';

  // URLs informativas
  logisticaUrl = environment.baseUrl + '/api/app-deployments';
  maestraUrl = environment.apiMaestra + '/api/app-deployments';

  // Datos de la prueba en vivo
  loading = false;
  localVersion = '';
  serverVersion: string | null = null;
  audit: VersionAuditSnapshot | null = null;
  currentDeployment: DeploymentRecord | null = null;

  private sub?: Subscription;

  ngOnInit(): void {
    this.activeApi = this.deploymentSvc.getActiveApi();
    this.sub = this.deploymentSvc.activeApi$.subscribe(api => (this.activeApi = api));
    void this.cargarEstado();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async cambiarApi(nueva: VersionControlApi) {
    if (nueva === this.activeApi) return;

    const result = await Swal.fire({
      title: '¿Cambiar la API de control de versiones?',
      html: `
        <p>Se usará: <b>${nueva === 'MAESTRA' ? 'API Maestra (api_maestros)' : 'API Logística (api_logistica)'}</b></p>
        <p style="font-size: 13px; color: #666;">
          El cambio aplica de inmediato para todas las consultas de versión en este navegador.
          Las demás funcionalidades de la app no se ven afectadas.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6'
    });

    if (!result.isConfirmed) return;

    this.deploymentSvc.setActiveApi(nueva);
    await Swal.fire({
      icon: 'success',
      title: 'API cambiada',
      text: `Ahora se usa: ${nueva}`,
      timer: 1500,
      showConfirmButton: false
    });

    await this.cargarEstado();
  }

  async cargarEstado() {
    this.loading = true;
    try {
      this.localVersion = await this.versionSvc.getLocalVersion();
      this.serverVersion = await this.versionSvc.getServerVersion();
      this.currentDeployment = await this.deploymentSvc.getCurrentDeployment();
      this.audit = await this.deploymentSvc.buildVersionAudit(this.localVersion, this.serverVersion);
    } catch (err) {
      console.error('Error cargando estado:', err);
    } finally {
      this.loading = false;
    }
  }

  apiLabel(api: VersionControlApi): string {
    return api === 'MAESTRA' ? 'API Maestra (POST + SP)' : 'API Logística (GET + SQL)';
  }

  apiUrl(api: VersionControlApi): string {
    return api === 'MAESTRA' ? this.maestraUrl : this.logisticaUrl;
  }
}
