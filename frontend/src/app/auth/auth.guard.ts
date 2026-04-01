import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getToken()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

export const agencyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.getToken()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (authService.activeAgencyId()) {
    return true;
  }

  // If we have agencies but none selected, go to selection
  if (authService.userAgencies().length > 0) {
    return router.createUrlTree(['/auth/select-agency']);
  }

  return true;
};
