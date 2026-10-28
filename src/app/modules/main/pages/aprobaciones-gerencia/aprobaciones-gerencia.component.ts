import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AprobacionesAreaComponent } from '../aprobaciones-area/aprobaciones-area.component';

@Component({
  selector: 'app-aprobaciones-gerencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AprobacionesAreaComponent],
  templateUrl: './aprobaciones-gerencia.component.html',
  styleUrl: './aprobaciones-gerencia.component.scss',
})
export class AprobacionesGerenciaComponent {}
