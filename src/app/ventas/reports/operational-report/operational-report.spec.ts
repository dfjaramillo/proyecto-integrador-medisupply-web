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

  beforeEach(() => {
    reportsService = jasmine.createSpyObj('ReportsService', ['getMonthlyReport']);
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
    component.ngOnInit();

    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
    expect(component.monthly().length).toBe(6);
    // Orders bar chart labels should match monthly payload labels
    expect(component.ordersBarConfig().data.labels).toEqual(monthlyPayload.monthly_data.map(m => m.label));
  });

  it('should expose empty state when monthly_data is empty', () => {
    reportsService.getMonthlyReport.and.returnValue(of({ ...monthlyPayload, monthly_data: [] }));
    component.ngOnInit();
    expect(component.monthly().length).toBe(0);
    expect(component.isEmptyState()).toBeTrue();
  });

  it('should set error signal on service failure', () => {
    reportsService.getMonthlyReport.and.returnValue(throwError(() => new Error('backend fail')));
    component.ngOnInit();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });

  it('should debounce client name filter and reduce topClients', fakeAsync(() => {
    reportsService.getMonthlyReport.and.returnValue(of(monthlyPayload));
    component.ngOnInit();
    const initial = component.topClients().length; // up to 5
    expect(initial).toBeGreaterThan(0);
    component.clientNameFilter = 'Ene';
    component.onClientFilterChange();
    tick(350); // debounce time + margin
    const filtered = component.topClients();
    expect(filtered.length).toBeLessThan(initial);
    expect(filtered.every(c => c.name.toLowerCase().includes('ene'))).toBeTrue();
  }));
});
