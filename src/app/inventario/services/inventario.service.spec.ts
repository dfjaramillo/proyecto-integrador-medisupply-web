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

      const req = httpMock.expectOne(`${environment.apiUrl}/inventory/products`);
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
        req.url === `${environment.apiUrl}/inventory/products` && 
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

      const req = httpMock.expectOne(`${environment.apiUrl}/inventory/products/1`);
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

      const req = httpMock.expectOne(`${environment.apiUrl}/inventory/products`);
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

      const req = httpMock.expectOne(`${environment.apiUrl}/inventory/products`);
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

      const req = httpMock.expectOne(`${environment.apiUrl}/inventory/products/1`);
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

      const req = httpMock.expectOne(`${environment.apiUrl}/inventory/products/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('filterProductos', () => {
    const mockFilterResponse: ApiListResponse = {
      success: true,
      message: 'Productos filtrados exitosamente',
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

    it('should filter products by SKU', () => {
      const filters = { sku: 'MED-0001' };

      service.filterProductos(filters).subscribe(response => {
        expect(response.products).toEqual([mockProducto]);
        expect(response.products.length).toBe(1);
        expect(response.products[0].sku).toBe('MED-0001');
      });

      const req = httpMock.expectOne(req => 
        req.url === `${environment.apiUrl}/inventory/products/filter` &&
        req.params.get('sku') === 'MED-0001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterResponse);
    });

    it('should filter products by name', () => {
      const filters = { name: 'Acetaminofén' };

      service.filterProductos(filters).subscribe(response => {
        expect(response.products).toEqual([mockProducto]);
        expect(response.products[0].name).toBe('Acetaminofén');
      });

      const req = httpMock.expectOne(req => 
        req.url === `${environment.apiUrl}/inventory/products/filter` &&
        req.params.get('name') === 'Acetaminofén'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterResponse);
    });

    it('should filter products by quantity', () => {
      const filters = { quantity: '100' };

      service.filterProductos(filters).subscribe(response => {
        expect(response.products).toEqual([mockProducto]);
        expect(response.products[0].quantity).toBe(100);
      });

      const req = httpMock.expectOne(req => 
        req.url === `${environment.apiUrl}/inventory/products/filter` &&
        req.params.get('quantity') === '100'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterResponse);
    });

    it('should filter products by price', () => {
      const filters = { price: '8500' };

      service.filterProductos(filters).subscribe(response => {
        expect(response.products).toEqual([mockProducto]);
        expect(response.products[0].price).toBe(8500);
      });

      const req = httpMock.expectOne(req => 
        req.url === `${environment.apiUrl}/inventory/products/filter` &&
        req.params.get('price') === '8500'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterResponse);
    });

    it('should filter products by location', () => {
      const filters = { location: 'A-03-01' };

      service.filterProductos(filters).subscribe(response => {
        expect(response.products).toEqual([mockProducto]);
        expect(response.products[0].location).toBe('A-03-01');
      });

      const req = httpMock.expectOne(req => 
        req.url === `${environment.apiUrl}/inventory/products/filter` &&
        req.params.get('location') === 'A-03-01'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterResponse);
    });

    it('should filter products by expiration_date', () => {
      const filters = { expiration_date: '2025-12-31' };

      service.filterProductos(filters).subscribe(response => {
        expect(response.products).toEqual([mockProducto]);
        expect(response.products[0].expiration_date).toBe('2025-12-31');
      });

      const req = httpMock.expectOne(req => 
        req.url === `${environment.apiUrl}/inventory/products/filter` &&
        req.params.get('expiration_date') === '2025-12-31'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterResponse);
    });

    it('should filter products by multiple criteria', () => {
      const filters = {
        sku: 'MED-0001',
        name: 'Acetaminofén',
        location: 'A-03-01'
      };

      service.filterProductos(filters).subscribe(response => {
        expect(response.products).toEqual([mockProducto]);
        expect(response.pagination).toBeDefined();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${environment.apiUrl}/inventory/products/filter` &&
        req.params.get('sku') === 'MED-0001' &&
        req.params.get('name') === 'Acetaminofén' &&
        req.params.get('location') === 'A-03-01'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterResponse);
    });

    it('should ignore empty filter values', () => {
      const filters = {
        sku: 'MED-0001',
        name: '',
        location: null as any,
        quantity: undefined as any
      };

      service.filterProductos(filters).subscribe();

      const req = httpMock.expectOne(req => {
        const hasSku = req.params.get('sku') === 'MED-0001';
        const hasNoName = !req.params.has('name');
        const hasNoLocation = !req.params.has('location');
        const hasNoQuantity = !req.params.has('quantity');
        return req.url === `${environment.apiUrl}/inventory/products/filter` &&
          hasSku && hasNoName && hasNoLocation && hasNoQuantity;
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterResponse);
    });

    it('should return empty results when no products match filters', () => {
      const emptyResponse: ApiListResponse = {
        success: true,
        message: 'No se encontraron productos',
        data: {
          products: [],
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

      const filters = { sku: 'NON-EXISTENT' };

      service.filterProductos(filters).subscribe(response => {
        expect(response.products).toEqual([]);
        expect(response.products.length).toBe(0);
        expect(response.pagination.total).toBe(0);
      });

      const req = httpMock.expectOne(req => 
        req.url === `${environment.apiUrl}/inventory/products/filter`
      );
      expect(req.request.method).toBe('GET');
      req.flush(emptyResponse);
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

      const req = httpMock.expectOne(`${environment.apiUrl}/providers`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('uploadProductsFile', () => {
    it('should upload a file successfully', () => {
      const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const userId = 'user-123';
      const mockResponse = {
        success: true,
        message: 'Archivo cargado exitosamente',
        data: { history_id: 'history-456' }
      };

      service.uploadProductsFile(userId, mockFile).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Archivo cargado exitosamente');
        expect(response.data.history_id).toBe('history-456');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/inventory/products/import`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should handle upload error', () => {
      const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const userId = 'user-123';
      const mockError = {
        error: {
          success: false,
          message: 'Error al procesar archivo'
        }
      };

      service.uploadProductsFile(userId, mockFile).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/inventory/products/import`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });
});
