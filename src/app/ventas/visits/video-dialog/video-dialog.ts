import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Video } from '../models/visit.model';

@Component({
  selector: 'app-video-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './video-dialog.html',
  styleUrls: ['./video-dialog.scss']
})
export class VideoDialogComponent {
  safeUrl: SafeResourceUrl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public video: Video,
    private dialogRef: MatDialogRef<VideoDialogComponent>,
    private sanitizer: DomSanitizer
  ) {
    // Use processed video if available, otherwise use original
    const videoUrl = video.filename_url_processed || video.filename_url || '';
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
  }

  close(): void {
    this.dialogRef.close();
  }
}
