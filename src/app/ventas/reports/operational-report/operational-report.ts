import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsService } from '../../services/reports.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { AuthService } from '../../../auth/services/auth.service';
import { forkJoin } from 'rxjs';

interface TopClient {
  id: string;
  name: string;
  orders: number;
}

interface TopProduct {
  id: number;
  name: string;
  orders: number;
}

@Component({
  selector: 'app-operational-report',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatTableModule,
    NgChartsModule
  ],
  templateUrl: './operational-report.html',
  styleUrls: ['./operational-report.scss']
})
export class OperationalReportComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);

  // Filters (server-side placeholders)
  clientNameFilter = '';
  clientDateFilter: Date | null = null;
  private filterTimeout: any;

  // Monthly data
  monthly = signal<{ label: string; orders: number; amount: number }[]>([]);

  // Top clients/products
  topClients = signal<TopClient[]>([]);
  topProducts = signal<TopProduct[]>([]);
  private originalTopClients: TopClient[] = [];

  // Access control
  canViewAll = signal(false);
  role = signal<string | null>(null);

  // Chart configs signals
  ordersBarConfig = computed<ChartConfiguration<'bar'>>(() => ({
    type: 'bar',
    data: {
      labels: this.monthly().map(m => m.label),
      datasets: [
        {
          label: 'Pedidos',
          data: this.monthly().map(m => m.orders),
          backgroundColor: '#90c5ff',
          borderRadius: 4,
          maxBarThickness: 40
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false }
      }
    }
  }));

  amountLineConfig = computed<ChartConfiguration<'line'>>(() => ({
    type: 'line',
    data: {
      labels: this.monthly().map(m => m.label),
      datasets: [
        {
          label: 'Ventas (COP)',
          data: this.monthly().map(m => m.amount),
          borderColor: '#3682ff',
          backgroundColor: 'rgba(54,130,255,0.15)',
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#3682ff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      },
      plugins: { legend: { display: false } }
    }
  }));

  productsBarConfig = computed<ChartConfiguration<'bar'>>(() => ({
    type: 'bar',
    data: {
      labels: this.topProducts().map(p => p.name),
      datasets: [
        {
          label: 'Pedidos',
          data: this.topProducts().map(p => p.orders),
          backgroundColor: '#b3d6ff',
          borderRadius: 4,
          maxBarThickness: 40
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      },
      plugins: { legend: { display: false } }
    }
  }));

  displayedClientColumns = ['name', 'orders'];

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initAccess();
    this.loadReport();
  }

  private initAccess(): void {
    const userRole = this.authService.getUserRole();
    this.role.set(userRole);
    this.canViewAll.set(userRole === 'Administrador');
  }

  private loadReport(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      monthly: this.reportsService.getMonthlyReport(),
      topClients: this.reportsService.getTopClients(),
      topProducts: this.reportsService.getTopProducts()
    }).subscribe({
      next: ({ monthly, topClients, topProducts }) => {
        this.monthly.set(
          monthly.monthly_data.map(m => ({
            label: m.label,
            orders: m.orders_count,
            amount: m.total_amount
          }))
        );

        // Map backend top clients
        this.originalTopClients = topClients.map(tc => ({
          id: tc.client_id,
          name: tc.client_name,
          orders: tc.orders_count
        }));
        // Keep only top 5 initially (backend already sends top N but enforce just in case)
        this.topClients.set(this.originalTopClients.slice(0, 5));

        // Map backend top products (limit top 10)
        const mappedProducts = topProducts.map(p => ({
          id: p.product_id,
            name: p.product_name,
            orders: p.total_sold
        })).sort((a,b) => b.orders - a.orders).slice(0,10);
        this.topProducts.set(mappedProducts);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading report', err);
        this.loading.set(false);
        this.error.set('Error temporal del sistema. Contacte soporte técnico si persiste.');
        this.snackBar.open('Error cargando reporte operativo', 'Cerrar', { duration: 4000 });
      }
    });
  }

  // Debounced filter triggering (server-side placeholder)
  onClientFilterChange(): void {
    if (this.filterTimeout) clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      // In future: call backend with filters
      this.applyClientFiltersLocally();
    }, 300);
  }

  private applyClientFiltersLocally(): void {
    const nameTerm = this.clientNameFilter.trim().toLowerCase();
    let clients = [...this.originalTopClients];
    if (nameTerm) {
      clients = clients.filter(c => c.name.toLowerCase().includes(nameTerm));
    }
    this.topClients.set(clients.slice(0, 5));
  }

  // (Placeholder removed: products now come from backend)

  isEmptyState(): boolean {
    return !this.loading() && this.monthly().length === 0 && !this.error();
  }
}
