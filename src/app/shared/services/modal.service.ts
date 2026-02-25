import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalData {
  titulo: string;
  mensaje: string;
  tipo?: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new Subject<ModalData | null>();
  public modal$ = this.modalSubject.asObservable();

  show(data: ModalData) {
    this.modalSubject.next(data);
  }

  hide() {
    this.modalSubject.next(null);
  }
}
