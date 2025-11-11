import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
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
}
