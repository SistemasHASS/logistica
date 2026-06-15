import { Routes } from '@angular/router';

export const MENU_DINAMICO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/menu-roles/menu-roles.component')
      .then(c => c.MenuRolesComponent),
    data: {
      title: 'Menú Dinámico',
      description: 'Sistema de menús dinámicos por roles (excluye JLOLOGIST)'
    }
  }
];
