import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OperationalReportComponent } from './operational-report';
import { ReportsService } from '../../services/reports.service';
import { AuthService } from '../../../auth/services/auth.service';

// Minimal shape to satisfy component mapping
const buildMonthlyData = (entries: Array<{ label: string; short: string; orders: number; amount: number }>) => {
  return entries.map(e => ({
    year: 2024,
    month: 1,
    month_name: e.label,
    month_short: e.short,
    label: e.label,
    orders_count: e.orders,
    total_amount: e.amount
  }));
};

describe('OperationalReportComponent', () => {
  let component: OperationalReportComponent;
  let reportsService: jasmine.SpyObj<ReportsService>;
  let authService: jasmine.SpyObj<AuthService>;

  const monthlyPayload = {
    period: { start_date: '2024-01-01', end_date: '2024-06-30', months: 6 },
    summary: {
      total_orders: 60,
      total_amount: 600000,
      months_with_data: 6,
      average_orders_per_month: 10,
      average_amount_per_month: 100000
    },
    monthly_data: buildMonthlyData([
      { label: 'Enero', short: 'Ene', orders: 10, amount: 100000 },
      { label: 'Febrero', short: 'Feb', orders: 9, amount: 90000 },
      { label: 'Marzo', short: 'Mar', orders: 11, amount: 110000 },
      { label: 'Abril', short: 'Abr', orders: 8, amount: 80000 },
      { label: 'Mayo', short: 'May', orders: 12, amount: 120000 },
      { label: 'Junio', short: 'Jun', orders: 10, amount: 100000 }
    ])
  };

  const topClientsPayload = {
    success: true,
    message: 'ok',
    data: {
      period: { start_date: '2024-01-01', end_date: '2024-06-30', months: 6 },
      top_clients: [
        { client_id: '1', orders_count: 10, client_name: 'Cliente Ene' },
        { client_id: '2', orders_count: 9, client_name: 'Cliente Feb' },
        { client_id: '3', orders_count: 8, client_name: 'Cliente Mar' },
        { client_id: '4', orders_count: 7, client_name: 'Cliente Abr' },
        { client_id: '5', orders_count: 6, client_name: 'Cliente May' }
      ]
    }
  };

  const topProductsPayload = {
    success: true,
    message: 'ok',
    data: {
      top_products: [
        { product_id: 101, total_sold: 15, product_name: 'Producto A' },
        { product_id: 102, total_sold: 12, product_name: 'Producto B' }
      ]
    }
  };

  beforeEach(() => {
    reportsService = jasmine.createSpyObj('ReportsService', ['getMonthlyReport', 'getTopClients', 'getTopProducts']);
    authService = jasmine.createSpyObj('AuthService', ['getUserRole']);
    authService.getUserRole.and.returnValue('Administrador');

    TestBed.configureTestingModule({
      imports: [OperationalReportComponent],
      providers: [
        { provide: ReportsService, useValue: reportsService },
        { provide: AuthService, useValue: authService },
        { provide: 'MatSnackBar', useValue: { open: () => {} } }
      ]
    });

    const fixture = TestBed.createComponent(OperationalReportComponent);
    component = fixture.componentInstance;
  });

  it('should show loading then populate charts on success', () => {
    reportsService.getMonthlyReport.and.returnValue(of(monthlyPayload));
    reportsService.getTopClients.and.returnValue(of(topClientsPayload.data.top_clients));
    reportsService.getTopProducts.and.returnValue(of(topProductsPayload.data.top_products));
    component.ngOnInit();

    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
    expect(component.monthly().length).toBe(6);
    // Orders bar chart labels should match monthly payload labels
    expect(component.ordersBarConfig().data.labels).toEqual(monthlyPayload.monthly_data.map(m => m.label));
  });

  it('should expose empty state when monthly_data is empty', () => {
    reportsService.getMonthlyReport.and.returnValue(of({ ...monthlyPayload, monthly_data: [] }));
    reportsService.getTopClients.and.returnValue(of(topClientsPayload.data.top_clients));
    reportsService.getTopProducts.and.returnValue(of(topProductsPayload.data.top_products));
    component.ngOnInit();
    expect(component.monthly().length).toBe(0);
    expect(component.isEmptyState()).toBeTrue();
  });

  it('should set error signal on service failure', () => {
    reportsService.getMonthlyReport.and.returnValue(throwError(() => new Error('backend fail')));
    reportsService.getTopClients.and.returnValue(of(topClientsPayload.data.top_clients));
    reportsService.getTopProducts.and.returnValue(of(topProductsPayload.data.top_products));
    component.ngOnInit();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });

  it('should debounce client name filter and reduce topClients', fakeAsync(() => {
    reportsService.getMonthlyReport.and.returnValue(of(monthlyPayload));
    reportsService.getTopClients.and.returnValue(of(topClientsPayload.data.top_clients));
    reportsService.getTopProducts.and.returnValue(of(topProductsPayload.data.top_products));
    component.ngOnInit();
    const initial = component.topClients().length; // up to 5
    expect(initial).toBeGreaterThan(0);
    component.clientNameFilter = 'Ene';
    component.onClientFilterChange();
    tick(350); // debounce time + margin
    const filtered = component.topClients();
    expect(filtered.length).toBeLessThan(initial);
    expect(filtered.every(c => c.name.toLowerCase().includes('ene'))).toBeTrue();
    // Ensure products mapped
    expect(component.topProducts().length).toBe(2);
    expect(component.topProducts()[0].name).toBe('Producto A');
  }));
});
