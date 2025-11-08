import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RoutesListComponent } from './routes-list';
import { RoutesService } from '../services/routes.service';
import { AuthService } from '../../auth/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('RoutesListComponent', () => {
  let component: RoutesListComponent;
  let fixture: ComponentFixture<RoutesListComponent>;
  let mockRoutesService: jasmine.SpyObj<RoutesService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockRoutes = [
    {
      id: 1,
      route_code: 'ROU-0001',
      assigned_truck: 'CAM-001',
      delivery_date: '2025-11-10',
      orders_count: 3,
      created_at: '2025-11-08T10:00:00',
      updated_at: '2025-11-08T10:00:00'
    },
    {
      id: 2,
      route_code: 'ROU-0002',
      assigned_truck: 'CAM-002',
      delivery_date: '2025-11-11',
      orders_count: 2,
      created_at: '2025-11-08T10:00:00',
      updated_at: '2025-11-08T10:00:00'
    }
  ];

  const mockPagination = {
    page: 1,
    per_page: 10,
    total: 20,
    total_pages: 2,
    has_next: true,
    has_prev: false,
    next_page: 2,
    prev_page: null
  };

  beforeEach(async () => {
    mockRoutesService = jasmine.createSpyObj('RoutesService', ['getRoutes']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole', 'getUserRoles']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    const mockDialogRef = {
      afterClosed: () => of(null)
    };
    mockDialog.open.and.returnValue(mockDialogRef as any);

    mockRoutesService.getRoutes.and.returnValue(of({
      routes: mockRoutes,
      pagination: mockPagination
    }));
    mockAuthService.getUserRoles.and.returnValue(['Logistica']);

    await TestBed.configureTestingModule({
      imports: [RoutesListComponent, BrowserAnimationsModule],
      providers: [
        { provide: RoutesService, useValue: mockRoutesService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RoutesListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load routes on init', () => {
    fixture.detectChanges();
    expect(mockRoutesService.getRoutes).toHaveBeenCalled();
    expect(component.routes().length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('should set pagination data', () => {
    fixture.detectChanges();
    const pagination = component.pagination();
    expect(pagination).toBeTruthy();
    // Expect the same total as provided by the mock pagination data
    expect(pagination?.total).toBe(20);
    expect(pagination?.page).toBe(1);
  });

  it('should format date correctly', () => {
    const date = '2025-11-10';
    const formattedDate = component.formatDate(date);
    
    // Format should match the locale date string
    const expectedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
    
    expect(formattedDate).toBe(expectedDate);
  });

  it('should set selected route id when opening detail', () => {
    const route = mockRoutes[0];
    component.openDetail(route);
    expect(component.selectedRouteId()).toBe(1);
  });

  it('should clear selected route id when closing map', () => {
    component.selectedRouteId.set(1);
    component.closeMap();
    expect(component.selectedRouteId()).toBeNull();
  });

  it('should open create dialog', () => {
    // Ensure dialog.open can be called without relying on real MatDialog internals
    const stubDialogRef = { afterClosed: () => of(null) } as any;
    const openSpy = jasmine.createSpy('open').and.returnValue(stubDialogRef);
    (component as any).dialog = { open: openSpy } as any;

    component.openCreate();
    expect(openSpy).toHaveBeenCalled();
  });

  it('should apply filters with debounce', fakeAsync(() => {
    component.routeCodeFilter = 'ROU-0001';
    component.onFilterChange();
    tick(600);
    expect(mockRoutesService.getRoutes).toHaveBeenCalledWith(
      jasmine.objectContaining({ route_code: 'ROU-0001' })
    );
  }));

  it('should handle pagination navigation', () => {
    fixture.detectChanges();
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
    expect(mockRoutesService.getRoutes).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 2 })
    );
  });

  it('should calculate pages correctly', () => {
    component.pagination.set({
      page: 5,
      per_page: 10,
      total: 100,
      total_pages: 10,
      has_next: true,
      has_prev: true,
      next_page: 6,
      prev_page: 4
    });
    component.currentPage = 5;
    
    const pages = component.getPages();
    expect(pages).toContain(5); // Current page should be included
  });

  it('should handle date filter change and trigger load after debounce', fakeAsync(() => {
    const date = new Date('2025-11-10');
    mockRoutesService.getRoutes.calls.reset();
    component.onDateChange(date);
    expect(component.dateFilter).toEqual(date);
    tick(600); // flush debounce
    expect(mockRoutesService.getRoutes).toHaveBeenCalled();
  }));

  it('should pass all filters (truck, product, date) to service', fakeAsync(() => {
    mockRoutesService.getRoutes.calls.reset();
    component.truckFilter = 'TRK-001';
    component.productTypeFilter = 'Medicamentos';
    // Use year, monthIndex, day to avoid timezone shifting
    const date = new Date(2025, 10, 10); // Nov 10, 2025
    component.routeCodeFilter = 'ROU-0002';
    component.onDateChange(date); // triggers debounce internally
    tick(600);
    expect(mockRoutesService.getRoutes).toHaveBeenCalledWith(
      jasmine.objectContaining({
        route_code: 'ROU-0002',
        assigned_truck: 'TRK-001',
        product_type: 'Medicamentos',
        delivery_date: '2025-11-10'
      })
    );
  }));

  it('should not navigate to invalid or same page', () => {
    fixture.detectChanges();
    mockRoutesService.getRoutes.calls.reset();
    component.pagination.set({
      page: 1,
      per_page: 10,
      total: 10,
      total_pages: 2,
      has_next: true,
      has_prev: false,
      next_page: 2,
      prev_page: null
    });
    component.currentPage = 1;
    component.goToPage(1); // same page
    component.goToPage(0); // invalid low
    component.goToPage(3); // beyond total_pages
    expect(mockRoutesService.getRoutes).not.toHaveBeenCalled();
  });

  it('should paginate to a valid page and call service', () => {
    fixture.detectChanges();
    mockRoutesService.getRoutes.calls.reset();
    component.pagination.set({
      page: 1,
      per_page: 5,
      total: 12,
      total_pages: 3,
      has_next: true,
      has_prev: false,
      next_page: 2,
      prev_page: null
    });
    component.currentPage = 1;
    component.goToPage(2);
    expect(component.currentPage).toBe(2);
    expect(mockRoutesService.getRoutes).toHaveBeenCalledWith(jasmine.objectContaining({ page: 2 }));
  });

  it('should compute pages at boundaries (start and end)', () => {
    // Start boundary
    component.pagination.set({
      page: 1,
      per_page: 10,
      total: 30,
      total_pages: 3,
      has_next: true,
      has_prev: false,
      next_page: 2,
      prev_page: null
    });
    component.currentPage = 1;
    const startPages = component.getPages();
    expect(startPages[0]).toBe(1);

    // End boundary
    component.pagination.set({
      page: 10,
      per_page: 10,
      total: 100,
      total_pages: 10,
      has_next: false,
      has_prev: true,
      next_page: null,
      prev_page: 9
    });
    component.currentPage = 10;
    const endPages = component.getPages();
    expect(endPages[endPages.length - 1]).toBe(10);
  });

  it('should return early and show access warning when user lacks roles', () => {
    mockAuthService.getUserRoles.and.returnValue([]);
    mockRoutesService.getRoutes.calls.reset();
    fixture = TestBed.createComponent(RoutesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // loadRoutes is not called due to access control
    expect(mockRoutesService.getRoutes).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('should handle 403 error on loadRoutes', fakeAsync(() => {
    mockRoutesService.getRoutes.and.returnValue(of({ routes: [], pagination: mockPagination }));
    fixture.detectChanges();
    mockRoutesService.getRoutes.calls.reset();
    // Force an error on next call
    mockRoutesService.getRoutes.and.returnValue(throwError(() => ({ status: 403 })));
    component.onFilterChange();
    tick(600); // flush debounce
    expect(mockRoutesService.getRoutes).toHaveBeenCalled();
    expect(component.loading()).toBeFalse();
  }));

  it('should handle generic error on loadRoutes', fakeAsync(() => {
    mockRoutesService.getRoutes.and.returnValue(of({ routes: [], pagination: mockPagination }));
    fixture.detectChanges();
    mockRoutesService.getRoutes.calls.reset();
    mockRoutesService.getRoutes.and.returnValue(throwError(() => ({ status: 500 })));
    component.onFilterChange();
    tick(600); // flush debounce
    expect(mockRoutesService.getRoutes).toHaveBeenCalled();
    expect(component.loading()).toBeFalse();
  }));

  it('should reload after creating a route from dialog', () => {
    const afterClosed$ = of('created');
    const dialogRef = { afterClosed: () => afterClosed$ } as any;
    mockDialog.open.and.returnValue(dialogRef);
    // Ensure the component uses the mocked dialog instead of real MatDialog
    (component as any).dialog = mockDialog as any;
    mockRoutesService.getRoutes.calls.reset();
    component.currentPage = 2;
    component.openCreate();
    expect(component.currentPage).toBe(1);
    expect(mockRoutesService.getRoutes).toHaveBeenCalled();
  });
});
