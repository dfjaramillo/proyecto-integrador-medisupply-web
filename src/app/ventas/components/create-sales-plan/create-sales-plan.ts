import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SalesPlanService } from '../../services/sales-plan.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-create-sales-plan',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './create-sales-plan.html',
  styleUrls: ['./create-sales-plan.scss'],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }
  ],
})
export class CreateSalesPlanComponent implements OnInit {
  salesPlanForm!: FormGroup;
  loading = signal(false);
  clients = signal<Array<{ id: string; name: string }>>([]);
  loadingClients = signal(true);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateSalesPlanComponent>,
    private salesPlanService: SalesPlanService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private initForm(): void {
    this.salesPlanForm = this.fb.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
            this.alphabeticValidator,
          ],
        ],
        client_id: ['', [Validators.required]],
        start_date: ['', [Validators.required]],
        end_date: ['', [Validators.required]],
        target_revenue: [
          '',
          [Validators.required, Validators.min(0), this.decimalValidator],
        ],
        objectives: ['', [Validators.maxLength(500)]],
      },
      { validators: this.dateRangeValidator }
    );
  }

  /**
   * Validador personalizado para caracteres alfabéticos, números y espacios
   */
  private alphabeticValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const pattern = /^[0-9a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return pattern.test(control.value)
      ? null
      : { alphabetic: 'Solo se permiten letras, números y espacios' };
  }

  /**
   * Validador personalizado para máximo 2 decimales
   */
  private decimalValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const value = control.value.toString();
    const parts = value.split('.');
    if (parts.length === 2 && parts[1].length > 2) {
      return { decimal: 'Máximo 2 decimales permitidos' };
    }
    return null;
  }

  /**
   * Validador para rango de fechas (inicio <= fin)
   */
  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const startDate = group.get('start_date')?.value;
    const endDate = group.get('end_date')?.value;

    if (!startDate || !endDate) {
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return start <= end
      ? null
      : { dateRange: 'La fecha de inicio debe ser menor o igual a la fecha de fin' };
  }

  /**
   * Carga la lista de clientes disponibles
   */
  private loadClients(): void {
    this.loadingClients.set(true);
    this.salesPlanService.getClients().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loadingClients.set(false);
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.loadingClients.set(false);
        this.snackBar.open(
          'Error al cargar los clientes. Intente nuevamente.',
          'Cerrar',
          { duration: 5000 }
        );
      },
    });
  }

  /**
   * Verifica si un campo tiene un error específico
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.salesPlanForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.salesPlanForm.get(fieldName);
    if (!field) {
      return '';
    }

    if (field.hasError('required')) {
      return 'Este campo es obligatorio';
    }

    if (field.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (field.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    if (field.hasError('min')) {
      return 'El valor debe ser mayor o igual a 0';
    }

    if (field.hasError('alphabetic')) {
      return field.errors?.['alphabetic'];
    }

    if (field.hasError('decimal')) {
      return field.errors?.['decimal'];
    }

    return '';
  }

  /**
   * Obtiene el mensaje de error para el rango de fechas
   */
  getDateRangeError(): string {
    if (this.salesPlanForm.hasError('dateRange')) {
      return this.salesPlanForm.errors?.['dateRange'];
    }
    return '';
  }

  /**
   * Envía el formulario
   */
  onSubmit(): void {
    if (this.salesPlanForm.invalid || this.loading()) {
      Object.keys(this.salesPlanForm.controls).forEach((key) => {
        this.salesPlanForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);

    const sellerId = this.authService.getUserId();
    if (!sellerId) {
      this.loading.set(false);
      this.snackBar.open(
        'Error: No se pudo obtener el ID del usuario. Por favor, inicie sesión nuevamente.',
        'Cerrar',
        { duration: 5000 }
      );
      return;
    }

    const formValue = this.salesPlanForm.value;
    const data = {
      name: formValue.name.trim(),
      client_id: formValue.client_id,
      seller_id: sellerId,
      start_date: new Date(formValue.start_date).toISOString(),
      end_date: new Date(formValue.end_date).toISOString(),
      target_revenue: parseFloat(formValue.target_revenue),
      objectives: formValue.objectives?.trim() || undefined,
    };

    this.salesPlanService.createSalesPlan(data).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.snackBar.open(
          'Plan de ventas creado exitosamente',
          'Cerrar',
          { duration: 3000 }
        );
        this.dialogRef.close('created');
      },
      error: (error) => {
        console.error('Error creating sales plan:', error);
        this.loading.set(false);

        let errorMessage = 'Error temporal del sistema. Intente nuevamente. Si persiste, contacte soporte.';

        if (error.status === 400) {
          // Errores de validación por campo
          if (error.error?.details) {
            const details = error.error.details;
            if (typeof details === 'object') {
              // Marcar los campos con error
              Object.keys(details).forEach((key) => {
                const control = this.salesPlanForm.get(key);
                if (control) {
                  control.setErrors({ serverError: details[key] });
                }
              });
              errorMessage = 'Por favor corrija los errores en el formulario';
            } else {
              errorMessage = details;
            }
          } else if (error.error?.error?.includes('nombre')) {
            this.salesPlanForm.get('name')?.setErrors({
              duplicate: 'Ya existe un plan de ventas con este nombre',
            });
            errorMessage = 'Ya existe un plan de ventas con este nombre';
          }
        } else if (error.status === 403) {
          errorMessage = 'El cliente seleccionado no está asignado a su usuario';
        }

        this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
      },
    });
  }

  /**
   * Cancela y cierra el diálogo
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
