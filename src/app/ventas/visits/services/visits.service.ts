import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { VideosResponse } from '../models/visit.model';

@Injectable({
  providedIn: 'root'
})
export class VisitsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/videos-processed`;

  /**
   * Get processed videos with pagination and optional filters
   */
  getVideos(
    page: number = 1, 
    perPage: number = 5,
    visitId?: string,
    clientName?: string,
    fileStatus?: string,
    findings?: string
  ): Observable<VideosResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    // Add optional filters only if provided
    if (visitId?.trim()) {
      params = params.set('visit_id', visitId.trim());
    }
    if (clientName?.trim()) {
      params = params.set('client_name', clientName.trim());
    }
    if (fileStatus?.trim()) {
      params = params.set('file_status', fileStatus.trim());
    }
      if (findings?.trim()) {
        params = params.set('find', findings.trim());
      }

    return this.http.get<{ success: boolean; message: string; data: VideosResponse }>(
      this.apiUrl,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }
}
