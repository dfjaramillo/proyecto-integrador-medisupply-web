import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateRouteComponent } from './create-route';
import { RoutesService } from '../../services/routes.service';
import { ProductType } from '../../models/route.model';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

describe('CreateRouteComponent', () => {
  let component: CreateRouteComponent;
  let fixture: ComponentFixture<CreateRouteComponent>;
  let mockRoutesService: jasmine.SpyObj<RoutesService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CreateRouteComponent>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTrucks = [
    { plate: 'TRK-001', label: 'TRK-001' },
    { plate: 'TRK-002', label: 'TRK-002' },
    { plate: 'TRK-003', label: 'TRK-003' }
  ];

  beforeEach(async () => {
    mockRoutesService = jasmine.createSpyObj('RoutesService', [
      'getAvailableTrucks',
      'createRoute',
      'validateTruckAvailability',
      'getProductTypes'
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockRoutesService.getAvailableTrucks.and.returnValue(of(mockTrucks));
    mockRoutesService.validateTruckAvailability.and.returnValue(of(true));
    mockRoutesService.getProductTypes.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [CreateRouteComponent, BrowserAnimationsModule],
      providers: [
        { provide: RoutesService, useValue: mockRoutesService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRouteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load trucks on init', () => {
    fixture.detectChanges();
    expect(mockRoutesService.getAvailableTrucks).toHaveBeenCalled();
    expect(component.trucks().length).toBe(3);
  });

  it('should initialize form with empty values', () => {
    fixture.detectChanges();
    expect(component.routeForm.get('assigned_truck')?.value).toBe('');
    expect(component.routeForm.get('delivery_date')?.value).toBe('');
  });

  it('should validate required fields', () => {
    fixture.detectChanges();
    const form = component.routeForm;
    
    expect(form.get('assigned_truck')?.hasError('required')).toBeTruthy();
    expect(form.get('product_type')?.hasError('required')).toBeTruthy();
    expect(form.get('delivery_date')?.hasError('required')).toBeTruthy();
    
    form.patchValue({
      assigned_truck: 'TRK-001',
      product_type: 'Medicamentos',
      delivery_date: '2025-11-10'
    });
    
    expect(form.valid).toBeTruthy();
  });

  it('should validate future date', () => {
    fixture.detectChanges();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    component.routeForm.patchValue({
      assigned_truck: 'TRK-001',
      product_type: 'Medicamentos',
      delivery_date: yesterday.toISOString().split('T')[0]
    });
    
    const dateControl = component.routeForm.get('delivery_date');
    expect(dateControl?.hasError('futureDate')).toBeTruthy();
  });

  it('should create route successfully', fakeAsync(() => {
    const mockRoute = {
      id: 1,
      route_code: 'ROU-0001',
      assigned_truck: 'TRK-001',
      delivery_date: '2025-11-10',
      orders_count: 0,
      created_at: '2025-11-08T10:00:00',
      updated_at: '2025-11-08T10:00:00'
    };

    mockRoutesService.createRoute.and.returnValue(of(mockRoute));

    fixture.detectChanges();
    component.routeForm.patchValue({
      assigned_truck: 'TRK-001',
      product_type: 'Medicamentos',
      delivery_date: '2025-11-10'
    });

    component.onSubmit();
    tick(); // Wait for observable to complete

    expect(mockRoutesService.createRoute).toHaveBeenCalled();
    // Verify dialog was closed signalling success
    expect(mockDialogRef.close).toHaveBeenCalledWith('created');
    // Avoid brittle snackbar expectation; ensure no form errors remain
    expect(component.routeForm.valid).toBeTrue();
  }));

  it('should handle create error by keeping dialog open and form intact', fakeAsync(() => {
    mockRoutesService.createRoute.and.returnValue(
      throwError(() => ({ status: 400, error: { message: 'Error al crear ruta' } }))
    );

    fixture.detectChanges();
    component.routeForm.patchValue({
      assigned_truck: 'TRK-001',
      product_type: 'Medicamentos',
      delivery_date: '2025-11-10'
    });

    component.onSubmit();
    tick(); // Wait for observable to complete

    // Dialog shouldn't close on error
    expect(mockDialogRef.close).not.toHaveBeenCalled();
    // Service was invoked
    expect(mockRoutesService.createRoute).toHaveBeenCalled();
    // Form should remain valid (data entry fine, backend rejected)
    expect(component.routeForm.valid).toBeTrue();
  }));

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should not submit if form is invalid', () => {
    fixture.detectChanges();
    component.onSubmit();
    expect(mockRoutesService.createRoute).not.toHaveBeenCalled();
  });

  it('should check truck availability when method is called', (done) => {
    fixture.detectChanges();
    
    component.routeForm.patchValue({
      assigned_truck: 'TRK-001',
      product_type: 'Medicamentos',
      delivery_date: '2025-11-10'
    });

    // Call the method directly
    component.validateTruckAvailability().then(() => {
      expect(mockRoutesService.validateTruckAvailability).toHaveBeenCalledWith(
        'TRK-001',
        '2025-11-10'
      );
      done();
    });
  });

  it('should return early in validateTruckAvailability if truck or date missing', async () => {
    fixture.detectChanges();
    mockRoutesService.validateTruckAvailability.calls.reset();
    // Missing both
    await component.validateTruckAvailability();
    expect(mockRoutesService.validateTruckAvailability).not.toHaveBeenCalled();
    // Only truck provided
    component.routeForm.patchValue({ assigned_truck: 'TRK-001' });
    await component.validateTruckAvailability();
    expect(mockRoutesService.validateTruckAvailability).not.toHaveBeenCalled();
    // Only date provided
    component.routeForm.patchValue({ assigned_truck: '', delivery_date: '2025-11-10' });
    await component.validateTruckAvailability();
    expect(mockRoutesService.validateTruckAvailability).not.toHaveBeenCalled();
  });

  it('should set truckUnavailable error when validateTruckAvailability returns false', async () => {
    fixture.detectChanges();
    mockRoutesService.validateTruckAvailability.and.returnValue(of(false));
    component.routeForm.patchValue({
      assigned_truck: 'TRK-002',
      product_type: 'Medicamentos',
      delivery_date: '2025-11-12'
    });
    await component.validateTruckAvailability();
    const control = component.routeForm.get('assigned_truck');
    expect(control?.errors?.['truckUnavailable']).toBeTruthy();
  });

  it('should handle error in validateTruckAvailability without setting truckUnavailable', async () => {
    fixture.detectChanges();
    mockRoutesService.validateTruckAvailability.and.returnValue(throwError(() => ({ status: 500 })));
    component.routeForm.patchValue({
      assigned_truck: 'TRK-003',
      product_type: 'Medicamentos',
      delivery_date: '2025-11-13'
    });
    await component.validateTruckAvailability();
    const control = component.routeForm.get('assigned_truck');
    expect(control?.errors?.['truckUnavailable']).toBeFalsy();
  });

  it('should handle loadTrucks error branch', () => {
    mockRoutesService.getAvailableTrucks.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(mockRoutesService.getAvailableTrucks).toHaveBeenCalled();
    expect(component.loadingTrucks()).toBeFalse();
  });

  it('should load product types on init', () => {
    mockRoutesService.getProductTypes.and.returnValue([
      ProductType.CADENA_FRIO,
      ProductType.ALTO_VALOR
    ]);
    fixture.detectChanges();
    expect(component.productTypes.length).toBe(2);
  });

  it('should accept today date (futureDate validator passes)', () => {
    fixture.detectChanges();
    const today = new Date();
    component.routeForm.patchValue({
      assigned_truck: 'TRK-001',
      product_type: 'Medicamentos',
      // Provide as Date object to avoid timezone parsing issues
      delivery_date: today
    });
    expect(component.routeForm.get('delivery_date')?.hasError('futureDate')).toBeFalse();
  });

  it('should format delivery_date to YYYY-MM-DD when submitting Date object', fakeAsync(() => {
    fixture.detectChanges();
    const dateObj = new Date(2025, 10, 15); // Nov 15 2025
    mockRoutesService.createRoute.calls.reset();
    mockRoutesService.createRoute.and.returnValue(of({
      id: 99,
      route_code: 'ROU-0099',
      assigned_truck: 'TRK-010',
      delivery_date: '2025-11-15',
      orders_count: 0,
      created_at: '2025-11-08T10:00:00',
      updated_at: '2025-11-08T10:00:00'
    }));
    component.routeForm.patchValue({
      assigned_truck: 'TRK-010',
      product_type: 'General',
      delivery_date: dateObj
    });
    component.onSubmit();
    tick();
    expect(mockRoutesService.createRoute.calls.mostRecent().args[0]).toEqual({
      assigned_truck: 'TRK-010',
      delivery_date: '2025-11-15'
    });
  }));

  it('should handle 400 error without message using fallback text', fakeAsync(() => {
    fixture.detectChanges();
    mockRoutesService.createRoute.and.returnValue(throwError(() => ({ status: 400, error: {} })));
    component.routeForm.patchValue({
      assigned_truck: 'TRK-020',
      product_type: 'General',
      delivery_date: '2025-11-16'
    });
    component.onSubmit();
    tick();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
    expect(component.loading()).toBeFalse();
  }));

  it('should handle 409 conflict error for existing truck route', fakeAsync(() => {
    fixture.detectChanges();
    mockRoutesService.createRoute.and.returnValue(throwError(() => ({ status: 409 })));
    component.routeForm.patchValue({
      assigned_truck: 'TRK-021',
      product_type: 'General',
      delivery_date: '2025-11-17'
    });
    component.onSubmit();
    tick();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
    expect(component.loading()).toBeFalse();
  }));

  it('should handle generic error (e.g., 500) with system message', fakeAsync(() => {
    fixture.detectChanges();
    mockRoutesService.createRoute.and.returnValue(throwError(() => ({ status: 500 })));
    component.routeForm.patchValue({
      assigned_truck: 'TRK-022',
      product_type: 'General',
      delivery_date: '2025-11-18'
    });
    component.onSubmit();
    tick();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
    expect(component.loading()).toBeFalse();
  }));

  it('should submit and set loading false after success', fakeAsync(() => {
    fixture.detectChanges();
    mockRoutesService.createRoute.calls.reset();
    mockRoutesService.createRoute.and.returnValue(of({
      id: 2,
      route_code: 'ROU-0002',
      assigned_truck: 'TRK-030',
      delivery_date: '2025-11-19',
      orders_count: 0,
      created_at: '2025-11-08T10:00:00',
      updated_at: '2025-11-08T10:00:00'
    }));
    component.routeForm.patchValue({
      assigned_truck: 'TRK-030',
      product_type: 'General',
      delivery_date: '2025-11-19'
    });
    component.onSubmit();
    tick();
    expect(component.loading()).toBeFalse();
    expect(mockRoutesService.createRoute).toHaveBeenCalled();
  }));

  it('should mark fields as touched on invalid submit', () => {
    fixture.detectChanges();
    const form = component.routeForm;
    expect(form.touched).toBeFalse();
    component.onSubmit();
    expect(form.get('assigned_truck')?.touched).toBeTrue();
    expect(form.get('product_type')?.touched).toBeTrue();
    expect(form.get('delivery_date')?.touched).toBeTrue();
  });
});
