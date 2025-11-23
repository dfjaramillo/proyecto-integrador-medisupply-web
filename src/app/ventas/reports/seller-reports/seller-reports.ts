import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { forkJoin } from 'rxjs';

import { SellerReportsService } from '../../services/seller-reports.service';
import { UserService } from '../../../usuarios/services/user.service';
import { User } from '../../../usuarios/models/user.model';
import {
  StatusSummaryData,
  ClientsSummaryData,
  MonthlySummaryData,
  ClientEarnings
} from '../../models/seller-report.model';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-seller-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    NgChartsModule
  ],
  templateUrl: './seller-reports.html',
  styleUrls: ['./seller-reports.scss']
})
export class SellerReportsComponent implements OnInit {
  private sellerReportsService = inject(SellerReportsService);
  private userService = inject(UserService);
  private authservice = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  // Sellers list
  sellers = signal<User[]>([]);
  loadingSellers = signal(true);
  
  // Selected seller
  selectedSellerId = signal<string>('');
  
  // Report data
  statusSummary = signal<StatusSummaryData | null>(null);
  clientsSummary = signal<ClientsSummaryData | null>(null);
  monthlySummary = signal<MonthlySummaryData | null>(null);
  
  // Loading states
  loadingReports = signal(false);
  
  // Pagination for clients table
  currentPage = signal(1);
  pageSize = signal(10);
  
  // Search filters
  searchClientName = '';
  searchDate = '';
  
  // Table columns
  displayedColumns = ['client_name', 'total_amount'];
  
  // Math utility
  Math = Math;

  currentUserRole = signal(this.authservice.getUserRole());

  ngOnInit(): void {
    if (this.authservice.getUserRole() === 'Ventas') {
      this.selectedSellerId.set(this.authservice.getUserId());
      this.loadReports(this.authservice.getUserId());            
    }else {
      this.loadSellers();
    }
  }

  /**
   * Load all sellers (users with role 'Ventas')
   */
  private loadSellers(): void {
    this.loadingSellers.set(true);
    // Get sellers (role: Ventas) with large page size to get all
    this.userService.getUsers(1, 100, 'role', 'Ventas').subscribe({
      next: (response) => {
        this.sellers.set(response.users);
        this.loadingSellers.set(false);
      },
      error: (error) => {
        console.error('Error loading sellers:', error);
        this.snackBar.open('Error al cargar vendedores', 'Cerrar', { duration: 3000 });
        this.loadingSellers.set(false);
      }
    });
  }

  /**
   * Handler for seller selection change
   */
  onSellerChange(): void {
    const sellerId = this.selectedSellerId();
    if (!sellerId) {
      // Clear reports if no seller selected
      this.statusSummary.set(null);
      this.clientsSummary.set(null);
      this.monthlySummary.set(null);
      return;
    }

    this.loadReports(sellerId);
  }

  /**
   * Load all reports for the selected seller
   */
  private loadReports(sellerId: string): void {
    this.loadingReports.set(true);
    
    forkJoin({
      status: this.sellerReportsService.getStatusSummary(sellerId),
      clients: this.sellerReportsService.getClientsSummary(sellerId, this.currentPage(), this.pageSize()),
      monthly: this.sellerReportsService.getMonthlySummary(sellerId)
    }).subscribe({
      next: (reports) => {
        this.statusSummary.set(reports.status);
        this.clientsSummary.set(reports.clients);
        this.monthlySummary.set(reports.monthly);
        this.loadingReports.set(false);
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.snackBar.open('Error al cargar informes', 'Cerrar', { duration: 3000 });
        this.loadingReports.set(false);
      }
    });
  }

  /**
   * Donut chart configuration for order status distribution
   */
  donutChartConfig = computed<ChartConfiguration<'doughnut'> | null>(() => {
    const data = this.statusSummary();
    if (!data || !data.status_summary.length) return null;

    // Filter out statuses with 0 count for cleaner visualization
    const filteredData = data.status_summary.filter(item => item.count > 0);
    
    if (filteredData.length === 0) return null;

    return {
      type: 'doughnut',
      data: {
        labels: filteredData.map(item => item.status),
        datasets: [{
          data: filteredData.map(item => item.count),
          backgroundColor: [
            '#3b82f6', // Recibido - blue
            '#f59e0b', // En Preparación - amber
            '#8b5cf6', // En Tránsito - purple
            '#10b981', // Entregado - green
            '#ef4444'  // Devuelto - red
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            align: 'center',
            labels: {
              padding: 12,
              font: { size: 12 },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels && data.datasets[0].data) {
                  return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i] as number; // value kept in case future customization
                    const percent = filteredData[i].percentage.toFixed(0);
                    const bgColors = data.datasets[0].backgroundColor as string[];
                    return {
                      text: `${label} ${percent}%`,
                      fillStyle: bgColors[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percent = filteredData[context.dataIndex].percentage.toFixed(1);
                return `${label}: ${value} pedidos (${percent}%)`;
              }
            }
          }
        }
      }
    };
  });

  /**
   * Line chart configuration for monthly sales
   */
  lineChartConfig = computed<ChartConfiguration<'line'> | null>(() => {
    const data = this.monthlySummary();
    if (!data || !data.monthly_data.length) return null;

    // Reverse to show oldest to newest (left to right)
    const reversedData = [...data.monthly_data].reverse();

    return {
      type: 'line',
      data: {
        labels: reversedData.map(item => `${item.month_short}. ${item.year}`),
        datasets: [{
          label: 'Ventas totales (COP)',
          data: reversedData.map(item => item.total_amount),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 11 },
              callback: (value) => {
                return '$' + (value as number).toLocaleString('es-CO');
              }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                return `Ventas: $${value.toLocaleString('es-CO')}`;
              }
            }
          }
        }
      }
    };
  });

  /**
   * Handler for search input changes
   */
  onSearchChange(): void {
    // Reset to first page when search changes
    this.currentPage.set(1);
    // For now, search is handled by the table's internal filtering
    // In a real app, you'd call the API with search parameters
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return '$' + amount.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  /**
   * Get clients for current page
   */
  get paginatedClients(): ClientEarnings[] {
    return this.clientsSummary()?.clients || [];
  }

  /**
   * Pagination helpers
   */
  get totalPages(): number {
    return this.clientsSummary()?.pagination.total_pages || 0;
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage();
    const delta = 2;
    const pages: number[] = [];

    if (total <= 0) return [];

    pages.push(1);

    let start = Math.max(2, current - delta);
    let end = Math.min(total - 1, current + delta);

    if (current <= delta + 2) {
      end = Math.min(total - 1, delta * 2 + 2);
    }

    if (current >= total - delta - 1) {
      start = Math.max(2, total - delta * 2 - 1);
    }

    if (start > 2) {
      pages.push(-1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) {
      pages.push(-2);
    }

    if (total > 1) {
      pages.push(total);
    }

    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
      const sellerId = this.selectedSellerId();
      if (sellerId) {
        this.loadClientsPage(sellerId);
      }
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      const sellerId = this.selectedSellerId();
      if (sellerId) {
        this.loadClientsPage(sellerId);
      }
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.set(this.currentPage() + 1);
      const sellerId = this.selectedSellerId();
      if (sellerId) {
        this.loadClientsPage(sellerId);
      }
    }
  }

  private loadClientsPage(sellerId: string): void {
    this.sellerReportsService.getClientsSummary(sellerId, this.currentPage(), this.pageSize())
      .subscribe({
        next: (data) => {
          this.clientsSummary.set(data);
        },
        error: (error) => {
          console.error('Error loading clients page:', error);
          this.snackBar.open('Error al cargar página de clientes', 'Cerrar', { duration: 3000 });
        }
      });
  }
}
