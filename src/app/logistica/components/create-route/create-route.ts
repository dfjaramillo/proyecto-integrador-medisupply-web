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
import { RoutesService } from '../../services/routes.service';
import { TruckOption, ProductType } from '../../models/route.model';

@Component({
  selector: 'app-create-route',
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
  templateUrl: './create-route.html',
  styleUrls: ['./create-route.scss'],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }
  ],
})
export class CreateRouteComponent implements OnInit {
  routeForm!: FormGroup;
  loading = signal(false);
  trucks = signal<TruckOption[]>([]);
  productTypes: ProductType[] = [];
  loadingTrucks = signal(true);
  minDate = new Date(); // Fecha mínima es hoy

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateRouteComponent>,
    private routesService: RoutesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadTrucks();
    this.loadProductTypes();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  private initForm(): void {
    this.routeForm = this.fb.group({
      assigned_truck: ['', [Validators.required]],
      product_type: ['', [Validators.required]],
      delivery_date: ['', [Validators.required, this.futureDateValidator()]]
    });
  }

  /**
   * Validador para asegurar que la fecha sea igual o posterior a hoy
   */
  private futureDateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      return selectedDate >= today
        ? null
        : { futureDate: 'La fecha debe ser igual o posterior a la fecha actual' };
    };
  }

  /**
   * Carga la lista de camiones disponibles
   */
  private loadTrucks(): void {
    this.loadingTrucks.set(true);
    this.routesService.getAvailableTrucks().subscribe({
      next: (trucks) => {
        this.trucks.set(trucks);
        this.loadingTrucks.set(false);
      },
      error: (error) => {
        console.error('Error loading trucks:', error);
        this.loadingTrucks.set(false);
        this.snackBar.open(
          'Error al cargar los camiones disponibles',
          'Cerrar',
          { duration: 3000 }
        );
      },
    });
  }

  /**
   * Carga los tipos de productos disponibles
   */
  private loadProductTypes(): void {
    this.productTypes = this.routesService.getProductTypes();
  }

  /**
   * Valida disponibilidad del camión cuando cambian truck o fecha
   */
  async validateTruckAvailability(): Promise<void> {
    const truck = this.routeForm.get('assigned_truck')?.value;
    const date = this.routeForm.get('delivery_date')?.value;

    if (!truck || !date) {
      return;
    }

    const formattedDate = this.formatDateForAPI(date);
    
    this.routesService.validateTruckAvailability(truck, formattedDate).subscribe({
      next: (isAvailable) => {
        if (!isAvailable) {
          this.routeForm.get('assigned_truck')?.setErrors({ 
            truckUnavailable: 'El camión ya tiene una ruta asignada en esta fecha' 
          });
          this.snackBar.open(
            'El camión seleccionado ya tiene una ruta asignada en esta fecha',
            'Cerrar',
            { duration: 5000 }
          );
        }
      },
      error: (error) => {
        console.error('Error validating truck availability:', error);
      }
    });
  }

  /**
   * Formatea la fecha para enviar al API (formato YYYY-MM-DD)
   */
  private formatDateForAPI(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Cierra el diálogo sin guardar
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Envía el formulario para crear la ruta
   */
  onSubmit(): void {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const formValue = this.routeForm.value;
    const routeData = {
      assigned_truck: formValue.assigned_truck,
      delivery_date: this.formatDateForAPI(formValue.delivery_date)
    };

    this.routesService.createRoute(routeData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.snackBar.open('Ruta generada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.dialogRef.close('created');
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error creating route:', error);

        let errorMessage = 'Error temporal del sistema. Contacte soporte técnico si persiste';

        if (error.status === 400) {
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = 'Por favor verifique los datos ingresados';
          }
        } else if (error.status === 409) {
          errorMessage = 'El camión ya tiene una ruta asignada en esta fecha';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const control = this.routeForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo es obligatorio';
    }

    if (control.errors['futureDate']) {
      return control.errors['futureDate'];
    }

    if (control.errors['truckUnavailable']) {
      return control.errors['truckUnavailable'];
    }

    return '';
  }
}
