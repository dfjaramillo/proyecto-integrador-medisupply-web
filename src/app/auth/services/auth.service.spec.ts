import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthTokenResponse } from '../models/auth-token.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockAuthResponse: AuthTokenResponse = {
    access_token: 'mock-access-token',
    expires_in: 3600,
    refresh_expires_in: 7200,
    refresh_token: 'mock-refresh-token',
    token_type: 'Bearer',
    'not-before-policy': 0,
    session_state: 'mock-session-state',
    scope: 'openid profile email'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should send POST request with username and password', () => {
      const username = 'test@example.com';
      const password = 'password123';

      service.login(username, password).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ user: username, password });
      req.flush(mockAuthResponse);
    });

    it('should store access token on successful login', () => {
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/token`);
      req.flush(mockAuthResponse);

      expect(service.getToken()).toBe('mock-access-token');
    });

    it('should store refresh token on successful login', () => {
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/token`);
      req.flush(mockAuthResponse);

      expect(service.getRefreshToken()).toBe('mock-refresh-token');
    });

    it('should return AuthTokenResponse observable', (done) => {
      service.login('test@example.com', 'password123').subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/token`);
      req.flush(mockAuthResponse);
    });

    it('should handle login error', (done) => {
      const errorMessage = 'Invalid credentials';

      service.login('test@example.com', 'wrongpassword').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/token`);
      req.flush({ message: errorMessage }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return stored token', () => {
      service.setToken('test-token');
      expect(service.getToken()).toBe('test-token');
    });
  });

  describe('setToken', () => {
    it('should store token in localStorage', () => {
      service.setToken('new-token');
      expect(localStorage.getItem('ms_access_token')).toBe('new-token');
    });

    it('should overwrite existing token', () => {
      service.setToken('old-token');
      service.setToken('new-token');
      expect(service.getToken()).toBe('new-token');
    });
  });

  describe('getRefreshToken', () => {
    it('should return null when no refresh token is stored', () => {
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should return stored refresh token', () => {
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      expect(service.getRefreshToken()).toBe('test-refresh-token');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token is stored', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when token is stored', () => {
      service.setToken('test-token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false after logout', (done) => {
      service.setToken('test-token');
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      
      service.logout().subscribe(() => {
        expect(service.isAuthenticated()).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({});
    });
  });

  describe('logout', () => {
    it('should send POST request to /auth/logout with refresh token', () => {
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      
      service.logout().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refresh_token: 'test-refresh-token' });
      req.flush({});
    });

    it('should remove access token from localStorage after logout', (done) => {
      service.setToken('test-token');
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      
      service.logout().subscribe(() => {
        expect(service.getToken()).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({});
    });

    it('should remove refresh token from localStorage after logout', (done) => {
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      
      service.logout().subscribe(() => {
        expect(service.getRefreshToken()).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({});
    });

    it('should clear both tokens after successful logout', (done) => {
      service.setToken('test-token');
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      
      service.logout().subscribe(() => {
        expect(service.getToken()).toBeNull();
        expect(service.getRefreshToken()).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({});
    });

    it('should clear tokens even if backend logout fails', (done) => {
      service.setToken('test-token');
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      
      service.logout().subscribe({
        error: () => {
          expect(service.getToken()).toBeNull();
          expect(service.getRefreshToken()).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should complete without backend call if no refresh token exists', (done) => {
      service.setToken('test-token');
      // No refresh token set
      
      service.logout().subscribe(() => {
        expect(service.getToken()).toBeNull();
        done();
      });

      // No HTTP request should be made
      httpMock.expectNone(`${environment.apiUrl}/auth/logout`);
    });
  });

  describe('clearSession', () => {
    it('should remove access token from localStorage', () => {
      service.setToken('test-token');
      expect(service.getToken()).toBe('test-token');
      
      service.clearSession();
      
      expect(service.getToken()).toBeNull();
    });

    it('should remove refresh token from localStorage', () => {
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      expect(service.getRefreshToken()).toBe('test-refresh-token');
      
      service.clearSession();
      
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should remove user data from localStorage', () => {
      localStorage.setItem('ms_user', JSON.stringify({ email: 'test@example.com', name: 'Test User', role: 'Administrador' }));
      expect(localStorage.getItem('ms_user')).toBeTruthy();
      
      service.clearSession();
      
      expect(localStorage.getItem('ms_user')).toBeNull();
    });

    it('should clear all session data at once', () => {
      service.setToken('test-token');
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      localStorage.setItem('ms_user', JSON.stringify({ email: 'test@example.com', name: 'Test User', role: 'Administrador' }));
      
      service.clearSession();
      
      expect(service.getToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(localStorage.getItem('ms_user')).toBeNull();
    });

    it('should not make any HTTP requests', () => {
      service.setToken('test-token');
      localStorage.setItem('ms_refresh_token', 'test-refresh-token');
      
      service.clearSession();
      
      // Verify no HTTP requests were made
      httpMock.expectNone(() => true);
    });

    it('should work correctly when called multiple times', () => {
      service.setToken('test-token');
      
      service.clearSession();
      expect(service.getToken()).toBeNull();
      
      // Call again - should not throw error
      service.clearSession();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('should return null when no token is stored', () => {
      expect(service.getUserRole()).toBeNull();
    });

    it('should extract role from JWT token realm_access.roles', () => {
      // Mock JWT token with Administrador role
      const mockJWT = createMockJWT({
        realm_access: {
          roles: ['Administrador', 'default-roles-medisupply-realm', 'offline_access']
        }
      });
      service.setToken(mockJWT);

      expect(service.getUserRole()).toBe('Administrador');
    });

    it('should return first application role from multiple roles', () => {
      const mockJWT = createMockJWT({
        realm_access: {
          roles: ['default-roles-medisupply-realm', 'Compras', 'offline_access']
        }
      });
      service.setToken(mockJWT);

      expect(service.getUserRole()).toBe('Compras');
    });

    it('should return null when no application role is found', () => {
      const mockJWT = createMockJWT({
        realm_access: {
          roles: ['default-roles-medisupply-realm', 'offline_access', 'uma_authorization']
        }
      });
      service.setToken(mockJWT);

      expect(service.getUserRole()).toBeNull();
    });

    it('should return null when realm_access is missing', () => {
      const mockJWT = createMockJWT({
        name: 'Test User',
        email: 'test@example.com'
      });
      service.setToken(mockJWT);

      expect(service.getUserRole()).toBeNull();
    });

    it('should handle invalid JWT token gracefully', () => {
      service.setToken('invalid-token');
      expect(service.getUserRole()).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true when user has Administrador role', () => {
      const mockJWT = createMockJWT({
        realm_access: {
          roles: ['Administrador', 'offline_access']
        }
      });
      service.setToken(mockJWT);

      expect(service.isAdmin()).toBe(true);
    });

    it('should return false when user has Compras role', () => {
      const mockJWT = createMockJWT({
        realm_access: {
          roles: ['Compras', 'offline_access']
        }
      });
      service.setToken(mockJWT);

      expect(service.isAdmin()).toBe(false);
    });

    it('should return false when user has no application role', () => {
      const mockJWT = createMockJWT({
        realm_access: {
          roles: ['offline_access']
        }
      });
      service.setToken(mockJWT);

      expect(service.isAdmin()).toBe(false);
    });

    it('should return false when no token is stored', () => {
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      const mockJWT = createMockJWT({
        realm_access: {
          roles: ['Ventas', 'offline_access']
        }
      });
      service.setToken(mockJWT);

      expect(service.hasRole('Ventas')).toBe(true);
    });

    it('should return false when user has different role', () => {
      const mockJWT = createMockJWT({
        realm_access: {
          roles: ['Logistica', 'offline_access']
        }
      });
      service.setToken(mockJWT);

      expect(service.hasRole('Ventas')).toBe(false);
    });

    it('should return false when no token is stored', () => {
      expect(service.hasRole('Administrador')).toBe(false);
    });
  });

  describe('getUserEmail', () => {
    it('should extract email from JWT token', () => {
      const mockJWT = createMockJWT({
        email: 'test@example.com',
        realm_access: { roles: ['Administrador'] }
      });
      service.setToken(mockJWT);

      expect(service.getUserEmail()).toBe('test@example.com');
    });

    it('should fallback to preferred_username when email is missing', () => {
      const mockJWT = createMockJWT({
        preferred_username: 'user@example.com',
        realm_access: { roles: ['Administrador'] }
      });
      service.setToken(mockJWT);

      expect(service.getUserEmail()).toBe('user@example.com');
    });

    it('should return null when no token is stored', () => {
      expect(service.getUserEmail()).toBeNull();
    });
  });

  describe('getUserName', () => {
    it('should extract name from JWT token', () => {
      const mockJWT = createMockJWT({
        name: 'John Doe',
        realm_access: { roles: ['Administrador'] }
      });
      service.setToken(mockJWT);

      expect(service.getUserName()).toBe('John Doe');
    });

    it('should fallback to given_name when name is missing', () => {
      const mockJWT = createMockJWT({
        given_name: 'Jane Smith',
        realm_access: { roles: ['Administrador'] }
      });
      service.setToken(mockJWT);

      expect(service.getUserName()).toBe('Jane Smith');
    });

    it('should return null when no token is stored', () => {
      expect(service.getUserName()).toBeNull();
    });
  });
 
  describe('getUserRoles', () => {
    it('should return all roles from JWT token', () => {
      const mockJWT = createMockJWT({
        realm_access: {
          roles: ['Administrador', 'default-roles-medisupply-realm', 'offline_access', 'uma_authorization']
        }
      });
      service.setToken(mockJWT);

      const roles = service.getUserRoles();
      expect(roles).toEqual(['Administrador', 'default-roles-medisupply-realm', 'offline_access', 'uma_authorization']);
    });

    it('should return empty array when realm_access is missing', () => {
      const mockJWT = createMockJWT({
        name: 'Test User'
      });
      service.setToken(mockJWT);

      expect(service.getUserRoles()).toEqual([]);
    });

    it('should return empty array when no token is stored', () => {
      expect(service.getUserRoles()).toEqual([]);
    });
  });
});

/**
 * Helper function to create mock JWT tokens for testing
 */
function createMockJWT(payload: any): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
