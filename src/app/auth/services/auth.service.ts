import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { AuthTokenResponse, LoginRequest, StoredUser } from '../models/auth-token.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private readonly TOKEN_KEY = 'ms_access_token';
  private readonly REFRESH_TOKEN_KEY = 'ms_refresh_token';
  private readonly USER_KEY = 'ms_user';

  /**
   * Authenticate user and store tokens
   */
  login(user: string, password: string): Observable<AuthTokenResponse> {
    const body: LoginRequest = { user, password };

    return this.http
      .post<AuthTokenResponse>(`${environment.apiUrl}/auth/token`, body)
      .pipe(
        tap((response) => {
          this.setToken(response.access_token);
          this.setRefreshToken(response.refresh_token);
          // Persist user info if backend provides it
          const userInfo: StoredUser = {
            email: response.email ?? null,
            name: response.name ?? null,
            role: response.role ?? null,
            id: response.id ?? null
          };
          try {
            localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
          } catch (e) {
            console.warn('Could not persist user info in localStorage', e);
          }
        })
      );
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Store access token
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Store refresh token
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Get stored user info
   */
  private getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Decode JWT token and get payload
   */
  private getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Extract user role from JWT token
   * The role is in realm_access.roles array
   * We look for application-specific roles (Administrador, Compras, Ventas, Logistica)
   */
  getUserRole(): string | null {
    // Prefer stored role if available
    const stored = this.getStoredUser();
    if (stored?.role) return stored.role;

    const decodedToken = this.getDecodedToken();
    if (!decodedToken || !decodedToken.realm_access?.roles) {
      return null;
    }

    const roles = decodedToken.realm_access.roles;
    const appRoles = ['Administrador', 'Compras', 'Ventas', 'Logistica'];
    // Find the first application role (ignore default Keycloak roles)
    const userRole = roles.find((r: string) => appRoles.includes(r));
    return userRole || null;
  }

  /**
   * Get user email from JWT token
   */
  getUserEmail(): string | null {
    const stored = this.getStoredUser();
    if (stored?.email) return stored.email;

    const decodedToken = this.getDecodedToken();
    return decodedToken?.email || decodedToken?.preferred_username || null;
  }

  /**
   * Get user name from JWT token
   */
  getUserName(): string | null {
    const stored = this.getStoredUser();
    if (stored?.name) return stored.name;

    const decodedToken = this.getDecodedToken();
    return decodedToken?.name || decodedToken?.given_name || null;
  }

  /**
   * Get user ID (subject) from JWT token
   */
  getUserId(): string {
    const stored = this.getStoredUser();
    if (stored?.id) return stored.id;    
    return  "";
  }

  /**
   * Check if user has admin role
   */
  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'Administrador';
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  /**
   * Get all user roles from JWT token
   */
  getUserRoles(): string[] {
    // If a stored role exists, return it as single-element array
    const stored = this.getStoredUser();
    if (stored?.role) return [stored.role];

    const decodedToken = this.getDecodedToken();
    return decodedToken?.realm_access?.roles || [];
  }

  /**
   * Log out user by calling backend and clearing tokens
   */
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    
    // Always clear local tokens, even if backend call fails
    const clearTokens = () => {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    };

    // If no refresh token, just clear local storage
    if (!refreshToken) {
      clearTokens();
      return of(void 0);
    }

    // Call backend logout endpoint
    return this.http
      .post<void>(`${environment.apiUrl}/auth/logout`, {
        refresh_token: refreshToken
      })
      .pipe(
        tap({
          next: () => clearTokens(),
          error: () => clearTokens() // Clear tokens even if backend fails
        })
      );
  }

  /**
   * Clear session data without calling backend
   * Used when token expires or is invalid
   */
  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}
