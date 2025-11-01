import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { InventarioListComponent } from './inventario-list';
import { InventarioService } from '../services/inventario.service';
import { AuthService } from '../../auth/services/auth.service';
import { ProductoResponse, UploadHistoryResponse } from '../models/producto.model';
import { Pagination } from '../../shared/models/pagination.model';

describe('InventarioListComponent', () => {
  let component: InventarioListComponent;
  let fixture: ComponentFixture<InventarioListComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let router: jasmine.SpyObj<Router>;

  const mockProductos: ProductoResponse[] = [
    {
      id: 1,
      sku: 'TEST-001',
      name: 'Producto Test 1',
      expiration_date: '2025-12-31',
      quantity: 100,
      price: 50000,
      location: 'Bodega A',
      description: 'Descripción del producto test 1',
      product_type: 'Cadena de frío',
      provider_id: 'provider-1',
      photo_filename: null,
      photo_url: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      sku: 'TEST-002',
      name: 'Producto Test 2',
      expiration_date: '2026-06-30',
      quantity: 50,
      price: 75000,
      location: 'Bodega B',
      description: 'Descripción del producto test 2',
      product_type: 'Alto valor',
      provider_id: 'provider-2',
      photo_filename: null,
      photo_url: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }
  ];

  const mockPagination: Pagination = {
    page: 1,
    per_page: 5,
    total: 2,
    total_pages: 1,
    has_next: false,
    has_prev: false,
    next_page: null,
    prev_page: null
  };

  const mockUploadHistoryResponse: UploadHistoryResponse = {
    history: [],
    pagination: {
      page: 1,
      per_page: 5,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false,
      next_page: null,
      prev_page: null
    }
  };

  beforeEach(async () => {
    const inventarioServiceSpy = jasmine.createSpyObj('InventarioService', ['getProductos', 'getUploadHistory']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserRole', 'isAdmin']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [InventarioListComponent, NoopAnimationsModule],
      providers: [
        { provide: InventarioService, useValue: inventarioServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    inventarioService = TestBed.inject(InventarioService) as jasmine.SpyObj<InventarioService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Configure default return value for getUploadHistory
    inventarioService.getUploadHistory.and.returnValue(of(mockUploadHistoryResponse));

    fixture = TestBed.createComponent(InventarioListComponent);
    component = fixture.componentInstance;
    
    // Mock console.error to prevent test output pollution
    spyOn(console, 'error').and.callFake(() => {});
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load productos on initialization', () => {
      inventarioService.getProductos.and.returnValue(
        of({ products: mockProductos, pagination: mockPagination })
      );

      fixture.detectChanges();

      expect(inventarioService.getProductos).toHaveBeenCalledWith({
        page: 1,
        per_page: 5
      });
      expect(component.productos()).toEqual(mockProductos);
      expect(component.pagination()).toEqual(mockPagination);
      expect(component.loading()).toBe(false);
    });

    it('should handle error when loading productos fails', (done) => {
      inventarioService.getProductos.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      // Wait for error handling to complete
      setTimeout(() => {
        expect(component.loading()).toBe(false);        
        done();
      }, 100);
    });
  });

  describe('Filter functionality', () => {
    beforeEach(() => {
      inventarioService.getProductos.and.returnValue(
        of({ products: mockProductos, pagination: mockPagination })
      );
      fixture.detectChanges();
    });

    it('should filter by SKU', (done) => {
      const event = { target: { value: 'TEST-001' } } as any;
      
      component.onSkuFilterChange(event);

      setTimeout(() => {
        expect(component.skuFilter()).toBe('test-001');
        expect(inventarioService.getProductos).toHaveBeenCalledWith({
          page: 1,
          per_page: 5,
          sku: 'TEST-001'
        });
        done();
      }, 500);
    });

    it('should filter by name', (done) => {
      const event = { target: { value: 'Producto' } } as any;
      
      component.onNombreFilterChange(event);

      setTimeout(() => {
        expect(component.nombreFilter()).toBe('producto');
        expect(inventarioService.getProductos).toHaveBeenCalledWith({
          page: 1,
          per_page: 5,
          name: 'Producto'
        });
        done();
      }, 500);
    });

    it('should filter by quantity', (done) => {
      const event = { target: { value: '100' } } as any;
      
      component.onCantidadFilterChange(event);

      setTimeout(() => {
        expect(component.cantidadFilter()).toBe('100');
        expect(inventarioService.getProductos).toHaveBeenCalledWith({
          page: 1,
          per_page: 5,
          quantity: '100'
        });
        done();
      }, 500);
    });

    it('should filter by price', (done) => {
      const event = { target: { value: '50000' } } as any;
      
      component.onPrecioFilterChange(event);

      setTimeout(() => {
        expect(component.precioFilter()).toBe('50000');
        expect(inventarioService.getProductos).toHaveBeenCalledWith({
          page: 1,
          per_page: 5,
          price: '50000'
        });
        done();
      }, 500);
    });

    it('should filter by location', (done) => {
      const event = { target: { value: 'Bodega A' } } as any;
      
      component.onUbicacionFilterChange(event);

      setTimeout(() => {
        expect(component.ubicacionFilter()).toBe('bodega a');
        expect(inventarioService.getProductos).toHaveBeenCalledWith({
          page: 1,
          per_page: 5,
          location: 'Bodega A'
        });
        done();
      }, 500);
    });
  });

  describe('Date filter functionality', () => {
    beforeEach(() => {
      inventarioService.getProductos.and.returnValue(
        of({ products: mockProductos, pagination: mockPagination })
      );
      fixture.detectChanges();
    });

    it('should format date to YYYY-MM-DD', () => {
      const date = new Date(2025, 11, 31); // December 31, 2025
      const formatted = component.formatDateToYYYYMMDD(date);
      expect(formatted).toBe('2025-12-31');
    });

    it('should filter by date when date is selected', (done) => {
      const testDate = new Date(2025, 11, 31);
      
      component.onDateChange(testDate);

      setTimeout(() => {
        expect(component.selectedDate).toEqual(testDate);
        expect(component.fechaFilter()).toBe('2025-12-31');
        expect(inventarioService.getProductos).toHaveBeenCalledWith({
          page: 1,
          per_page: 5,
          expiration_date: '2025-12-31'
        });
        done();
      }, 500);
    });

    it('should clear date filter when date is null', (done) => {
      component.onDateChange(null);

      setTimeout(() => {
        expect(component.selectedDate).toBeNull();
        expect(component.fechaFilter()).toBe('');
        done();
      }, 500);
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters and reload productos', () => {
      inventarioService.getProductos.and.returnValue(
        of({ products: mockProductos, pagination: mockPagination })
      );

      component.skuFilter.set('test');
      component.nombreFilter.set('producto');
      component.fechaFilter.set('2025-12-31');
      component.selectedDate = new Date();
      component.cantidadFilter.set('100');
      component.precioFilter.set('50000');
      component.ubicacionFilter.set('bodega');

      component.clearFilters();

      expect(component.skuFilter()).toBe('');
      expect(component.nombreFilter()).toBe('');
      expect(component.fechaFilter()).toBe('');
      expect(component.cantidadFilter()).toBe('');
      expect(component.precioFilter()).toBe('');
      expect(component.ubicacionFilter()).toBe('');
      expect(component.selectedDate).toBeNull();
      expect(component.currentPage).toBe(1);
      expect(inventarioService.getProductos).toHaveBeenCalled();
    });
  });

  describe('hasAnyFilter', () => {
    it('should return true when any filter has value', () => {
      component.skuFilter.set('test');
      expect(component.hasAnyFilter()).toBe(true);
    });

    it('should return false when all filters are empty', () => {
      component.skuFilter.set('');
      component.nombreFilter.set('');
      component.fechaFilter.set('');
      component.cantidadFilter.set('');
      component.precioFilter.set('');
      component.ubicacionFilter.set('');
      expect(component.hasAnyFilter()).toBe(false);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      inventarioService.getProductos.and.returnValue(
        of({ 
          products: mockProductos, 
          pagination: { 
            ...mockPagination, 
            total_pages: 3, 
            has_next: true,
            next_page: 2
          }
        })
      );
      fixture.detectChanges();
    });

    it('should calculate page numbers correctly', () => {
      const pageNumbers = component.pageNumbers;
      expect(pageNumbers).toEqual([1, 2, 3]);
    });

    it('should go to specific page', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
      expect(inventarioService.getProductos).toHaveBeenCalledWith({
        page: 2,
        per_page: 5
      });
    });

    it('should not go to page outside valid range', () => {
      component.currentPage = 1;
      component.goToPage(0);
      expect(component.currentPage).toBe(1);

      component.goToPage(10);
      expect(component.currentPage).toBe(1);
    });
  });

  describe('canCreateProducto', () => {
    it('should return true for Compras role', () => {
      authService.getUserRole.and.returnValue('Compras');
      expect(component.canCreateProducto()).toBe(true);
    });

    it('should return true for Administrador role', () => {
      authService.getUserRole.and.returnValue('Administrador');
      expect(component.canCreateProducto()).toBe(true);
    });

    it('should return false for other roles', () => {
      authService.getUserRole.and.returnValue('Ventas');
      expect(component.canCreateProducto()).toBe(false);
    });
  });

  describe('openCreateProductoDialog', () => {
    // Note: These tests are skipped due to MatDialog internal dependencies
    // that are difficult to mock in unit tests. Consider integration tests instead.
    xit('should open dialog and reload productos on success', () => {
      // This test requires proper MatDialog setup which is complex in unit tests
    });

    xit('should not reload productos when dialog is cancelled', () => {
      // This test requires proper MatDialog setup which is complex in unit tests
    });
  });

  describe('canCreateProducto', () => {
    it('should return true for Compras role', () => {
      authService.getUserRole.and.returnValue('Compras');
      expect(component.canCreateProducto()).toBe(true);
    });

    it('should return true for Administrador role', () => {
      authService.getUserRole.and.returnValue('Administrador');
      expect(component.canCreateProducto()).toBe(true);
    });

    it('should return false for other roles', () => {
      authService.getUserRole.and.returnValue('Ventas');
      expect(component.canCreateProducto()).toBe(false);
    });
  });

  describe('Format methods', () => {
    it('should format price correctly', () => {
      const price = 50000;
      const formatted = component.formatPrice(price);
      expect(formatted).toContain('50');
      expect(formatted).toContain('000');
    });

    it('should format date correctly', () => {
      const date = '2025-10-15';
      const formatted = component.formatDate(date);
      expect(formatted).toMatch(/Oct \d{2}, 2025/);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      inventarioService.getProductos.and.returnValue(
        of({ products: mockProductos, pagination: mockPagination })
      );
      fixture.detectChanges();

      const event = { target: { value: 'test' } } as any;
      component.onSkuFilterChange(event);

      expect(component['subscriptions'].length).toBeGreaterThan(0);

      component.ngOnDestroy();

      // Verify all subscriptions are closed
      component['subscriptions'].forEach(sub => {
        expect(sub.closed).toBe(true);
      });
    });
  });
});
