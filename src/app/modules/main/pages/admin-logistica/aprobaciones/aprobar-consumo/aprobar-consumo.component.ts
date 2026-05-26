import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AprobacionesAreaComponent } from '@/app/modules/main/pages/aprobaciones-area/aprobaciones-area.component';

@Component({
  selector: 'app-aprobar-consumo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AprobacionesAreaComponent],
  templateUrl: './aprobar-consumo.component.html',
  styleUrl: './aprobar-consumo.component.scss',
})
export class AprobarConsumoComponent {}
