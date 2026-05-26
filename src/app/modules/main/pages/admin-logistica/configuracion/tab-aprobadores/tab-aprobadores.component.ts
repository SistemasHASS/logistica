import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AprobadoresMantenedorComponent } from '@/app/modules/main/pages/aprobadores/aprobadores-mantenedor.component';

@Component({
  selector: 'app-tab-aprobadores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AprobadoresMantenedorComponent],
  templateUrl: './tab-aprobadores.component.html',
  styleUrl: './tab-aprobadores.component.scss',
})
export class TabAprobadoresComponent {}
