import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PublicFooterComponent } from '../shared/components/public-footer/public-footer.component';
import { PublicNavbarComponent } from '../shared/components/public-navbar/public-navbar.component';
import { PropertiesService, Property, PaginatedProperties } from '../services/properties.service';
import { CircularGalleryComponent, CircularGalleryItem } from '../public/circular-gallery/circular-gallery.component';
import { SharedSearchBarComponent, SearchFilters } from '../shared/components/search-bar/search-bar.component';
import { AgencyService, AgencyProfile } from '../services/agency.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PublicNavbarComponent, PublicFooterComponent, CircularGalleryComponent, SharedSearchBarComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  propertiesService = inject(PropertiesService);
  private agencyService = inject(AgencyService);
  mobileMenuOpen = false;

  properties: Property[] = [];
  loading = false;
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
    this.loadProperties();
    this.loadAgencies();
  }

  get galleryItems(): CircularGalleryItem[] {
    return this.properties.slice(0, 8).map(property => ({
      id: property._id,
      title: property.reference,
      subtitle: `${property.address} · ${property.price.toLocaleString()} TND`,
      imageUrl: property.photos[0] || '/assets/Doghmani_logo-removebg-preview.png',
      imageAlt: property.description,
    }));
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

  loadProperties(filters?: any) {
    this.loading = true;
    this.propertiesService.getPublicProperties(1, 6, filters).subscribe({
      next: (response: PaginatedProperties) => {
        this.properties = response.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearch(filters: SearchFilters) {
    this.searchQuery = filters.query;
    this.searchLocation = filters.location;
    this.searchType = filters.type;
    const filterParams: any = {};
    if (filters.query) filterParams.query = filters.query;
    if (filters.location) filterParams.location = filters.location;
    if (filters.type) filterParams.type = filters.type;
    this.loadProperties(filterParams);
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
    this.loadProperties(filters);
  }

  navigateToDashboard() {
    this.mobileMenuOpen = false;
    this.router.navigate(['/dashboard/overview']);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
