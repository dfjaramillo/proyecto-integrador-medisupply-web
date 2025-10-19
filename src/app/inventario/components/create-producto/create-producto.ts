import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { InventarioService } from '../../services/inventario.service';
import { TipoProducto, ProductoCreateRequest, Provider } from '../../models/producto.model';
import {
  skuFormatValidator,  
  productNameValidator,
  futureDateValidator,
  cantidadValidator,
  precioValidator,
  ubicacionFormatValidator,
  imagenValidator
} from '../../validators/producto.validators';

@Component({
  selector: 'app-create-producto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatAutocompleteModule
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }
  ],
  templateUrl: './create-producto.html',
  styleUrls: ['./create-producto.scss']
})
export class CreateProductoComponent implements OnInit {
  productoForm!: FormGroup;
  loading = signal(false);
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  tiposProducto: TipoProducto[] = ['Cadena fría', 'Seguridad', 'Alto valor'];

  providers = signal<Provider[]>([]);
  filteredProviders = signal<Provider[]>([]);

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private dialogRef: MatDialogRef<CreateProductoComponent>,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProviders();
  }

  initForm(): void {
    this.productoForm = this.fb.group({
      sku: [
        '',
        [Validators.required, skuFormatValidator()],        
      ],
      name: [
        '',
        [Validators.required, Validators.minLength(3), productNameValidator()]
      ],
      expiration_date: [
        '',
        [Validators.required, futureDateValidator()]
      ],
      quantity: [
        '',
        [Validators.required, cantidadValidator()]
      ],
      price: [
        '',
        [Validators.required, precioValidator()]
      ],
      location: [
        '',
        [Validators.required, ubicacionFormatValidator()]
      ],
      description: [
        '',
        [Validators.required, Validators.minLength(10)]
      ],
      product_type: [
        '',
        [Validators.required]
      ],
      provider_id: [
        '',
        [Validators.required]
      ],
      photo: [null, [imagenValidator()]]
    });

    // Filtrar proveedores basado en input
    this.productoForm.get('provider_id')?.valueChanges.subscribe(value => {
      this.filterProviders(value);
    });
  }

  loadProviders(): void {
    this.inventarioService.getProviders().subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.filteredProviders.set(providers);
      },
      error: (error) => {
        console.error('Error loading providers:', error);
        this.snackBar.open('Error al cargar proveedores', 'Cerrar', { duration: 4000 });
      }
    });
  }

  filterProviders(value: string | Provider): void {
    // Si el valor es un objeto Provider, no filtrar (usuario seleccionó una opción)
    if (typeof value === 'object' && value !== null) {
      return;
    }
    
    const filterValue = value?.toLowerCase() || '';
    this.filteredProviders.set(
      this.providers().filter(provider =>
        provider.name.toLowerCase().includes(filterValue)
      )
    );
  }

  displayProvider = (value: string | Provider): string => {
    if (!value) return '';
    
    // Si ya es un string (GUID), buscar el proveedor
    if (typeof value === 'string') {
      const provider = this.providers().find(p => p.id === value);
      return provider ? provider.name : '';
    }
    
    // Si es un objeto Provider, retornar su nombre
    return value.name;
  }

  onProviderSelected(provider: Provider): void {
    // Guardar solo el ID en el formulario
    this.productoForm.patchValue({ provider_id: provider.id }, { emitEvent: false });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      
      // Actualizar el control del formulario
      this.productoForm.patchValue({ photo: file });
      this.productoForm.get('photo')?.updateValueAndValidity();

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.productoForm.patchValue({ photo: null });
    this.productoForm.get('photo')?.updateValueAndValidity();
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.productoForm.get(controlName);
    return !!(control?.hasError(errorName) && (control?.dirty || control?.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.productoForm.get(controlName);
    
    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }

    if (control.hasError('skuFormat')) {
      return 'El SKU debe tener el formato MED-XXXX (4 dígitos)';
    }

    if (control.hasError('skuExists')) {
      return 'El SKU ya existe en el sistema. Utilice un SKU único.';
    }

    if (control.hasError('productName')) {
      return control.errors['productName'].message;
    }

    if (control.hasError('futureDate')) {
      return control.errors['futureDate'].message;
    }

    if (control.hasError('cantidad')) {
      return control.errors['cantidad'].message;
    }

    if (control.hasError('precio')) {
      return control.errors['precio'].message;
    }

    if (control.hasError('ubicacionFormat')) {
      return control.errors['ubicacionFormat'].message;
    }

    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (control.hasError('imagenTipo')) {
      return control.errors['imagenTipo'].message;
    }

    if (control.hasError('imagenTamano')) {
      return control.errors['imagenTamano'].message;
    }

    return 'Campo inválido';
  }

  onSubmit(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      this.snackBar.open(
        'Por favor corrija los errores en el formulario',
        'Cerrar',
        { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top' }
      );
      return;
    }

    this.loading.set(true);

    const formValue = this.productoForm.value;
    
    // Formatear fecha para envío
    const expirationDate = new Date(formValue.expiration_date);
    const dateFormatted = expirationDate.toISOString().split('T')[0];

    const productoData: ProductoCreateRequest = {
      sku: formValue.sku,
      name: formValue.name,
      expiration_date: dateFormatted,
      quantity: Number(formValue.quantity),
      price: Number(formValue.price),
      location: formValue.location,
      description: formValue.description,
      product_type: formValue.product_type,
      provider_id: formValue.provider_id,
      photo: this.selectedFile || undefined
    };

    this.inventarioService.createProducto(productoData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.snackBar.open(
          'Producto registrado exitosamente',
          'Cerrar',
          { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top' }
        );
        this.dialogRef.close('created');
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error al crear producto:', error);
        
        let errorMessage = 'Error temporal del sistema. Contacte soporte técnico si persiste';
        
        // Safely access error.error.details using optional chaining
        const errorDetails = error?.error?.details;
        
        if (errorDetails === 'El SKU ya existe en el sistema. Utilice un SKU único.') {
          errorMessage = 'El SKU ya existe en el sistema. Utilice un SKU único.';
        } else if (error.status === 400) {
          errorMessage = 'Por favor verifique los datos ingresados';
        }

        this.snackBar.open(
          errorMessage,
          'Cerrar',
          { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top' }
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
