import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProveedoresService } from '../services/proveedores.service';
import { ProveedorResponse } from '../models/proveedor.model';
import { CreateProveedorComponent } from '../components/create-proveedor/create-proveedor';

@Component({
  selector: 'app-proveedores-list',
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
    MatSnackBarModule
  ],
  templateUrl: './proveedores-list.html',
  styleUrls: ['./proveedores-list.scss']
})
export class ProveedoresListComponent implements OnInit, OnDestroy {
  private proveedoresService = inject(ProveedoresService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  allProveedores = signal<ProveedorResponse[]>([]);
  proveedores = signal<ProveedorResponse[]>([]);
  loading = signal(false);
  totalProveedores = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = signal(5);

  displayedColumns: string[] = ['name', 'email', 'phone'];

  // Individual search filters
  nameFilter = signal('');
  emailFilter = signal('');
  phoneFilter = signal('');

  // Debounced subjects for inputs
  private nameFilter$ = new Subject<string>();
  private emailFilter$ = new Subject<string>();
  private phoneFilter$ = new Subject<string>();
  private subscriptions: Subscription[] = [];

  // Generate array of page numbers for pagination
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  // Filtered proveedores based on search
  get filteredProveedores(): ProveedorResponse[] {
    return this.allProveedores().filter(proveedor => {
      const matchesName = !this.nameFilter() || 
        proveedor.name.toLowerCase().includes(this.nameFilter());
      const matchesEmail = !this.emailFilter() || 
        proveedor.email.toLowerCase().includes(this.emailFilter());
      const matchesPhone = !this.phoneFilter() || 
        proveedor.phone.toLowerCase().includes(this.phoneFilter());
      
      return matchesName && matchesEmail && matchesPhone;
    });
  }

  // Paginated proveedores
  get paginatedProveedores(): ProveedorResponse[] {
    const filtered = this.filteredProveedores;
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  }

  // Math utility for template
  Math = Math;

  ngOnInit(): void {
    // Subscribe to debounced inputs
    this.subscriptions.push(
      this.nameFilter$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        this.nameFilter.set(value.toLowerCase());
        this.currentPage.set(0);
        this.updatePagination();
      }) as unknown as Subscription
    );

    this.subscriptions.push(
      this.emailFilter$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        this.emailFilter.set(value.toLowerCase());
        this.currentPage.set(0);
        this.updatePagination();
      }) as unknown as Subscription
    );

    this.subscriptions.push(
      this.phoneFilter$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        this.phoneFilter.set(value.toLowerCase());
        this.currentPage.set(0);
        this.updatePagination();
      }) as unknown as Subscription
    );

    // Initial load
    this.loadProveedores();
  }

  loadProveedores(): void {
    this.loading.set(true);
    
    
    const params = {
      page: 1,
      per_page: 100 
    };

    this.proveedoresService.getProveedores(params).subscribe({
      next: (response) => {
        this.allProveedores.set(response.providers);
        this.updatePagination();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading proveedores:', error);
        this.loading.set(false);
        this.allProveedores.set([]);
        this.proveedores.set([]);
        this.totalProveedores.set(0);
        this.snackBar.open(
          'No se pudieron cargar los proveedores. Intente nuevamente',
          'Cerrar',
          { duration: 4000 }
        );
      }
    });
  }

  updatePagination(): void {
    const filtered = this.filteredProveedores;
    this.totalProveedores.set(filtered.length);
    this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));
    
    // Reset to first page if current page is out of bounds
    if (this.currentPage() >= this.totalPages() && this.totalPages() > 0) {
      this.currentPage.set(0);
    }
    
    this.proveedores.set(this.paginatedProveedores);
  }

  goToPage(page: number): void {
    this.currentPage.set(page - 1);
    this.updatePagination();
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.updatePagination();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateProveedorComponent, {
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

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload proveedores after successful creation
        this.loadProveedores();
      }
    });
  }

  onNameFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.nameFilter$.next(value);
  }

  onEmailFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emailFilter$.next(value);
  }

  onPhoneFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.phoneFilter$.next(value);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }
}
