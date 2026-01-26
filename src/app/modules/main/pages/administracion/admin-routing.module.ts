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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}


// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { AdminPerfilesComponent } from './pages/admin-perfiles/admin-perfiles.component';
// import { AdminFlujosComponent } from './pages/admin-flujos/admin-flujos.component';

// const routes: Routes = [
//   {
//     path: 'perfiles',
//     component: AdminPerfilesComponent
//   },
//   {
//     path: 'flujos',
//     component: AdminFlujosComponent
//   }
// ];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule]
// })
// export class AdminRoutingModule {}