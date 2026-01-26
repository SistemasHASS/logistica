import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesRoutingModule } from './reportes-routing.module';
import { ReportesDashboardComponent } from './pages/reportes-dashboard/reportes-dashboard.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReportesRoutingModule,
    ReportesDashboardComponent
  ]
})
export class ReportesModule { }
