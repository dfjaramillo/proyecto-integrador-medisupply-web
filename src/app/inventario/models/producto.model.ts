export interface Producto {
  id?: string;
  sku: string;
  name: string;
  expiration_date: Date | string;
  quantity: number;
  price: number;
  location: string;
  description: string;
  product_type: TipoProducto;
  provider_id?: string;
  photo?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export type TipoProducto = 'Cadena fría' | 'Seguridad' | 'Alto valor';

export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo_filename: string;
  logo_url: string;
}

export interface ProvidersResponse {
  providers: Provider[];
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

export interface ProductoCreateRequest {
  sku: string;
  name: string;
  expiration_date: string;
  quantity: number;
  price: number;
  location: string;
  description: string;
  product_type: TipoProducto;
  provider_id: string;
  photo?: File | string;
}

export interface ProductoResponse {
  id: number;
  sku: string;
  name: string;
  expiration_date: string;
  quantity: number;
  price: number;
  location: string;
  description: string;
  product_type: TipoProducto;
  provider_id: string;
  photo_filename?: string | null;
  photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Respuesta envuelta del API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Para la lista de productos
export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
}
