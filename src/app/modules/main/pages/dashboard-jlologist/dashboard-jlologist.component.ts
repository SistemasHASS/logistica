import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DexieService } from '@/app/shared/dixiedb/dexie-db.service';

@Component({
  selector: 'app-dashboard-jlologist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './dashboard-jlologist.component.html',
  styleUrls: ['./dashboard-jlologist.component.scss']
})
export class DashboardJlologistComponent implements OnInit {
  usuario: any = null;

  constructor(
    private dexieService: DexieService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.usuario = await this.dexieService.obtenerPrimerUsuario();
    this.cdr.markForCheck();
  }

  irA(ruta: string) {
    this.router.navigate(['main', ruta]);
  }
}
