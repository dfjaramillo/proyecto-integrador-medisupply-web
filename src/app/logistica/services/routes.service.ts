import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Route,
  CreateRouteRequest,
  CreateRouteResponse,
  RoutesListResponse,
  RouteDetailResponse,
  RouteDetail,
  TruckOption,
  ProductType
} from '../models/route.model';

@Injectable({
  providedIn: 'root'
})
export class RoutesService {
  private apiUrl = `${environment.apiUrl}/logistics/routes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de rutas con paginación
   */
  getRoutes(params?: {
    page?: number;
    per_page?: number;
    route_code?: string;
    assigned_truck?: string;
    delivery_date?: string;
    product_type?: string;
  }): Observable<RoutesListResponse['data']> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (
          params[key as keyof typeof params] !== null &&
          params[key as keyof typeof params] !== undefined &&
          params[key as keyof typeof params] !== ''
        ) {
          httpParams = httpParams.set(key, params[key as keyof typeof params]!.toString());
        }
      });
    }

    return this.http
      .get<RoutesListResponse>(this.apiUrl, { params: httpParams })
      .pipe(map((response) => response.data));
  }

  /**
   * Crea una nueva ruta de entrega
   */
  createRoute(data: CreateRouteRequest): Observable<Route> {
    return this.http
      .post<CreateRouteResponse>(this.apiUrl, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Obtiene el detalle completo de una ruta por ID incluyendo clientes
   */
  getRouteById(id: number): Observable<RouteDetail> {
    return this.http
      .get<RouteDetailResponse>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Obtiene la lista de camiones disponibles
   * Por ahora retorna opciones hardcodeadas según el prototipo
   */
  getAvailableTrucks(): Observable<TruckOption[]> {
    // En el futuro esto vendría del backend
    return new Observable(observer => {
      const trucks: TruckOption[] = [
        { plate: 'CAM-001', label: 'CAM-001' },
        { plate: 'CAM-002', label: 'CAM-002' },
        { plate: 'CAM-003', label: 'CAM-003' },
        { plate: 'CAM-004', label: 'CAM-004' },
        { plate: 'CAM-005', label: 'CAM-005' },
      ];
      observer.next(trucks);
      observer.complete();
    });
  }

  /**
   * Obtiene los tipos de productos disponibles
   */
  getProductTypes(): ProductType[] {
    return [
      ProductType.CADENA_FRIO,
      ProductType.ALTO_VALOR,
      ProductType.SEGURIDAD,
      ProductType.GENERAL
    ];
  }

  /**
   * Valida que un camión no tenga otra ruta en la misma fecha
   */
  validateTruckAvailability(truck: string, date: string, excludeRouteId?: number): Observable<boolean> {
    const params: any = {
      assigned_truck: truck,
      delivery_date: date
    };

    return this.getRoutes(params).pipe(
      map(data => {
        // Si no hay rutas, el camión está disponible
        if (!data.routes || data.routes.length === 0) {
          return true;
        }
        
        // Si hay rutas, verificar si alguna coincide (excluyendo la ruta actual si se está editando)
        const hasConflict = data.routes.some(route => 
          (!excludeRouteId || route.id !== excludeRouteId)
        );
        
        return !hasConflict;
      })
    );
  }
}
