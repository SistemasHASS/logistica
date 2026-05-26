import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AprobacionesOSComponent } from '@/app/modules/main/pages/aprobaciones-os/aprobaciones-os.component';

@Component({
  selector: 'app-aprobar-ss',
  standalone: true,
  imports: [CommonModule, AprobacionesOSComponent],
  templateUrl: './aprobar-ss.component.html',
  styleUrls: ['./aprobar-ss.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AprobarSsComponent {}
