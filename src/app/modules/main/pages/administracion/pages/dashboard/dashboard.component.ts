import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  adminUser: any = null;

  totals = {
    usuarios: 3,
    areas: 2,
    roles: 3,
    perfiles: 3,
    flujos: 3,
    aprobadores: 3
  };

  constructor(private router: Router) { }

  ngOnInit(): void {
    const user = localStorage.getItem('ADMIN_USER');
    this.adminUser = user ? JSON.parse(user) : null;
    this.loadTotals();
  }

  loadTotals() {
    // Aquí puedes cargar los totales desde un servicio o API
    // Por ahora usamos datos de ejemplo
  }

  goTo(path: string) {
    const rutaFinal = `/administracion/${path}`;

    console.log('➡️ Navegando a:', rutaFinal);
    this.router.navigate([rutaFinal]);
  }
}
