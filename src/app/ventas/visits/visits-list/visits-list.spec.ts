import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { VisitsListComponent } from './visits-list';
import { VisitsService } from '../services/visits.service';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('VisitsListComponent', () => {
  let component: VisitsListComponent;
  let visitsService: jasmine.SpyObj<VisitsService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;

  function createVideos(count: number) {
    return Array.from({ length: count }).map((_, i) => ({
      id: i + 1,
      visit_id: `V${i + 1}`,
      name: `Cliente ${i + 1}`,
      file_status: i % 2 === 0 ? 'Procesado' : 'En curso',
      find: `Hallazgo ${i + 1}`,
      filename_url: i % 2 === 0 ? `https://example.com/video${i + 1}.mp4` : null,
      filename_url_processed: i % 2 === 0 ? `https://example.com/video${i + 1}-processed.mp4` : null
    }));
  }

  beforeEach(() => {
    visitsService = jasmine.createSpyObj('VisitsService', ['getVideos']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [VisitsListComponent, NoopAnimationsModule],
      providers: [
        { provide: VisitsService, useValue: visitsService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
        provideZonelessChangeDetection()
      ]
    });

    component = TestBed.createComponent(VisitsListComponent).componentInstance;
  });

  it('debe cargar videos en ngOnInit', () => {
    const videos = createVideos(5);
    visitsService.getVideos.and.returnValue(of({
      videos,
      pagination: { page: 1, per_page: 5, total: 10, total_pages: 2 }
    }));
    component.ngOnInit();
    expect(visitsService.getVideos).toHaveBeenCalledWith(1, 5);
    expect(component.videos().length).toBe(5);
    expect(component.pagination().total).toBe(10);
    expect(component.loading()).toBeFalse();
  });

  it('debe manejar error al cargar videos', () => {
    // Reemplazar snackBar por un mock directo para evitar internals
    (component as any).snackBar = { open: jasmine.createSpy('open') };
    visitsService.getVideos.and.returnValue(throwError(() => new Error('Network error')));
    component.loadVideos();
    expect((component as any).snackBar.open).toHaveBeenCalled();
    expect(component.loading()).toBeFalse();
  });

  it('pageNumbers total=0 debe retornar []', () => {
    component.pagination.set({ page: 1, per_page: 5, total: 0, total_pages: 0 });
    expect(component.pageNumbers).toEqual([]);
  });

  it('pageNumbers con pocas páginas', () => {
    component.pagination.set({ page: 1, per_page: 5, total: 10, total_pages: 2 });
    expect(component.pageNumbers).toEqual([1, 2]);
  });

  it('pageNumbers en página intermedia muestra elipsis', () => {
    component.pagination.set({ page: 5, per_page: 5, total: 100, total_pages: 20 });
    const pages = component.pageNumbers;
    expect(pages[0]).toBe(1);
    expect(pages).toContain(-1); // primera elipsis
    expect(pages).toContain(-2); // segunda elipsis
    expect(pages[pages.length - 1]).toBe(20);
  });

  it('previousPage debe decrementar página si >1', () => {
    component.pagination.set({ page: 2, per_page: 5, total: 10, total_pages: 2 });
    visitsService.getVideos.and.returnValue(of({ videos: [], pagination: { page: 1, per_page: 5, total: 10, total_pages: 2 } }));
    component.previousPage();
    expect(component.pagination().page).toBe(1);
  });

  it('previousPage no decrementa si está en 1', () => {
    component.pagination.set({ page: 1, per_page: 5, total: 10, total_pages: 2 });
    component.previousPage();
    expect(component.pagination().page).toBe(1);
  });

  it('nextPage debe incrementar página si < total_pages', () => {
    component.pagination.set({ page: 1, per_page: 5, total: 10, total_pages: 2 });
    visitsService.getVideos.and.returnValue(of({ videos: [], pagination: { page: 2, per_page: 5, total: 10, total_pages: 2 } }));
    component.nextPage();
    expect(component.pagination().page).toBe(2);
  });

  it('nextPage no incrementa si está en última página', () => {
    component.pagination.set({ page: 2, per_page: 5, total: 10, total_pages: 2 });
    component.nextPage();
    expect(component.pagination().page).toBe(2);
  });

  it('goToPage dentro de rango carga videos', () => {
    visitsService.getVideos.and.returnValue(of({ videos: [], pagination: { page: 2, per_page: 5, total: 10, total_pages: 2 } }));
    component.goToPage(2);
    expect(visitsService.getVideos).toHaveBeenCalledWith(2, 5);
    expect(component.pagination().page).toBe(2);
  });

  it('goToPage fuera de rango no cambia página', () => {
    component.pagination.set({ page: 1, per_page: 5, total: 10, total_pages: 2 });
    component.goToPage(3);
    expect(component.pagination().page).toBe(1);
  });

  it('onSearchChange reinicia a página 1', () => {
    component.pagination.set({ page: 2, per_page: 5, total: 10, total_pages: 2 });
    component.onSearchChange();
    expect(component.pagination().page).toBe(1);
  });

  it('openVideoDialog llama dialog.open si hay video disponible', () => {
    const video: any = { filename_url: 'x.mp4' };
    (component as any).dialog = { open: jasmine.createSpy('open') };
    component.openVideoDialog(video);
    expect((component as any).dialog.open).toHaveBeenCalled();
  });

  it('openVideoDialog no llama dialog.open si no hay video', () => {
    const video: any = { filename_url: undefined };
    component.openVideoDialog(video);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('isVideoAvailable retorna true si filename_url existe', () => {
    expect(component.isVideoAvailable({ filename_url: 'a' } as any)).toBeTrue();
  });

  it('isVideoAvailable retorna false si filename_url no existe', () => {
    expect(component.isVideoAvailable({} as any)).toBeFalse();
  });
});
