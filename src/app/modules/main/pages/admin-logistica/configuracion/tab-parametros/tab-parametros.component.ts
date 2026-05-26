import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Component({
  selector: 'app-tab-parametros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-parametros.component.html',
  styleUrl: './tab-parametros.component.scss',
})
export class TabParametrosComponent {
  private dexieService = inject(DexieService);
  usuario = signal<any>(null);

  async ngOnInit() {
    const user = await this.dexieService.showUsuario();
    this.usuario.set(user);
  }
}
