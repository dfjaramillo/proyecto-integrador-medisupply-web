import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InventarioService } from './inventario.service';
import { 
  ProductoResponse, 
  ProductoCreateRequest, 
  Provider,
  ProvidersResponse,
  ApiResponse,
  ApiListResponse 
} from '../models/producto.model';
import { environment } from '../../../environments/environment';

describe('InventarioService', () => {
  let service: InventarioService;
  let httpMock: HttpTestingController;

  const mockProducto: ProductoResponse = {
    id: 1,
    sku: 'MED-0001',
    name: 'Acetaminofén',
    expiration_date: '2025-12-31',
    quantity: 100,
    price: 8500,
    location: 'A-03-01',
    description: 'Analgésico y antipirético',
    product_type: 'Alto valor',
    provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b',
    photo_filename: 'test.jpg',
    photo_url: 'http://example.com/test.jpg',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockProviders: Provider[] = [
    {
      id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b',
      name: 'Farmacia Oeste',
      email: 'contacto@farmacia.com',
      phone: '3202679361',
      logo_filename: '',
      logo_url: ''
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InventarioService]
    });
    service = TestBed.inject(InventarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProductos', () => {
    it('should retrieve list of products', () => {
      const mockResponse: ApiListResponse = {
        success: true,
        message: 'Success',
        data: {
          products: [mockProducto],
          pagination: {
            page: 1,
            per_page: 10,
            total: 1,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      };

      service.getProductos().subscribe(response => {
        expect(response.products).toEqual([mockProducto]);
        expect(response.products.length).toBe(1);
        expect(response.products[0].sku).toBe('MED-0001');
      });

      const req = httpMock.expectOne(`${environment.inventoryApiUrl}/inventory/products`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle query params', () => {
      const mockResponse: ApiListResponse = {
        success: true,
        message: 'Success',
        data: {
          products: [mockProducto],
          pagination: {
            page: 1,
            per_page: 10,
            total: 1,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      };

      service.getProductos({ sku: 'MED-0001' }).subscribe();

      const req = httpMock.expectOne(req => 
        req.url === `${environment.inventoryApiUrl}/inventory/products` && 
        req.params.get('sku') === 'MED-0001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getProductoById', () => {
    it('should retrieve a product by id', () => {
      const mockResponse: ApiResponse<ProductoResponse> = {
        success: true,
        message: 'Success',
        data: mockProducto
      };

      service.getProductoById('1').subscribe(producto => {
        expect(producto).toEqual(mockProducto);
        expect(producto.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.inventoryApiUrl}/inventory/products/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createProducto', () => {
    it('should create a product without photo', () => {
      const createRequest: ProductoCreateRequest = {
        sku: 'MED-0001',
        name: 'Acetaminofén',
        expiration_date: '2025-12-31',
        quantity: 100,
        price: 8500,
        location: 'A-03-01',
        description: 'Analgésico y antipirético',
        product_type: 'Alto valor',
        provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b'
      };

      const mockResponse: ApiResponse<ProductoResponse> = {
        success: true,
        message: 'Producto creado',
        data: mockProducto
      };

      service.createProducto(createRequest).subscribe(producto => {
        expect(producto).toEqual(mockProducto);
        expect(producto.sku).toBe('MED-0001');
      });

      const req = httpMock.expectOne(`${environment.inventoryApiUrl}/inventory/products`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockResponse);
    });

    it('should create a product with photo using FormData', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const createRequest: ProductoCreateRequest = {
        sku: 'MED-0001',
        name: 'Acetaminofén',
        expiration_date: '2025-12-31',
        quantity: 100,
        price: 8500,
        location: 'A-03-01',
        description: 'Analgésico y antipirético',
        product_type: 'Alto valor',
        provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b',
        photo: file
      };

      const mockResponse: ApiResponse<ProductoResponse> = {
        success: true,
        message: 'Producto creado',
        data: mockProducto
      };

      service.createProducto(createRequest).subscribe(producto => {
        expect(producto).toEqual(mockProducto);
      });

      const req = httpMock.expectOne(`${environment.inventoryApiUrl}/inventory/products`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });
  });

  describe('updateProducto', () => {
    it('should update a product', () => {
      const updateData: Partial<ProductoCreateRequest> = {
        quantity: 150,
        price: 9000
      };

      const mockResponse: ApiResponse<ProductoResponse> = {
        success: true,
        message: 'Producto actualizado',
        data: { ...mockProducto, quantity: 150, price: 9000 }
      };

      service.updateProducto('1', updateData).subscribe(producto => {
        expect(producto.quantity).toBe(150);
        expect(producto.price).toBe(9000);
      });

      const req = httpMock.expectOne(`${environment.inventoryApiUrl}/inventory/products/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });
  });

  describe('deleteProducto', () => {
    it('should delete a product', () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Producto eliminado',
        data: undefined as any
      };

      service.deleteProducto('1').subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.inventoryApiUrl}/inventory/products/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('getProviders', () => {
    it('should retrieve list of providers', () => {
      const mockResponse = {
        message: 'Lista de proveedores obtenida exitosamente',
        data: {
          providers: mockProviders,
          pagination: {
            page: 1,
            per_page: 10,
            total: 1,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      };

      service.getProviders().subscribe(providers => {
        expect(providers).toEqual(mockProviders);
        expect(providers.length).toBe(1);
        expect(providers[0].name).toBe('Farmacia Oeste');
      });

      const req = httpMock.expectOne(`${environment.providersApiUrl}/providers`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
