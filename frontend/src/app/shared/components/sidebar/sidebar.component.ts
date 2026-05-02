import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { I18nService } from '../../../i18n/i18n.service';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  subItems?: NavItem[];
  exact?: boolean;
  isHeader?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Input() navItems: NavItem[] = [];
  @Output() closeMobile = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();

  authService = inject(AuthService);
  i18n = inject(I18nService);
  private router = inject(Router);

  logout() {
    this.authService.logout();
    this.closeMobile.emit();
    this.router.navigate(['/']);
  }

  onNavigate() {
    if (this.mobileOpen) {
      this.closeMobile.emit();
    }
  }
}
