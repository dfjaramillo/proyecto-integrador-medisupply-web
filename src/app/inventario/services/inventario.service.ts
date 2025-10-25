import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Producto,
  ProductoCreateRequest,
  ProductoResponse,
  ApiResponse,
  ApiListResponse,
  ProductosListResponse,
  Provider,
  ProvidersResponse,
  UploadHistoryResponse,
  ApiUploadHistoryResponse,
} from '../models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private apiUrl = `${environment.apiUrl}/inventory/products`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de productos con paginación
   */
  getProductos(params?: any): Observable<ProductosListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== undefined &&
          params[key] !== ''
        ) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http
      .get<ApiListResponse>(this.apiUrl, { params: httpParams })
      .pipe(map((response) => response.data));
  }

  /**
   * Obtiene un producto por ID
   */
  getProductoById(id: string): Observable<ProductoResponse> {
    return this.http
      .get<ApiResponse<ProductoResponse>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Crea un nuevo producto
   */
  createProducto(
    producto: ProductoCreateRequest
  ): Observable<ProductoResponse> {
    // Si hay foto, convertir a FormData
    if (producto.photo && producto.photo instanceof File) {
      const formData = new FormData();
      formData.append('sku', producto.sku);
      formData.append('name', producto.name);
      formData.append('expiration_date', producto.expiration_date);
      formData.append('quantity', producto.quantity.toString());
      formData.append('price', producto.price.toString());
      formData.append('location', producto.location);
      formData.append('description', producto.description);
      formData.append('product_type', producto.product_type);
      formData.append('provider_id', producto.provider_id);
      formData.append('photo', producto.photo);

      return this.http
        .post<ApiResponse<ProductoResponse>>(this.apiUrl, formData)
        .pipe(map((response) => response.data));
    }

    // Sin foto, enviar JSON
    return this.http
      .post<ApiResponse<ProductoResponse>>(this.apiUrl, producto)
      .pipe(map((response) => response.data));
  }

  /**
   * Actualiza un producto existente
   */
  updateProducto(
    id: string,
    producto: Partial<ProductoCreateRequest>
  ): Observable<ProductoResponse> {
    return this.http
      .put<ApiResponse<ProductoResponse>>(`${this.apiUrl}/${id}`, producto)
      .pipe(map((response) => response.data));
  }

  /**
   * Elimina un producto
   */
  deleteProducto(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  /**
   * Filtra productos por múltiples criterios
   */
  filterProductos(filters: {
    sku?: string;
    name?: string;
    quantity?: string;
    price?: string;
    location?: string;
    expiration_date?: string;
  }): Observable<ProductosListResponse> {
    let httpParams = new HttpParams();

    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof typeof filters];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http
      .get<ApiListResponse>(`${this.apiUrl}/filter`, { params: httpParams })
      .pipe(map((response) => response.data));
  }

  /**
   * Obtiene la lista de proveedores
   */
  getProviders(): Observable<Provider[]> {
    return this.http
      .get<{ message: string; data: ProvidersResponse }>(
        `${environment.apiUrl}/providers`
      )
      .pipe(map((response) => response.data.providers));
  }

  /**
   * Carga masiva de productos mediante archivo
   */
  uploadProductsFile(
    userId: string,
    file: File
  ): Observable<{
    success: boolean;
    message: string;
    data: { history_id: string };
  }> {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('file', file);

    return this.http.post<{
      success: boolean;
      message: string;
      data: { history_id: string };
    }>(`${environment.apiUrl}/inventory/products/import`, formData);
  }

  /**
   * Obtiene el historial de cargues masivos
   */
  getUploadHistory(page: number = 1, perPage: number = 5): Observable<UploadHistoryResponse> {
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http
      .get<ApiUploadHistoryResponse>(`${environment.apiUrl}/inventory/products/history`, { params: httpParams })
      .pipe(map((response) => response.data));
  }
}
