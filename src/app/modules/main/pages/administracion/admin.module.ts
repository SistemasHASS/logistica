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
    RouterModule,       // ✅ OBLIGATORIO PARA routerLink

  ]
})
export class AdminModule { }