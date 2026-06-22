import { Routes } from '@angular/router';
import { Error404PageComponent } from './shared/pages/error404-page/error404-page.component';
import { LayoutComponent } from './modules/main/pages/layout/layout.component';
import { ParametrosComponent } from './modules/main/pages/parametros/parametros.component';
import { RequerimientosComponent } from './modules/main/pages/requerimientos/requerimientos.component';
import { AprobacionesComponent } from './modules/main/pages/aprobaciones/aprobaciones.component';
import { NotificacionesListaComponent } from './modules/main/pages/notificaciones-lista/notificaciones-lista.component';
import { AprobadorGuard } from './modules/auth/guard/aprobador.guard';
import { AlmacenGuard } from './modules/auth/guard/almacen.guard';
import { OperativoGuard } from './modules/auth/guard/operativo.guard';
import { OperativoLogisticoGuard } from './modules/auth/guard/operativo-logistico.guard';
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
import { DespachoOriginalComponent } from './modules/main/pages/despachos-original/despacho-original.component';
import { ReporteSaldosComponent } from './modules/main/pages/reporte/reporte-saldos.component';
import { ReporteAprobadosComponent } from './modules/main/pages/reporte/reporte-aprobados.component';
import { ReporteDespachosComponent } from './modules/main/pages/reporte/reporte-despachos.component';
import { ListasStockComponent } from './modules/main/pages/listas-stock/listas-stock.component';
import { AprobadoresMantenedorComponent } from './modules/main/pages/aprobadores/aprobadores-mantenedor.component';
import { ConfigGuard } from './modules/auth/guard/config.guard';
import { ReporteRequerimientos } from './modules/main/pages/reporte-requerimientos/reporte-requerimientos';
import { AdminModule } from './modules/main/pages/administracion/admin.module';
import { AdminLoginComponent } from './modules/admin-login/admin-login.component';
import { SolicitudesCompraComponent } from './modules/main/pages/solicitudes-compra/solicitudes-compra.component';
import { KardexComponent } from './modules/main/pages/kardex/kardex.component';
import { CotizacionesComponent } from './modules/main/pages/cotizaciones/cotizaciones.component';
import { OrdenesCompraComponent } from './modules/main/pages/ordenes-compra/ordenes-compra.component';
import { RecepcionMercaderiaComponent } from './modules/main/pages/recepcion-mercaderia/recepcion-mercaderia.component';
import { ConformidadAlmacenComponent } from './modules/main/pages/conformidad-almacen/conformidad-almacen.component';
import { TransferenciasAlmacenComponent } from './modules/main/pages/transferencias-almacen/transferencias-almacen.component';
import { DashboardComprasComponent } from './modules/main/pages/dashboard-compras/dashboard-compras.component';
import { GestionInventarioComponent } from './modules/main/pages/gestion-inventario/gestion-inventario.component';
import { MaestroProveedoresComponent } from './modules/main/pages/maestro-proveedores/maestro-proveedores.component';
import { DevolucionesProveedoresComponent } from './modules/main/pages/devoluciones-proveedores/devoluciones-proveedores.component';
import { DevolucionesConsumoComponent } from './modules/main/pages/devoluciones-consumo/devoluciones-consumo.component';
import { ReingresosComponent } from './modules/main/pages/reingresos/reingresos.component';
import { ReportesComprasComponent } from './modules/main/pages/reportes-compras/reportes-compras.component';
import { EvaluacionProveedoresComponent } from './modules/main/pages/evaluacion-proveedores/evaluacion-proveedores.component';
import { ConsolidacionRequerimientosComponent } from './modules/main/pages/consolidacion-requerimientos/consolidacion-requerimientos.component';
import { LogisticoGuard } from './modules/auth/guard/logistico.guard';
import { SaldoRequerimientoComponent } from './modules/main/pages/saldo-requerimiento/saldo-requerimiento.component';
import { DashboardLogisticaComponent } from './modules/main/pages/dashboard-logistica/dashboard-logistica.component';
import { DashboardOplogistComponent } from './modules/main/pages/dashboard-oplogist/dashboard-oplogist.component';
import { DashboardJlologistComponent } from './modules/main/pages/dashboard-jlologist/dashboard-jlologist.component';
import { DashboardJemlogistComponent } from './modules/main/pages/dashboard-jemlogist/dashboard-jemlogist.component';
import { DashboardAdlogistComponent } from './modules/main/pages/dashboard-adlogist/dashboard-adlogist.component';
import { DashboardTilogistComponent } from './modules/main/pages/dashboard-tilogist/dashboard-tilogist.component';
import { DashboardDespachoComponent } from './modules/main/pages/dashboard-despacho/dashboard-despacho.component';
import { DashboardFinanzasComponent } from './modules/main/pages/dashboard-finanzas/dashboard-finanzas.component';
import { AprobacionesAreaComponent } from './modules/main/pages/aprobaciones-area/aprobaciones-area.component';
import { DashboardAprobacionesAreaComponent } from './modules/main/pages/dashboard-aprobaciones-area/dashboard-aprobaciones-area.component';
import { ReporteAprobacionesAreaComponent } from './modules/main/pages/reporte-aprobaciones-area/reporte-aprobaciones-area.component';
import { AprobacionesOCComponent } from './modules/main/pages/aprobaciones-oc/aprobaciones-oc.component';
import { AprobacionesOSComponent } from './modules/main/pages/aprobaciones-os/aprobaciones-os.component';
import { SolicitudesServicioComponent } from './modules/main/pages/solicitudes-servicio/solicitudes-servicio.component';
import { OrdenesServicioComponent } from './modules/main/pages/ordenes-servicio/ordenes-servicio.component';
import { DevolucionConsumoGuard, ReingresoGuard } from './modules/main/guards/role.guard';
import { AprobadorOCGuard } from './modules/auth/guard/aprobador-oc.guard';
import { ConsolidacionComprasComponent } from './modules/main/pages/consolidacion-compras/consolidacion-compras.component';
import { ConsolidacionServiciosComponent } from './modules/main/pages/consolidacion-servicios/consolidacion-servicios.component';
import { AdminLogisticaComponent } from './modules/main/pages/admin-logistica/admin-logistica.component';
import { AdminLogisticaGuard } from './modules/auth/guard/admin-logistica.guard';
import { ConformidadServiciosComponent } from './modules/main/pages/conformidad-servicios/conformidad-servicios.component';
import { ConformidadServiciosGuard } from './modules/auth/guard/conformidad-servicios.guard';
import { CatalogoItemsComponent } from './modules/main/pages/catalogo-items/catalogo-items.component';

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
    path: 'admin-logistica',
    loadChildren: () => import('./modules/admin-logistica/admin-logistica.routes').then(m => m.adminLogisticaRoutes)
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
      { path: 'notificaciones', component: NotificacionesListaComponent, canActivate: [OperativoEmpaqueGuard] },
      // { path: 'saldo-requerimiento', component: SaldoRequerimientoComponent, canActivate: [OperativoEmpaqueGuard] },
      { path: 'solicitudes-compra', component: SolicitudesCompraComponent, canActivate: [LogisticoGuard] },
      { path: 'dashboard-logistica', component: DashboardLogisticaComponent, canActivate: [LogisticoGuard] },
      { path: 'dashboard-oplogist', component: DashboardOplogistComponent, canActivate: [OperativoLogisticoGuard] },
      { path: 'dashboard-compras', component: DashboardComprasComponent, canActivate: [LogisticoGuard] },
      { path: 'dashboard-jlologist', component: DashboardJlologistComponent, canActivate: [LogisticoGuard] },
      { path: 'dashboard-jemlogist', component: DashboardJemlogistComponent, canActivate: [LogisticoGuard] },
      { path: 'dashboard-adlogist', component: DashboardAdlogistComponent, canActivate: [AdministradorGuard] },
      { path: 'dashboard-tilogist', component: DashboardTilogistComponent, canActivate: [AdministradorGuard] },
      { path: 'dashboard-despacho', component: DashboardDespachoComponent, canActivate: [AlmacenGuard] },
      { path: 'dashboard-finanzas', component: DashboardFinanzasComponent, canActivate: [AprobadorOCGuard] },
      { path: 'dashboard-aprobaciones-area', component: DashboardAprobacionesAreaComponent, canActivate: [AprobadorGuard] },
      { path: 'cotizaciones', component: CotizacionesComponent, canActivate: [LogisticoGuard] },
      { path: 'ordenes-compra', component: OrdenesCompraComponent, canActivate: [LogisticoGuard] },
      { path: 'recepcion-mercaderia', component: RecepcionMercaderiaComponent, canActivate: [AlmacenGuard] },
      { path: 'conformidad-almacen', component: ConformidadAlmacenComponent, canActivate: [DevolucionConsumoGuard] },
      { path: 'devoluciones-proveedores', component: DevolucionesProveedoresComponent, canActivate: [AlmacenGuard] },
      { path: 'devoluciones-consumo', component: DevolucionesConsumoComponent, canActivate: [DevolucionConsumoGuard] },
      { path: 'reingresos', component: ReingresosComponent, canActivate: [ReingresoGuard] },
      { path: 'reportes-compras', component: ReportesComprasComponent, canActivate: [LogisticoGuard] },
      { path: 'gestion-inventario', component: GestionInventarioComponent, canActivate: [AlmacenGuard] },
      { path: 'kardex', component: KardexComponent, canActivate: [AlmacenGuard] },
      { path: 'aprobaciones', component: AprobacionesComponent, canActivate: [AprobadorGuard] },
      { path: 'aprobaciones-oc', component: AprobacionesOCComponent, canActivate: [AprobadorOCGuard] },
      { path: 'aprobaciones-os', component: AprobacionesOSComponent, canActivate: [AprobadorOCGuard] },
      { path: 'solicitudes-servicio', component: SolicitudesServicioComponent, canActivate: [LogisticoGuard] },
      { path: 'ordenes-servicio', component: OrdenesServicioComponent, canActivate: [LogisticoGuard] },
      { path: 'aprobaciones-area', component: AprobacionesAreaComponent, canActivate: [AprobadorGuard] },
      { path: 'reporte-aprobaciones-area', component: ReporteAprobacionesAreaComponent, canActivate: [AprobadorGuard] },
      { path: 'reporte-aprobados', component: ReporteAprobadosComponent, canActivate: [AprobadorGuard] },
      { path: 'listas-stock', component: ListasStockComponent, canActivate: [AlmacenGuard] },
      { path: 'despachos', component: DespachoComponent, canActivate: [AlmacenGuard] },
      { path: 'despachos-original', component: DespachoOriginalComponent, canActivate: [AlmacenGuard] },
      { path: 'transferencias-almacen', component: TransferenciasAlmacenComponent, canActivate: [AlmacenGuard] },
      { path: 'reporte_logistico', component: ReporteLogisticoComponent },
      { path: 'reporte-saldos', component: ReporteSaldosComponent, canActivate: [AlmacenGuard] },
      { path: 'reporte-despachos', component: ReporteDespachosComponent, canActivate: [AlmacenGuard] },
      { path: 'reporte-requerimientos', component: ReporteRequerimientos },
      { path: 'consolidacion-requerimientos', component: ConsolidacionRequerimientosComponent, canActivate: [LogisticoGuard] },
      { path: 'consolidacion-compras', component: ConsolidacionComprasComponent, canActivate: [LogisticoGuard] },
      { path: 'consolidacion-servicios', component: ConsolidacionServiciosComponent, canActivate: [LogisticoGuard] },
      { path: 'conformidad-servicios', component: ConformidadServiciosComponent, canActivate: [ConformidadServiciosGuard] },
      { path: 'catalogo-items', component: CatalogoItemsComponent },
      { path: '**', redirectTo: 'auth/login' }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '404',
  }
];
