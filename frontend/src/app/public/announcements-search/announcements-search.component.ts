import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Announcement,
  AnnouncementFilters,
  AnnouncementsService,
} from '../../services/announcements.service';
import {
  SearchFilters,
  SharedSearchBarComponent,
} from '../../shared/components/search-bar/search-bar.component';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { PaymentType } from '../../shared/enums';
import { environment } from '../../../environments/environment';

type SearchTab = 'LOCATION' | 'VENTE' | 'COURT-SEJOUR';
type SearchPageQueryParams = {
  tab: SearchTab;
  query?: string;
  location?: string;
  type?: string;
  rooms?: string;
};

@Component({
  selector: 'app-announcements-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GoogleMapsModule,
    SharedSearchBarComponent,
    PublicNavbarComponent,
  ],
  templateUrl: './announcements-search.component.html',
  styleUrl: './announcements-search.component.scss',
})
export class AnnouncementsSearchComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly announcementsService = inject(AnnouncementsService);

  @ViewChild(GoogleMap) googleMap?: GoogleMap;

  readonly googleMapsApiKey = environment.googleMapsApiKey;
  readonly defaultCenter: google.maps.LatLngLiteral = { lat: 36.8065, lng: 10.1686 };
  readonly markerIcon = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
  readonly activeMarkerIcon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

  readonly mapOptions: google.maps.MapOptions = {
    center: this.defaultCenter,
    zoom: 11,
    fullscreenControl: true,
    mapTypeControl: true,
    zoomControl: true,
    streetViewControl: false,
  };

  readonly announcements = signal<Announcement[]>([]);
  readonly isLoading = signal(false);
  readonly totalResults = signal(0);
  readonly selectedAnnouncementId = signal<string | null>(null);
  readonly mapCenter = signal<google.maps.LatLngLiteral>(this.defaultCenter);
  readonly mapZoom = signal(11);

  readonly mappableAnnouncements = computed(() =>
    this.announcements().filter((announcement) =>
      this.hasValidCoordinates(announcement),
    ),
  );

  searchQuery = '';
  searchLocation = '';
  searchType = '';
  searchRooms = '';
  selectedPaymentTab: SearchTab = 'LOCATION';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = params.get('query') ?? '';
      this.searchLocation = params.get('location') ?? '';
      this.searchType = params.get('type') ?? '';
      this.searchRooms = params.get('rooms') ?? '';
      this.selectedPaymentTab = this.parseSearchTab(params.get('tab'));
      this.loadAnnouncements();
    });
  }

  onSearch(filters: SearchFilters): void {
    this.router.navigate(['/search'], {
      queryParams: this.buildQueryParams(
        filters,
        this.getSearchTabForPaymentTypes(filters.paymentType),
      ),
    });
  }

  focusAnnouncement(announcement: Announcement): void {
    if (!this.hasValidCoordinates(announcement)) {
      return;
    }

    const center = {
      lat: announcement.gpsLocation.lat,
      lng: announcement.gpsLocation.lng,
    };

    this.selectedAnnouncementId.set(announcement._id);
    this.mapCenter.set(center);
    this.mapZoom.set(15);

    if (this.googleMap?.googleMap) {
      this.googleMap.googleMap.panTo(center);
      this.googleMap.googleMap.setZoom(15);
    }
  }

  clearSelection(): void {
    this.selectedAnnouncementId.set(null);
    this.mapCenter.set(this.defaultCenter);
    this.mapZoom.set(11);
  }

  hasMapResults(): boolean {
    return this.mappableAnnouncements().length > 0;
  }

  hasValidCoordinates(announcement: Announcement): boolean {
    const { lat, lng } = announcement.gpsLocation ?? {};

    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  isSelected(announcement: Announcement): boolean {
    return this.selectedAnnouncementId() === announcement._id;
  }

  getMarkerOptions(announcement: Announcement): google.maps.MarkerOptions {
    return {
      icon: this.isSelected(announcement) ? this.activeMarkerIcon : this.markerIcon,
    };
  }

  getCardType(announcement: Announcement): 'rental' | 'sale' | 'short-term' {
    switch (announcement.paymentFrequency) {
      case PaymentType.DIRECT_SALE:
        return 'sale';
      case PaymentType.DAILY:
        return 'short-term';
      default:
        return 'rental';
    }
  }

  getPaymentLabel(paymentType: PaymentType): string {
    switch (paymentType) {
      case PaymentType.DAILY:
        return 'Daily';
      case PaymentType.WEEKLY:
        return 'Weekly';
      case PaymentType.MONTHLY:
        return 'Monthly';
      case PaymentType.DIRECT_SALE:
        return 'Direct sale';
      default:
        return paymentType;
    }
  }

  private loadAnnouncements(): void {
    this.isLoading.set(true);

    this.announcementsService
      .getAllPublicAnnouncements(1, 24, this.buildApiFilters())
      .subscribe({
        next: (response) => {
          this.announcements.set(response.data);
          this.totalResults.set(response.total);
          this.isLoading.set(false);

          const firstMappableAnnouncement = response.data.find((announcement) =>
            this.hasValidCoordinates(announcement),
          );

          if (firstMappableAnnouncement) {
            this.focusAnnouncement(firstMappableAnnouncement);
            return;
          }

          this.clearSelection();
        },
        error: () => {
          this.announcements.set([]);
          this.totalResults.set(0);
          this.isLoading.set(false);
          this.clearSelection();
        },
      });
  }

  private buildApiFilters(): AnnouncementFilters {
    const filters: AnnouncementFilters = {};
    const trimmedQuery = this.searchQuery.trim();
    const budgetRange = this.parseBudgetQuery(trimmedQuery);
    const rooms = Number(this.searchRooms);

    if (budgetRange) {
      if (budgetRange.minPrice !== undefined) {
        filters['minPrice'] = budgetRange.minPrice;
      }

      if (budgetRange.maxPrice !== undefined) {
        filters['maxPrice'] = budgetRange.maxPrice;
      }
    } else if (trimmedQuery) {
      filters['query'] = trimmedQuery;
    }

    if (this.searchLocation.trim()) {
      filters['location'] = this.searchLocation.trim();
    }

    if (this.searchType.trim()) {
      filters['type'] = this.searchType.trim();
    }

    if (!Number.isNaN(rooms) && rooms > 0) {
      filters['rooms'] = rooms;
    }

    filters['paymentFrequency'] = this.getPaymentTypesForTab(this.selectedPaymentTab);

    return filters;
  }

  private buildQueryParams(
    filters: SearchFilters,
    selectedTab: SearchTab,
  ): SearchPageQueryParams {
    const queryParams: SearchPageQueryParams = {
      tab: selectedTab,
    };

    if (filters.query.trim()) {
      queryParams['query'] = filters.query.trim();
    }

    if (filters.location.trim()) {
      queryParams['location'] = filters.location.trim();
    }

    if (filters.type.trim()) {
      queryParams['type'] = filters.type.trim();
    }

    if (filters.rooms?.trim()) {
      queryParams['rooms'] = filters.rooms.trim();
    }

    return queryParams;
  }

  private parseSearchTab(value: string | null): SearchTab {
    if (value === 'VENTE' || value === 'COURT-SEJOUR') {
      return value;
    }

    return 'LOCATION';
  }

  private getPaymentTypesForTab(tab: SearchTab): PaymentType[] {
    switch (tab) {
      case 'VENTE':
        return [PaymentType.DIRECT_SALE];
      case 'COURT-SEJOUR':
        return [PaymentType.DAILY];
      default:
        return [PaymentType.MONTHLY, PaymentType.WEEKLY];
    }
  }

  private getSearchTabForPaymentTypes(
    paymentTypes?: PaymentType[],
  ): SearchTab {
    if (paymentTypes?.includes(PaymentType.DIRECT_SALE)) {
      return 'VENTE';
    }

    if (paymentTypes?.includes(PaymentType.DAILY)) {
      return 'COURT-SEJOUR';
    }

    return 'LOCATION';
  }

  private parseBudgetQuery(
    query: string,
  ): { minPrice?: number; maxPrice?: number } | null {
    if (!query) {
      return null;
    }

    const rangeMatch = query.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const minPrice = Number(rangeMatch[1]);
      const maxPrice = Number(rangeMatch[2]);

      if (!Number.isNaN(minPrice) && !Number.isNaN(maxPrice)) {
        return {
          minPrice: Math.min(minPrice, maxPrice),
          maxPrice: Math.max(minPrice, maxPrice),
        };
      }
    }

    const numericValue = Number(query);
    if (!Number.isNaN(numericValue) && numericValue > 0) {
      return { maxPrice: numericValue };
    }

    return null;
  }
}
