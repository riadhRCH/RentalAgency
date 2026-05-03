import { HttpInterceptorFn, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, Observable, of } from 'rxjs';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getAccessToken();
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

  return next(cloned).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(cloned, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandler,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshAccessToken().pipe(
      switchMap((res: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(res.access_token);
        return next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${res.access_token}`
          }
        }));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => refreshError);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      switchMap((token) => {
        if (token) {
          return next(req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          }));
        }
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }
}
