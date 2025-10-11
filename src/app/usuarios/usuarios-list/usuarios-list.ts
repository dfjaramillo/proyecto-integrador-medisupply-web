import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { CreateUserComponent } from '../components/create-user/create-user';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './usuarios-list.html',
  styleUrls: ['./usuarios-list.scss']
})
export class UsuariosListComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  users = signal<User[]>([]);
  loading = signal(false);
  totalUsers = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);

  displayedColumns: string[] = ['name', 'email', 'institution_type', 'phone'];
  searchTerm = signal('');

  // Check if user is admin
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers(this.currentPage() + 1, this.pageSize()).subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.totalUsers.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(CreateUserComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload users after successful creation
        this.loadUsers();
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value.toLowerCase());
  }

  get filteredUsers(): User[] {
    if (!this.searchTerm()) {
      return this.users();
    }
    
    return this.users().filter(user =>
      user.name.toLowerCase().includes(this.searchTerm()) ||
      user.email.toLowerCase().includes(this.searchTerm()) ||
      (user.institution_type && user.institution_type.toLowerCase().includes(this.searchTerm())) ||
      (user.phone && user.phone.toLowerCase().includes(this.searchTerm()))
    );
  }
}
