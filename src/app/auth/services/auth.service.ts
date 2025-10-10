import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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
   * Clear tokens and log out
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}
