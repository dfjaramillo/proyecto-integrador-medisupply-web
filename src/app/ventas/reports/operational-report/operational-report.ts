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

interface TopClient {
  name: string;
  orders: number;
}

interface TopProduct {
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

  // Top clients/products (placeholder simulated until backend endpoints exist)
  topClients = signal<TopClient[]>([]);
  topProducts = signal<TopProduct[]>([]);

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
    this.reportsService.getMonthlyReport().subscribe({
      next: data => {
        this.monthly.set(
          data.monthly_data.map(m => ({
            label: m.label,
            orders: m.orders_count,
            amount: m.total_amount
          }))
        );
        // Simulate placeholder top clients/products (subset derived from monthly totals)
        this.topClients.set(this.buildMockTopClients(data.monthly_data));
        this.topProducts.set(this.buildMockTopProducts(data.monthly_data));
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
    let clients = this.buildMockTopClientsFromCurrentMonthly();
    if (nameTerm) {
      clients = clients.filter(c => c.name.toLowerCase().includes(nameTerm));
    }
    this.topClients.set(clients.slice(0, 5));
  }

  private buildMockTopClients(monthlyData: any[]): TopClient[] {
    // Aggregate orders by pseudo-client names (demo only)
    const buckets: Record<string, number> = {};
    monthlyData.forEach(m => {
      if (m.orders_count > 0) {
        buckets[`Cliente ${m.month_short}`] = (buckets[`Cliente ${m.month_short}`] || 0) + m.orders_count;
      }
    });
    return Object.entries(buckets)
      .map(([name, orders]) => ({ name, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
  }

  private buildMockTopClientsFromCurrentMonthly(): TopClient[] {
    return this.topClients().slice();
  }

  private buildMockTopProducts(monthlyData: any[]): TopProduct[] {
    // Derive pseudo products (demo only)
    const products: TopProduct[] = [];
    monthlyData.forEach(m => {
      if (m.orders_count > 0) {
        products.push({ name: `Prod ${m.month_short}`, orders: m.orders_count });
      }
    });
    return products.sort((a, b) => b.orders - a.orders).slice(0, 10);
  }

  isEmptyState(): boolean {
    return !this.loading() && this.monthly().length === 0 && !this.error();
  }
}
