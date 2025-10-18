import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../services/inventario.service';
import { AuthService } from '../../auth/services/auth.service';
import { ProductoResponse } from '../models/producto.model';
import { CreateProductoComponent } from '../components/create-producto/create-producto';

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './inventario-list.html',
  styleUrls: ['./inventario-list.scss']
})
export class InventarioListComponent implements OnInit {
  productos = signal<ProductoResponse[]>([]);
  filteredProductos = signal<ProductoResponse[]>([]);
  loading = signal(true);
  
  // Expose Math for template
  Math = Math;
  
  // Filtros
  skuFilter = '';
  nombreFilter = '';
  ubicacionFilter = '';

  // Paginación
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;

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
    this.loadProductos();
  }

  loadProductos(): void {
    this.loading.set(true);
    
    this.inventarioService.getProductos().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.applyFilters();
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

  applyFilters(): void {
    let filtered = this.productos();

    if (this.skuFilter) {
      filtered = filtered.filter(p => 
        p.sku.toLowerCase().includes(this.skuFilter.toLowerCase())
      );
    }

    if (this.nombreFilter) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(this.nombreFilter.toLowerCase())
      );
    }

    if (this.ubicacionFilter) {
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(this.ubicacionFilter.toLowerCase())
      );
    }

    this.filteredProductos.set(filtered);
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.currentPage = 1;
  }

  get paginatedProductos(): ProductoResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredProductos().slice(start, end);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  canCreateProducto(): boolean {
    const role = this.authService.getUserRole();
    return role === 'Administrador' || role === 'Compras';
  }

  openCreateProductoDialog(): void {
    const dialogRef = this.dialog.open(CreateProductoComponent, {
      width: '700px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'created') {
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
    return new Date(date).toLocaleDateString('es-CO');
  }
}
