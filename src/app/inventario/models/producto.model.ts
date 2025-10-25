import { Pagination } from '../../shared/models/pagination.model';

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
  pagination: Pagination;
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

// Respuesta envuelta del API para un solo producto
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Respuesta para la lista de productos con paginación
export interface ProductosListResponse {
  products: ProductoResponse[];
  pagination: Pagination;
}

// Para la lista de productos
export interface ApiListResponse {
  success: boolean;
  message: string;
  data: ProductosListResponse;
}

// Historial de cargue masivo
export interface UploadHistoryRecord {
  id: string;
  file_name: string;
  created_at: string;
  status: string;
  result: string;
  user: string;
}

export interface UploadHistoryResponse {
  history: UploadHistoryRecord[];
  pagination: Pagination;
}

export interface ApiUploadHistoryResponse {
  success: boolean;
  message: string;
  data: UploadHistoryResponse;
}
