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
  private readonly assignedClientsUrl = `${environment.apiUrl}/auth/assigned-clients`;

  /**
   * Get paginated list of users
   */
  getUsers(page: number = 1, perPage: number = 10, filterKey?: 'role' | 'name' | 'email', filterValue?: string): Observable<{ users: User[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    // If a filter key and value are provided, add them to params
    if (filterKey && filterValue) {
      params = params.set(filterKey, filterValue);
    }

    return this.http.get<GetUsersResponse>(this.usersListUrl, { params }).pipe(
      map(response => ({
        users: response.data.users,
        total: response.data.pagination.total
      }))
    );
  }

  /**
   * Get all clients (role=Cliente) for local filtering/pagination
   */
  getClients(): Observable<User[]> {
    const params = new HttpParams()
      .set('page', '1')
      .set('per_page', '5')
      .set('role', 'Cliente');

    return this.http.get<GetUsersResponse>(this.usersListUrl, { params }).pipe(
      map(response => (response.data.users || []).filter(u => u.role === 'Cliente'))
    );
  }

  /**
   * Get account managers / sellers (role=Ventas)
   */
  getSellers(): Observable<User[]> {
    const params = new HttpParams()
      .set('page', '1')
      .set('per_page', '5')
      .set('role', 'Ventas');

    return this.http.get<GetUsersResponse>(this.usersListUrl, { params }).pipe(
      map(response => response.data.users || [])
    );
  }

  /**
   * Assign client to seller (approve client)
   */
  assignClientToSeller(sellerId: string, clientId: string): Observable<any> {
    const body = {
      seller_id: sellerId,
      client_id: clientId
    };
    return this.http.post<any>(this.assignedClientsUrl, body);
  }

  /**
   * Get assigned clients by seller
   */
  getAssignedClientsBySeller(sellerId: string): Observable<{ seller_id: string; assigned_clients: any[]; total: number }> {
    return this.http.get<{ message: string; data: { seller_id: string; assigned_clients: any[]; total: number } }>(
      `${this.assignedClientsUrl}/${sellerId}`
    ).pipe(map(res => res.data));
  }

  /**
   * Reject client request
   */
  rejectClient(userId: string, sellerId: string, clientId: string): Observable<any> {
    const body = {
      seller_id: sellerId,
      client_id: clientId
    };
    return this.http.post<any>(`${this.usersListUrl}/reject/${userId}`, body);
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
