import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Helper function to get default route based on user role
 */
function getDefaultRouteForRole(role: string | null): string {
  switch (role) {
    case 'Administrador':
      return '/usuarios';    
    case 'Compras':
      return '/inventario';
    case 'Ventas':
      return '/planes-ventas';
    case 'Logistica':
      return '/logistica/rutas';
    default:
      return '/login';
  }
}

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
 * Guard for Administrador role only
 * Only users with 'Administrador' role can access
 */
export const administradorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const userRole = authService.getUserRole();
  if (userRole !== 'Administrador') {
    router.navigate([getDefaultRouteForRole(userRole)]);
    return false;
  }
  
  return true;
};

/**
 * Guard for Compras role
 * Only users with 'Administrador' or 'Compras' role can access
 */
export const comprasGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const userRole = authService.getUserRole();
  if (userRole !== 'Administrador' && userRole !== 'Compras') {
    router.navigate([getDefaultRouteForRole(userRole)]);
    return false;
  }
  
  return true;
};

/**
 * Guard for Ventas role
 * Only users with 'Administrador' or 'Ventas' role can access
 */
export const ventasGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const userRole = authService.getUserRole();
  if (userRole !== 'Administrador' && userRole !== 'Ventas') {
    router.navigate([getDefaultRouteForRole(userRole)]);
    return false;
  }
  
  return true;
};

/**
 * Guard for Logistica role
 * Only users with 'Administrador' or 'Logistica' role can access
 */
export const logisticaGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const userRole = authService.getUserRole();
  if (userRole !== 'Administrador' && userRole !== 'Logistica') {
    router.navigate([getDefaultRouteForRole(userRole)]);
    return false;
  }
  
  return true;
};

/**
 * Guard for Inventario access
 * Allows users with 'Administrador', 'Compras', or 'Logistica' role
 */
export const inventarioAccessGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const userRole = authService.getUserRole();
  if (userRole !== 'Administrador' && userRole !== 'Compras' && userRole !== 'Logistica') {
    router.navigate([getDefaultRouteForRole(userRole)]);
    return false;
  }
  
  return true;
};

/**
 * @deprecated Use administradorGuard instead
 * Kept for backwards compatibility
 */
export const adminGuard = administradorGuard;

/**
 * @deprecated Use comprasGuard instead
 * Kept for backwards compatibility
 */
export const inventarioGuard = comprasGuard;
