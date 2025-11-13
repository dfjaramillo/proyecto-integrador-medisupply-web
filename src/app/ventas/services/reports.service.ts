import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface MonthlyReportResponse {
  success: boolean;
  message: string;
  data: {
    period: {
      start_date: string;
      end_date: string;
      months: number;
    };
    summary: {
      total_orders: number;
      total_amount: number;
      months_with_data: number;
      average_orders_per_month: number;
      average_amount_per_month: number;
    };
    monthly_data: Array<{
      year: number;
      month: number;
      month_name: string;
      month_short: string;
      label: string;
      orders_count: number;
      total_amount: number;
    }>;
  };
}

export interface TopClientsResponse {
  success: boolean;
  message: string;
  data: {
    period: {
      start_date: string;
      end_date: string;
      months: number;
    };
    top_clients: Array<{
      client_id: string;
      orders_count: number;
      client_name: string;
    }>;
  };
}

export interface TopProductsResponse {
  success: boolean;
  message: string;
  data: {
    top_products: Array<{
      product_id: number;
      total_sold: number;
      product_name: string;
    }>;
  };
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getMonthlyReport(params?: { start_date?: string; end_date?: string; months?: number }): Observable<MonthlyReportResponse['data']> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '')
          httpParams = httpParams.set(key, String(value));
      });
    }

    // If backend is not ready, use local mock JSON (also used as graceful fallback on error)
    const mockUrl = `/mocks/reports/monthly.json`;

    const real$ = this.http.get<MonthlyReportResponse>(`${this.baseUrl}/orders/reports/monthly`, { params: httpParams });
    return real$
      .pipe(
        catchError(() => this.http.get<MonthlyReportResponse>(mockUrl)),
        map(r => r.data)
      );
  }

  /**
   * Fetch TOP clients report (last semester or backend default period).
   * Maps directly to the raw backend response data.top_clients.
   */
  getTopClients(params?: { start_date?: string; end_date?: string; months?: number }): Observable<TopClientsResponse['data']['top_clients']> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http
      .get<TopClientsResponse>(`${this.baseUrl}/orders/reports/top-clients`, { params: httpParams })
      .pipe(
        // On failure just return empty list so the rest of the dashboard can still render
        catchError(err => {
          console.error('Error fetching top clients report', err);
          return of({ success: false, message: 'fallback', data: { period: { start_date: '', end_date: '', months: 0 }, top_clients: [] } } as TopClientsResponse);
        }),
        map(r => r.data.top_clients)
      );
  }

  /**
   * Fetch TOP products report and map response.
   */
  getTopProducts(params?: { start_date?: string; end_date?: string; months?: number }): Observable<TopProductsResponse['data']['top_products']> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http
      .get<TopProductsResponse>(`${this.baseUrl}/orders/reports/top-products`, { params: httpParams })
      .pipe(
        catchError(err => {
          console.error('Error fetching top products report', err);
          return of({ success: false, message: 'fallback', data: { top_products: [] } } as TopProductsResponse);
        }),
        map(r => r.data.top_products)
      );
  }
}
