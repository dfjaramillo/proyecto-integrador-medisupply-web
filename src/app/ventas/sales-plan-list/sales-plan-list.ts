import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { SalesPlanService } from '../services/sales-plan.service';
import { AuthService } from '../../auth/services/auth.service';
import { SalesPlan, SalesPlanPagination } from '../models/sales-plan.model';
import { SalesPlanDetailComponent } from '../components/sales-plan-detail';
import { CreateSalesPlanComponent } from '../components/create-sales-plan/create-sales-plan';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-sales-plan-list',
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
    MatDatepickerToggle,
    MatDatepicker,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }
  ],
  templateUrl: './sales-plan-list.html',
  styleUrls: ['./sales-plan-list.scss'],
})
export class SalesPlanListComponent implements OnInit {
  salesPlans = signal<SalesPlan[]>([]);
  loading = signal(true);
  pagination = signal<SalesPlanPagination | null>(null);

  // Filtros
  nameFilter = '';
  startDateFilter: Date | null = null;
  endDateFilter: Date | null = null;
  clientFilter = '';
  
  // Debounce timeout for filters
  private filterTimeout: any;

  // Expose Math for template
  Math = Math;

  // Paginación
  currentPage = 1;
  pageSize = 5;

  displayedColumns: string[] = [
    'name',
    'start_date',
    'end_date',
    'client_id',
    'actions',
  ];

  constructor(
    private salesPlanService: SalesPlanService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.checkAccess();
    this.loadSalesPlans();
  }

  /**
   * Verifica si el usuario tiene acceso a esta funcionalidad
   */
  private checkAccess(): void {
    if (!this.canAccessSalesPlans()) {
      this.snackBar.open(
        'No tiene permisos para acceder a esta información.',
        'Cerrar',
        { duration: 5000 }
      );
      this.loading.set(false);
    }
  }

  /**
   * Control de acceso: Administrador y Ventas pueden acceder
   */
  canAccessSalesPlans(): boolean {
    const userRoles = this.authService.getUserRoles();
    return (
      userRoles.includes('Administrador') || userRoles.includes('Ventas')
    );
  }

  /**
   * Carga la lista de planes de ventas
   */
  loadSalesPlans(): void {
    if (!this.canAccessSalesPlans()) {
      return;
    }

    this.loading.set(true);

    const params: any = {
      page: this.currentPage,
      per_page: this.pageSize,
    };

    // Solo agregar seller_id si el usuario NO es Administrador
    const isAdmin = this.authService.getUserRoles().includes('Administrador');
    if (!isAdmin) {
      const userId = this.authService.getUserId();
      if (userId) {
        params.seller_id = userId;
      }
    }

    // Agregar filtros si tienen valores
    if (this.nameFilter.trim()) {
      params.name = this.nameFilter.trim();
    }

    if (this.clientFilter.trim()) {
      params.client_name = this.clientFilter.trim();
    }

    if (this.startDateFilter) {
      params.start_date = this.formatDateForAPI(this.startDateFilter);
    }

    if (this.endDateFilter) {
      params.end_date = this.formatDateForAPI(this.endDateFilter);
    }

    this.salesPlanService.getSalesPlans(params).subscribe({
      next: (response) => {
        this.salesPlans.set(response.items);
        this.pagination.set(response.pagination);
        this.loading.set(false);      
      },
      error: (error) => {
        console.error('Error loading sales plans:', error);
        this.loading.set(false);

        let errorMessage =
          'Error temporal del sistema. Intente nuevamente. Si persiste, contacte soporte.';

        if (error.status === 403) {
          errorMessage = 'No tiene permisos para acceder a esta información.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
      },
    });
  }

  /**
   * Formatea la fecha para enviar al API (formato ISO)
   */
  private formatDateForAPI(date: Date | string): string {
    if (typeof date === 'string') {
      // Si es un string ISO, devolverlo tal cual
      if (date.includes('T') && date.includes('Z')) {
        return date;
      }
      // Si es un string de fecha simple, convertirlo a Date y luego a ISO
      return new Date(date).toISOString();
    }
    // Si es un Date object, convertirlo a ISO
    return date.toISOString();
  }

  /**
   * Abre el detalle del plan de ventas en un diálogo
   */
  openDetail(plan: SalesPlan): void {
     const dialogRef = this.dialog.open(SalesPlanDetailComponent, {
    data: plan,
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
  }

  /**
   * Abre el diálogo para crear un nuevo plan de ventas
   */
  openCreate(): void {
    const dialogRef = this.dialog.open(CreateSalesPlanComponent, {
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      width: '600px',
      maxWidth: '800px',
      height: '100vh',
      panelClass: ['right-sheet'],
      position: { right: '0' },
      disableClose: true // Evita cerrar accidentalmente mientras se edita
    });

    // Recargar la lista cuando se cierre el diálogo si se creó un plan
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'created') {
        this.currentPage = 1;
        this.loadSalesPlans();
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
      this.loadSalesPlans();
    }, 500);
  }

  /**
   * Maneja el cambio de fecha de inicio
   */
  onStartDateChange(date: Date | null): void {
    this.startDateFilter = date;
    this.onFilterChange();
  }

  /**
   * Maneja el cambio de fecha de fin
   */
  onEndDateChange(date: Date | null): void {
    this.endDateFilter = date;
    this.onFilterChange();
  }

  /**
   * Formatea la fecha para mostrar en la tabla (Ene 15, 2026)
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
   * Formatea el valor monetario (30.266.999)
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(value);
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
    this.loadSalesPlans();
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
