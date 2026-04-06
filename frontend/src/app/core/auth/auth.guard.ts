import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Only signed-in admin/staff can open /admin routes. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }
  if (!auth.isAdmin()) {
    return router.createUrlTree(['/'], { fragment: 'heritage-series' });
  }
  return true;
};

/** Cart and checkout: signed-in CUSTOMER only (not admin/staff). */
export const customerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  if (!auth.isCustomer()) {
    return router.createUrlTree(['/'], { fragment: 'heritage-series' });
  }
  return true;
};

/** Logged-in users skip login: admins → dashboard, customers → New arrivals. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  if (auth.isAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }
  return router.createUrlTree(['/'], { fragment: 'heritage-series' });
};
