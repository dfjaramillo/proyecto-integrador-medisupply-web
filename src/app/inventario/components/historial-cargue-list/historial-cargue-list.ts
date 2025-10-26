import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventarioService } from '../../services/inventario.service';
import { UploadHistoryRecord } from '../../models/producto.model';
import { Pagination } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-historial-cargue-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './historial-cargue-list.html',
  styleUrls: ['./historial-cargue-list.scss']
})
export class HistorialCargueListComponent implements OnInit {
  uploadHistory = signal<UploadHistoryRecord[]>([]);
  historyLoading = signal(false);
  historyPagination = signal<Pagination | null>(null);
  historyCurrentPage = 1;
  historyPageSize = 5;

  // Expose Math for template
  Math = Math;

  historyColumns: string[] = [
    'file_name',
    'created_at',
    'status',
    'result',
    'user'
  ];

  constructor(
    private inventarioService: InventarioService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUploadHistory();
  }

  /**
   * Carga el historial de cargues masivos
   */
  loadUploadHistory(): void {
    this.historyLoading.set(true);
    
    this.inventarioService
      .getUploadHistory(this.historyCurrentPage, this.historyPageSize)
      .subscribe({
        next: (response) => {
          this.uploadHistory.set(response.history);
          this.historyPagination.set(response.pagination);
          this.historyLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading upload history:', error);
          this.historyLoading.set(false);
          this.snackBar.open('Error al cargar el historial', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Navega a una página específica del historial
   */
  goToHistoryPage(page: number): void {
    const totalPages = this.historyPagination()?.total_pages || 0;
    if (page >= 1 && page <= totalPages) {
      this.historyCurrentPage = page;
      this.loadUploadHistory();
    }
  }

  /**
   * Obtiene los números de página para el historial
   */
  get historyPageNumbers(): number[] {
    const totalPages = this.historyPagination()?.total_pages || 0;
    const current = this.historyCurrentPage;
    const delta = 2;
    const pages: number[] = [];

    if (totalPages > 0) {
      pages.push(1);
    }

    let start = Math.max(2, current - delta);
    let end = Math.min(totalPages - 1, current + delta);

    if (current <= delta + 2) {
      end = Math.min(totalPages - 1, delta * 2 + 2);
    }

    if (current >= totalPages - delta - 1) {
      start = Math.max(2, totalPages - delta * 2 - 1);
    }

    if (start > 2) {
      pages.push(-1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push(-2);
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }

  /**
   * Formatea la fecha del historial
   */
  formatHistoryDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
