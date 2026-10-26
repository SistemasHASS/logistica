import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AprobacionesAreaComponent } from '@/app/modules/main/pages/aprobaciones-area/aprobaciones-area.component';

@Component({
  selector: 'app-aprobar-gerencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AprobacionesAreaComponent],
  templateUrl: './aprobar-gerencia.component.html',
  styleUrl: './aprobar-gerencia.component.scss',
})
export class AprobarGerenciaComponent {}
