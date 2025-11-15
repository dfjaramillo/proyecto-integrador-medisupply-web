import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User, CreateUserRequest, CreateUserResponse, GetUsersResponse, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      institution_type: 'Hospital',
      phone: '1234567890',
      role: UserRole.ADMINISTRADOR,
      enabled: true,
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      institution_type: 'Clinica',
      phone: '0987654321',
      role: UserRole.VENTAS,
      enabled: true,
      created_at: '2025-01-02T00:00:00Z'
    }
  ];

  const mockGetUsersResponse: GetUsersResponse = {
    message: 'Success',
    data: {
      users: mockUsers,
      pagination: {
        page: 1,
        per_page: 10,
        total: 2,
        total_pages: 1,
        has_next: false,
        has_prev: false,
        next_page: null,
        prev_page: null
      }
    }
  };

  const mockCreateUserResponse: CreateUserResponse = {
    message: 'User created successfully',
    data: {
      id: '3',
      name: 'New User',
      email: 'newuser@example.com',
      role: UserRole.COMPRAS,
      enabled: true,
      created_at: '2025-01-03T00:00:00Z'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should fetch users with default pagination', () => {
      service.getUsers().subscribe(response => {
        expect(response.users).toEqual(mockUsers);
        expect(response.total).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/user?page=1&per_page=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGetUsersResponse);
    });

    it('should fetch users with custom pagination', () => {
      service.getUsers(2, 20).subscribe(response => {
        expect(response.users).toEqual(mockUsers);
        expect(response.total).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/user?page=2&per_page=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGetUsersResponse);
    });

    it('should map response data correctly', () => {
      service.getUsers(1, 10).subscribe(response => {
        expect(response).toEqual({
          users: mockUsers,
          total: 2
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/user?page=1&per_page=10`);
      req.flush(mockGetUsersResponse);
    });

    it('should handle empty users list', () => {
      const emptyResponse: GetUsersResponse = {
        message: 'Success',
        data: {
          users: [],
          pagination: {
            page: 1,
            per_page: 10,
            total: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      };

      service.getUsers().subscribe(response => {
        expect(response.users).toEqual([]);
        expect(response.total).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/user?page=1&per_page=10`);
      req.flush(emptyResponse);
    });

    it('should handle HTTP error', () => {
      service.getUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/user?page=1&per_page=10`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getClients', () => {
    it('should request clients with role Cliente and map only Cliente users', () => {
      const response: GetUsersResponse = {
        message: 'Success',
        data: {
          users: [
            { ...mockUsers[0], role: 'Cliente' },
            { ...mockUsers[1], role: UserRole.VENTAS }
          ],
          pagination: mockGetUsersResponse.data.pagination
        }
      };

      service.getClients().subscribe(users => {
        expect(users.length).toBe(1);
        expect(users[0].role).toBe('Cliente');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/auth/user?page=1&per_page=100&role=Cliente`
      );
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('getSellers', () => {
    it('should request sellers with role Ventas and return all users', () => {
      const response: GetUsersResponse = {
        message: 'Success',
        data: {
          users: [
            { ...mockUsers[0], role: UserRole.VENTAS },
            { ...mockUsers[1], role: UserRole.VENTAS }
          ],
          pagination: mockGetUsersResponse.data.pagination
        }
      };

      service.getSellers().subscribe(users => {
        expect(users.length).toBe(2);
        expect(users.every(u => u.role === UserRole.VENTAS)).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/auth/user?page=1&per_page=100&role=Ventas`
      );
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('createUser', () => {
    it('should send POST request with user data', () => {
      const userData: CreateUserRequest = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
        role: UserRole.COMPRAS
      };

      service.createUser(userData).subscribe(response => {
        expect(response).toEqual(mockCreateUserResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/admin/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        confirm_password: userData.password,
        role: userData.role
      });
      req.flush(mockCreateUserResponse);
    });

    it('should include confirm_password same as password', () => {
      const userData: CreateUserRequest = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        role: UserRole.VENTAS
      };

      service.createUser(userData).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/admin/users`);
      expect(req.request.body.password).toBe('SecurePass123!');
      expect(req.request.body.confirm_password).toBe('SecurePass123!');
      req.flush(mockCreateUserResponse);
    });

    it('should handle duplicate email error (409)', () => {
      const userData: CreateUserRequest = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'Password123!',
        role: UserRole.LOGISTICA
      };

      service.createUser(userData).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/admin/users`);
      req.flush({ message: 'Email already exists' }, { status: 409, statusText: 'Conflict' });
    });

    it('should handle validation error (400)', () => {
      const userData: CreateUserRequest = {
        name: 'New User',
        email: 'invalid-email',
        password: 'weak',
        role: UserRole.COMPRAS
      };

      service.createUser(userData).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/admin/users`);
      req.flush({ message: 'Validation error' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle unauthorized error (401)', () => {
      const userData: CreateUserRequest = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
        role: UserRole.ADMINISTRADOR
      };

      service.createUser(userData).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/admin/users`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('checkEmailExists', () => {
    it('should check if email exists', () => {
      const email = 'test@example.com';

      service.checkEmailExists(email).subscribe(response => {
        expect(response.exists).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/admin/users/check-email?email=${email}`);
      expect(req.request.method).toBe('GET');
      req.flush({ exists: true });
    });

    it('should return false for non-existent email', () => {
      const email = 'newuser@example.com';

      service.checkEmailExists(email).subscribe(response => {
        expect(response.exists).toBe(false);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/admin/users/check-email?email=${email}`);
      req.flush({ exists: false });
    });

    it('should encode email in query params', () => {
      const email = 'user+test@example.com';

      service.checkEmailExists(email).subscribe();

      const req = httpMock.expectOne((request) => 
        request.url.includes('/check-email') && request.params.get('email') === email
      );
      expect(req.request.method).toBe('GET');
      req.flush({ exists: false });
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID', () => {
      const userId = '1';
      const mockUser = mockUsers[0];

      service.getUserById(userId).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/user/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should handle user not found (404)', () => {
      const userId = 'non-existent';

      service.getUserById(userId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/user/${userId}`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('assignClientToSeller', () => {
    it('should POST assignment payload to assigned-clients endpoint', () => {
      const sellerId = 'seller-1';
      const clientId = 'client-1';

      service.assignClientToSeller(sellerId, clientId).subscribe(response => {
        expect(response).toEqual({ success: true });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/assigned-clients`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ seller_id: sellerId, client_id: clientId });
      req.flush({ success: true });
    });
  });

  describe('getAssignedClientsBySeller', () => {
    it('should GET assigned clients and map inner data object', () => {
      const sellerId = 'seller-123';
      const apiResponse = {
        message: 'Success',
        data: {
          seller_id: sellerId,
          assigned_clients: [{ id: 'c1' }, { id: 'c2' }],
          total: 2
        }
      };

      service.getAssignedClientsBySeller(sellerId).subscribe(data => {
        expect(data.seller_id).toBe(sellerId);
        expect(data.assigned_clients.length).toBe(2);
        expect(data.total).toBe(2);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/auth/assigned-clients/${sellerId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });
  });

  describe('rejectClient', () => {
    it('should POST reject payload to correct URL', () => {
      const userId = 'user-1';
      const sellerId = 'seller-1';
      const clientId = 'client-1';

      service.rejectClient(userId, sellerId, clientId).subscribe(response => {
        expect(response).toEqual({ rejected: true });
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/auth/user/reject/${userId}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ seller_id: sellerId, client_id: clientId });
      req.flush({ rejected: true });
    });
  });
});
