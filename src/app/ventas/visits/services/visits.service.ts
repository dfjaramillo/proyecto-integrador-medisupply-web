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
   * Get processed videos with pagination
   */
  getVideos(page: number = 1, perPage: number = 5): Observable<VideosResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<{ success: boolean; message: string; data: VideosResponse }>(
      this.apiUrl,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }
}
