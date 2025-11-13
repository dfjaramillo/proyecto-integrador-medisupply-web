import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportsService, MonthlyReportResponse, TopClientsResponse, TopProductsResponse } from './reports.service';
import { environment } from '../../../environments/environment';

describe('ReportsService', () => {
  let service: ReportsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ReportsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should fetch monthly report and map data', () => {
    const mock: MonthlyReportResponse = {
      success: true,
      message: 'ok',
      data: {
        period: { start_date: '2024-01-01', end_date: '2024-06-30', months: 6 },
        summary: { total_orders: 10, total_amount: 1000, months_with_data: 1, average_orders_per_month: 10, average_amount_per_month: 1000 },
        monthly_data: [
          { year: 2024, month: 1, month_name: 'Enero', month_short: 'Ene', label: 'Enero', orders_count: 10, total_amount: 1000 }
        ]
      }
    };

    let result: MonthlyReportResponse['data'] | undefined;
    service.getMonthlyReport({ months: 6 }).subscribe(r => (result = r));

    const req = http.expectOne(r => r.url === `${environment.apiUrl}/orders/reports/monthly` && r.params.get('months') === '6');
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(result).toEqual(mock.data);
  });

  it('should fallback to mock when monthly endpoint fails', () => {
    const mock: MonthlyReportResponse = {
      success: true,
      message: 'mock',
      data: { period: { start_date: '', end_date: '', months: 0 }, summary: { total_orders: 0, total_amount: 0, months_with_data: 0, average_orders_per_month: 0, average_amount_per_month: 0 }, monthly_data: [] }
    };
    let result: MonthlyReportResponse['data'] | undefined;
    service.getMonthlyReport().subscribe(r => (result = r));

    const realReq = http.expectOne(`${environment.apiUrl}/orders/reports/monthly`);
    realReq.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });

    const mockReq = http.expectOne('/mocks/reports/monthly.json');
    mockReq.flush(mock);

    expect(result).toEqual(mock.data);
  });

  it('should return empty array on top clients error', () => {
    let result: TopClientsResponse['data']['top_clients'] | undefined;
    service.getTopClients({ months: 6 }).subscribe(r => (result = r));
    const realReq = http.expectOne(r => r.url === `${environment.apiUrl}/orders/reports/top-clients` && r.params.get('months') === '6');
    realReq.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
    expect(result).toEqual([]);
  });

  it('should map top clients response', () => {
    const backend: TopClientsResponse = {
      success: true,
      message: 'ok',
      data: {
        period: { start_date: '2024-01-01', end_date: '2024-06-30', months: 6 },
        top_clients: [
          { client_id: 'C1', client_name: 'Acme', orders_count: 5 },
          { client_id: 'C2', client_name: 'Beta', orders_count: 3 }
        ]
      }
    };
    let result: TopClientsResponse['data']['top_clients'] | undefined;
    service.getTopClients().subscribe(r => (result = r));
    const req = http.expectOne(`${environment.apiUrl}/orders/reports/top-clients`);
    req.flush(backend);
    expect(result).toEqual(backend.data.top_clients);
  });

  it('should return empty array on top products error', () => {
    let result: TopProductsResponse['data']['top_products'] | undefined;
    service.getTopProducts().subscribe(r => (result = r));
    const req = http.expectOne(`${environment.apiUrl}/orders/reports/top-products`);
    req.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
    expect(result).toEqual([]);
  });

  it('should map top products response', () => {
    const backend: TopProductsResponse = {
      success: true,
      message: 'ok',
      data: {
        top_products: [
          { product_id: 1, product_name: 'Prod A', total_sold: 20 },
          { product_id: 2, product_name: 'Prod B', total_sold: 5 }
        ]
      }
    };
    let result: TopProductsResponse['data']['top_products'] | undefined;
    service.getTopProducts({ start_date: '2024-01-01', end_date: '2024-06-30' }).subscribe(r => (result = r));
    const req = http.expectOne(r => r.url === `${environment.apiUrl}/orders/reports/top-products` && r.params.get('start_date') === '2024-01-01' && r.params.get('end_date') === '2024-06-30');
    req.flush(backend);
    expect(result).toEqual(backend.data.top_products);
  });
});