import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Component({
  selector: 'app-admin-logistica',
  templateUrl: './admin-logistica.component.html',
  styleUrl: './admin-logistica.component.scss',
  standalone: true,
  imports: [RouterModule, CommonModule],
})
export class AdminLogisticaComponent {
  private router = inject(Router);
  private dexieService = inject(DexieService);

  usuario = signal<any>(null);
  currentTab = signal('bandeja');

  constructor() {
    this.loadUsuario();
    this.setupRouterListener();
  }

  async loadUsuario() {
    const user = await this.dexieService.showUsuario();
    this.usuario.set(user);
  }

  setupRouterListener() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        if (url.includes('/bandeja')) {
          this.currentTab.set('bandeja');
        } else if (url.includes('/aprobar-consumo')) {
          this.currentTab.set('aprobar-consumo');
        } else if (url.includes('/aprobar-sc')) {
          this.currentTab.set('aprobar-sc');
        } else if (url.includes('/maestros')) {
          this.currentTab.set('maestros');
        } else if (url.includes('/usuarios')) {
          this.currentTab.set('usuarios');
        } else if (url.includes('/pdf')) {
          this.currentTab.set('pdf');
        } else if (url.includes('/parametros')) {
          this.currentTab.set('parametros');
        } else if (url.includes('/aprobadores')) {
          this.currentTab.set('aprobadores');
        } else if (url.includes('/auditoria')) {
          this.currentTab.set('auditoria');
        }
      }
    });
  }

  canSeeUsuarios(): boolean {
    const rol = this.usuario()?.idrol ?? '';
    return rol.includes('TILOGIST') || rol.includes('ADLOGIST');
  }

  canSeeParametros(): boolean {
    const rol = this.usuario()?.idrol ?? '';
    return rol.includes('TILOGIST') || rol.includes('ADLOGIST');
  }

  canSeeAprobadores(): boolean {
    const rol = this.usuario()?.idrol ?? '';
    return rol.includes('TILOGIST') || rol.includes('ADLOGIST');
  }

  canSeeAuditoria(): boolean {
    const rol = this.usuario()?.idrol ?? '';
    return rol.includes('TILOGIST') || rol.includes('ADLOGIST');
  }
}
