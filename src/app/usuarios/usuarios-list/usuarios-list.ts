import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
    MatInputModule,
    MatSnackBarModule,
    FormsModule
  ],
  templateUrl: './usuarios-list.html',
  styleUrls: ['./usuarios-list.scss']
})
export class UsuariosListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users = signal<User[]>([]);
  loading = signal(false);
  totalUsers = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = signal(5);

  selectedRole: string = '';

  displayedColumns: string[] = ['name', 'email', 'role'];
  
  // Individual search filters
  nameFilter = signal('');
  emailFilter = signal('');
  roleFilter = signal('');

  // Debounced subjects for inputs
  private nameFilter$ = new Subject<string>();
  private emailFilter$ = new Subject<string>();
  private roleFilter$ = new Subject<string>();
  private subscriptions: Subscription[] = [];

  // Check if user is admin
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Generate array of page numbers for pagination
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  // Math utility for template
  Math = Math;

  ngOnInit(): void {
    // Subscribe to debounced inputs
    this.subscriptions.push(
      this.nameFilter$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        if (value && value.trim().length > 0) {
          this.currentPage.set(0);
          this.loadUsers('name', value.trim());
        } else {
          this.currentPage.set(0);
          this.loadUsers();
        }
      }) as unknown as Subscription
    );

    this.subscriptions.push(
      this.emailFilter$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        if (value && value.trim().length > 0) {
          this.currentPage.set(0);
          this.loadUsers('email', value.trim());
        } else {
          this.currentPage.set(0);
          this.loadUsers();
        }
      }) as unknown as Subscription
    );

    this.subscriptions.push(
      this.roleFilter$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        if (value && value.trim().length > 0) {
          this.currentPage.set(0);
          this.loadUsers('role', value.trim());
        } else {
          this.currentPage.set(0);
          this.loadUsers();
        }
      }) as unknown as Subscription
    );

    // Initial load
    this.loadUsers();
  }
  loadUsers(filterKey?: 'role' | 'name' | 'email', filterValue?: string): void {
    this.loading.set(true);
    this.userService.getUsers(this.currentPage() + 1, this.pageSize(), filterKey, filterValue).subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.totalUsers.set(response.total);
        this.totalPages.set(Math.ceil(response.total / this.pageSize()));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading.set(false);
        this.users.set([]);
        this.totalUsers.set(0);
        this.snackBar.open('No se pudieron cargar los usuarios. Intente nuevamente', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page - 1);
    this.loadUsers();
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadUsers();
    }
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(CreateUserComponent, {
    hasBackdrop: true,
    disableClose: true,
    // quita la animación default de material
    enterAnimationDuration: '0ms',
    exitAnimationDuration: '0ms',
    // tamaño y anclaje al borde derecho
    width: '600px',
    maxWidth: '800px',
    height: '100vh',
    panelClass: ['right-sheet'],
    position: { right: '0' }
  });
    // const dialogRef = this.dialog.open(CreateUserComponent, {
    //   width: '700px',
    //   disableClose: true
    // });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload users after successful creation
        this.loadUsers();
      }
    });
  }

  onNameFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.nameFilter.set(value.toLowerCase());
    this.nameFilter$.next(value);
  }

  onEmailFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emailFilter.set(value.toLowerCase());
    this.emailFilter$.next(value);
  }

  onRoleFilterChange(event: Event): void {
    const value = event as unknown as string;
    this.roleFilter.set(value.toLowerCase());
    this.roleFilter$.next(value);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }

  get filteredUsers(): User[] {
    return this.users().filter(user => {
      const matchesName = !this.nameFilter() || 
        user.name.toLowerCase().includes(this.nameFilter());
      const matchesEmail = !this.emailFilter() || 
        user.email.toLowerCase().includes(this.emailFilter());
      const matchesRole = !this.roleFilter() || 
        (user.role && user.role.toLowerCase().includes(this.roleFilter()));
      
      return matchesName && matchesEmail && matchesRole;
    });
  }
}
