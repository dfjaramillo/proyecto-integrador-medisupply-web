import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { SalesPlan } from '../../models/sales-plan.model';

@Component({
  selector: 'app-sales-plan-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './sales-plan-detail.html',
  styleUrls: ['./sales-plan-detail.scss']
})
export class SalesPlanDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<SalesPlanDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public plan: SalesPlan
  ) {}

  /**
   * Formatea la fecha para mostrar (Ene 15, 2026)
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day < 10 ? '0' + day : day}, ${year}`;
  }

  /**
   * Formatea el valor monetario ($30.266.999)
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(value);
  }

  /**
   * Cierra el diálogo
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
