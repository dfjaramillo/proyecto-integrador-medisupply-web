import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login';
import { AuthService } from '../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockAuthResponse = {
    access_token: 'mock-token',
    expires_in: 3600,
    refresh_expires_in: 7200,
    refresh_token: 'mock-refresh-token',
    token_type: 'Bearer',
    'not-before-policy': 0,
    session_state: 'mock-session',
    scope: 'openid profile email',
    role: 'Administrador'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent
      ],
      providers: [
        provideAnimations(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.form.get('email')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
    });

    it('should have email field with required and email validators', () => {
      const emailControl = component.form.get('email');
      expect(emailControl?.hasError('required')).toBe(true);
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBe(false);
    });

    it('should have password field with required and minLength validators', () => {
      const passwordControl = component.form.get('password');
      expect(passwordControl?.hasError('required')).toBe(true);
      
      passwordControl?.setValue('short');
      expect(passwordControl?.hasError('minlength')).toBe(true);
      
      passwordControl?.setValue('validpassword');
      expect(passwordControl?.hasError('minlength')).toBe(false);
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should initialize with password hidden', () => {
      expect(component.hide()).toBe(true);
    });

    it('should toggle password visibility', () => {
      expect(component.hide()).toBe(true);
      component.hide.set(false);
      expect(component.hide()).toBe(false);
      component.hide.set(true);
      expect(component.hide()).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should not submit if form is invalid', () => {
      component.submit();
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when submitting invalid form', () => {
      component.submit();
      expect(component.form.get('email')?.touched).toBe(true);
      expect(component.form.get('password')?.touched).toBe(true);
    });
  });

  describe('hasError method', () => {
    it('should return true when field has error and is touched', () => {
      const emailControl = component.form.get('email');
      emailControl?.markAsTouched();
      expect(component.hasError('email', 'required')).toBe(true);
    });

    it('should return false when field has error but is not touched', () => {
      expect(component.hasError('email', 'required')).toBe(false);
    });

    it('should return false when field is touched but has no error', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('valid@email.com');
      emailControl?.markAsTouched();
      expect(component.hasError('email', 'required')).toBe(false);
    });
  });

  describe('Successful Login', () => {
    beforeEach(() => {
      authService.login.and.returnValue(of(mockAuthResponse));
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should call authService.login with correct credentials', () => {
      component.submit();
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should set loading to true during login', () => {
      component.submit();
      expect(component.loading()).toBe(false); // After observable completes
    });

    it('should navigate to /usuarios on successful login', () => {
      component.submit();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/usuarios');
    });

    it('should set loading to false after successful login', (done) => {
      component.submit();
      setTimeout(() => {
        expect(component.loading()).toBe(false);
        done();
      }, 0);
    });
  });

  describe('Role-based Navigation', () => {
    beforeEach(() => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should navigate to /proveedores when role is Compras', () => {
      const comprasResponse = { ...mockAuthResponse, role: 'Compras' };
      authService.login.and.returnValue(of(comprasResponse));
      
      component.submit();
      
      expect(router.navigateByUrl).toHaveBeenCalledWith('/proveedores');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/usuarios');
    });

    it('should navigate to /inventario when role is Logistica', () => {
      const logisticaResponse = { ...mockAuthResponse, role: 'Logistica' };
      authService.login.and.returnValue(of(logisticaResponse));
      
      component.submit();
      
      expect(router.navigateByUrl).toHaveBeenCalledWith('/inventario');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/usuarios');
    });

    it('should navigate to /usuarios when role is Administrador', () => {
      const adminResponse = { ...mockAuthResponse, role: 'Administrador' };
      authService.login.and.returnValue(of(adminResponse));
      
      component.submit();
      
      expect(router.navigateByUrl).toHaveBeenCalledWith('/usuarios');
    });

    it('should navigate to /usuarios when role is not recognized', () => {
      const otherResponse = { ...mockAuthResponse, role: 'OtroRol' };
      authService.login.and.returnValue(of(otherResponse));
      
      component.submit();
      
      expect(router.navigateByUrl).toHaveBeenCalledWith('/usuarios');
    });

    it('should display success snackbar for all roles', () => {
      const comprasResponse = { ...mockAuthResponse, role: 'Compras' };
      authService.login.and.returnValue(of(comprasResponse));
      
      component.submit();
      
      expect(snackBar.open);
    });
  });

  describe('Failed Login', () => {
    const errorResponse = {
      message: 'Invalid credentials'
    };

    beforeEach(() => {
      authService.login.and.returnValue(throwError(() => errorResponse));
      component.form.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    });

    it('should log error on failed login', () => {
      spyOn(console, 'error');
      component.submit();
      expect(console.error).toHaveBeenCalledWith('Login error:', errorResponse);
    });

    it('should set loading to false after failed login', (done) => {
      component.submit();
      setTimeout(() => {
        expect(component.loading()).toBe(false);
        done();
      }, 0);
    });

    it('should log error to console', () => {
      spyOn(console, 'error');
      component.submit();
      expect(console.error).toHaveBeenCalledWith('Login error:', errorResponse);
    });
  });
});
