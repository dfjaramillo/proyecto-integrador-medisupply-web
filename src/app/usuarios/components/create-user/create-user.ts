import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserService } from '../../services/user.service';
import { UserRole, CreateUserRequest } from '../../models/user.model';
import { passwordStrengthValidator, matchFieldsValidator, fullNameValidator } from '../../validators/user.validators';

@Component({
  selector: 'app-create-user',
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
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.scss']
})
export class CreateUserComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateUserComponent>);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  roles = Object.values(UserRole).filter(role => role !== UserRole.ADMINISTRADOR);

  form = this.fb.group({
    name: ['', [
      Validators.required,
      Validators.minLength(3),
      fullNameValidator()
    ]],
    email: ['', [
      Validators.required,
      Validators.email
    ]],
    password: ['', [
      Validators.required,
      passwordStrengthValidator()
    ]],
    confirmPassword: ['', [
      Validators.required,
      matchFieldsValidator('password')
    ]],
    role: [UserRole.COMPRAS, [Validators.required]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.form.getRawValue();
    
    const userData: CreateUserRequest = {
      name: formValue.name!,
      email: formValue.email!,
      password: formValue.password!,
      role: formValue.role!
    };

    this.userService.createUser(userData).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.snackBar.open(response.message || 'Usuario creado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(response.data);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error creating user:', err);
        
        let errorMessage = 'Error temporal del sistema. Contacte soporte técnico si persiste';
        
        if (err.status === 409) {
          errorMessage = 'El correo electrónico ya está registrado';
          this.form.get('email')?.setErrors({ duplicate: true });
        } else if (err.status === 400) {
          errorMessage = err.error?.message || 'Datos inválidos. Verifique el formulario';
        }
        
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.touched && control.hasError(error));
  }

  getPasswordError(): string {
    const control = this.form.get('password');
    if (!control || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'La contraseña es obligatoria';
    }

    if (control.hasError('passwordStrength')) {
      const errors = control.getError('passwordStrength');
      const missing: string[] = [];
      
      if (!errors.hasMinLength) missing.push('8 caracteres');
      if (!errors.hasUpperCase) missing.push('una mayúscula');
      if (!errors.hasLowerCase) missing.push('una minúscula');
      if (!errors.hasNumber) missing.push('un número');
      if (!errors.hasSpecialChar) missing.push('un carácter especial');
      
      return `La contraseña debe contener: ${missing.join(', ')}`;
    }

    return '';
  }
}
