import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Guard to protect routes that require authentication
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login if not authenticated
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Guard to protect admin-only routes
 * Only users with 'Administrador' role can access
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if user has 'Administrador' role
  if (!authService.isAdmin()) {
    // Redirect to appropriate page based on user role
    const userRole = authService.getUserRole();
    
    switch (userRole) {
      case 'Logistica':
        router.navigate(['/logistica']);
        break;
      case 'Ventas':
        router.navigate(['/ventas']);
        break;
      case 'Compras':
        router.navigate(['/inventario']);
        break;
      default:
        router.navigate(['/login']);
    }
    
    return false;
  }
  
  return true;
};

/**
 * Guard to protect inventory routes
 * Only users with 'Administrador' or 'Analista de Compras' role can access
 */
export const inventarioGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if user has 'Administrador' or 'Analista de Compras' role
  const userRole = authService.getUserRole();
  if (userRole !== 'Administrador' && userRole !== 'Analista de Compras') {
    // Redirect to appropriate page based on user role
    switch (userRole) {
      case 'Logistica':
        router.navigate(['/logistica']);
        break;
      case 'Ventas':
        router.navigate(['/ventas']);
        break;
      default:
        router.navigate(['/login']);
    }
    
    return false;
  }
  
  return true;
};
