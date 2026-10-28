import { Component } from '@angular/core';
import { AprobacionesAreaComponent } from '@/app/modules/main/pages/aprobaciones-area/aprobaciones-area.component';

@Component({
  selector: 'app-aprobar-gerencia',
  standalone: true,
  imports: [AprobacionesAreaComponent],
  templateUrl: './aprobar-gerencia.component.html',
  styleUrl: './aprobar-gerencia.component.scss',
})
export class AprobarGerenciaComponent {}
