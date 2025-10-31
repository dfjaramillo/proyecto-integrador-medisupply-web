import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  SalesPlan,
  SalesPlanListResponse,
  SalesPlanDetailResponse,
} from '../models/sales-plan.model';

@Injectable({
  providedIn: 'root',
})
export class SalesPlanService {
  private apiUrl = `${environment.apiUrl}/sales-plan`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de planes de ventas con paginación y filtros
   */
  getSalesPlans(params?: {
    page?: number;
    per_page?: number;
    seller_id?: string;
    client_id?: string;
    name?: string;
    start_date?: string;
    end_date?: string;
  }): Observable<SalesPlanListResponse['data']> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<SalesPlanListResponse>(this.apiUrl, { params: httpParams })
      .pipe(map((response) => response.data));
  }

  /**
   * Obtiene el detalle de un plan de ventas por ID
   */
  getSalesPlanById(id: number): Observable<SalesPlan> {
    return this.http
      .get<SalesPlanDetailResponse>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }
}
