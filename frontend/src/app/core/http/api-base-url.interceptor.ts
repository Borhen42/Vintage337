import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * In development, send `/api` and `/uploads` to Spring Boot on 8080 so the app works even when
 * the dev-server proxy is not applied (e.g. some preview modes). Production uses same-origin URLs.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.apiBaseUrl;
  if (!base) {
    return next(req);
  }
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    return next(req.clone({ url: base + req.url }));
  }
  return next(req);
};
