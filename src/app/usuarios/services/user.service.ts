import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User, CreateUserRequest, CreateUserResponse, GetUsersResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly usersListUrl = `${environment.apiUrl}/auth/user`;
  private readonly createUserUrl = `${environment.apiUrl}/auth/admin/users`;

  /**
   * Get paginated list of users
   */
  getUsers(page: number = 1, perPage: number = 10): Observable<{ users: User[], total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<GetUsersResponse>(this.usersListUrl, { params }).pipe(
      map(response => ({
        users: response.data.users,
        total: response.data.pagination.total
      }))
    );
  }

  /**
   * Create a new user (Admin only)
   * Requires Authorization header with Bearer token (automatically added by interceptor)
   */
  createUser(userData: CreateUserRequest): Observable<CreateUserResponse> {
    const body = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      confirm_password: userData.password, // Same as password
      role: userData.role
    };

    return this.http.post<CreateUserResponse>(this.createUserUrl, body);
  }

  /**
   * Check if email already exists
   */
  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    const params = new HttpParams().set('email', email);
    return this.http.get<{ exists: boolean }>(`${this.createUserUrl}/check-email`, { params });
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.usersListUrl}/${id}`);
  }
}
