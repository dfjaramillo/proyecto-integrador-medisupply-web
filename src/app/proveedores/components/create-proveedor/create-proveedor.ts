import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProveedoresService } from '../../services/proveedores.service';
import { ProveedorCreateRequest } from '../../models/proveedor.model';
import {
  proveedorNameValidator,
  proveedorEmailValidator,
  proveedorPhoneValidator,
  logoValidator
} from '../../validators/proveedor.validators';

@Component({
  selector: 'app-create-proveedor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './create-proveedor.html',
  styleUrls: ['./create-proveedor.scss']
})
export class CreateProveedorComponent implements OnInit {
  proveedorForm!: FormGroup;
  loading = signal(false);
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService,
    private dialogRef: MatDialogRef<CreateProveedorComponent>,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.proveedorForm = this.fb.group({
      name: [
        '',
        [Validators.required, proveedorNameValidator()]
      ],
      email: [
        '',
        [Validators.required, proveedorEmailValidator()]
      ],
      phone: [
        '',
        [Validators.required, proveedorPhoneValidator()]
      ],
      logo: [null, [logoValidator()]]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      
      // Actualizar el control del formulario
      this.proveedorForm.patchValue({ logo: file });
      this.proveedorForm.get('logo')?.updateValueAndValidity();

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
    this.proveedorForm.patchValue({ logo: null });
    this.proveedorForm.get('logo')?.updateValueAndValidity();
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.proveedorForm.get(controlName);
    return !!(control?.hasError(errorName) && (control?.dirty || control?.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.proveedorForm.get(controlName);
    
    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }

    if (control.hasError('proveedorName')) {
      return control.errors['proveedorName'].message;
    }

    if (control.hasError('proveedorEmail')) {
      return control.errors['proveedorEmail'].message;
    }

    if (control.hasError('proveedorPhone')) {
      return control.errors['proveedorPhone'].message;
    }

    if (control.hasError('logoTipo')) {
      return control.errors['logoTipo'].message;
    }

    if (control.hasError('logoTamano')) {
      return control.errors['logoTamano'].message;
    }

    return 'Campo inválido';
  }

  onSubmit(): void {
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      this.snackBar.open(
        'Por favor corrija los errores en el formulario',
        'Cerrar',
        { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top' }
      );
      return;
    }

    this.loading.set(true);

    const formValue = this.proveedorForm.value;

    const proveedorData: ProveedorCreateRequest = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      logo: this.selectedFile || undefined
    };

    this.proveedoresService.createProveedor(proveedorData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.snackBar.open(
          'Proveedor registrado exitosamente',
          'Cerrar',
          { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top' }
        );
        this.dialogRef.close('created');
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error al crear proveedor:', error);
        
        let errorMessage = 'Error temporal del sistema. Contacte soporte técnico si persiste';
        
        // Safely access error.error.details using optional chaining
        const errorDetails = error?.error?.details;
        
        if (errorDetails) {
          errorMessage = errorDetails;
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
