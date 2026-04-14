import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/** Attach JWT to API calls when the archivist or customer is signed in. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.endsWith('/api/auth/login') || req.url.endsWith('/api/auth/register')) {
    return next(req);
  }
  const auth = inject(AuthService);
  const value = auth.authHeader();
  if (!value) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: value } }));
};
