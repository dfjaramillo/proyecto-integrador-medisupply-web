import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoutesService } from './routes.service';
import { environment } from '../../../environments/environment';
import { Route, CreateRouteRequest, RouteDetail } from '../models/route.model';

describe('RoutesService', () => {
  let service: RoutesService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/logistics/routes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoutesService]
    });
    service = TestBed.inject(RoutesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRoutes', () => {
    it('should fetch routes list', (done) => {
      const mockResponse = {
        success: true,
        message: 'Rutas obtenidas exitosamente',
        data: {
          routes: [
            {
              id: 1,
              route_code: 'ROU-0001',
              assigned_truck: 'CAM-001',
              delivery_date: '2025-11-10',
              orders_count: 3,
              created_at: '2025-11-08T10:00:00',
              updated_at: '2025-11-08T10:00:00'
            }
          ],
          pagination: {
            page: 1,
            per_page: 10,
            total: 1,
            total_pages: 1
          }
        }
      };

      service.getRoutes().subscribe(data => {
        expect(data.routes).toBeTruthy();
        expect(data.routes.length).toBe(1);
        expect(data.routes[0].route_code).toBe('ROU-0001');
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should apply filters to request', (done) => {
      const filters = {
        route_code: 'ROU-0001',
        assigned_truck: 'TRK-001',
        delivery_date: '2025-11-10'
      };

      service.getRoutes(filters).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && 
        request.params.get('route_code') === 'ROU-0001'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { routes: [], pagination: {} } });
    });
  });

  describe('createRoute', () => {
    it('should create a new route', (done) => {
      const newRoute: CreateRouteRequest = {
        assigned_truck: 'TRK-001',
        delivery_date: '2025-11-10'
      };

      const mockResponse = {
        success: true,
        message: 'Ruta creada exitosamente',
        data: {
          id: 1,
          route_code: 'ROU-0001',
          assigned_truck: 'TRK-001',
          delivery_date: '2025-11-10',
          orders_count: 0,
          created_at: '2025-11-08T10:00:00',
          updated_at: '2025-11-08T10:00:00'
        }
      };

      service.createRoute(newRoute).subscribe(route => {
        expect(route).toBeTruthy();
        expect(route.route_code).toBe('ROU-0001');
        expect(route.assigned_truck).toBe('TRK-001');
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newRoute);
      req.flush(mockResponse);
    });
  });

  describe('getRouteById', () => {
    it('should fetch route detail with clients', (done) => {
      const routeId = 1;
      const mockResponse = {
        success: true,
        message: 'Ruta obtenida exitosamente',
        data: {
          route: {
            id: 1,
            route_code: 'ROU-0001',
            assigned_truck: 'TRK-001',
            delivery_date: '2025-11-10',
            orders_count: 2,
            created_at: '2025-11-08T10:00:00',
            updated_at: '2025-11-08T10:00:00'
          },
          clients: [
            {
              id: 'client-1',
              name: 'Cliente 1',
              email: 'cliente1@test.com',
              address: 'Calle 123',
              phone: '1234567890',
              latitude: 4.6097,
              longitude: -74.0817
            }
          ]
        }
      };

      service.getRouteById(routeId).subscribe(data => {
        expect(data.route).toBeTruthy();
        expect(data.clients).toBeTruthy();
        expect(data.clients.length).toBe(1);
        expect(data.route.route_code).toBe('ROU-0001');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/${routeId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAvailableTrucks', () => {
    it('should return list of available trucks', (done) => {
      service.getAvailableTrucks().subscribe(trucks => {
        expect(trucks).toBeTruthy();
        expect(trucks.length).toBe(5);
        expect(trucks[0].plate).toBe('CAM-001');
        expect(trucks[4].plate).toBe('CAM-005');
        done();
      });
    });
  });

  describe('getProductTypes', () => {
    it('should return list of product types', () => {
      const types = service.getProductTypes();
      expect(types).toBeTruthy();
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('validateTruckAvailability', () => {
    it('should return true when truck is available', (done) => {
      const mockResponse = {
        success: true,
        data: {
          routes: [],
          pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 }
        }
      };

      service.validateTruckAvailability('CAM-001', '2025-11-10').subscribe(isAvailable => {
        expect(isAvailable).toBe(true);
        done();
      });

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && 
        request.params.get('assigned_truck') === 'CAM-001'
      );
      req.flush(mockResponse);
    });

    it('should return false when truck has conflict', (done) => {
      const mockResponse = {
        success: true,
        data: {
          routes: [{
            id: 1,
            route_code: 'ROU-0001',
            assigned_truck: 'CAM-001',
            delivery_date: '2025-11-10',
            orders_count: 1,
            created_at: '2025-11-08T10:00:00',
            updated_at: '2025-11-08T10:00:00'
          }],
          pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 }
        }
      };

      service.validateTruckAvailability('CAM-001', '2025-11-10').subscribe(isAvailable => {
        expect(isAvailable).toBe(false);
        done();
      });

      const req = httpMock.expectOne(request => request.url === apiUrl);
      req.flush(mockResponse);
    });
  });
});
