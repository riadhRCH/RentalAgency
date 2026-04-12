import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-navbar.component.html',
  styleUrls: ['./public-navbar.component.scss']
})
export class PublicNavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  mobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  navigateToDashboard(): void {
    this.mobileMenuOpen = false;
    this.router.navigate(['/dashboard/overview']);
  }

  logout(): void {
    this.authService.logout();
    this.mobileMenuOpen = false;
    this.router.navigate(['/']);
  }
}
