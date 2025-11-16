import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { ApproveClientComponent } from './dialogs/approve-client/approve-client';
import { RejectClientComponent } from './dialogs/reject-client/reject-client';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-clientes-pendientes',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './clientes-pendientes.html',
  styleUrls: ['./clientes-pendientes.scss']
})
export class ClientesPendientesComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  clients = signal<User[]>([]);

  // Total clients from backend
  totalClients = signal(0);

  // Filters per column
  codeFilter = signal('');
  nameFilter = signal('');
  typeFilter = signal('');
  dateFilter = signal('');

  // Pagination (0-based index for currentPage)
  currentPage = signal(0);
  pageSize = signal(5);

  displayedColumns: string[] = ['code', 'name', 'institution_type', 'created_at', 'status', 'actions'];

  Math = Math;

  ngOnInit(): void {
    this.loadClients();
  }

  private loadClients(): void {
    this.loading.set(true);
    // Use backend pagination similar to UsuariosListComponent
    this.userService.getUsers(this.currentPage() + 1, this.pageSize(), 'role', 'Cliente').subscribe({
      next: (response) => {
        // Ensure we only keep clients (role Cliente)
        const clients = (response.users || []).filter(u => u.role === 'Cliente');
        this.clients.set(clients);
        this.totalClients.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading clients', err);
        this.loading.set(false);
        this.snackBar.open('No se pudieron cargar los clientes. Intenta nuevamente.', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalClients() / this.pageSize()));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Derived lists
  filteredClients = computed(() => {
    const code = this.codeFilter().toLowerCase();
    const name = this.nameFilter().toLowerCase();
    const type = this.typeFilter().toLowerCase();
    const date = this.dateFilter().toLowerCase();

    return this.clients().filter(client => {
      const clientCode = this.buildClientCode(client).toLowerCase();
      const createdAt = client.created_at ? new Date(client.created_at).toLocaleDateString('es-CO') : '';

      const matchesCode = !code || clientCode.includes(code);
      const matchesName = !name || client.name.toLowerCase().includes(name);
      const matchesType = !type || (client.institution_type || '').toLowerCase().includes(type);
      const matchesDate = !date || createdAt.toLowerCase().includes(date);

      return matchesCode && matchesName && matchesType && matchesDate;
    });
  });

  // With backend pagination, current page is loaded from API,
  // so table uses full filtered list for current page.
  pagedClients = computed(() => this.filteredClients());

  buildClientCode(client: User): string {
    // Simple derived code CL + last 4 of id
    const suffix = client.id.slice(-4).toUpperCase();
    return `CL${suffix}`;
  }

  // Pagination actions
  goToPage(page: number): void {
    this.currentPage.set(page - 1);
    this.loadClients();
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadClients();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadClients();
    }
  }

  // Filter handlers
  onCodeFilterChange(event: Event): void {
    this.codeFilter.set((event.target as HTMLInputElement).value);
    this.currentPage.set(0);
  }

  onNameFilterChange(event: Event): void {
    this.nameFilter.set((event.target as HTMLInputElement).value);
    this.currentPage.set(0);
  }

  onTypeFilterChange(event: Event): void {
    this.typeFilter.set((event.target as HTMLInputElement).value);
    this.currentPage.set(0);
  }

  onDateFilterChange(event: Event): void {
    this.dateFilter.set((event.target as HTMLInputElement).value);
    this.currentPage.set(0);
  }

  // Dialogs
  approveClient(client: User): void {
    if (this.isClientApproved(client) || this.isClientRejected(client)) {
      return;
    }
    const dialogRef = this.dialog.open(ApproveClientComponent, {
      hasBackdrop: true,
      disableClose: true,
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      width: '600px',
      maxWidth: '800px',
      height: '100vh',
      panelClass: ['right-sheet'],
      position: { right: '0' },
      data: { client }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.approved) {
        this.removeClientFromList(client.id);
      }
    });
  }

  rejectClient(client: User): void {
    if (this.isClientApproved(client) || this.isClientRejected(client)) {
      return;
    }
    const currentUserId = this.authService.getUserId();
    const dialogRef = this.dialog.open(RejectClientComponent, {
      hasBackdrop: true,
      disableClose: true,
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      width: '600px',
      maxWidth: '800px',
      height: '100vh',
      panelClass: ['right-sheet'],
      position: { right: '0' },
      data: {
        client,
        sellerId: currentUserId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.rejected) {
        this.removeClientFromList(client.id);
      }
    });
  }

  private removeClientFromList(clientId: string): void {
    // After approve/reject, reload list from backend to reflect latest status
    this.loadClients();
  }

  isClientApproved(client: any): boolean {
    return client.status === 'APROBADO';
  }

  isClientRejected(client: any): boolean {
    return client.status === 'RECHAZADO';
  }

  isClientPending(client: any): boolean {
    return client.status == null;
  }
}
