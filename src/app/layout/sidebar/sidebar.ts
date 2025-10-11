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

  // Collapsible sections state
  administracionExpanded = signal(true);
  ventasExpanded = signal(true);
  
  // User role for conditional rendering
  userRole = signal<string | null>(null);

  constructor() {
    // Get user role on component initialization
    this.userRole.set(this.authService.getUserRole());
  }

  // Check if user has admin role
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  // Check if user can see Administración menu
  canSeeAdministracion(): boolean {
    return this.isAdmin();
  }

  // Check if user can see Inventario menu
  canSeeInventario(): boolean {
    return this.isAdmin() || this.hasRole('Compras');
  }

  // Check if user can see Logística menu
  canSeeLogistica(): boolean {
    return this.isAdmin() || this.hasRole('Logistica');
  }

  // Check if user can see Ventas menu
  canSeeVentas(): boolean {
    return this.isAdmin() || this.hasRole('Ventas');
  }

  toggleAdministracion(): void {
    this.administracionExpanded.set(!this.administracionExpanded());
  }

  toggleVentas(): void {
    this.ventasExpanded.set(!this.ventasExpanded());
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
