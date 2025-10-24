import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProveedoresService } from './proveedores.service';
import { environment } from '../../../environments/environment';
import {
  ProveedorCreateRequest,
  ProveedorResponse,
  ApiResponse,
  ApiListResponse,
  ProveedoresListResponse
} from '../models/proveedor.model';

describe('ProveedoresService', () => {
  let service: ProveedoresService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/providers`;

  const mockProveedorResponse: ProveedorResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Farmacia Central',
    email: 'contacto@farmaciacentral.com',
    phone: '3001234567',
    logo_filename: '',
    logo_url: '',
    created_at: '2025-01-15T10:30:00.000Z',
    updated_at: '2025-01-15T10:30:00.000Z'
  };

  const mockProveedoresList: ProveedorResponse[] = [
    mockProveedorResponse,
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Droguería Norte',
      email: 'ventas@droguerianorte.com',
      phone: '3109876543',
      logo_filename: '',
      logo_url: '',
      created_at: '2025-01-16T11:00:00.000Z',
      updated_at: '2025-01-16T11:00:00.000Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProveedoresService]
    });

    service = TestBed.inject(ProveedoresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProveedores', () => {
    it('should return proveedores list with pagination', () => {
      const mockResponse: ApiListResponse = {
        message: 'Proveedores obtenidos exitosamente',
        data: {
          providers: mockProveedoresList,
          pagination: {
            page: 1,
            per_page: 10,
            total: 2,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      };

      const expectedResult: ProveedoresListResponse = {
        providers: mockProveedoresList,
        pagination: {
          page: 1,
          per_page: 10,
          total: 2,
          total_pages: 1,
          has_next: false,
          has_prev: false,
          next_page: null,
          prev_page: null
        }
      };

      service.getProveedores({ page: 1, per_page: 10 }).subscribe(response => {
        expect(response).toEqual(expectedResult);
        expect(response.providers.length).toBe(2);
        expect(response.pagination.total).toBe(2);
      });

      const req = httpMock.expectOne(request => 
        request.url === apiUrl && 
        request.params.get('page') === '1' &&
        request.params.get('per_page') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call API without params', () => {
      const mockResponse: ApiListResponse = {
        message: 'Proveedores obtenidos exitosamente',
        data: {
          providers: [],
          pagination: {
            page: 1,
            per_page: 10,
            total: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      };

      service.getProveedores().subscribe(response => {
        expect(response.providers).toEqual([]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should filter out null and empty params', () => {
      const params = {
        page: 1,
        per_page: 10,
        filter: null,
        search: '',
        name: undefined
      };

      const mockResponse: ApiListResponse = {
        message: 'Proveedores obtenidos exitosamente',
        data: {
          providers: [],
          pagination: {
            page: 1,
            per_page: 10,
            total: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      };

      const expectedResult: ProveedoresListResponse = {
        providers: [],
        pagination: {
          page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
          next_page: null,
          prev_page: null
        }
      };

      service.getProveedores(params).subscribe(response => {
        expect(response).toEqual(expectedResult);
        expect(response.providers.length).toBe(0);
      });

      const req = httpMock.expectOne(request => {
        const hasPageParam = request.params.has('page');
        const hasPerPageParam = request.params.has('per_page');
        const hasNoFilterParam = !request.params.has('filter');
        const hasNoSearchParam = !request.params.has('search');
        const hasNoNameParam = !request.params.has('name');
        
        return hasPageParam && hasPerPageParam && hasNoFilterParam && hasNoSearchParam && hasNoNameParam;
      });
      
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getProveedorById', () => {
    it('should return a single proveedor', () => {
      const proveedorId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResponse: ApiResponse<ProveedorResponse> = {
        message: 'Proveedor obtenido exitosamente',
        data: mockProveedorResponse
      };

      service.getProveedorById(proveedorId).subscribe(response => {
        expect(response).toEqual(mockProveedorResponse);
        expect(response.id).toBe(proveedorId);
        expect(response.name).toBe('Farmacia Central');
      });

      const req = httpMock.expectOne(`${apiUrl}/${proveedorId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when proveedor not found', () => {
      const proveedorId = 'non-existent-id';

      service.getProveedorById(proveedorId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${proveedorId}`);
      req.flush({ message: 'Proveedor no encontrado' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createProveedor', () => {
    it('should create proveedor with JSON when no logo', () => {
      const newProveedor: ProveedorCreateRequest = {
        name: 'Nueva Farmacia',
        email: 'nueva@farmacia.com',
        phone: '3201234567'
      };

      const mockResponse: ApiResponse<ProveedorResponse> = {
        message: 'Proveedor registrado exitosamente',
        data: {
          ...mockProveedorResponse,
          name: newProveedor.name,
          email: newProveedor.email,
          phone: newProveedor.phone
        }
      };

      service.createProveedor(newProveedor).subscribe(response => {
        expect(response.name).toBe(newProveedor.name);
        expect(response.email).toBe(newProveedor.email);
        expect(response.phone).toBe(newProveedor.phone);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newProveedor);
      req.flush(mockResponse);
    });

    it('should create proveedor with FormData when logo is provided', () => {
      const file = new File(['logo content'], 'logo.png', { type: 'image/png' });
      const newProveedor: ProveedorCreateRequest = {
        name: 'Farmacia con Logo',
        email: 'logo@farmacia.com',
        phone: '3301234567',
        logo: file
      };

      const mockResponse: ApiResponse<ProveedorResponse> = {
        message: 'Proveedor registrado exitosamente',
        data: {
          ...mockProveedorResponse,
          name: newProveedor.name,
          email: newProveedor.email,
          phone: newProveedor.phone,
          logo_filename: 'logo.png',
          logo_url: 'http://example.com/logo.png'
        }
      };

      service.createProveedor(newProveedor).subscribe(response => {
        expect(response.name).toBe(newProveedor.name);
        expect(response.logo_filename).toBe('logo.png');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      
      const formData = req.request.body as FormData;
      expect(formData.get('name')).toBe(newProveedor.name);
      expect(formData.get('email')).toBe(newProveedor.email);
      expect(formData.get('phone')).toBe(newProveedor.phone);
      expect(formData.get('logo')).toBe(file);
      
      req.flush(mockResponse);
    });

    it('should handle validation errors', () => {
      const newProveedor: ProveedorCreateRequest = {
        name: 'AB', // Too short
        email: 'invalid-email',
        phone: '123'
      };

      service.createProveedor(newProveedor).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { message: 'Datos inválidos' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('updateProveedor', () => {
    it('should update proveedor', () => {
      const proveedorId = '123e4567-e89b-12d3-a456-426614174000';
      const updates: Partial<ProveedorCreateRequest> = {
        name: 'Farmacia Central Actualizada',
        phone: '3009999999'
      };

      const mockResponse: ApiResponse<ProveedorResponse> = {
        message: 'Proveedor actualizado exitosamente',
        data: {
          ...mockProveedorResponse,
          name: updates.name!,
          phone: updates.phone!,
          updated_at: '2025-01-20T15:00:00.000Z'
        }
      };

      service.updateProveedor(proveedorId, updates).subscribe(response => {
        expect(response.name).toBe(updates.name!);
        expect(response.phone).toBe(updates.phone!);
      });

      const req = httpMock.expectOne(`${apiUrl}/${proveedorId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(mockResponse);
    });

    it('should handle update with empty object', () => {
      const proveedorId = '123e4567-e89b-12d3-a456-426614174000';
      const updates: Partial<ProveedorCreateRequest> = {};

      const mockResponse: ApiResponse<ProveedorResponse> = {
        message: 'Proveedor actualizado exitosamente',
        data: mockProveedorResponse
      };

      service.updateProveedor(proveedorId, updates).subscribe(response => {
        expect(response).toEqual(mockProveedorResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${proveedorId}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('deleteProveedor', () => {
    it('should delete proveedor', () => {
      const proveedorId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResponse: ApiResponse<void> = {
        message: 'Proveedor eliminado exitosamente',
        data: undefined as any
      };

      service.deleteProveedor(proveedorId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/${proveedorId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle delete error', () => {
      const proveedorId = '123e4567-e89b-12d3-a456-426614174000';

      service.deleteProveedor(proveedorId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${proveedorId}`);
      req.flush(
        { message: 'Proveedor no encontrado' },
        { status: 404, statusText: 'Not Found' }
      );
    });
  });
});
