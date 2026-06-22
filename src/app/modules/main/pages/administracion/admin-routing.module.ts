import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './pages/admin-layout/admin-layout.component';
import { AdminUsuariosComponent } from './pages/admin-usuarios/admin-usuarios.component';
import { AdminPerfilesComponent } from './pages/admin-perfiles/admin-perfiles.component';
import { AdminFlujosComponent } from './pages/admin-flujos/admin-flujos.component';
import { AdminAreasComponent } from './pages/admin-areas/admin-areas.component';
import { AdminRolesComponent } from './pages/admin-roles/admin-roles.component';
import { AdminAprobadoresComponent } from './pages/admin-aprobadores/admin-aprobadores.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsuariosPorAreaComponent } from './pages/usuarios-por-area/usuarios-por-area.component';
import { AdminVersionApiComponent } from './pages/admin-version-api/admin-version-api.component';
import { AdminProveedoresEmailComponent } from './pages/admin-proveedores-email/admin-proveedores-email.component';
import { AdminConfigSmtpComponent } from './pages/admin-config-smtp/admin-config-smtp.component';
import { AdminPlantillaCorreoComponent } from './pages/admin-plantilla-correo/admin-plantilla-correo.component';
import { AdminPlantillaPdfComponent } from './pages/admin-plantilla-pdf/admin-plantilla-pdf.component';
import { ConfiguracionColoresComponent } from './pages/configuracion-colores/configuracion-colores.component';
import { AdminPermisosRolesComponent } from './pages/admin-permisos-roles/admin-permisos-roles.component';
import { AdminMenusLayoutComponent } from './pages/admin-menus-layout/admin-menus-layout.component';
import { AdminMenusDinamicosComponent } from './pages/admin-menus-dinamicos/admin-menus-dinamicos.component';
import { AdminEmpresasComponent } from './pages/admin-empresas/admin-empresas.component';
import { AdminPermisosMenuDinamicoComponent } from './pages/admin-permisos-menu-dinamico/admin-permisos-menu-dinamico.component';
import { AdminPlantillasMenuComponent } from './pages/admin-plantillas-menu/admin-plantillas-menu.component';
import { AdminPlantillaAlmacenComponent } from './pages/admin-plantilla-almacen/admin-plantilla-almacen.component';
import { AdminConfigBrandingComponent } from './pages/admin-config-branding/admin-config-branding.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'admin-usuarios', component: AdminUsuariosComponent },
      { path: 'admin-roles', component: AdminRolesComponent },
      { path: 'admin-areas', component: AdminAreasComponent },
      { path: 'admin-perfiles', component: AdminPerfilesComponent },
      { path: 'admin-flujos', component: AdminFlujosComponent },
      { path: 'admin-aprobadores', component: AdminAprobadoresComponent },
      { path: 'usuarios-por-area', component: UsuariosPorAreaComponent },
      { path: 'admin-version-api', component: AdminVersionApiComponent },
      { path: 'admin-proveedores-email', component: AdminProveedoresEmailComponent },
      { path: 'admin-config-smtp', component: AdminConfigSmtpComponent },
      { path: 'admin-plantilla-correo', component: AdminPlantillaCorreoComponent },
      { path: 'admin-plantilla-pdf', component: AdminPlantillaPdfComponent },
      { path: 'configuracion-colores', component: ConfiguracionColoresComponent },
      { path: 'admin-permisos-roles', component: AdminPermisosRolesComponent },
      { path: 'admin-menus-layout', component: AdminMenusLayoutComponent },
      { path: 'admin-menus-dinamicos', component: AdminMenusDinamicosComponent },
      { path: 'admin-empresas', component: AdminEmpresasComponent },
      { path: 'admin-permisos-menu-dinamico', component: AdminPermisosMenuDinamicoComponent },
      { path: 'admin-plantillas-menu', component: AdminPlantillasMenuComponent },
      { path: 'admin-plantilla-almacen', component: AdminPlantillaAlmacenComponent },
      { path: 'admin-config-branding', component: AdminConfigBrandingComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
