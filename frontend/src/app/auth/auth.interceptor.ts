import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const agencyId = authService.activeAgencyId();

  let cloned = req;
  
  if (token) {
    cloned = cloned.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  if (agencyId) {
    cloned = cloned.clone({
      setHeaders: {
        'X-Agency-ID': agencyId
      }
    });
  }

  return next(cloned);
};
