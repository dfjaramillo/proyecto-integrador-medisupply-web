import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { InventarioService } from '../services/inventario.service';
import { AuthService } from '../../auth/services/auth.service';
import { ProductoResponse } from '../models/producto.model';
import { Pagination } from '../../shared/models/pagination.model';
import { CreateProductoComponent } from '../components/create-producto/create-producto';
import { CargueMasivoComponent } from '../components/cargue-masivo/cargue-masivo';
import { HistorialCargueListComponent } from '../components/historial-cargue-list/historial-cargue-list';
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDatepickerToggle, MatDatepicker } from "@angular/material/datepicker";
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormField,
    MatDatepickerToggle,
    MatDatepicker,
    HistorialCargueListComponent
],
 providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }
  ],
  templateUrl: './inventario-list.html',
  styleUrls: ['./inventario-list.scss']
})
export class InventarioListComponent implements OnInit, OnDestroy {
  productos = signal<ProductoResponse[]>([]);
  loading = signal(true);
  
  // Paginación del backend
  pagination = signal<Pagination | null>(null);
  
  // Expose Math for template
  Math = Math;
  
  // Filtros usando signals
  skuFilter = signal('');
  nombreFilter = signal('');
  fechaFilter = signal('');
  cantidadFilter = signal('');
  precioFilter = signal('');
  ubicacionFilter = signal('');

  // Para mantener la fecha seleccionada en el datepicker
  selectedDate: Date | null = null;

  // Debounced subjects for filters
  private skuFilter$ = new Subject<string>();
  private nombreFilter$ = new Subject<string>();
  private fechaFilter$ = new Subject<string>();
  private cantidadFilter$ = new Subject<string>();
  private precioFilter$ = new Subject<string>();
  private ubicacionFilter$ = new Subject<string>();
  private subscriptions: Subscription[] = [];

  // Paginación del servidor
  currentPage = 1;
  pageSize = 5;

  displayedColumns: string[] = [
    'sku',
    'name',
    'expiration_date',
    'quantity',
    'price',
    'location'
  ];

  constructor(
    private inventarioService: InventarioService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupFilterDebounce();
    this.loadProductos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }

  setupFilterDebounce(): void {
    // SKU filter
    this.subscriptions.push(
      this.skuFilter$.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(value => {
        if (value && value.trim().length > 0) {
          this.currentPage = 1;
          this.loadProductos('sku', value.trim());
        } else {
          this.currentPage = 1;
          this.loadProductos();
        }
      }) as unknown as Subscription
    );

    // Name filter
    this.subscriptions.push(
      this.nombreFilter$.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(value => {
        if (value && value.trim().length > 0) {
          this.currentPage = 1;
          this.loadProductos('name', value.trim());
        } else {
          this.currentPage = 1;
          this.loadProductos();
        }
      }) as unknown as Subscription
    );

    // Expiration date filter
    this.subscriptions.push(
      this.fechaFilter$.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(value => {
        if (value && value.trim().length > 0) {
          this.currentPage = 1;
          this.loadProductos('expiration_date', value.trim());
        } else {
          this.currentPage = 1;
          this.loadProductos();
        }
      }) as unknown as Subscription
    );

    // Quantity filter
    this.subscriptions.push(
      this.cantidadFilter$.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(value => {
        if (value && value.trim().length > 0) {
          this.currentPage = 1;
          this.loadProductos('quantity', value.trim());
        } else {
          this.currentPage = 1;
          this.loadProductos();
        }
      }) as unknown as Subscription
    );

    // Price filter
    this.subscriptions.push(
      this.precioFilter$.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(value => {
        if (value && value.trim().length > 0) {
          this.currentPage = 1;
          this.loadProductos('price', value.trim());
        } else {
          this.currentPage = 1;
          this.loadProductos();
        }
      }) as unknown as Subscription
    );

    // Location filter
    this.subscriptions.push(
      this.ubicacionFilter$.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(value => {
        if (value && value.trim().length > 0) {
          this.currentPage = 1;
          this.loadProductos('location', value.trim());
        } else {
          this.currentPage = 1;
          this.loadProductos();
        }
      }) as unknown as Subscription
    );
  }

  loadProductos(filterKey?: 'sku' | 'name' | 'expiration_date' | 'quantity' | 'price' | 'location', filterValue?: string): void {
    this.loading.set(true);
    
    const params: any = {
      page: this.currentPage,
      per_page: this.pageSize
    };

    // Si hay un filtro activo, agregarlo a los parámetros
    if (filterKey && filterValue) {
      params[filterKey] = filterValue;
    }
    
    this.inventarioService.getProductos(params).subscribe({
      next: (response) => {
        this.productos.set(response.products);
        this.pagination.set(response.pagination);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.snackBar.open(
          'No se pudieron cargar los productos. Intente nuevamente',
          'Cerrar',
          { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top' }
        );
        this.loading.set(false);
      }
    });
  }

  onSkuFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.skuFilter.set(value.toLowerCase());
    this.skuFilter$.next(value);
  }

  onNombreFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.nombreFilter.set(value.toLowerCase());
    this.nombreFilter$.next(value);
  }

  onFechaFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fechaFilter.set(value.toLowerCase());
    this.fechaFilter$.next(value);
  }

  onDateChange(date: Date | null): void {
    this.selectedDate = date;
    if (date) {
      const formattedDate = this.formatDateToYYYYMMDD(date);
      this.fechaFilter.set(formattedDate);
      this.fechaFilter$.next(formattedDate);
    } else {
      this.fechaFilter.set('');
      this.fechaFilter$.next('');
    }
  }

  formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onCantidadFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.cantidadFilter.set(value.toLowerCase());
    this.cantidadFilter$.next(value);
  }

  onPrecioFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.precioFilter.set(value.toLowerCase());
    this.precioFilter$.next(value);
  }

  onUbicacionFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.ubicacionFilter.set(value.toLowerCase());
    this.ubicacionFilter$.next(value);
  }

  hasAnyFilter(): boolean {
    return !!(this.skuFilter() || this.nombreFilter() || this.fechaFilter() || 
              this.cantidadFilter() || this.precioFilter() || this.ubicacionFilter());
  }

  clearFilters(): void {
    this.skuFilter.set('');
    this.nombreFilter.set('');
    this.fechaFilter.set('');
    this.cantidadFilter.set('');
    this.precioFilter.set('');
    this.ubicacionFilter.set('');
    this.selectedDate = null;
    this.currentPage = 1;
    this.loadProductos();
  }

  get paginatedProductos(): ProductoResponse[] {
    // Ya no es necesario paginar localmente, el backend lo hace
    return this.productos();
  }

  get pageNumbers(): number[] {
    const totalPages = this.pagination()?.total_pages || 0;
    const current = this.currentPage;
    const delta = 2; // Número de páginas a mostrar a cada lado de la página actual
    const pages: number[] = [];

    // Siempre mostrar la primera página
    if (totalPages > 0) {
      pages.push(1);
    }

    // Calcular el rango de páginas a mostrar
    let start = Math.max(2, current - delta);
    let end = Math.min(totalPages - 1, current + delta);

    // Ajustar si estamos cerca del inicio
    if (current <= delta + 2) {
      end = Math.min(totalPages - 1, delta * 2 + 2);
    }

    // Ajustar si estamos cerca del final
    if (current >= totalPages - delta - 1) {
      start = Math.max(2, totalPages - delta * 2 - 1);
    }

    // Agregar puntos suspensivos al inicio si es necesario
    if (start > 2) {
      pages.push(-1); // -1 representa "..."
    }

    // Agregar páginas del rango
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Agregar puntos suspensivos al final si es necesario
    if (end < totalPages - 1) {
      pages.push(-2); // -2 representa "..."
    }

    // Siempre mostrar la última página (si hay más de una página)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }

  get totalPages(): number {
    return this.pagination()?.total_pages || 0;
  }

  goToPage(page: number): void {
    const totalPages = this.pagination()?.total_pages || 0;
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.loadProductos();
    }
  }

  canCreateProducto(): boolean {
    const role = this.authService.getUserRole();
    return role === 'Compras' || role === 'Administrador';
  }

  openCreateProductoDialog(): void {
    const dialogRef = this.dialog.open(CreateProductoComponent, {
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
      if (result === 'created') {
        this.loadProductos();
      }
    });
  }

  openCargueMasivoDialog(): void {
    const dialogRef = this.dialog.open(CargueMasivoComponent, {
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
    // const dialogRef = this.dialog.open(CargueMasivoComponent, {
    //   width: '700px',
    //   disableClose: true
    // });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'uploaded') {
        this.snackBar.open('Productos cargados exitosamente', 'Cerrar', {
          duration: 3000
        });
        this.loadProductos();
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }
}
