import { Component, Input, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

type MenuType = 'accordion' | 'nav' | 'list' | 'default';

interface MenuItem {
  id: string;
  nombre: string;
  icono: string;
  ruta?: string;
  activo: boolean;
  orden: number;
  submenu?: MenuItem[];
}

interface MenuGroup {
  id: string;
  label: string;
  icono: string;
  activo: boolean;
  orden: number;
  tipo?: MenuType;
  items: MenuItem[];
}

/**
 * Componente de menú dinámico - NUEVO SISTEMA COMPLETAMENTE SEPARADO
 * No afecta al sistema existente de JLOLOGIST
 * Se usará en el futuro cuando se quiera implementar el nuevo sistema
 */
@Component({
  selector: 'app-menu-dinamico-nuevo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="menu-dinamico-nuevo">
      <div class="header">
        <h3>Menú Dinámico Nuevo (Sistema Separado)</h3>
        <p>Este es un componente completamente separado del sistema existente.</p>
        <p>No afecta a JLOLOGIST ni al sistema actual.</p>
      </div>
      
      <div class="content">
        <p>Para usar este sistema:</p>
        <ol>
          <li>Ejecutar SQL: 701_TABLA_CONFIG_MENU_NUEVO.sql</li>
          <li>Configurar roles en este componente</li>
          <li>Usar endpoints: /api/configmenu/*</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .menu-dinamico-nuevo {
      padding: 20px;
      border: 2px dashed #00a884;
      border-radius: 8px;
      background: rgba(0, 168, 132, 0.05);
    }
    .header h3 {
      color: #00a884;
      margin: 0 0 10px 0;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .content {
      margin-top: 15px;
      padding: 15px;
      background: white;
      border-radius: 6px;
    }
    .content ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .content li {
      margin: 5px 0;
    }
  `]
})
export class MenuDinamicoNuevoComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Inputs para configuración futura
  @Input() idrol: string = '';
  @Input() menuType: MenuType = 'default';
  @Input() menuGroups: MenuGroup[] = [];

  baseUrl = environment.baseUrl;
}
