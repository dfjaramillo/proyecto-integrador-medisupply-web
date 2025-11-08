import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { RoutesService } from '../services/routes.service';
import { AuthService } from '../../auth/services/auth.service';
import { Route } from '../models/route.model';
import { Pagination } from '../../shared/models/pagination.model';
import { CreateRouteComponent } from '../components/create-route/create-route';
import { RouteMapComponent } from '../components/route-map/route-map';

@Component({
  selector: 'app-routes-list',
  standalone: true,
  imports: [
    CommonModule,    
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    RouteMapComponent,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }
  ],
  templateUrl: './routes-list.html',
  styleUrls: ['./routes-list.scss'],
})
export class RoutesListComponent implements OnInit {
  routes = signal<Route[]>([]);
  loading = signal(true);
  pagination = signal<Pagination | null>(null);
  selectedRouteId = signal<number | null>(null);

  // Filtros
  routeCodeFilter = '';
  truckFilter = '';
  dateFilter: Date | null = null;
  productTypeFilter = '';
  
  // Debounce timeout for filters
  private filterTimeout: any;

  // Expose Math for template
  Math = Math;

  // Paginación
  currentPage = 1;
  pageSize = 5;

  displayedColumns: string[] = [
    'route_code',
    'assigned_truck',
    'delivery_date',
    'orders_count',
    'actions',
  ];

  constructor(
    private routesService: RoutesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.checkAccess();
    this.loadRoutes();
  }

  /**
   * Verifica si el usuario tiene acceso a esta funcionalidad
   */
  private checkAccess(): void {
    if (!this.canAccessRoutes()) {
      this.snackBar.open(
        'No tiene permisos para acceder a esta información.',
        'Cerrar',
        { duration: 5000 }
      );
      this.loading.set(false);
    }
  }

  /**
   * Control de acceso: Administrador y Logística pueden acceder
   */
  canAccessRoutes(): boolean {
    const userRoles = this.authService.getUserRoles();
    return (
      userRoles.includes('Administrador') || userRoles.includes('Logistica')
    );
  }

  /**
   * Carga la lista de rutas
   */
  loadRoutes(): void {
    if (!this.canAccessRoutes()) {
      return;
    }

    this.loading.set(true);

    const params: any = {
      page: this.currentPage,
      per_page: this.pageSize,
    };

    // Agregar filtros si tienen valores
    if (this.routeCodeFilter.trim()) {
      params.route_code = this.routeCodeFilter.trim();
    }

    if (this.truckFilter.trim()) {
      params.assigned_truck = this.truckFilter.trim();
    }

    if (this.dateFilter) {
      params.delivery_date = this.formatDateForAPI(this.dateFilter);
    }

    if (this.productTypeFilter.trim()) {
      params.product_type = this.productTypeFilter.trim();
    }

    this.routesService.getRoutes(params).subscribe({
      next: (response) => {
        this.routes.set(response.routes);
        this.pagination.set(response.pagination);
        this.loading.set(false);      
      },
      error: (error) => {
        console.error('Error loading routes:', error);
        this.loading.set(false);

        let errorMessage =
          'Error temporal del sistema. Contacte soporte técnico si persiste.';

        if (error.status === 403) {
          errorMessage = 'No tiene permisos para acceder a esta información.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
      },
    });
  }

  /**
   * Formatea la fecha para enviar al API (formato YYYY-MM-DD)
   */
  private formatDateForAPI(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    // Formato YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Abre el detalle de la ruta mostrando el mapa
   */
  openDetail(route: Route): void {
    this.selectedRouteId.set(route.id);
  }

  /**
   * Cierra la vista del mapa y vuelve al listado
   */
  closeMap(): void {
    this.selectedRouteId.set(null);
  }

  /**
   * Abre el diálogo para crear una nueva ruta
   */
  openCreate(): void {
    const dialogRef = this.dialog.open(CreateRouteComponent, {
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      width: '600px',
      maxWidth: '800px',
      height: '100vh',
      panelClass: ['right-sheet'],
      position: { right: '0' },
      disableClose: true
    });

    // Recargar la lista cuando se cierre el diálogo si se creó una ruta
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'created') {
        this.currentPage = 1;
        this.loadRoutes();
      }
    });
  }

  /**
   * Maneja el cambio en los filtros con debounce
   */
  onFilterChange(): void {
    // Limpiar el timeout anterior
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }

    // Esperar 500ms después del último cambio antes de aplicar el filtro
    this.filterTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadRoutes();
    }, 500);
  }

  /**
   * Maneja el cambio de fecha
   */
  onDateChange(date: Date | null): void {
    this.dateFilter = date;
    this.onFilterChange();
  }

  /**
   * Formatea la fecha para mostrar en la tabla (Dic 01, 2025)
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day < 10 ? '0' + day : day}, ${year}`;
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number): void {
    if (
      page < 1 ||
      page > (this.pagination()?.total_pages || 1) ||
      page === this.currentPage
    ) {
      return;
    }
    this.currentPage = page;
    this.loadRoutes();
  }

  /**
   * Obtiene el array de páginas para mostrar en la paginación
   */
  getPages(): number[] {
    const totalPages = this.pagination()?.total_pages || 1;
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, this.currentPage - halfMaxPages);
    let endPage = Math.min(totalPages, this.currentPage + halfMaxPages);

    if (this.currentPage <= halfMaxPages) {
      endPage = Math.min(maxPagesToShow, totalPages);
    }

    if (this.currentPage + halfMaxPages >= totalPages) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
