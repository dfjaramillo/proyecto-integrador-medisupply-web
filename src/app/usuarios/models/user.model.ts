import { Pagination } from '../../shared/models/pagination.model';

export enum UserRole {
  ADMINISTRADOR = 'Administrador',
  COMPRAS = 'Compras',
  VENTAS = 'Ventas',
  LOGISTICA = 'Logistica'
}

export interface User {
  id: string;
  name: string;
  email: string;
  institution_type: string;
  phone: string;
  role?: string;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: UserRole;
}

export interface CreateUserResponse {
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    enabled: boolean;
    created_at: string;
  };
}

export interface GetUsersResponse {
  message: string;
  data: {
    users: User[];
    pagination: Pagination;
  };
}
