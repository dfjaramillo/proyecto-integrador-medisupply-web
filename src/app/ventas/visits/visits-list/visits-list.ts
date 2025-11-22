import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { VisitsService } from '../services/visits.service';
import { Video, Pagination } from '../models/visit.model';
import { VideoDialogComponent } from '../video-dialog/video-dialog';

@Component({
  selector: 'app-visits-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './visits-list.html',
  styleUrls: ['./visits-list.scss']
})
export class VisitsListComponent implements OnInit, OnDestroy {
  private visitsService = inject(VisitsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  videos = signal<Video[]>([]);
  pagination = signal<Pagination>({ page: 1, per_page: 5, total: 0, total_pages: 0 });
  loading = signal(false);

  // Search filters
  searchId = '';
  searchClient = '';
  searchStatus = '';
  searchFindings = '';

  // Debounced subjects for inputs
  private searchId$ = new Subject<string>();
  private searchClient$ = new Subject<string>();
  private searchStatus$ = new Subject<string>();
  private searchFindings$ = new Subject<string>();
  private subscriptions: Subscription[] = [];

  displayedColumns: string[] = ['id_visita', 'cliente', 'estado', 'hallazgos', 'evidencia'];

  // Math utility for template
  Math = Math;

  ngOnInit(): void {
    // Subscribe to debounced inputs
    this.subscriptions.push(
      this.searchId$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        this.searchId = value;
        this.pagination.set({ ...this.pagination(), page: 1 });
        this.loadVideos();
      }) as unknown as Subscription
    );

    this.subscriptions.push(
      this.searchClient$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        this.searchClient = value;
        this.pagination.set({ ...this.pagination(), page: 1 });
        this.loadVideos();
      }) as unknown as Subscription
    );

    this.subscriptions.push(
      this.searchStatus$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        this.searchStatus = value;
        this.pagination.set({ ...this.pagination(), page: 1 });
        this.loadVideos();
      }) as unknown as Subscription
    );

    this.subscriptions.push(
      this.searchFindings$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(value => {
        this.searchFindings = value;
        this.pagination.set({ ...this.pagination(), page: 1 });
        this.loadVideos();
      }) as unknown as Subscription
    );

    // Initial load
    this.loadVideos();
  }

  loadVideos(): void {
    this.loading.set(true);
    const currentPage = this.pagination().page;
    const perPage = this.pagination().per_page;

    this.visitsService.getVideos(
      currentPage, 
      perPage,
      this.searchId,
      this.searchClient,
      this.searchStatus,
      this.searchFindings
      
    ).subscribe({
      next: (response) => {
        this.videos.set(response.videos);
        this.pagination.set(response.pagination);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading videos:', error);
        this.snackBar.open('Error al cargar las visitas', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  onSearchChange(): void {
    // This method is now deprecated, replaced by debounced subjects
    // Reset to first page when search changes
    this.pagination.set({ ...this.pagination(), page: 1 });
    // Load videos with the current filters
    this.loadVideos();
  }

  onSearchIdChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchId$.next(value);
  }

  onSearchClientChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchClient$.next(value);
  }

  onSearchStatusChange(value: string): void {
    this.searchStatus$.next(value);
  }

  onSearchFindingsChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchFindings$.next(value);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination().total_pages) {
      this.pagination.set({ ...this.pagination(), page });
      this.loadVideos();
    }
  }

  previousPage(): void {
    const currentPage = this.pagination().page;
    if (currentPage > 1) {
      this.goToPage(currentPage - 1);
    }
  }

  nextPage(): void {
    const currentPage = this.pagination().page;
    const totalPages = this.pagination().total_pages;
    if (currentPage < totalPages) {
      this.goToPage(currentPage + 1);
    }
  }

  get pageNumbers(): number[] {
    const total = this.pagination().total_pages;
    const current = this.pagination().page;
    const delta = 2;
    const pages: number[] = [];

    if (total <= 0) return [];

    pages.push(1);

    let start = Math.max(2, current - delta);
    let end = Math.min(total - 1, current + delta);

    if (current <= delta + 2) {
      end = Math.min(total - 1, delta * 2 + 2);
    }

    if (current >= total - delta - 1) {
      start = Math.max(2, total - delta * 2 - 1);
    }

    if (start > 2) {
      pages.push(-1); // ellipsis
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) {
      pages.push(-2); // ellipsis
    }

    if (total > 1) {
      pages.push(total);
    }

    return pages;
  }

  openVideoDialog(video: Video): void {
    if (!video.filename_url) return;

    this.dialog.open(VideoDialogComponent, {
      width: '80vw',
      maxWidth: '1200px',
      data: video
    });
  }

  isVideoAvailable(video: Video): boolean {
    return !!video.filename_url;
  }
}
