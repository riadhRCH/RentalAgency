import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertiesService, Property } from '../../services/properties.service';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { AnnouncementsService, Announcement } from '../../services/announcements.service';

@Component({
  selector: 'app-properties-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, TranslatePipe],
  templateUrl: './properties-mgmt.component.html',
  styleUrls: ['./properties-mgmt.component.scss']
})
export class PropertiesMgmtComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private announcementsService = inject(AnnouncementsService);
  private router = inject(Router);
  readonly i18n = inject(I18nService);

  properties: Property[] = [];
  announcementsByPropertyId: Record<string, Announcement> = {};
  loading = signal(true);
  generatingAnnouncementId = signal<string | null>(null);
  currentPage = 1;
  totalPages = 1;
  typeFilter = '';

  ngOnInit() {
    this.loadProperties();
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.announcementsService.getAgencyAnnouncements().subscribe({
      next: announcements => {
        this.announcementsByPropertyId = announcements.reduce<Record<string, Announcement>>(
          (acc, announcement) => {
            acc[announcement.propertyId] = announcement;
            return acc;
          },
          {},
        );
      },
    });
  }

  loadProperties(page = 1) {
    this.loading.set(true);
    this.propertiesService.getProperties(page, 10, { type: this.typeFilter || undefined }).subscribe({
      next: (res) => {
        this.properties = res?.data || [];
        this.totalPages = res?.totalPages || 1;
        this.currentPage = res?.page || 1;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }

  onFilterChange() {
    this.loadProperties(1);
  }

  clearFilter() {
    this.typeFilter = '';
    this.loadProperties(1);
  }

  navigateToAddProperty() {
    this.router.navigate(['/dashboard/properties/add']);
  }

  navigateToEditProperty(id: string) {
    this.router.navigate(['/dashboard/properties/edit', id]);
  }

  deleteProperty(id: string) {
    if (confirm(this.i18n.translate('CONFIRM.DELETE_PROPERTY'))) {
      this.propertiesService.deleteProperty(id).subscribe(() => {
        this.loadProperties(this.currentPage);
      });
    }
  }

  generateAnnouncement(propertyId: string) {
    this.generatingAnnouncementId.set(propertyId);
    this.announcementsService.createAnnouncement(propertyId).subscribe({
      next: announcement => {
        this.announcementsByPropertyId = {
          ...this.announcementsByPropertyId,
          [propertyId]: announcement,
        };
        this.generatingAnnouncementId.set(null);
      },
      error: () => this.generatingAnnouncementId.set(null),
    });
  }

  getAnnouncement(propertyId: string) {
    return this.announcementsByPropertyId[propertyId];
  }

  getPropertyTypeLabel(type: string) {
    return this.i18n.translate(`PROPERTIES.TYPE_${type.toUpperCase()}`);
  }

  getPropertyStatusLabel(status: string) {
    return this.i18n.translate(`PROPERTY_FORM.STATUS_${status.toUpperCase()}`);
  }
}
