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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
