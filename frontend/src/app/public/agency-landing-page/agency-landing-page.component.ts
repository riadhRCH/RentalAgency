import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AgencyService, AgencyProfile } from '../../services/agency.service';
import {
  Announcement,
  AnnouncementsService,
} from '../../services/announcements.service';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import {
  CircularGalleryComponent,
  CircularGalleryItem,
} from '../circular-gallery/circular-gallery.component';
import { SharedSearchBarComponent, SearchFilters } from '../../shared/components/search-bar/search-bar.component';

@Component({
  selector: 'app-agency-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PublicNavbarComponent,
    PublicFooterComponent,
    CircularGalleryComponent,
    SharedSearchBarComponent,
  ],
  templateUrl: './agency-landing-page.component.html',
  styleUrl: './agency-landing-page.component.scss',
})
export class AgencyLandingPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly agencyService = inject(AgencyService);
  private readonly announcementsService = inject(AnnouncementsService);

  agencyId = '';
  agency: AgencyProfile | null = null;
  announcements: Announcement[] = [];
  loading = signal(false);

  searchQuery = '';
  searchLocation = '';
  searchType = '';

  readonly propertyTypes = [
    { value: '', label: 'All types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'house', label: 'House' },
    { value: 'land', label: 'Land' },
  ];

  ngOnInit() {
    this.agencyId = this.route.snapshot.paramMap.get('agencyId') ?? '';
    if (!this.agencyId) {
      return;
    }

    this.loadAgency();
    this.loadAnnouncements();
  }

  get galleryItems(): CircularGalleryItem[] {
    return this.announcements.slice(0, 8).map(announcement => ({
      id: announcement._id,
      title: announcement.reference,
      subtitle: `${announcement.address} · ${announcement.price.toLocaleString()} TND`,
      imageUrl: announcement.photos[0] || this.agency?.logo || '/assets/Doghmani_logo-removebg-preview.png',
      imageAlt: announcement.title,
    }));
  }

  loadAgency() {
    this.agencyService.getPublicProfile(this.agencyId).subscribe({
      next: agency => {
        this.agency = agency;
      },
    });
  }

  loadAnnouncements(filters?: SearchFilters) {
    this.loading.set(true)
    const query = filters?.query ?? this.searchQuery;
    const location = filters?.location ?? this.searchLocation;
    const type = filters?.type ?? this.searchType;
    
    this.announcementsService
      .getPublicAgencyAnnouncements(this.agencyId, 1, 18, {
        query: query || undefined,
        location: location || undefined,
        type: type || undefined,
      })
      .subscribe({
        next: response => {
          this.announcements = response.data;
           this.loading.set(false)
        },
        error: () => {
           this.loading.set(false)
        },
      });
  }

  onSearch(filters: SearchFilters) {
    this.searchQuery = filters.query;
    this.searchLocation = filters.location;
    this.searchType = filters.type;
    this.loadAnnouncements(filters);
  }

  clearFilters() {
    this.searchQuery = '';
    this.searchLocation = '';
    this.searchType = '';
    this.loadAnnouncements({
      query: '',
      location: '',
      type: '',
    });
  }
}
