import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigGuard implements CanActivate {

  constructor(
    private dexieService: DexieService,
    private alertService: AlertService,
    private router: Router
  ) { }

  async canActivate(): Promise<boolean> {
    const config = await this.dexieService.obtenerConfiguracion();

    if (!config || config.length === 0) {

      this.alertService.showAlert(
        'Falta configurar',
        'Debe sincronizar y guardar la configuración antes de continuar.',
        'warning'
      );

      this.router.navigate(['/main/parametros']);
      return false;
    }

    return true;
  }

}
