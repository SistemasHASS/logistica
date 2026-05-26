import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AdminLogisticaAuthService } from './services/admin-logistica-auth.service';

export const AdminLogisticaAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AdminLogisticaAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/admin-logistica/login']);
  return false;
};
