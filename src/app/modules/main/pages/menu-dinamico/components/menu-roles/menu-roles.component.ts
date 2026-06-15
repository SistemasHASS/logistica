import { Component, Input, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AccordionGroupConfig, AccordionItemConfig, MenuType } from '../../../../services/layout-config.service';

type MenuState = {
  openGroups: Set<string>;
  openSubmenus: Map<string, Set<string>>;
};

/**
 * Componente de menú por roles - NUEVO SISTEMA
 * Excluye JLOLOGIST (usa sistema legacy)
 * Soporta: accordion, nav, list, default
 * Submenús recursivos con tipos por grupo
 */
@Component({
  selector: 'app-menu-roles',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu-roles.component.html',
  styleUrls: ['./menu-roles.component.scss']
})
export class MenuRolesComponent {
  private router = inject(Router);

  // Inputs
  @Input() menuType: MenuType = 'default';
  @Input() menuGroups: AccordionGroupConfig[] = [];
  @Input() idrol: string = ''; // Para validación (no debe ser JLOLOGIST)

  // Estado de apertura de grupos (solo para accordion)
  openGroups = signal<Set<string>>(new Set());

  // Estado de apertura de submenús por grupo
  openSubmenus = signal<Map<string, Set<string>>>(new Map());

  ngOnInit() {
    // Validación: JLOLOGIST no debe usar este componente
    if (this.idrol === 'JLOLOGIST') {
      console.warn('MenuRolesComponent: JLOLOGIST debe usar sistema legacy');
      return;
    }
    
    // Abrir primer grupo por defecto si es accordion
    if (this.menuType === 'accordion' && this.menuGroups.length > 0) {
      const firstGroup = this.menuGroups[0];
      if (firstGroup?.activo) {
        this.openGroups.update(set => new Set([...set, firstGroup.id]));
      }
    }
  }

  // Toggle grupo (accordion)
  toggleGroup(groupId: string) {
    this.openGroups.update(set => {
      const newSet = new Set(set);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }

  // Verificar si grupo está abierto
  isGroupOpen(groupId: string): boolean {
    return this.openGroups().has(groupId);
  }

  // Toggle submenu
  toggleSubmenu(groupId: string, itemId: string, event?: Event) {
    event?.stopPropagation();
    
    this.openSubmenus.update(map => {
      const newMap = new Map(map);
      const currentSet = newMap.get(groupId) || new Set();
      const newSet = new Set(currentSet);
      
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      
      newMap.set(groupId, newSet);
      return newMap;
    });
  }

  // Verificar si submenu está abierto
  isSubmenuOpen(groupId: string, itemId: string): boolean {
    return this.openSubmenus().get(groupId)?.has(itemId) || false;
  }

  // Navegar a ruta
  navigateTo(route: string | undefined, event?: Event) {
    event?.stopPropagation();
    if (route) {
      this.router.navigate([route]);
    }
  }

  // Verificar si hay submenús
  hasSubmenu(item: AccordionItemConfig): boolean {
    return !!item.submenu && item.submenu.length > 0;
  }

  // Obtener items activos de un grupo
  getActiveItems(group: AccordionGroupConfig): AccordionItemConfig[] {
    return group.items.filter((item: AccordionItemConfig) => item.activo).sort((a: AccordionItemConfig, b: AccordionItemConfig) => a.orden - b.orden);
  }

  // Track by para optimización
  trackByGroupId(index: number, group: AccordionGroupConfig): string {
    return group.id;
  }

  trackByItemId(index: number, item: AccordionItemConfig): string {
    return item.id;
  }
}
