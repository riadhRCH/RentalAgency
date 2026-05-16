import { Component, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { I18nService } from '../../../i18n/i18n.service';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { DemandsService } from '../../../services/demands.service';
import { environment } from '../../../../environments/environment';
import type { Language } from '../../../i18n/translations';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './public-navbar.component.html',
  styleUrls: ['./public-navbar.component.scss']
})
export class PublicNavbarComponent {
  authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private router = inject(Router);
  private demandsService = inject(DemandsService);
  mobileMenuOpen = false;
  langDropdownOpen = false;

  @ViewChild('langDropdown') langDropdownRef!: ElementRef;

  get currentLang(): Language {
    return this.i18n.language();
  }

  setLang(lang: Language): void {
    this.i18n.setLanguage(lang);
    this.langDropdownOpen = false;
  }

  toggleLangDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.langDropdownOpen = !this.langDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  closeLangDropdown(event: MouseEvent): void {
    if (this.langDropdownRef && !this.langDropdownRef.nativeElement.contains(event.target)) {
      this.langDropdownOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  scrollTo(sectionId: string): void {
    this.mobileMenuOpen = false;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  navigateToDashboard(): void {
    this.mobileMenuOpen = false;
    this.router.navigate(['/dashboard/overview']);
  }

  bookViewing(): void {
    this.mobileMenuOpen = false;
    const segments = this.router.url.split('/').filter(s => s);
    const knownPaths = ['search', 'announce', 'transaction', 'visit-request', 'owner-dashboard', 'thank-you', 'carousel', 'auth', 'dashboard'];
    let agencyId: string = environment.defaultAgencyId;

    if (segments.length === 1 && !knownPaths.includes(segments[0])) {
      agencyId = segments[0];
    }

    this.demandsService.createPublicDemand(agencyId).subscribe({
      next: (demand) => {
        this.router.navigate(['/demand', demand._id]);
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.mobileMenuOpen = false;
    this.router.navigate(['/']);
  }
}
