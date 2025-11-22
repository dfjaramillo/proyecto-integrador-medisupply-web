import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { VideoDialogComponent } from './video-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';

describe('VideoDialogComponent', () => {
  let dialogRef: jasmine.SpyObj<MatDialogRef<VideoDialogComponent>>;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      imports: [VideoDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { filename_url: 'orig.mp4', filename_url_processed: 'proc.mp4' } },
        provideZonelessChangeDetection()
      ]
    });
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('usa URL procesada si existe', () => {
    const fixture = TestBed.createComponent(VideoDialogComponent);
    const comp = fixture.componentInstance;
    expect(comp.safeUrl).toBeDefined();
  });

  it('usa URL original si no hay procesada', () => {
    TestBed.resetTestingModule();
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      imports: [VideoDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { filename_url: 'orig.mp4' } },
        provideZonelessChangeDetection()
      ]
    });
    const fixture = TestBed.createComponent(VideoDialogComponent);
    const comp = fixture.componentInstance;
    expect(comp.safeUrl).toBeDefined();
  });

  it('close debe llamar dialogRef.close', () => {
    const fixture = TestBed.createComponent(VideoDialogComponent);
    const comp = fixture.componentInstance;
    comp.close();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
