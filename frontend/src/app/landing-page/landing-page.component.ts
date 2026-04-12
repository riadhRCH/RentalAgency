import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PublicFooterComponent } from '../shared/components/public-footer/public-footer.component';
import { PublicNavbarComponent } from '../shared/components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PublicNavbarComponent, PublicFooterComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  authService = inject(AuthService);
  router = inject(Router);
  mobileMenuOpen = false;

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
