import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, AsyncPipe } from '@angular/common';
import { NotificationService, Notificacion } from '../../services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, AsyncPipe],
  templateUrl: './notification-container.component.html',
  styleUrls: ['./notification-container.component.scss']
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  notificaciones$: Observable<Notificacion[]>;
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {
    this.notificaciones$ = this.notificationService.notificaciones$;
  }

  ngOnInit() {
    // Suscribirse para detectar nuevas notificaciones y reproducir sonido si es necesario
    this.subscription = this.notificaciones$.subscribe();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  cerrar(id: string) {
    this.notificationService.remove(id);
  }

  ejecutarAccion(notificacion: Notificacion) {
    if (notificacion.accion) {
      notificacion.accion.handler();
      this.cerrar(notificacion.id);
    }
  }
}
