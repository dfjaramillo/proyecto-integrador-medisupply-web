import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Component that redirects to the appropriate page based on user role
 * - Administrador -> /usuarios
 * - Compras -> /inventario
 * - Ventas -> /ventas
 * - Logistica -> /logistica
 */
@Component({
  selector: 'app-role-redirect',
  standalone: true,
  template: '<p>Redirigiendo...</p>',
})
export class RoleRedirectComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    
    switch (role) {
      case 'Administrador':
        this.router.navigate(['/usuarios']);
        break;
      case 'Compras':
        this.router.navigate(['/inventario']);
        break;
      case 'Ventas':
        this.router.navigate(['/planes-ventas']);
        break;
      case 'Logistica':
        this.router.navigate(['/logistica/rutas']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
