import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '@/app/shared/services/user.service';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';
import { AlertService } from '@/app/shared/alertas/alerts.service';
import { UtilsService } from '@/app/shared/utils/utils.service';

@Component({
  selector: 'app-administracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './administracion.component.html',
  styleUrls: ['./administracion.component.scss'],
})
export class AdministracionComponent implements OnInit {
  async ngOnInit() {

  }
}