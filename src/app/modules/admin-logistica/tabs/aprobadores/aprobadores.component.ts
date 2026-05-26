import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AprobadoresMantenedorComponent } from '@/app/modules/main/pages/aprobadores/aprobadores-mantenedor.component';

@Component({
  selector: 'app-aprobadores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AprobadoresMantenedorComponent],
  templateUrl: './aprobadores.component.html',
  styleUrl: './aprobadores.component.scss',
})
export class AprobadoresComponent {}
