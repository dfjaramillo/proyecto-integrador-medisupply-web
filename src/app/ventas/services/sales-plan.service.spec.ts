import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SalesPlanService } from './sales-plan.service';
import { environment } from '../../../environments/environment';
import {
  SalesPlan,
  SalesPlanListResponse,
  SalesPlanDetailResponse,
} from '../models/sales-plan.model';

describe('SalesPlanService', () => {
  let service: SalesPlanService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/sales-plan`;

  const mockSalesPlan: SalesPlan = {
    id: 1,
    name: 'Plan AÑO NUEVO 3085',
    start_date: '2025-11-30T00:00:00.000Z',
    end_date: '2026-03-02T00:00:00.000Z',
    target_revenue: 30266999,
    objectives: 'Aumentar las ventas en un 20% durante el primer trimestre del año',
    seller_id: '550e8400-e29b-41d4-a716-446655440000',
    seller_name: 'Juan Pérez',
    client_id: '660e8400-e29b-41d4-a716-446655440001',
    client_name: 'Farmacia San Juan',
    created_at: '2025-01-15T10:30:00.000Z',
    updated_at: '2025-01-15T10:30:00.000Z'
  };

  const mockSalesPlansList: SalesPlan[] = [
    mockSalesPlan,
    {
      id: 2,
      name: 'Plan Estratégico 02 8923',
      start_date: '2025-12-01T00:00:00.000Z',
      end_date: '2026-03-05T00:00:00.000Z',
      target_revenue: 45000000,
      objectives: 'Expandir la línea de productos cardiovasculares',
      seller_id: '550e8400-e29b-41d4-a716-446655440000',
      seller_name: 'Juan Pérez',
      client_id: '770e8400-e29b-41d4-a716-446655440002',
      client_name: 'Droguería Central',
      created_at: '2025-01-16T11:00:00.000Z',
      updated_at: '2025-01-16T11:00:00.000Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SalesPlanService]
    });

    service = TestBed.inject(SalesPlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSalesPlans', () => {
    it('should return sales plans list with pagination', () => {
      const mockResponse: SalesPlanListResponse = {
        success: true,
        message: 'Planes de ventas obtenidos exitosamente',
        data: {
          items: mockSalesPlansList,
          pagination: {
            page: 1,
            per_page: 5,
            total: 2,
            total_pages: 1
          }
        }
      };

      service.getSalesPlans({ page: 1, per_page: 5 }).subscribe(response => {
        expect(response).toEqual(mockResponse.data);
        expect(response.items.length).toBe(2);
        expect(response.pagination.total).toBe(2);
      });

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && request.params.has('page') && request.params.has('per_page')
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('per_page')).toBe('5');
      req.flush(mockResponse);
    });

    it('should filter by seller_id', () => {
      const sellerId = '550e8400-e29b-41d4-a716-446655440000';
      const mockResponse: SalesPlanListResponse = {
        success: true,
        message: 'Planes de ventas obtenidos exitosamente',
        data: {
          items: [mockSalesPlan],
          pagination: {
            page: 1,
            per_page: 5,
            total: 1,
            total_pages: 1
          }
        }
      };

      service.getSalesPlans({ seller_id: sellerId }).subscribe(response => {
        expect(response.items.length).toBe(1);
        expect(response.items[0].seller_id).toBe(sellerId);
      });

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && request.params.has('seller_id')
      );
      expect(req.request.params.get('seller_id')).toBe(sellerId);
      req.flush(mockResponse);
    });

    it('should filter by name', () => {
      const name = 'Plan AÑO NUEVO';
      const mockResponse: SalesPlanListResponse = {
        success: true,
        message: 'Planes de ventas obtenidos exitosamente',
        data: {
          items: [mockSalesPlan],
          pagination: {
            page: 1,
            per_page: 5,
            total: 1,
            total_pages: 1
          }
        }
      };

      service.getSalesPlans({ name }).subscribe(response => {
        expect(response.items.length).toBe(1);
      });

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && request.params.has('name')
      );
      expect(req.request.params.get('name')).toBe(name);
      req.flush(mockResponse);
    });

    it('should filter by client_id', () => {
      const clientId = '660e8400-e29b-41d4-a716-446655440001';
      const mockResponse: SalesPlanListResponse = {
        success: true,
        message: 'Planes de ventas obtenidos exitosamente',
        data: {
          items: [mockSalesPlan],
          pagination: {
            page: 1,
            per_page: 5,
            total: 1,
            total_pages: 1
          }
        }
      };

      service.getSalesPlans({ client_id: clientId }).subscribe(response => {
        expect(response.items[0].client_id).toBe(clientId);
      });

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && request.params.has('client_id')
      );
      expect(req.request.params.get('client_id')).toBe(clientId);
      req.flush(mockResponse);
    });

    it('should filter by date range', () => {
      const startDate = '2025-11-30T00:00:00.000Z';
      const endDate = '2026-03-02T00:00:00.000Z';
      const mockResponse: SalesPlanListResponse = {
        success: true,
        message: 'Planes de ventas obtenidos exitosamente',
        data: {
          items: [mockSalesPlan],
          pagination: {
            page: 1,
            per_page: 5,
            total: 1,
            total_pages: 1
          }
        }
      };

      service.getSalesPlans({ start_date: startDate, end_date: endDate }).subscribe(response => {
        expect(response.items.length).toBe(1);
      });

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && request.params.has('start_date') && request.params.has('end_date')
      );
      expect(req.request.params.get('start_date')).toBe(startDate);
      expect(req.request.params.get('end_date')).toBe(endDate);
      req.flush(mockResponse);
    });

    it('should omit empty or null parameters', () => {
      const mockResponse: SalesPlanListResponse = {
        success: true,
        message: 'Planes de ventas obtenidos exitosamente',
        data: {
          items: mockSalesPlansList,
          pagination: {
            page: 1,
            per_page: 5,
            total: 2,
            total_pages: 1
          }
        }
      };

      service.getSalesPlans({ name: '', client_id: undefined }).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.params.has('name')).toBeFalse();
      expect(req.request.params.has('client_id')).toBeFalse();
      req.flush(mockResponse);
    });

    it('should handle empty list', () => {
      const mockResponse: SalesPlanListResponse = {
        success: true,
        message: 'No se encontraron planes de ventas',
        data: {
          items: [],
          pagination: {
            page: 1,
            per_page: 5,
            total: 0,
            total_pages: 0
          }
        }
      };

      service.getSalesPlans().subscribe(response => {
        expect(response.items.length).toBe(0);
        expect(response.pagination.total).toBe(0);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(mockResponse);
    });

    it('should handle error response', (done) => {
      service.getSalesPlans().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getSalesPlanById', () => {
    it('should return a single sales plan by id', () => {
      const planId = 1;
      const mockResponse: SalesPlanDetailResponse = {
        success: true,
        message: 'Plan de ventas obtenido exitosamente',
        data: mockSalesPlan
      };

      service.getSalesPlanById(planId).subscribe(response => {
        expect(response).toEqual(mockSalesPlan);
        expect(response.id).toBe(planId);
        expect(response.name).toBe('Plan AÑO NUEVO 3085');
      });

      const req = httpMock.expectOne(`${apiUrl}/${planId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle not found error', (done) => {
      const planId = 999;

      service.getSalesPlanById(planId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${planId}`);
      req.flush({ message: 'Plan de ventas no encontrado' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle unauthorized error', (done) => {
      const planId = 1;

      service.getSalesPlanById(planId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${planId}`);
      req.flush({ message: 'No autorizado' }, { status: 403, statusText: 'Forbidden' });
    });
  });
});
