import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

/**
 * HTTP Interceptor to add Bearer token to all outgoing requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
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
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // If no token and not a public endpoint, still proceed
  // (the backend will return 401 if authentication is required)
  return next(req);
};
