import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    // Material
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private authService = inject(AuthService);

  hide = signal(true);
  loading = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();

    this.authService.login(email!, password!).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.snack.open('Inicio de sesión exitoso', 'OK', { duration: 2000 });
        if (response.role=='Compras') {
          this.router.navigateByUrl('/proveedores');
        }
        if (response.role=='Logistica') {
          this.router.navigateByUrl('/inventario');
        }

        // Navigate to protected route after successful login
        this.router.navigateByUrl('/usuarios');
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Login error:', err);
        this.snack.open('Usuario o contraseña incorrectos', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.touched && c.hasError(error));
  }
}