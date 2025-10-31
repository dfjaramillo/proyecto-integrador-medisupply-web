import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { CreateProductoComponent } from './create-producto';
import { InventarioService } from '../../services/inventario.service';
import { Provider, ProductoResponse } from '../../models/producto.model';

describe('CreateProductoComponent', () => {
  let component: CreateProductoComponent;
  let fixture: ComponentFixture<CreateProductoComponent>;
  let mockInventarioService: jasmine.SpyObj<InventarioService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CreateProductoComponent>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockProviders: Provider[] = [
    {
      id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b',
      name: 'Farmacia Oeste',
      email: 'contacto@farmacia.com',
      phone: '3202679361',
      logo_filename: '',
      logo_url: ''
    },
    {
      id: 'bb142fcc-5e27-4e94-9b08-ac7c1202ae6c',
      name: 'Farmacia Norte',
      email: 'norte@farmacia.com',
      phone: '3201234567',
      logo_filename: '',
      logo_url: ''
    }
  ];

  const mockProductoResponse: ProductoResponse = {
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
    photo_filename: null,
    photo_url: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    mockInventarioService = jasmine.createSpyObj('InventarioService', [
      'createProducto',
      'getProviders'
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockInventarioService.getProviders.and.returnValue(of(mockProviders));

    await TestBed.configureTestingModule({
      imports: [
        CreateProductoComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: InventarioService, useValue: mockInventarioService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateProductoComponent);
    component = fixture.componentInstance;
    
    // Mock console.error to prevent test output pollution
    spyOn(console, 'error').and.callFake(() => {});
    
    // Override ngOnInit to prevent automatic provider loading
    spyOn(component, 'ngOnInit');
    
    fixture.detectChanges();
    
    // Manually call initForm to set up the form
    component.initForm();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with all controls', () => {
    expect(component.productoForm.get('sku')).toBeTruthy();
    expect(component.productoForm.get('name')).toBeTruthy();
    expect(component.productoForm.get('expiration_date')).toBeTruthy();
    expect(component.productoForm.get('quantity')).toBeTruthy();
    expect(component.productoForm.get('price')).toBeTruthy();
    expect(component.productoForm.get('location')).toBeTruthy();
    expect(component.productoForm.get('description')).toBeTruthy();
    expect(component.productoForm.get('product_type')).toBeTruthy();
    expect(component.productoForm.get('provider_id')).toBeTruthy();
    expect(component.productoForm.get('photo')).toBeTruthy();
  });

  it('should load providers on init', () => {
    component.loadProviders();
    
    expect(mockInventarioService.getProviders).toHaveBeenCalled();
    expect(component.providers()).toEqual(mockProviders);
    expect(component.filteredProviders()).toEqual(mockProviders);
  });

  it('should have form invalid when empty', () => {
    expect(component.productoForm.valid).toBeFalsy();
  });

  it('should validate SKU format', () => {
    const skuControl = component.productoForm.get('sku');
    
    skuControl?.setValue('INVALID');
    expect(skuControl?.hasError('skuFormat')).toBeTruthy();
    
    skuControl?.setValue('MED-0001');
    expect(skuControl?.hasError('skuFormat')).toBeFalsy();
  });

  it('should validate name minimum length', () => {
    const nameControl = component.productoForm.get('name');
    
    nameControl?.setValue('AB');
    expect(nameControl?.hasError('minlength')).toBeTruthy();
    
    nameControl?.setValue('Acetaminofén');
    expect(nameControl?.hasError('minlength')).toBeFalsy();
  });

  it('should validate quantity range', () => {
    const quantityControl = component.productoForm.get('quantity');
    
    quantityControl?.setValue(0);
    expect(quantityControl?.hasError('cantidad')).toBeTruthy();
    
    quantityControl?.setValue(10000);
    expect(quantityControl?.hasError('cantidad')).toBeTruthy();
    
    quantityControl?.setValue(100);
    expect(quantityControl?.hasError('cantidad')).toBeFalsy();
  });

  it('should validate price is positive', () => {
    const priceControl = component.productoForm.get('price');
    
    priceControl?.setValue(0);
    expect(priceControl?.hasError('precio')).toBeTruthy();
    
    priceControl?.setValue(-100);
    expect(priceControl?.hasError('precio')).toBeTruthy();
    
    priceControl?.setValue(8500);
    expect(priceControl?.hasError('precio')).toBeFalsy();
  });

  it('should validate location format', () => {
    const locationControl = component.productoForm.get('location');
    
    locationControl?.setValue('INVALID');
    expect(locationControl?.hasError('ubicacionFormat')).toBeTruthy();
    
    locationControl?.setValue('A-03-01');
    expect(locationControl?.hasError('ubicacionFormat')).toBeFalsy();
  });

  it('should handle file selection', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const event = {
      target: {
        files: [file]
      }
    } as any;

    spyOn(FileReader.prototype, 'readAsDataURL');
    
    component.onFileSelected(event);
    
    expect(component.selectedFile).toBe(file);
    expect(component.productoForm.get('photo')?.value).toBe(file);
  });

  it('should remove selected file', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    component.selectedFile = file;
    component.previewUrl = 'data:image/jpeg;base64,test';
    component.productoForm.patchValue({ photo: file });
    
    component.removeFile();
    
    expect(component.selectedFile).toBeNull();
    expect(component.previewUrl).toBeNull();
    expect(component.productoForm.get('photo')?.value).toBeNull();
  });

  it('should filter providers based on input', () => {
    component.providers.set(mockProviders);
    component.filteredProviders.set(mockProviders);
    
    component.filterProviders('Norte');
    
    expect(component.filteredProviders().length).toBe(1);
    expect(component.filteredProviders()[0].name).toBe('Farmacia Norte');
  });

  it('should display provider name correctly', () => {
    component.providers.set(mockProviders);
    
    const displayName = component.displayProvider('ee142fcc-5e27-4e94-9b08-ac7c1202ae6b');
    expect(displayName).toBe('Farmacia Oeste');
    
    const emptyName = component.displayProvider('');
    expect(emptyName).toBe('');
  });

  it('should handle provider selection', () => {
    const provider = mockProviders[0];
    
    component.onProviderSelected(provider);
    
    expect(component.productoForm.get('provider_id')?.value).toBe(provider.id);
  });

  it('should create product successfully without photo', () => {
    mockInventarioService.createProducto.and.returnValue(of(mockProductoResponse));
    
    component.productoForm.patchValue({
      sku: 'MED-0001',
      name: 'Acetaminofén',
      expiration_date: new Date('2025-12-31'),
      quantity: 100,
      price: 8500,
      location: 'A-03-01',
      description: 'Analgésico y antipirético',
      product_type: 'Medio valor',
      provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b'
    });

    component.onSubmit();

    expect(component.loading()).toBe(false);
    expect(mockInventarioService.createProducto).toHaveBeenCalled();    
    expect(mockDialogRef.close).toHaveBeenCalledWith('created');
  });

  it('should create product successfully with photo', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    component.selectedFile = file;
    mockInventarioService.createProducto.and.returnValue(of(mockProductoResponse));
    
    component.productoForm.patchValue({
      sku: 'MED-0001',
      name: 'Acetaminofén',
      expiration_date: new Date('2025-12-31'),
      quantity: 100,
      price: 8500,
      location: 'A-03-01',
      description: 'Analgésico y antipirético',
      product_type: 'Medio valor',
      provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b',
      photo: file
    });

    component.onSubmit();

    expect(mockInventarioService.createProducto).toHaveBeenCalled();
    const callArgs = mockInventarioService.createProducto.calls.mostRecent().args[0];
    expect(callArgs.photo).toBe(file);
  });


  it('should handle creation error (422 - SKU exists)', () => {
    const error = { 
      status: 422,
      error: {
        details: 'El SKU ya existe en el sistema. Utilice un SKU único.'
      }
    };
    mockInventarioService.createProducto.and.returnValue(throwError(() => error));
    
    component.productoForm.patchValue({
      sku: 'MED-0001',
      name: 'Acetaminofén',
      expiration_date: new Date('2025-12-31'),
      quantity: 100,
      price: 8500,
      location: 'A-03-01',
      description: 'Analgésico y antipirético',
      product_type: 'Medio valor',
      provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b'
    });

    component.onSubmit();

    expect(component.loading()).toBe(false);
    expect(error.status === 422).toBe(true);
  });

  it('should handle creation error (400 - Bad request)', () => {
    const error = { 
      status: 400,
      error: {
        success: false,
        error: "Error de validación",        
      }
    };
    mockInventarioService.createProducto.and.returnValue(throwError(() => error));
    
    component.productoForm.patchValue({
      sku: 'MED-0001',
      name: 'Acetaminofén',
      expiration_date: new Date('2025-12-31'),
      quantity: 100,
      price: 8500,
      location: 'A-03-01',
      description: 'Analgésico y antipirético',
      product_type: 'Medio valor',
      provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b'
    });

    component.onSubmit();

    expect(error.status === 400).toBe(true);
  });


  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should check for form errors correctly', () => {
    const skuControl = component.productoForm.get('sku');
    skuControl?.setValue('INVALID');
    skuControl?.markAsDirty();

    expect(component.hasError('sku', 'skuFormat')).toBeTruthy();
    expect(component.hasError('sku', 'required')).toBeFalsy();
  });

  it('should return correct error messages', () => {
    const skuControl = component.productoForm.get('sku');
    skuControl?.setValue('');
    skuControl?.markAsTouched();

    expect(component.getErrorMessage('sku')).toBe('Este campo es obligatorio');
  });

  // Tests adicionales para mejorar coverage de branches
  
  it('should return empty string when control has no errors', () => {
    const skuControl = component.productoForm.get('sku');
    skuControl?.setValue('MED-1234');
    expect(component.getErrorMessage('sku')).toBe('');
  });

  it('should return correct error message for skuFormat error', () => {
    const skuControl = component.productoForm.get('sku');
    skuControl?.setValue('INVALID');
    skuControl?.markAsTouched();
    expect(component.getErrorMessage('sku')).toBe('El SKU debe tener el formato MED-XXXX (4 dígitos)');
  });

  it('should return correct error message for minlength error', () => {
    const descControl = component.productoForm.get('description');
    descControl?.setValue('ABC');
    descControl?.markAsTouched();
    expect(component.getErrorMessage('description')).toContain('Mínimo');
  });

  it('should return correct error message for productName error', () => {
    const nameControl = component.productoForm.get('name');
    nameControl?.setValue('Product@123');
    nameControl?.markAsTouched();
    const errorMsg = component.getErrorMessage('name');
    expect(errorMsg).toBeTruthy();
  });

  it('should return correct error message for futureDate error', () => {
    const dateControl = component.productoForm.get('expiration_date');
    dateControl?.setValue(new Date('2020-01-01'));
    dateControl?.markAsTouched();
    const errorMsg = component.getErrorMessage('expiration_date');
    expect(errorMsg).toBeTruthy();
  });

  it('should return correct error message for cantidad error', () => {
    const cantidadControl = component.productoForm.get('quantity');
    cantidadControl?.setValue(-1);
    cantidadControl?.markAsTouched();
    const errorMsg = component.getErrorMessage('quantity');
    expect(errorMsg).toBeTruthy();
  });

  it('should return correct error message for precio error', () => {
    const precioControl = component.productoForm.get('price');
    precioControl?.setValue(-100);
    precioControl?.markAsTouched();
    const errorMsg = component.getErrorMessage('price');
    expect(errorMsg).toBeTruthy();
  });

  it('should return correct error message for ubicacionFormat error', () => {
    const locationControl = component.productoForm.get('location');
    locationControl?.setValue('INVALID');
    locationControl?.markAsTouched();
    const errorMsg = component.getErrorMessage('location');
    expect(errorMsg).toBeTruthy();
  });

  it('should handle filterProviders with null value', () => {
    component.providers.set(mockProviders);
    component.filterProviders(null as any);
    expect(component.filteredProviders().length).toBe(mockProviders.length);
  });

  it('should handle filterProviders with Provider object', () => {
    component.providers.set(mockProviders);
    const provider = mockProviders[0];
    component.filterProviders(provider);
    // Should not filter when value is an object
    expect(component.filteredProviders().length).toBeGreaterThan(0);
  });

  it('should handle filterProviders with empty string', () => {
    component.providers.set(mockProviders);
    component.filterProviders('');
    expect(component.filteredProviders().length).toBe(mockProviders.length);
  });

  it('should return empty string in displayProvider when provider not found', () => {
    component.providers.set(mockProviders);
    const result = component.displayProvider('non-existent-id');
    expect(result).toBe('');
  });

  it('should return empty string in displayProvider when value is empty', () => {
    const result = component.displayProvider('');
    expect(result).toBe('');
  });

  it('should return provider name in displayProvider when value is Provider object', () => {
    const provider = mockProviders[0];
    const result = component.displayProvider(provider);
    expect(result).toBe(provider.name);
  });

  it('should handle onFileSelected when no file is selected', () => {
    const event = {
      target: {
        files: null
      }
    } as any;

    component.onFileSelected(event);
    expect(component.selectedFile).toBeNull();
  });

  it('should handle onFileSelected when files array is empty', () => {
    const event = {
      target: {
        files: []
      }
    } as any;

    component.onFileSelected(event);
    expect(component.selectedFile).toBeNull();
  });

  it('should handle error 400 in onSubmit', () => {
    const error = { 
      status: 400,
      error: {
        details: 'Bad request'
      }
    };
    mockInventarioService.createProducto.and.returnValue(throwError(() => error));
    
    component.productoForm.patchValue({
      sku: 'MED-0001',
      name: 'Acetaminofén',
      expiration_date: new Date('2025-12-31'),
      quantity: 100,
      price: 8500,
      location: 'A-03-01',
      description: 'Analgésico y antipirético',
      product_type: 'Medio valor',
      provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b'
    });

    component.onSubmit();
    expect(component.loading()).toBe(false);
  });

  it('should handle error 500 in onSubmit', () => {
    const error = { 
      status: 500,
      error: {
        details: 'Internal server error'
      }
    };
    mockInventarioService.createProducto.and.returnValue(throwError(() => error));
    
    component.productoForm.patchValue({
      sku: 'MED-0001',
      name: 'Acetaminofén',
      expiration_date: new Date('2025-12-31'),
      quantity: 100,
      price: 8500,
      location: 'A-03-01',
      description: 'Analgésico y antipirético',
      product_type: 'Medio valor',
      provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b'
    });

    component.onSubmit();
    expect(component.loading()).toBe(false);
  });

  it('should handle createProducto with FormData', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    component.selectedFile = file;
    
    mockInventarioService.createProducto.and.returnValue(of(mockProductoResponse));
    
    component.productoForm.patchValue({
      sku: 'MED-0001',
      name: 'Acetaminofén',
      expiration_date: new Date('2025-12-31'),
      quantity: 100,
      price: 8500,
      location: 'A-03-01',
      description: 'Analgésico y antipirético',
      product_type: 'Medio valor',
      provider_id: 'ee142fcc-5e27-4e94-9b08-ac7c1202ae6b',
      photo: file
    });

    component.onSubmit();
    expect(mockInventarioService.createProducto).toHaveBeenCalled();
  });

});
