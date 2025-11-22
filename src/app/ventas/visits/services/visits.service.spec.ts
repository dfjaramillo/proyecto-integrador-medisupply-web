import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VisitsService } from './visits.service';
import { environment } from '../../../../environments/environment';

describe('VisitsService', () => {
  let service: VisitsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(VisitsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe llamar endpoint con parámetros correctos y mapear respuesta', () => {
    service.getVideos(2, 10).subscribe(data => {
      expect(data.pagination.page).toBe(2);
      expect(data.videos.length).toBe(1);
    });

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/videos-processed` && r.params.get('page') === '2' && r.params.get('per_page') === '10');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      message: 'ok',
      data: {
        videos: [{ id: 1 }],
        pagination: { page: 2, per_page: 10, total: 1, total_pages: 1 }
      }
    });
  });

  it('debe incluir filtros opcionales en query params', () => {
    service.getVideos(1, 5, 'visit-123', 'Hospital', 'Procesado').subscribe();

    const req = httpMock.expectOne(r => {
      return r.url === `${environment.apiUrl}/videos-processed` &&
        r.params.get('page') === '1' &&
        r.params.get('per_page') === '5' &&
        r.params.get('visit_id') === 'visit-123' &&
        r.params.get('client_name') === 'Hospital' &&
        r.params.get('file_status') === 'Procesado';
    });
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'ok', data: { videos: [], pagination: { page: 1, per_page: 5, total: 0, total_pages: 0 } } });
  });

  it('no debe incluir filtros vacíos en query params', () => {
    service.getVideos(1, 5, '', '', '').subscribe();

    const req = httpMock.expectOne(r => {
      return r.url === `${environment.apiUrl}/videos-processed` &&
        r.params.get('page') === '1' &&
        r.params.get('per_page') === '5' &&
        !r.params.has('visit_id') &&
        !r.params.has('client_name') &&
        !r.params.has('file_status');
    });
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'ok', data: { videos: [], pagination: { page: 1, per_page: 5, total: 0, total_pages: 0 } } });
  });

  it('debe propagar error si backend falla', () => {
    let errorCaught: any;
    service.getVideos(1, 5).subscribe({
      error: (err) => errorCaught = err
    });
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/videos-processed`);
    req.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
    expect(errorCaught).toBeTruthy();
  });
});
