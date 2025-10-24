import { Routes } from '@angular/router';
import { Error404PageComponent } from './shared/pages/error404-page/error404-page.component';
import { LayoutComponent } from './modules/main/pages/layout/layout.component';
import { ParametrosComponent } from './modules/main/pages/parametros/parametros.component';
import { RequerimientoConsumoComponent } from './modules/main/pages/requerimiento_consumo/requerimiento_consumo.component';
import { RequerimientoTransferenciaComponent } from './modules/main/pages/requerimiento_transferencia/requerimiento_transferencia.component';
import { AuthGuard } from './modules/auth/guard/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: '404',
    component: Error404PageComponent,
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'main',
    component: LayoutComponent,
    children: [
      { path: 'parametros', component: ParametrosComponent },
      { path: 'requerimiento_consumo', component: RequerimientoConsumoComponent },
      { path: 'requerimiento_transferencia', component: RequerimientoTransferenciaComponent },
      { path: 'requerimiento_transferencia', component: RequerimientoTransferenciaComponent },
      { path: 'aprobaciones', component: RequerimientoTransferenciaComponent },
      { path: 'reportes', component: RequerimientoTransferenciaComponent },
      { path: '**', redirectTo: 'auth/login' }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '404',
  }
];
