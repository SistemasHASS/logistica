import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';

@Component({
  selector: 'app-maestros',
  templateUrl: './maestros.component.html',
  styleUrls: ['./maestros.component.scss'],
  standalone: true,
  imports: [RouterModule],
})
export class MaestrosComponent {
  titulo = 'Maestro de Items';

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.url.includes('items')) {
          this.titulo = 'Maestro de Items';
        } else if (event.url.includes('comodities')) {
          this.titulo = 'Maestro de Comodities';
        }
      }
    });
  }
}
