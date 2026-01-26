import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportesDashboardComponent } from './pages/reportes-dashboard/reportes-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: ReportesDashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportesRoutingModule { }
