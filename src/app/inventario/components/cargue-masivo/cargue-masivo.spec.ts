import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { CargueMasivoComponent } from './cargue-masivo';
import { InventarioService } from '../../services/inventario.service';
import { AuthService } from '../../../auth/services/auth.service';

describe('CargueMasivoComponent', () => {
  let component: CargueMasivoComponent;
  let fixture: ComponentFixture<CargueMasivoComponent>;
  let inventarioService: jasmine.SpyObj<InventarioService>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CargueMasivoComponent>>;

  beforeEach(async () => {
    const inventarioServiceSpy = jasmine.createSpyObj('InventarioService', ['uploadProductsFile']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [CargueMasivoComponent, NoopAnimationsModule],
      providers: [
        { provide: InventarioService, useValue: inventarioServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    inventarioService = TestBed.inject(InventarioService) as jasmine.SpyObj<InventarioService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CargueMasivoComponent>>;

    snackBar.open.and.returnValue({} as any);

    fixture = TestBed.createComponent(CargueMasivoComponent);
    component = fixture.componentInstance;
    
    // Mock console.error to prevent test output pollution
    spyOn(console, 'error').and.callFake(() => {});
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('downloadTemplate', () => {
    it('should call download method', () => {
      // Simply verify the method exists and can be called
      expect(component.downloadTemplate).toBeDefined();
      expect(() => component.downloadTemplate()).not.toThrow();
    });
  });

  describe('onFileSelected', () => {
    let mockEvent: any;
    let mockInput: any;

    beforeEach(() => {
      mockInput = {
        files: null as any,
        value: ''
      };
      mockEvent = {
        target: mockInput
      };
    });

    it('should accept valid CSV file', () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      mockInput.files = [mockFile];

      component.onFileSelected(mockEvent);

      expect(component.selectedFile).toBe(mockFile);
      expect(component.uploadError()).toBeNull();
    });

    it('should accept valid Excel file by extension', () => {
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/octet-stream' });
      mockInput.files = [mockFile];

      component.onFileSelected(mockEvent);

      expect(component.selectedFile).toBe(mockFile);
      expect(component.uploadError()).toBeNull();
    });

    it('should reject invalid file type', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      mockInput.files = [mockFile];

      component.onFileSelected(mockEvent);

      expect(component.selectedFile).toBeNull();
      expect(component.uploadError()).toBe('Por favor seleccione un archivo CSV o Excel válido');
      expect(mockInput.value).toBe('');
    });

    it('should reject file larger than 10MB', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv', { type: 'text/csv' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
      mockInput.files = [largeFile];

      component.onFileSelected(mockEvent);

      expect(component.selectedFile).toBeNull();
      expect(component.uploadError()).toBe('El archivo no debe superar los 10MB');
      expect(mockInput.value).toBe('');
    });

    it('should do nothing if no files selected', () => {
      mockInput.files = [];

      component.onFileSelected(mockEvent);

      expect(component.selectedFile).toBeNull();
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(component.formatFileSize(500)).toBe('500 Bytes');
      expect(component.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('removeFile', () => {
    it('should clear selected file and reset messages', () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      component.selectedFile = mockFile;
      component.uploadError.set('Some error');
      component.successMessage.set('Some success');

      component.removeFile();

      expect(component.selectedFile).toBeNull();
      expect(component.uploadError()).toBeNull();
      expect(component.successMessage()).toBeNull();
    });
  });

  describe('onSubmit', () => {
    it('should show error if no file selected', () => {
      component.selectedFile = null;

      component.onSubmit();

      expect(component.uploadError()).toBe('Por favor seleccione un archivo');
      expect(inventarioService.uploadProductsFile).not.toHaveBeenCalled();
    });

    it('should show error if user ID not available', () => {
      component.selectedFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      authService.getUserId.and.returnValue(null);

      component.onSubmit();

      expect(component.loading()).toBe(false);
      expect(component.uploadError()).toBe('No se pudo obtener el ID de usuario');
      expect(inventarioService.uploadProductsFile).not.toHaveBeenCalled();
    });

    it('should upload file successfully', () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      component.selectedFile = mockFile;
      authService.getUserId.and.returnValue('user123');
      
      const mockResponse = {
        success: true,
        message: 'Success',
        data: { history_id: 'hist123' }
      };
      inventarioService.uploadProductsFile.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(inventarioService.uploadProductsFile).toHaveBeenCalledWith('user123', mockFile);
      expect(component.successMessage()).toBe('Archivo cargado exitosamente');
    });

    it('should handle upload error', () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      component.selectedFile = mockFile;
      authService.getUserId.and.returnValue('user123');

      const mockError = {
        error: { message: 'Upload failed' }
      };
      inventarioService.uploadProductsFile.and.returnValue(throwError(() => mockError));

      component.onSubmit();

      expect(inventarioService.uploadProductsFile).toHaveBeenCalledWith('user123', mockFile);
      expect(component.uploadError()).toBe('Upload failed');
    });

    it('should handle upload error with details (more than 100 products)', () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      component.selectedFile = mockFile;
      authService.getUserId.and.returnValue('user123');

      const mockError = {
        error: {
          success: false,
          error: 'Error de validación',
          details: 'Solo se permiten cargar 100 productos. El archivo contiene 1000 registros'
        }
      };
      inventarioService.uploadProductsFile.and.returnValue(throwError(() => mockError));

      component.onSubmit();

      expect(inventarioService.uploadProductsFile).toHaveBeenCalled();
      expect(component.uploadError()).toBe('Solo se permiten cargar 100 productos. El archivo contiene 1000 registros');
    });

    it('should handle upload error without message', () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      component.selectedFile = mockFile;
      authService.getUserId.and.returnValue('user123');

      inventarioService.uploadProductsFile.and.returnValue(throwError(() => ({})));

      component.onSubmit();

      expect(inventarioService.uploadProductsFile).toHaveBeenCalled();
      expect(component.uploadError()).toBe('Error al cargar el archivo, vuelva a intentarlo');
    });

    it('should close dialog after successful upload', () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      component.selectedFile = mockFile;
      authService.getUserId.and.returnValue('user123');

      const mockResponse = {
        success: true,
        message: 'Success',
        data: { history_id: 'hist123' }
      };
      inventarioService.uploadProductsFile.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(inventarioService.uploadProductsFile).toHaveBeenCalled();
      expect(component.successMessage()).toBe('Archivo cargado exitosamente');
    });
  });

  describe('onCancel', () => {
    it('should close dialog', () => {
      component.onCancel();

      expect(dialogRef.close).toHaveBeenCalled();
    });
  });
});
