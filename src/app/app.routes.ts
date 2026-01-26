import { Routes } from '@angular/router';
import { Error404PageComponent } from './shared/pages/error404-page/error404-page.component';
import { LayoutComponent } from './modules/main/pages/layout/layout.component';
import { ParametrosComponent } from './modules/main/pages/parametros/parametros.component';
import { RequerimientosComponent } from './modules/main/pages/requerimientos/requerimientos.component';
import { AprobacionesComponent } from './modules/main/pages/aprobaciones/aprobaciones.component';
import { AprobadorGuard } from './modules/auth/guard/aprobador.guard';
import { AlmacenGuard } from './modules/auth/guard/almacen.guard';
import { OperativoGuard } from './modules/auth/guard/operativo.guard';
import { EmpaqueGuard } from './modules/auth/guard/empaque.guard';
import { OperativoEmpaqueGuard } from './modules/auth/guard/operativo-empaque.guard';
import { AdministradorGuard } from './modules/auth/guard/administrador.guard';
import { AdminGuard } from './modules/auth/guard/admin.guard';
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
import { ConfigGuard } from './modules/auth/guard/config.guard';
import { ReporteRequerimientos } from './modules/main/pages/reporte-requerimientos/reporte-requerimientos';
import { AdminModule } from './modules/main/pages/administracion/admin.module';
import { AdminLoginComponent } from './modules/admin-login/admin-login.component';
import { SolicitudesCompraComponent } from './modules/main/pages/solicitudes-compra/solicitudes-compra.component';
import { CotizacionesComponent } from './modules/main/pages/cotizaciones/cotizaciones.component';
import { OrdenesCompraComponent } from './modules/main/pages/ordenes-compra/ordenes-compra.component';
import { RecepcionMercaderiaComponent } from './modules/main/pages/recepcion-mercaderia/recepcion-mercaderia.component';
import { DashboardComprasComponent } from './modules/main/pages/dashboard-compras/dashboard-compras.component';
import { GestionInventarioComponent } from './modules/main/pages/gestion-inventario/gestion-inventario.component';
import { MaestroProveedoresComponent } from './modules/main/pages/maestro-proveedores/maestro-proveedores.component';
import { DevolucionesProveedoresComponent } from './modules/main/pages/devoluciones-proveedores/devoluciones-proveedores.component';
import { ReportesComprasComponent } from './modules/main/pages/reportes-compras/reportes-compras.component';
import { EvaluacionProveedoresComponent } from './modules/main/pages/evaluacion-proveedores/evaluacion-proveedores.component';


export const routes: Routes = [
  {
    path: 'admin-login',
    component: AdminLoginComponent
  },
  {
    path: 'administracion',
    loadChildren: () =>
      import('./modules/main/pages/administracion/admin.module')
        .then(m => m.AdminModule),
    canActivate: [AdminGuard]
  },
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
      { path: 'maestro-proveedores', component: MaestroProveedoresComponent, canActivate: [AlmacenGuard] },
      { path: 'evaluacion-proveedores', component: EvaluacionProveedoresComponent, canActivate: [AlmacenGuard] },
      // { path: 'parametros', component: ParametrosComponent, canActivate: [OperativoGuard] },
      { path: 'parametros', component: ParametrosComponent, canActivate: [OperativoEmpaqueGuard] },
      // { path: 'requerimientos', component: RequerimientosComponent, canActivate: [OperativoGuard, ConfigGuard] },
      { path: 'requerimientos', component: RequerimientosComponent, canActivate: [OperativoEmpaqueGuard, ConfigGuard] },
      { path: 'solicitudes-compra', component: SolicitudesCompraComponent, canActivate: [AlmacenGuard] },
      { path: 'cotizaciones', component: CotizacionesComponent, canActivate: [AlmacenGuard] },
      { path: 'ordenes-compra', component: OrdenesCompraComponent, canActivate: [AlmacenGuard] },
      { path: 'recepcion-mercaderia', component: RecepcionMercaderiaComponent, canActivate: [AlmacenGuard] },
      { path: 'devoluciones-proveedores', component: DevolucionesProveedoresComponent, canActivate: [AlmacenGuard] },
      { path: 'reportes-compras', component: ReportesComprasComponent, canActivate: [AlmacenGuard] },
      { path: 'gestion-inventario', component: GestionInventarioComponent, canActivate: [AlmacenGuard] },
      { path: 'aprobaciones', component: AprobacionesComponent, canActivate: [AprobadorGuard] },
      { path: 'reporte-aprobados', component: ReporteAprobadosComponent, canActivate: [AprobadorGuard] },
      // { path: 'listas-stock', component: ListasStockComponent, canActivate: [AlmacenGuard] },
      { path: 'despachos', component: DespachoComponent, canActivate: [AlmacenGuard] },
      { path: 'reporte_logistico', component: ReporteLogisticoComponent },
      { path: 'reporte-saldos', component: ReporteSaldosComponent, canActivate: [AlmacenGuard] },
      { path: 'reporte-requerimientos', component: ReporteRequerimientos },
      { path: '**', redirectTo: 'auth/login' }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '404',
  }
];
