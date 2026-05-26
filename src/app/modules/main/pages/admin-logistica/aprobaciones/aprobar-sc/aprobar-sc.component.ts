import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AprobacionesSCComponent } from '@/app/modules/main/pages/aprobaciones-sc/aprobaciones-sc.component';

@Component({
  selector: 'app-aprobar-sc',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AprobacionesSCComponent],
  templateUrl: './aprobar-sc.component.html',
  styleUrl: './aprobar-sc.component.scss',
})
export class AprobarScComponent {}
