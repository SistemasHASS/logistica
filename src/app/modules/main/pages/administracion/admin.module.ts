import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdminRoutingModule } from './admin-routing.module';

import { AdminLayoutComponent } from './pages/admin-layout/admin-layout.component';
import { AdminUsuariosComponent } from './pages/admin-usuarios/admin-usuarios.component';
import { AdminPerfilesComponent } from './pages/admin-perfiles/admin-perfiles.component';
import { AdminFlujosComponent } from './pages/admin-flujos/admin-flujos.component';
import { AdminAprobadoresComponent } from './pages/admin-aprobadores/admin-aprobadores.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminProveedoresEmailComponent } from './pages/admin-proveedores-email/admin-proveedores-email.component';
import { AdminConfigSmtpComponent } from './pages/admin-config-smtp/admin-config-smtp.component';
import { AdminPlantillaCorreoComponent } from './pages/admin-plantilla-correo/admin-plantilla-correo.component';
import { AdminPlantillaPdfComponent } from './pages/admin-plantilla-pdf/admin-plantilla-pdf.component';
import { AdminMenusLayoutComponent } from './pages/admin-menus-layout/admin-menus-layout.component';
import { AdminMenusDinamicosComponent } from './pages/admin-menus-dinamicos/admin-menus-dinamicos.component';
import { AdminPermisosMenuDinamicoComponent } from './pages/admin-permisos-menu-dinamico/admin-permisos-menu-dinamico.component';
import { AdminPlantillasMenuComponent } from './pages/admin-plantillas-menu/admin-plantillas-menu.component';
import { AdminPlantillaAlmacenComponent } from './pages/admin-plantilla-almacen/admin-plantilla-almacen.component';
import { AdminConfigBrandingComponent } from './pages/admin-config-branding/admin-config-branding.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule,
    AdminLayoutComponent,
    DashboardComponent,
    AdminUsuariosComponent,
    AdminPerfilesComponent,
    AdminFlujosComponent,
    AdminAprobadoresComponent,
    AdminProveedoresEmailComponent,
    AdminConfigSmtpComponent,
    AdminPlantillaCorreoComponent,
    AdminPlantillaPdfComponent,
    AdminMenusLayoutComponent,
    AdminMenusDinamicosComponent,
    AdminPermisosMenuDinamicoComponent,
    AdminPlantillasMenuComponent,
    AdminPlantillaAlmacenComponent,
    AdminConfigBrandingComponent,
    RouterModule,       // ✅ OBLIGATORIO PARA routerLink

  ]
})
export class AdminModule { }