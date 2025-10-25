import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventarioService } from '../../services/inventario.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-cargue-masivo',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './cargue-masivo.html',
  styleUrls: ['./cargue-masivo.scss'],
})
export class CargueMasivoComponent {
  private dialogRef = inject(MatDialogRef<CargueMasivoComponent>);
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  uploadError = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  selectedFile: File | null = null;

  /**
   * Download template file
   */
  downloadTemplate(): void {
    // Path to the template file in public folder
    const templatePath = '/files/productos_cargue_plantilla.csv';
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = templatePath;
    link.download = 'productos_cargue_plantilla.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.snackBar.open('Plantilla descargada exitosamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isValidExtension = ['csv', 'xlsx', 'xls'].includes(
        fileExtension || ''
      );

      if (!validTypes.includes(file.type) && !isValidExtension) {
        this.uploadError.set(
          'Por favor seleccione un archivo CSV o Excel válido'
        );
        this.selectedFile = null;
        input.value = '';
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.uploadError.set('El archivo no debe superar los 10MB');
        this.selectedFile = null;
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.uploadError.set(null);
      this.successMessage.set(null);
    }
  }

  /**
   * Format file size to human readable
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Remove selected file
   */
  removeFile(): void {
    this.selectedFile = null;
    this.uploadError.set(null);
    this.successMessage.set(null);
  }

  /**
   * Submit file upload
   */
  onSubmit(): void {
    if (!this.selectedFile) {
      this.uploadError.set('Por favor seleccione un archivo');
      return;
    }

    this.loading.set(true);
    this.uploadError.set(null);
    this.successMessage.set(null);

    const userId = this.authService.getUserId();

    if (!userId) {
      this.loading.set(false);
      this.uploadError.set('No se pudo obtener el ID de usuario');
      return;
    }

    this.inventarioService
      .uploadProductsFile(userId, this.selectedFile)
      .subscribe({
        next: (response: {
          success: boolean;
          message: string;
          data: { history_id: string };
        }) => {
          this.loading.set(false);
          this.successMessage.set('Archivo cargado exitosamente');

          this.snackBar.open('Archivo cargado exitosamente', 'Cerrar', {
            duration: 4000,
            panelClass: ['success-snackbar'],
          });

          // Close dialog after 2 seconds
          setTimeout(() => {
            this.dialogRef.close('uploaded');
          }, 2000);
        },
        error: (error: any) => {
          this.loading.set(false);
          console.error('Error uploading file:', error);

          const errorMessage =
            error.error?.details ||
            error.error?.message ||
            'Error al cargar el archivo, vuelva a intentarlo';
          this.uploadError.set(errorMessage);

          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
