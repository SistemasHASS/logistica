import { Routes } from '@angular/router';
import { AdminLogisticaAuthGuard } from './auth/admin-logistica-auth.guard';
import { AdminLogisticaLayoutComponent } from './layout/admin-logistica-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const adminLogisticaRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: AdminLogisticaLayoutComponent,
    canActivate: [AdminLogisticaAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { 
        path: 'bandeja', 
        loadComponent: () => import('./tabs/bandeja-aprobaciones/bandeja-aprobaciones.component').then(m => m.BandejaAprobacionesComponent) 
      },
      { 
        path: 'aprobar-consumo', 
        loadComponent: () => import('./tabs/aprobar-consumo/aprobar-consumo.component').then(m => m.AprobarConsumoComponent) 
      },
      {
        path: 'aprobar-sc',
        loadComponent: () => import('./tabs/aprobar-sc/aprobar-sc.component').then(m => m.AprobarScComponent)
      },
      {
        path: 'aprobar-ss',
        loadComponent: () => import('./tabs/aprobar-ss/aprobar-ss.component').then(m => m.AprobarSsComponent)
      },
      {
        path: 'maestros',
        loadComponent: () => import('./tabs/maestros/maestros.component').then(m => m.MaestrosComponent)
      },
      {
        path: 'proveedores',
        loadComponent: () => import('./tabs/proveedores/proveedores.component').then(m => m.ProveedoresComponent)
      },
      { 
        path: 'usuarios', 
        loadComponent: () => import('../main/pages/admin-logistica/configuracion/tab-usuarios/tab-usuarios.component').then(m => m.TabUsuariosComponent) 
      },
      { 
        path: 'pdf', 
        loadComponent: () => import('./tabs/pdf/pdf.component').then(m => m.PdfComponent) 
      },
      {
        path: 'empresa',
        loadComponent: () => import('./tabs/empresa/empresa.component').then(m => m.EmpresaComponent)
      },
      { 
        path: 'parametros', 
        loadComponent: () => import('./tabs/parametros/parametros.component').then(m => m.ParametrosComponent) 
      },
      { 
        path: 'aprobadores', 
        loadComponent: () => import('./tabs/aprobadores/aprobadores.component').then(m => m.AprobadoresComponent) 
      },
      { 
        path: 'auditoria', 
        loadComponent: () => import('./tabs/auditoria/auditoria.component').then(m => m.AuditoriaComponent) 
      },
      { 
        path: 'areas', 
        loadComponent: () => import('./configuracion/areas/areas.component').then(m => m.AreasComponent) 
      },
      { 
        path: 'usuario-area', 
        loadComponent: () => import('./configuracion/usuario-area/usuario-area.component').then(m => m.UsuarioAreaComponent) 
      },
      { 
        path: 'flujo-aprobacion-area', 
        loadComponent: () => import('./configuracion/flujo-aprobacion-area/flujo-aprobacion-area.component').then(m => m.FlujoAprobacionAreaComponent) 
      },
      {
        path: 'almacen',
        loadComponent: () => import('./tabs/almacen/almacen.component').then(m => m.AlmacenComponent)
      },
    ]
  }
];
