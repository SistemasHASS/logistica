import { Component, Input, Output, EventEmitter, signal, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccordionGroupConfig, AccordionItemConfig, MenuType } from '../../../../services/layout-config.service';

type OpenState = Record<string, boolean>;

@Component({
  selector: 'app-dynamic-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dynamic-menu.component.html',
  styleUrl: './dynamic-menu.component.scss'
})
export class DynamicMenuComponent {
  @Input() menuType: MenuType = 'default';
  @Input() menuGroups: AccordionGroupConfig[] = [];
  @Input() contadorNotificaciones: number = 0;
  @Output() itemClick = new EventEmitter<void>();

  // Estados de apertura para grupos y submenús
  openState = signal<OpenState>({});

  ngOnChanges() {
    // No reiniciar estados existentes, solo inicializar nuevos
    this.openState.update(state => {
      const newState = { ...state };
      this.menuGroups.forEach(g => {
        if (!(g.id in newState)) {
          newState[g.id] = false;
        }
        g.items?.forEach(item => {
          if (item.submenu && !(item.id in newState)) {
            newState[item.id] = false;
          }
        });
      });
      return newState;
    });
  }

  toggle(key: string): void {
    this.openState.update(state => ({
      ...state,
      [key]: !state[key]
    }));
  }

  isOpen(key: string): boolean {
    return this.openState()[key] || false;
  }

  onItemClick(): void {
    this.itemClick.emit();
  }

  // Determina el tipo efectivo de un grupo (hereda del global si no tiene propio)
  getGroupTipo(grupo: AccordionGroupConfig): MenuType {
    return grupo.tipo || this.menuType;
  }

  isGroupAccordion(grupo: AccordionGroupConfig): boolean {
    return this.getGroupTipo(grupo) === 'accordion';
  }

  isGroupNav(grupo: AccordionGroupConfig): boolean {
    return this.getGroupTipo(grupo) === 'nav';
  }

  isGroupList(grupo: AccordionGroupConfig): boolean {
    return this.getGroupTipo(grupo) === 'list';
  }

  // Helpers para templates
  hasSubmenu(item: AccordionItemConfig): boolean {
    return !!item.submenu && item.submenu.length > 0;
  }

  trackGroup: TrackByFunction<AccordionGroupConfig> = (index, group) => group.id;
  trackItem: TrackByFunction<AccordionItemConfig> = (index, item) => item.id;
}
