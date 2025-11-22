import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  StatusSummaryResponse,
  StatusSummaryData,
  ClientsSummaryResponse,
  ClientsSummaryData,
  MonthlySummaryResponse,
  MonthlySummaryData
} from '../models/seller-report.model';

@Injectable({ providedIn: 'root' })
export class SellerReportsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Get status summary report for a seller (Donut chart data)
   * Shows distribution of orders by status for clients assigned to the seller
   */
  getStatusSummary(sellerId: string): Observable<StatusSummaryData> {
    const params = new HttpParams().set('seller_id', sellerId);
    
    return this.http
      .get<StatusSummaryResponse>(`${this.baseUrl}/orders/informes/seller/status-summary`, { params })
      .pipe(map(response => response.data));
  }

  /**
   * Get clients summary report for a seller (Earnings table data)
   * Shows total earnings per client assigned to the seller
   */
  getClientsSummary(sellerId: string, page: number = 1, perPage: number = 10): Observable<ClientsSummaryData> {
    const params = new HttpParams()
      .set('seller_id', sellerId)
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    
    return this.http
      .get<ClientsSummaryResponse>(`${this.baseUrl}/orders/informes/seller/clients-summary`, { params })
      .pipe(map(response => response.data));
  }

  /**
   * Get monthly summary report for a seller (Line chart data)
   * Shows total sales per month for the last 12 months
   */
  getMonthlySummary(sellerId: string): Observable<MonthlySummaryData> {
    const params = new HttpParams().set('seller_id', sellerId);
    
    return this.http
      .get<MonthlySummaryResponse>(`${this.baseUrl}/orders/informes/seller/monthly`, { params })
      .pipe(map(response => response.data));
  }
}
