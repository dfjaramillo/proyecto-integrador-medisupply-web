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
