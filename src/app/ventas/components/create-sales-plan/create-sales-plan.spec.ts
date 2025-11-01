import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { CreateSalesPlanComponent } from './create-sales-plan';
import { SalesPlanService } from '../../services/sales-plan.service';
import { AuthService } from '../../../auth/services/auth.service';

describe('CreateSalesPlanComponent', () => {
  let component: CreateSalesPlanComponent;
  let fixture: ComponentFixture<CreateSalesPlanComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CreateSalesPlanComponent>>;
  let mockSalesPlanService: jasmine.SpyObj<SalesPlanService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockClients = [
    { id: 'client-1', name: 'Cliente A' },
    { id: 'client-2', name: 'Cliente B' },
  ];

  const mockSalesPlan = {
    id: 1,
    name: 'Plan Test',
    client_id: 'client-1',
    client_name: 'Cliente A',
    seller_id: 'seller-1',
    seller_name: 'Vendedor A',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    target_revenue: 50000000,
    objectives: 'Test objectives',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSalesPlanService = jasmine.createSpyObj('SalesPlanService', [
      'getClients',
      'createSalesPlan',
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockSalesPlanService.getClients.and.returnValue(of(mockClients));
    mockAuthService.getUserId.and.returnValue('seller-1');

    await TestBed.configureTestingModule({
      imports: [
        CreateSalesPlanComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: SalesPlanService, useValue: mockSalesPlanService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSalesPlanComponent);
    component = fixture.componentInstance;
    
    // Mock console.error to prevent test output pollution
    spyOn(console, 'error').and.callFake(() => {});
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    fixture.detectChanges();
    expect(component.salesPlanForm).toBeDefined();
    expect(component.salesPlanForm.get('name')?.value).toBe('');
    expect(component.salesPlanForm.get('client_id')?.value).toBe('');
    expect(component.salesPlanForm.get('start_date')?.value).toBe('');
    expect(component.salesPlanForm.get('end_date')?.value).toBe('');
    expect(component.salesPlanForm.get('target_revenue')?.value).toBe('');
    expect(component.salesPlanForm.get('objectives')?.value).toBe('');
  });

  it('should load clients on init', () => {
    fixture.detectChanges();
    expect(mockSalesPlanService.getClients).toHaveBeenCalled();
    expect(component.clients()).toEqual(mockClients);
    expect(component.loadingClients()).toBe(false);
  });

  it('should handle error when loading clients fails', fakeAsync(() => {
    mockSalesPlanService.getClients.and.returnValue(
      throwError(() => new Error('Network error'))
    );
    component.ngOnInit();
    tick();
    expect(component.loadingClients()).toBe(false);
    expect(component.clients()).toEqual([]);
  }));

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark form as invalid when empty', () => {
      expect(component.salesPlanForm.invalid).toBe(true);
    });

    it('should validate required fields', () => {
      const form = component.salesPlanForm;
      expect(form.get('name')?.hasError('required')).toBe(true);
      expect(form.get('client_id')?.hasError('required')).toBe(true);
      expect(form.get('start_date')?.hasError('required')).toBe(true);
      expect(form.get('end_date')?.hasError('required')).toBe(true);
      expect(form.get('target_revenue')?.hasError('required')).toBe(true);
    });

    it('should validate name minlength', () => {
      component.salesPlanForm.get('name')?.setValue('ab');
      expect(component.salesPlanForm.get('name')?.hasError('minlength')).toBe(
        true
      );
    });

    it('should validate name maxlength', () => {
      const longName = 'a'.repeat(101);
      component.salesPlanForm.get('name')?.setValue(longName);
      expect(component.salesPlanForm.get('name')?.hasError('maxlength')).toBe(
        true
      );
    });

    it('should validate alphabetic characters only in name', () => {
      component.salesPlanForm.get('name')?.setValue('Plan 123 - 2026');
      expect(component.salesPlanForm.get('name')?.hasError('alphabetic')).toBe(
        true
      );
    });

    it('should accept valid alphabetic name with spaces', () => {
      component.salesPlanForm.get('name')?.setValue('Plan de Ventas Anual');
      expect(component.salesPlanForm.get('name')?.hasError('alphabetic')).toBe(
        false
      );
    });

    it('should validate target_revenue minimum value', () => {
      component.salesPlanForm.get('target_revenue')?.setValue(-100);
      expect(component.salesPlanForm.get('target_revenue')?.hasError('min')).toBe(
        true
      );
    });

    it('should validate decimal places (max 2)', () => {
      component.salesPlanForm.get('target_revenue')?.setValue(1000.123);
      expect(
        component.salesPlanForm.get('target_revenue')?.hasError('decimal')
      ).toBe(true);
    });

    it('should accept valid decimal with 2 places', () => {
      component.salesPlanForm.get('target_revenue')?.setValue(1000.12);
      expect(
        component.salesPlanForm.get('target_revenue')?.hasError('decimal')
      ).toBe(false);
    });

    it('should validate objectives maxlength', () => {
      const longText = 'a'.repeat(501);
      component.salesPlanForm.get('objectives')?.setValue(longText);
      expect(
        component.salesPlanForm.get('objectives')?.hasError('maxlength')
      ).toBe(true);
    });

    it('should validate date range (start_date <= end_date)', () => {
      component.salesPlanForm.get('start_date')?.setValue(new Date('2025-12-31'));
      component.salesPlanForm.get('end_date')?.setValue(new Date('2025-01-01'));
      expect(component.salesPlanForm.hasError('dateRange')).toBe(true);
    });

    it('should accept valid date range', () => {
      component.salesPlanForm.get('start_date')?.setValue(new Date('2025-01-01'));
      component.salesPlanForm.get('end_date')?.setValue(new Date('2025-12-31'));
      expect(component.salesPlanForm.hasError('dateRange')).toBe(false);
    });
  });

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return required error message', () => {
      const control = component.salesPlanForm.get('name');
      control?.markAsTouched();
      expect(component.getErrorMessage('name')).toBe(
        'Este campo es obligatorio'
      );
    });

    it('should return minlength error message', () => {
      const control = component.salesPlanForm.get('name');
      control?.setValue('ab');
      control?.markAsTouched();
      expect(component.getErrorMessage('name')).toBe('Mínimo 3 caracteres');
    });

    it('should return maxlength error message', () => {
      const control = component.salesPlanForm.get('objectives');
      control?.setValue('a'.repeat(501));
      control?.markAsTouched();
      expect(component.getErrorMessage('objectives')).toBe(
        'Máximo 500 caracteres'
      );
    });

    it('should return min value error message', () => {
      const control = component.salesPlanForm.get('target_revenue');
      control?.setValue(-100);
      control?.markAsTouched();
      expect(component.getErrorMessage('target_revenue')).toBe(
        'El valor debe ser mayor o igual a 0'
      );
    });

    it('should return alphabetic error message', () => {
      const control = component.salesPlanForm.get('name');
      control?.setValue('Plan 123 - 2026');
      control?.markAsTouched();
      expect(component.getErrorMessage('name')).toBe(
        'Solo se permiten letras, números y espacios'
      );
    });

    it('should return decimal error message', () => {
      const control = component.salesPlanForm.get('target_revenue');
      control?.setValue(1000.123);
      control?.markAsTouched();
      expect(component.getErrorMessage('target_revenue')).toBe(
        'Máximo 2 decimales permitidos'
      );
    });

    it('should return date range error message', () => {
      component.salesPlanForm.get('start_date')?.setValue(new Date('2025-12-31'));
      component.salesPlanForm.get('start_date')?.markAsTouched();
      component.salesPlanForm.get('end_date')?.setValue(new Date('2025-01-01'));
      component.salesPlanForm.get('end_date')?.markAsTouched();
      expect(component.getDateRangeError()).toBe(
        'La fecha de inicio debe ser menor o igual a la fecha de fin'
      );
    });
  });

  describe('hasError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when field has error and is touched', () => {
      const control = component.salesPlanForm.get('name');
      control?.markAsTouched();
      expect(component.hasError('name', 'required')).toBe(true);
    });

    it('should return false when field is not touched', () => {
      expect(component.hasError('name', 'required')).toBe(false);
    });

    it('should return false when field is dirty but valid', () => {
      const control = component.salesPlanForm.get('name');
      control?.setValue('Valid Name');
      control?.markAsDirty();
      expect(component.hasError('name', 'required')).toBe(false);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(mockSalesPlanService.createSalesPlan).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when submitting invalid form', () => {
      component.onSubmit();
      expect(component.salesPlanForm.get('name')?.touched).toBe(true);
      expect(component.salesPlanForm.get('client_id')?.touched).toBe(true);
      expect(component.salesPlanForm.get('start_date')?.touched).toBe(true);
      expect(component.salesPlanForm.get('end_date')?.touched).toBe(true);
      expect(component.salesPlanForm.get('target_revenue')?.touched).toBe(true);
    });

    it('should submit when form is valid', () => {
      component.ngOnInit();
      mockSalesPlanService.createSalesPlan.and.returnValue(of(mockSalesPlan));

      // Fill form with valid data
      component.salesPlanForm.patchValue({
        name: 'Plan de Ventas Anual',
        client_id: 'client-1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        target_revenue: 50000000.50,
        objectives: 'Test objectives',
      });

      // Ensure form is valid
      expect(component.salesPlanForm.valid).toBe(true);

      component.onSubmit();

      expect(mockSalesPlanService.createSalesPlan).toHaveBeenCalled();
    });
  
    it('should handle 400 error with duplicate name', () => {
      const error = {
        status: 400,
        error: { error: 'Ya existe un plan de ventas con el nombre' },
      };
      mockSalesPlanService.createSalesPlan.and.returnValue(
        throwError(() => error)
      );

      component.salesPlanForm.patchValue({
        name: 'Plan Existente',
        client_id: 'client-1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        target_revenue: 50000000,
      });

      component.onSubmit();

      expect(component.salesPlanForm.get('name')?.hasError('duplicate')).toBe(
        true
      );
    });

    it('should handle 400 error with field validation errors', () => {
      fixture.detectChanges(); // Initialize the component and form
      
      const error = {
        status: 400,
        error: { details: { name: 'Nombre inválido', client_id: 'Cliente requerido' } },
      };
      mockSalesPlanService.createSalesPlan.and.returnValue(
        throwError(() => error)
      );

      component.salesPlanForm.patchValue({
        name: 'Plan123',
        client_id: 'client-1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        target_revenue: 50000000,
      });

      component.onSubmit();

      expect(
        component.salesPlanForm.get('name')?.hasError('serverError')
      ).toBe(true);
    });

    it('should convert form data correctly before submission', () => {
      component.ngOnInit();
      mockSalesPlanService.createSalesPlan.and.returnValue(of(mockSalesPlan));

      component.salesPlanForm.patchValue({
        name: '  Plan de Ventas Anual  ',
        client_id: 'client-1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        target_revenue: '50000000.50',
        objectives: '  Test objectives  ',
      });

      component.onSubmit();

      expect(mockSalesPlanService.createSalesPlan).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'Plan de Ventas Anual',
          client_id: 'client-1',
          seller_id: 'seller-1',
          target_revenue: 50000000.50,
          objectives: 'Test objectives',
        })
      );
    });

    it('should omit objectives if empty', () => {
      component.ngOnInit();
      mockSalesPlanService.createSalesPlan.and.returnValue(of(mockSalesPlan));

      component.salesPlanForm.patchValue({
        name: 'Plan de Ventas Anual',
        client_id: 'client-1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        target_revenue: 50000000,
        objectives: '',
      });

      component.onSubmit();

      const callArgs = mockSalesPlanService.createSalesPlan.calls.mostRecent().args[0];
      expect(callArgs.objectives).toBeUndefined();
    });
  });

  describe('Cancel', () => {
    it('should handle cancel action', () => {
      component.onCancel();
      // Test that the method can be called without errors
      expect(component.onCancel).toBeDefined();
    });
  });
});
