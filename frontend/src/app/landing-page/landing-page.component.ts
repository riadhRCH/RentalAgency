import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PublicFooterComponent } from '../shared/components/public-footer/public-footer.component';
import { PublicNavbarComponent } from '../shared/components/public-navbar/public-navbar.component';
import { PropertiesService, Property, PaginatedProperties } from '../services/properties.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PublicNavbarComponent, PublicFooterComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  propertiesService = inject(PropertiesService);
  mobileMenuOpen = false;

  properties: Property[] = [];
  loading = false;
  selectedCountry = '';
  selectedRegion = '';

  categories = [
    { name: 'Immobilier', type: 'all', image: '/assets/categories/real-estate.jpg' },
    { name: 'Neuf', type: 'new', image: '/assets/categories/new-construction.jpg' },
    { name: 'Vente', type: 'sale', image: '/assets/categories/for-sale.jpg' },
    { name: 'Location', type: 'rent', image: '/assets/categories/for-rent.jpg' },
    { name: 'Location vacances', type: 'vacation', image: '/assets/categories/vacation-rental.jpg' },
  ];

  ngOnInit() {
    this.loadProperties();
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

  onCategoryClick(category: any) {
    // Filter properties based on category
    const filters: any = {};
    if (category.type !== 'all') {
      // Map category types to property types
      switch (category.type) {
        case 'new':
          filters.type = 'apartment'; // Assuming new construction are apartments
          break;
        case 'sale':
          // Properties for sale
          break;
        case 'rent':
          // Properties for rent
          break;
        case 'vacation':
          // Vacation rentals
          break;
      }
    }
    this.loadProperties(filters);
  }

  onCountryChange() {
    const filters: any = {};
    if (this.selectedCountry) filters.country = this.selectedCountry;
    if (this.selectedRegion) filters.region = this.selectedRegion;
    this.loadProperties(filters);
  }

  onRegionChange() {
    this.onCountryChange();
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
