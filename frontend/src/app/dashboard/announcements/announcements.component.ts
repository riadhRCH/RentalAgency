import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AnnouncementsService, Announcement } from '../../services/announcements.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, TranslatePipe],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss',
})
export class AnnouncementsComponent implements OnInit {
  private readonly announcementsService = inject(AnnouncementsService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  announcements: Announcement[] = [];
  loading = signal(true);
  processingId = signal<string | null>(null);

  ngOnInit() {
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.loading.set(true);
    this.announcementsService.getAgencyAnnouncements().subscribe({
      next: announcements => {
        this.announcements = announcements;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToProperties() {
    this.router.navigate(['/dashboard/properties']);
  }

  setProcessing(id: string | null) {
    this.processingId.set(id);
  }

  toggleVisibility(announcement: Announcement) {
    this.setProcessing(announcement._id);
    this.announcementsService
      .updateVisibility(announcement._id, !announcement.isVisible)
      .subscribe({
        next: updated => {
          this.announcements = this.announcements.map(item =>
            item._id === updated._id ? updated : item,
          );
          this.setProcessing(null);
        },
        error: () => this.setProcessing(null),
      });
  }

  refreshAnnouncement(announcement: Announcement) {
    this.setProcessing(announcement._id);
    this.announcementsService.refreshAnnouncement(announcement._id).subscribe({
      next: updated => {
        this.announcements = this.announcements.map(item =>
          item._id === updated._id ? updated : item,
        );
        this.setProcessing(null);
      },
      error: () => this.setProcessing(null),
    });
  }

  deleteAnnouncement(announcement: Announcement) {
    if (!confirm(this.i18n.translate('CONFIRM.DELETE_ANNOUNCEMENT'))) {
      return;
    }

    this.setProcessing(announcement._id);
    this.announcementsService.deleteAnnouncement(announcement._id).subscribe({
      next: () => {
        this.announcements = this.announcements.filter(item => item._id !== announcement._id);
        this.setProcessing(null);
      },
      error: () => this.setProcessing(null),
    });
  }
}
