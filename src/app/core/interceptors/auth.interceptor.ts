import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * HTTP Interceptor to add Bearer token to all outgoing requests
 * and handle token expiration (401 errors)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Endpoints that don't require authentication (only login endpoint)
  const publicEndpoints = ['/auth/token'];
  
  // Check if the URL matches exactly a public endpoint (not just contains)
  const isPublicEndpoint = publicEndpoints.some(endpoint => {
    return req.url.endsWith(endpoint) || req.url.includes(`${endpoint}?`);
  });

  // Skip adding token for public endpoints
  if (isPublicEndpoint) {
    return next(req);
  }

  // Clone request and add Authorization header if token exists
  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request and catch 401 errors
  return next(clonedReq).pipe(
    catchError((error) => {
      // If 401 Unauthorized, clear session and redirect to login
      if (error.status === 401) {
        authService.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
