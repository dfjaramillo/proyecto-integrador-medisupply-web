import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  ProveedorCreateRequest, 
  ProveedorResponse, 
  ApiResponse, 
  ApiListResponse,
  ProveedoresListResponse
} from '../models/proveedor.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private apiUrl = `${environment.providersApiUrl}/providers`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de proveedores con paginación
   */
  getProveedores(params?: any): Observable<ProveedoresListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<ApiListResponse>(this.apiUrl, { params: httpParams }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtiene un proveedor por ID
   */
  getProveedorById(id: string): Observable<ProveedorResponse> {
    return this.http.get<ApiResponse<ProveedorResponse>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Crea un nuevo proveedor
   */
  createProveedor(proveedor: ProveedorCreateRequest): Observable<ProveedorResponse> {
    // Si hay logo, convertir a FormData
    if (proveedor.logo && proveedor.logo instanceof File) {
      const formData = new FormData();
      formData.append('name', proveedor.name);
      formData.append('email', proveedor.email);
      formData.append('phone', proveedor.phone);
      formData.append('logo', proveedor.logo);

      return this.http.post<ApiResponse<ProveedorResponse>>(this.apiUrl, formData).pipe(
        map(response => response.data)
      );
    }

    // Sin logo, enviar JSON
    return this.http.post<ApiResponse<ProveedorResponse>>(this.apiUrl, proveedor).pipe(
      map(response => response.data)
    );
  }

  /**
   * Actualiza un proveedor existente
   */
  updateProveedor(id: string, proveedor: Partial<ProveedorCreateRequest>): Observable<ProveedorResponse> {
    return this.http.put<ApiResponse<ProveedorResponse>>(`${this.apiUrl}/${id}`, proveedor).pipe(
      map(response => response.data)
    );
  }

  /**
   * Elimina un proveedor
   */
  deleteProveedor(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }
}
