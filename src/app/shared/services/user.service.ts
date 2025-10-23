import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usuarioSubject = new BehaviorSubject<any>(null);

  setUsuario(usuario: any) {
    this.usuarioSubject.next(usuario);
  }

  getUsuario() {
    return this.usuarioSubject.value;
  }

  usuario$ = this.usuarioSubject.asObservable();
}
