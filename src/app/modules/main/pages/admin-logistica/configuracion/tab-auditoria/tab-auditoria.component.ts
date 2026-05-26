import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Component({
  selector: 'app-tab-auditoria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-auditoria.component.html',
  styleUrl: './tab-auditoria.component.scss',
})
export class TabAuditoriaComponent {
  private dexieService = inject(DexieService);
  usuario = signal<any>(null);

  async ngOnInit() {
    const user = await this.dexieService.showUsuario();
    this.usuario.set(user);
  }
}
