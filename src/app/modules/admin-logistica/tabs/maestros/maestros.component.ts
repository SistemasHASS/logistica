import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { MaestrosItemsComponent } from '@/app/modules/main/pages/maestros/items/maestros-items.component';
import { MaestrosComoditiesComponent } from '@/app/modules/main/pages/maestros/comodities/maestros-comodities.component';
import { MaestrosUnidadesMedidaComponent } from '@/app/modules/main/pages/maestros/unidades-medida/maestros-unidades-medida.component';

type ActiveTab = 'items' | 'comodities' | 'unidades';

@Component({
  selector: 'app-maestros',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MaestrosItemsComponent, MaestrosComoditiesComponent, MaestrosUnidadesMedidaComponent],
  templateUrl: './maestros.component.html',
  styleUrl: './maestros.component.scss',
})
export class MaestrosComponent {
  activeTab = signal<ActiveTab>('items');

  setTab(tab: ActiveTab) {
    this.activeTab.set(tab);
  }
}
