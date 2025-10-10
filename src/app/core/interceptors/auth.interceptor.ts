import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

/**
 * HTTP Interceptor to add Bearer token to all outgoing requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Skip adding token for auth/token endpoint
  if (req.url.includes('/auth/token')) {
    return next(req);
  }

  // Clone request and add Authorization header if token exists
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
