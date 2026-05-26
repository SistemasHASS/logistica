import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaestroProveedoresComponent } from '@/app/modules/main/pages/maestro-proveedores/maestro-proveedores.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, MaestroProveedoresComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProveedoresComponent {}
