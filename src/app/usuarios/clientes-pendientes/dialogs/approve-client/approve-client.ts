import { Component, Inject, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

export interface ApproveClientData {
  client: User;
}

@Component({
  selector: 'app-approve-client',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './approve-client.html',
  styleUrls: ['./approve-client.scss']
})
export class ApproveClientComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ApproveClientComponent>);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  constructor(@Inject(MAT_DIALOG_DATA) public data: ApproveClientData) {}

  loadingSellers = signal(false);
  saving = signal(false);
  sellers = signal<User[]>([]);
  selectedSellerId = signal<string | null>(null);

  @ViewChild('loadSellersError', { static: true }) loadSellersError!: ElementRef<HTMLElement>;
  @ViewChild('approvedSnack', { static: true }) approvedSnack!: ElementRef<HTMLElement>;
  @ViewChild('approveErrorSnack', { static: true }) approveErrorSnack!: ElementRef<HTMLElement>;
  @ViewChild('closeAction', { static: true }) closeAction!: ElementRef<HTMLElement>;

  // For capacity / suggestion we will plug assigned-clients later if needed
  ngOnInit(): void {
    this.loadSellers();
  }

  get canSave(): boolean {
    return !!this.selectedSellerId() && !this.saving();
  }

  private loadSellers(): void {
    this.loadingSellers.set(true);
    this.userService.getSellers().subscribe({
      next: (users) => {
        this.sellers.set(users);
        this.loadingSellers.set(false);
      },
      error: (err) => {
        console.error('Error loading sellers', err);
        this.loadingSellers.set(false);
        this.snackBar.open(this.loadSellersError.nativeElement.textContent!.trim(), this.closeAction.nativeElement.textContent!.trim(), {
          duration: 4000
        });
      }
    });
  }

  onSellerChange(value: string): void {
    this.selectedSellerId.set(value);
  }

  save(): void {
    const sellerId = this.selectedSellerId();
    if (!sellerId) {
      return;
    }

    this.saving.set(true);
    this.userService.assignClientToSeller(sellerId, this.data.client.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(this.approvedSnack.nativeElement.textContent!.trim(), this.closeAction.nativeElement.textContent!.trim(), {
          duration: 3000
        });
        this.dialogRef.close({ approved: true, sellerId });
      },
      error: (err) => {
        console.error('Error assigning client', err);
        this.saving.set(false);
        this.snackBar.open(this.approveErrorSnack.nativeElement.textContent!.trim(), this.closeAction.nativeElement.textContent!.trim(), {
          duration: 4000
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
