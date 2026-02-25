import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalService, ModalData } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="modalData" class="modal-overlay" (click)="hideModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h5 class="modal-title">
            <i [class]="getIconClass()"></i>
            {{ modalData.titulo }}
          </h5>
          <button type="button" class="btn-close" (click)="hideModal()"></button>
        </div>
        <div class="modal-body">
          <div [innerHTML]="modalData.mensaje"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" (click)="hideModal()">Entendido</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnDestroy {
  modalData: ModalData | null = null;
  private subscription: Subscription;

  constructor(private modalService: ModalService) {
    this.subscription = this.modalService.modal$.subscribe(data => {
      this.modalData = data;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  hideModal() {
    this.modalService.hide();
  }

  getIconClass(): string {
    if (!this.modalData?.tipo) return 'fas fa-info-circle';
    
    switch (this.modalData.tipo) {
      case 'success': return 'fas fa-check-circle text-success';
      case 'warning': return 'fas fa-exclamation-triangle text-warning';
      case 'error': return 'fas fa-times-circle text-danger';
      default: return 'fas fa-info-circle text-info';
    }
  }
}
