import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // User role for conditional rendering
  userRole = signal<string | null>(null);
  // Collapsible sections state
  administracionExpanded = signal(true);
  ventasExpanded = signal(true);
  // Sidebar collapsed state for mobile/responsive
  sidebarCollapsed = signal(false);

  constructor() {
    // Get user role on component initialization
    this.userRole.set(this.authService.getUserRole());
  }

  // ============================================
  // ROLE VALIDATION METHODS
  // ============================================

  /**
   * Check if user has Administrador role
   * Administrador has access to all features
   */
  isAdministrador(): boolean {
    return this.authService.hasRole('Administrador');
  }

  /**
   * Check if user has Compras role
   * Departamento de compras - Manages inventory and suppliers
   */
  isCompras(): boolean {
    return this.authService.hasRole('Compras');
  }

  /**
   * Check if user has Ventas role
   * Gerente de cuenta/vendedor - Manages sales
   */
  isVentas(): boolean {
    return this.authService.hasRole('Ventas');
  }

  /**
   * Check if user has Logistica role
   * Personal logístico - Manages logistics and distribution
   */
  isLogistica(): boolean {
    return this.authService.hasRole('Logistica');
  }

  // ============================================
  // MENU VISIBILITY BY ROLE
  // ============================================

  /**
   * Show Usuarios menu
   * Only: Administrador
   */
  canSeeUsuarios(): boolean {
    return this.isAdministrador();
  }

  /**
   * Show Inventario menu
   * Roles: Administrador, Compras
   */
  canSeeInventario(): boolean {
    return this.isAdministrador() || this.isCompras() || this.isLogistica();
  }

  /**
   * Show Proveedores menu
   * Roles: Administrador, Compras
   */
  canSeeProveedores(): boolean {
    return this.isAdministrador() || this.isCompras();
  }

  /**
   * Show Ventas menu
   * Roles: Administrador, Ventas
   */
  canSeeVentas(): boolean {
    return this.isAdministrador() || this.isVentas();
  }

  /**
   * Show Logística menu
   * Roles: Administrador, Logistica
   */
  canSeeLogistica(): boolean {
    return this.isAdministrador() || this.isLogistica();
  }

  // ============================================
  // ACTIONS
  // ============================================

  toggleAdministracion(): void {
    this.administracionExpanded.set(!this.administracionExpanded());
  }

  toggleVentas(): void {
    this.ventasExpanded.set(!this.ventasExpanded());
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  closeSidebar(): void {
    // Close sidebar on mobile when a nav item is clicked
    if (window.innerWidth <= 768) {
      this.sidebarCollapsed.set(true);
    }
  }


  onLogout(): void {
    // Call logout endpoint and clear tokens
    this.authService.logout().subscribe({
      next: () => {
        // Navigate to login page after successful logout
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        // Even if backend fails, still navigate to login
        console.error('Logout error:', err);
        this.router.navigateByUrl('/login');
      }
    });
  }
}
