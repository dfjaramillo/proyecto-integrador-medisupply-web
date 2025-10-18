export interface Proveedor {
  id?: string;
  name: string;
  email: string;
  phone: string;
  logo?: string;
  logo_filename?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProveedorCreateRequest {
  name: string;
  email: string;
  phone: string;
  logo?: File | string;
}

export interface ProveedorResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo_filename: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
}

// Respuesta del API (sin success field)
export interface ApiResponse<T> {
  message: string;
  data: T;
}

// Para la lista de proveedores
export interface ApiListResponse {
  message: string;
  data: {
    providers: ProveedorResponse[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
      next_page: number | null;
      prev_page: number | null;
    };
  };
}

export interface ProveedoresListResponse {
  providers: ProveedorResponse[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    next_page: number | null;
    prev_page: number | null;
  };
}
