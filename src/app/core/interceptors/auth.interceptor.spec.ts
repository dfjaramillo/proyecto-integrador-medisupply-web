import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../../auth/services/auth.service';

describe('authInterceptor', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockNext: HttpHandlerFn;
  let capturedRequest: HttpRequest<any> | null;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getToken', 'clearSession']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    capturedRequest = null;

    // Create mock next function
    mockNext = (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
      capturedRequest = req;
      return of({ type: 0 } as HttpEvent<any>); // Default success response
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  const createRequest = (url: string): HttpRequest<any> => {
    return new HttpRequest('GET', url);
  };

  const executeInterceptor = (req: HttpRequest<any>): Observable<any> => {
    return TestBed.runInInjectionContext(() => {
      return authInterceptor(req, mockNext);
    });
  };

  describe('Token Management', () => {
    it('should add Authorization header when token exists', (done) => {
      const token = 'test-token-123';
      mockAuthService.getToken.and.returnValue(token);

      const req = createRequest('https://api.example.com/inventory/products');
      
      executeInterceptor(req).subscribe(() => {
        expect(capturedRequest).toBeTruthy();
        expect(capturedRequest!.headers.get('Authorization')).toBe(`Bearer ${token}`);
        done();
      });
    });

    it('should not add Authorization header when token does not exist', (done) => {
      mockAuthService.getToken.and.returnValue(null);

      const req = createRequest('https://api.example.com/inventory/products');
      
      executeInterceptor(req).subscribe(() => {
        expect(capturedRequest).toBeTruthy();
        expect(capturedRequest!.headers.has('Authorization')).toBe(false);
        done();
      });
    });

    it('should not add Authorization header for public endpoints', (done) => {
      const token = 'test-token-123';
      mockAuthService.getToken.and.returnValue(token);

      const req = createRequest('https://api.example.com/auth/token');
      
      executeInterceptor(req).subscribe(() => {
        expect(capturedRequest).toBeTruthy();
        expect(capturedRequest!.headers.has('Authorization')).toBe(false);
        done();
      });
    });

    it('should not add Authorization header for public endpoints with query params', (done) => {
      const token = 'test-token-123';
      mockAuthService.getToken.and.returnValue(token);

      const req = createRequest('https://api.example.com/auth/token?param=value');
      
      executeInterceptor(req).subscribe(() => {
        expect(capturedRequest).toBeTruthy();
        expect(capturedRequest!.headers.has('Authorization')).toBe(false);
        done();
      });
    });
  });

  describe('Error Handling - Token Expiration', () => {
    it('should clear session and redirect to login on 401 error', (done) => {
      const token = 'expired-token';
      mockAuthService.getToken.and.returnValue(token);
      
      const error = new HttpErrorResponse({
        error: 'Unauthorized',
        status: 401,
        statusText: 'Unauthorized'
      });
      
      // Override mockNext to return error
      mockNext = (): Observable<HttpEvent<any>> => throwError(() => error);

      const req = createRequest('https://api.example.com/inventory/products');
      
      executeInterceptor(req).subscribe({
        error: (err: HttpErrorResponse) => {
          expect(mockAuthService.clearSession).toHaveBeenCalled();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          expect(err.status).toBe(401);
          done();
        }
      });
    });

    it('should not interfere with other error codes', (done) => {
      const token = 'valid-token';
      mockAuthService.getToken.and.returnValue(token);
      
      const error = new HttpErrorResponse({
        error: 'Not Found',
        status: 404,
        statusText: 'Not Found'
      });
      
      // Override mockNext to return error
      mockNext = (): Observable<HttpEvent<any>> => throwError(() => error);

      const req = createRequest('https://api.example.com/inventory/products/999');
      
      executeInterceptor(req).subscribe({
        error: (err: HttpErrorResponse) => {
          expect(mockAuthService.clearSession).not.toHaveBeenCalled();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
          expect(err.status).toBe(404);
          done();
        }
      });
    });

    it('should handle 401 error even without token', (done) => {
      mockAuthService.getToken.and.returnValue(null);
      
      const error = new HttpErrorResponse({
        error: 'Unauthorized',
        status: 401,
        statusText: 'Unauthorized'
      });
      
      // Override mockNext to return error
      mockNext = (): Observable<HttpEvent<any>> => throwError(() => error);

      const req = createRequest('https://api.example.com/inventory/products');
      
      executeInterceptor(req).subscribe({
        error: (err: HttpErrorResponse) => {
          expect(mockAuthService.clearSession).toHaveBeenCalled();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          expect(err.status).toBe(401);
          done();
        }
      });
    });
  });

  describe('Successful Requests', () => {
    it('should pass through successful requests', (done) => {
      const token = 'valid-token';
      mockAuthService.getToken.and.returnValue(token);
      
      const mockResponse = { type: 4, body: { id: 1, name: 'Test' } } as HttpEvent<any>;
      mockNext = (): Observable<HttpEvent<any>> => of(mockResponse);

      const req = createRequest('https://api.example.com/inventory/products');
      
      executeInterceptor(req).subscribe((response: HttpEvent<any>) => {
        expect(response).toEqual(mockResponse);
        expect(mockAuthService.clearSession).not.toHaveBeenCalled();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });
});

