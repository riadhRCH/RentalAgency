import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PublicFooterComponent } from '../shared/components/public-footer/public-footer.component';
import { PublicNavbarComponent } from '../shared/components/public-navbar/public-navbar.component';
import { CircularGalleryItem } from '../public/circular-gallery/circular-gallery.component';
import { SharedSearchBarComponent, SearchFilters } from '../shared/components/search-bar/search-bar.component';
import { PropertyCardComponent } from '../shared/components/property-card/property-card.component';
import { AgencyService, AgencyProfile } from '../services/agency.service';
import { AnnouncementsService, Announcement, PaginatedAnnouncements } from '../services/announcements.service';
import { PaymentType } from '../shared/enums';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PublicNavbarComponent, PublicFooterComponent, SharedSearchBarComponent, PropertyCardComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit {
  router = inject(Router);
  private agencyService = inject(AgencyService);
  private announcementsService = inject(AnnouncementsService);
  mobileMenuOpen = false;

  announcements: Announcement[] = [];
  loading = signal(false);
  agencies: AgencyProfile[] = [];
  searchQuery = '';
  searchLocation = '';
  searchType = '';

  categories = [
    { name: 'Immobilier', type: 'all', image: '/assets/categories/real-estate.jpg' },
    { name: 'Neuf', type: 'new', image: '/assets/categories/new-construction.jpg' },
    { name: 'Vente', type: 'sale', image: '/assets/categories/for-sale.jpg' },
    { name: 'Location', type: 'rent', image: '/assets/categories/for-rent.jpg' },
    { name: 'Location vacances', type: 'vacation', image: '/assets/categories/vacation-rental.jpg' },
  ];

  ngOnInit() {
    this.loadAnnouncements();
    this.loadAgencies();
  }

  get galleryItems(): CircularGalleryItem[] {
    return this.announcements.slice(0, 8).map(announcement => ({
      id: announcement._id,
      title: announcement.reference,
      subtitle: `${announcement.address} · ${announcement.price.toLocaleString()} TND`,
      imageUrl: announcement.photos[0] || '/assets/Doghmani_logo-removebg-preview.png',
      imageAlt: announcement.title,
    }));
  }

  get rentalAnnouncements(): Announcement[] {
    return this.announcements.filter(a => 
      a.paymentFrequency === PaymentType.MONTHLY || a.paymentFrequency === PaymentType.WEEKLY
    );
  }

  get saleAnnouncements(): Announcement[] {
    return this.announcements.filter(a => a.paymentFrequency === PaymentType.DIRECT_SALE);
  }

  get shortTermAnnouncements(): Announcement[] {
    return this.announcements.filter(a => a.paymentFrequency === PaymentType.DAILY);
  }

  loadAgencies() {
    this.agencyService.getPublicAgencies().subscribe({
      next: (agencies) => {
        this.agencies = agencies;
      },
      error: () => {
        console.error('Failed to load agencies');
      }
    });
  }

  loadAnnouncements(filters?: any) {
    this.loading.set(true);
    this.announcementsService.getAllPublicAnnouncements(1, 6, filters).subscribe({
      next: (response: PaginatedAnnouncements) => {
        this.announcements = response.data;
          this.loading.set(false);
      },
      error: () => {
          this.loading.set(false);
      }
    });
  }

  onSearch(filters: SearchFilters) {
    const queryParams: Record<string, string> = {
      tab: filters.paymentType?.includes(PaymentType.DIRECT_SALE)
        ? 'VENTE'
        : filters.paymentType?.includes(PaymentType.DAILY)
          ? 'COURT-SEJOUR'
          : 'LOCATION',
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

    this.router.navigate(['/search'], { queryParams });
  }

  onCategoryClick(category: any) {
    const filters: any = {};
    if (category.type !== 'all') {
      switch (category.type) {
        case 'new':
          filters.type = 'apartment';
          break;
        case 'sale':
          break;
        case 'rent':
          break;
        case 'vacation':
          break;
      }
    }
    this.loadAnnouncements(filters);
  }

  navigateToDashboard() {
    this.mobileMenuOpen = false;
    this.router.navigate(['/dashboard/overview']);
  }

  openAnnouncement(announcement: Announcement) {
    this.router.navigate(['/announce/' + announcement._id]);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
