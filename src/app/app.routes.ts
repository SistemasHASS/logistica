import { Routes } from '@angular/router';
import { Error404PageComponent } from './shared/pages/error404-page/error404-page.component';
import { LayoutComponent } from './modules/main/pages/layout/layout.component';
import { ParametrosComponent } from './modules/main/pages/parametros/parametros.component';
import { RequerimientosComponent } from './modules/main/pages/requerimientos/requerimientos.component';
import { AprobacionesComponent } from './modules/main/pages/aprobaciones/aprobaciones.component';
import { AprobadorGuard } from './modules/auth/guard/aprobador.guard';
import { AlmacenGuard } from './modules/auth/guard/almacen.guard';
import { OperativoGuard } from './modules/auth/guard/operativo.guard';
import { AdministradorGuard } from './modules/auth/guard/administrador.guard';
import { AuthGuard } from './modules/auth/guard/auth.guard';
import { ReporteLogisticoComponent } from './modules/main/pages/reporte_logistico/reporte_logistico.component';
import { MaestrosComponent } from './modules/main/pages/maestros/maestros.component';
import { MaestrosItemsComponent } from './modules/main/pages/maestros/items/maestros-items.component';
import { MaestrosComoditiesComponent } from './modules/main/pages/maestros/comodities/maestros-comodities.component';
import { DespachoComponent } from './modules/main/pages/despachos/despacho.component';
import { ReporteSaldosComponent } from './modules/main/pages/reporte/reporte-saldos.component';
import { ReporteAprobadosComponent } from './modules/main/pages/reporte/reporte-aprobados.component';
import { ListasStockComponent } from './modules/main/pages/listas-stock/listas-stock.component';
import { AprobadoresMantenedorComponent } from './modules/main/pages/aprobadores/aprobadores-mantenedor.component';

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
      {
        path: 'maestros',
        component: MaestrosComponent,
        canActivate: [AdministradorGuard],
        children: [
          { path: '', redirectTo: 'items', pathMatch: 'full' }, // ✅ ruta por defecto
          { path: 'items', component: MaestrosItemsComponent },
          { path: 'comodities', component: MaestrosComoditiesComponent },
        ]
      },
      { path: 'aprobadores', component: AprobadoresMantenedorComponent, canActivate: [AdministradorGuard] },
      { path: 'parametros', component: ParametrosComponent, canActivate: [OperativoGuard] },
      { path: 'requerimientos', component: RequerimientosComponent, canActivate: [OperativoGuard] },
      { path: 'aprobaciones', component: AprobacionesComponent, canActivate: [AprobadorGuard] },
      { path: 'reporte-aprobados', component: ReporteAprobadosComponent, canActivate: [AprobadorGuard] },
      { path: 'listas-stock', component: ListasStockComponent, canActivate: [AlmacenGuard] },
      { path: 'despachos', component: DespachoComponent, canActivate: [AlmacenGuard] },
      { path: 'reporte_logistico', component: ReporteLogisticoComponent },
      { path: 'reporte-saldos', component: ReporteSaldosComponent, canActivate: [AlmacenGuard] },
      { path: '**', redirectTo: 'auth/login' }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '404',
  }
];
