import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { AuthTokenResponse, LoginRequest } from '../models/auth-token.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private readonly TOKEN_KEY = 'ms_access_token';
  private readonly REFRESH_TOKEN_KEY = 'ms_refresh_token';

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
    const decodedToken = this.getDecodedToken();
    if (!decodedToken || !decodedToken.realm_access?.roles) {
      return null;
    }

    const roles = decodedToken.realm_access.roles;
    const appRoles = ['Administrador', 'Compras', 'Ventas', 'Logistica'];
    
    // Find the first application role (ignore default Keycloak roles)
    const userRole = roles.find((role: string) => appRoles.includes(role));
    return userRole || null;
  }

  /**
   * Get user email from JWT token
   */
  getUserEmail(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken?.email || decodedToken?.preferred_username || null;
  }

  /**
   * Get user name from JWT token
   */
  getUserName(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken?.name || decodedToken?.given_name || null;
  }

  /**
   * Get user ID (subject) from JWT token
   */
  getUserId(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken?.sub || null;
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
}
