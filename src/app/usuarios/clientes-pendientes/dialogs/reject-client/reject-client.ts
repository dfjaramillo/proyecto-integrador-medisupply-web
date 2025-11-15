import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';

export interface RejectClientData {
  client: User;
  sellerId: string;
}

@Component({
  selector: 'app-reject-client',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './reject-client.html',
  styleUrls: ['./reject-client.scss']
})
export class RejectClientComponent {
  private dialogRef = inject(MatDialogRef<RejectClientComponent>);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  justification = signal('');
  saving = signal(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: RejectClientData) {}

  get canSave(): boolean {
    const text = this.justification();
    return text.trim().length > 0 && text.length <= 500 && !this.saving();
  }

  onJustificationChange(event: Event): void {
    this.justification.set((event.target as HTMLTextAreaElement).value);
  }

  save(): void {
    if (!this.canSave) {
      return;
    }

    this.saving.set(true);
    this.userService.rejectClient(this.data.client.id, this.data.sellerId, this.data.client.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Usuario rechazado exitosamente.', 'Cerrar', {
          duration: 3000
        });
        this.dialogRef.close({ rejected: true });
      },
      error: (err) => {
        console.error('Error rejecting client', err);
        this.saving.set(false);
        this.snackBar.open('No se pudo rechazar el cliente. Intenta nuevamente.', 'Cerrar', {
          duration: 4000
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
