import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './services/notification.service';

@NgModule({
  declarations: [
    // Standalone components cannot be declared here
  ],
  imports: [
    CommonModule
  ],
  providers: [
    NotificationService
  ],
  exports: [
    CommonModule
  ]
})
export class NotificationModule { }
