import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SellerReportsService } from './seller-reports.service';
import { environment } from '../../../environments/environment';

describe('SellerReportsService', () => {
  let service: SellerReportsService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SellerReportsService]
    });

    service = TestBed.inject(SellerReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStatusSummary', () => {
    it('should fetch status summary for a seller', () => {
      const sellerId = 'test-seller-id';
      const mockResponse = {
        success: true,
        message: 'Informe de estados generado exitosamente',
        data: {
          seller_id: sellerId,
          summary: {
            total_orders: 10,
            total_amount: 1000000
          },
          status_summary: [
            { status: 'Recibido', count: 5, percentage: 50, total_amount: 500000 }
          ]
        }
      };

      service.getStatusSummary(sellerId).subscribe(data => {
        expect(data.seller_id).toBe(sellerId);
        expect(data.summary.total_orders).toBe(10);
      });

      const req = httpMock.expectOne(`${baseUrl}/orders/informes/seller/status-summary?seller_id=${sellerId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getClientsSummary', () => {
    it('should fetch clients summary with pagination', () => {
      const sellerId = 'test-seller-id';
      const page = 1;
      const perPage = 10;
      const mockResponse = {
        success: true,
        message: 'Informe de clientes generado exitosamente',
        data: {
          seller_id: sellerId,
          summary: {
            total_clients: 5,
            total_orders: 20,
            total_amount: 2000000
          },
          clients: [
            { client_id: '1', client_name: 'Cliente 1', orders_count: 10, total_amount: 1000000 }
          ],
          pagination: {
            page: 1,
            per_page: 10,
            total: 5,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      };

      service.getClientsSummary(sellerId, page, perPage).subscribe(data => {
        expect(data.seller_id).toBe(sellerId);
        expect(data.clients.length).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/orders/informes/seller/clients-summary?seller_id=${sellerId}&page=${page}&per_page=${perPage}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getMonthlySummary', () => {
    it('should fetch monthly summary for a seller', () => {
      const sellerId = 'test-seller-id';
      const mockResponse = {
        success: true,
        message: 'Informe mensual generado exitosamente',
        data: {
          seller_id: sellerId,
          period: {
            start_date: '2024-12-01',
            end_date: '2025-11-20',
            months: 12
          },
          summary: {
            total_orders: 50,
            total_amount: 5000000
          },
          monthly_data: [
            {
              year: 2025,
              month: 11,
              month_name: 'noviembre',
              month_short: 'nov',
              label: 'nov-2025',
              orders_count: 10,
              total_amount: 1000000
            }
          ]
        }
      };

      service.getMonthlySummary(sellerId).subscribe(data => {
        expect(data.seller_id).toBe(sellerId);
        expect(data.monthly_data.length).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/orders/informes/seller/monthly?seller_id=${sellerId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
