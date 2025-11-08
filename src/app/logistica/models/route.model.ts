import { Pagination } from '../../shared/models/pagination.model';

/**
 * Tipos de productos que puede transportar un camión
 */
export enum ProductType {
  CADENA_FRIO = 'Cadena de frío',
  ALTO_VALOR = 'Alto valor',
  SEGURIDAD = 'Seguridad',
  GENERAL = 'General'
}

/**
 * Interface para un cliente en la ruta
 */
export interface RouteClient {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
}

/**
 * Interface para una ruta de entrega
 */
export interface Route {
  id: number;
  route_code: string;
  assigned_truck: string;
  delivery_date: string;
  orders_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para el detalle completo de una ruta con clientes
 */
export interface RouteDetail {
  route: Route;
  clients: RouteClient[];
}

/**
 * Response del detalle de una ruta
 */
export interface RouteDetailResponse {
  success: boolean;
  message: string;
  data: RouteDetail;
}

/**
 * Interface para crear una nueva ruta
 */
export interface CreateRouteRequest {
  assigned_truck: string;
  delivery_date: string;
}

/**
 * Response al crear una ruta
 */
export interface CreateRouteResponse {
  success: boolean;
  message: string;
  data: Route;
}

/**
 * Response de listado de rutas con paginación
 */
export interface RoutesListResponse {
  success: boolean;
  message: string;
  data: {
    routes: Route[];
    pagination: Pagination;
  };
}

/**
 * Opciones de camiones disponibles
 */
export interface TruckOption {
  plate: string;
  label: string;
  order_id?: string;
}
