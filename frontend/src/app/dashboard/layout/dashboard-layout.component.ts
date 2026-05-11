import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AgencyService, AgencyProfile } from '../../services/agency.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent implements OnInit {
  private agencyService = inject(AgencyService);
  private authService = inject(AuthService);
  private router = inject(Router);

  sidebarCollapsed = false;
  mobileSidebarOpen = false;
  agencyProfile: AgencyProfile | null = null;

  navItems = signal<NavItem[]>([]);

  ngOnInit() {
    this.loadAgencyProfile();

    this.authService.servicesRefresh$.subscribe(() => {
      this.loadAgencyProfile();
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadAgencyProfile();
    });
  }

  loadAgencyProfile() {
    this.agencyService.getProfile().subscribe({
      next: (profile) => {
        this.agencyProfile = profile;
        const services = profile.services || ['rental'];
        this.authService.agencyServices.set(services);
        this.updateNavItems(services);
      },
      error: () => {
        this.updateNavItems(['rental']);
      }
    });
  }

  updateNavItems(services: string[]) {
    const hasRentalOrSales = services.includes('rental') || services.includes('sales');
    const hasShortTerm = services.includes('short_term');

    const items: NavItem[] = [
      {
        label: 'SIDEBAR.OVERVIEW',
        icon: 'dashboard',
        route: '/dashboard/overview',
        subItems: hasRentalOrSales ? [
          { label: 'SIDEBAR.LEADS', icon: 'group', route: '/dashboard/overview/leads' },
          { label: 'SIDEBAR.VISITS', icon: 'event', route: '/dashboard/overview/visits' },
          { label: 'SIDEBAR.ACTIVE_TRANSACTIONS', icon: 'contract', route: '/dashboard/overview/transactions' },
        ] : undefined,
      },
      { label: 'SIDEBAR.PROPERTIES', icon: 'real_estate_agent', route: '/dashboard/properties' },
      { label: 'SIDEBAR.ANNOUNCEMENTS', icon: 'campaign', route: '/dashboard/announcements' },
      {
        label: 'SIDEBAR.PERSONNEL',
        icon: 'people',
        subItems: [
          { label: 'SIDEBAR.TEAM_MANAGEMENT', icon: 'badge', route: '/dashboard/personnel/team' },
          { label: 'SIDEBAR.OWNERS_PAGE', icon: 'person', route: '/dashboard/personnel/owners' },
        ]
      },
    ];

    if (hasShortTerm) {
      items.push(
        { label: 'SIDEBAR.PAYMENTS', icon: 'account_balance', route: '/dashboard/bank-details' },
        { label: 'SIDEBAR.CASHOUTS', icon: 'payments', route: '/dashboard/cashouts' },
      );
    }

    items.push(
      { label: 'SIDEBAR.SYSTEM', icon: '', isHeader: true },
      { label: 'SIDEBAR.SETTINGS', icon: 'settings', route: '/dashboard/config' },
    );

    if (this.authService.isAdmin()) {
      items.push(
        { label: 'SIDEBAR.ADMIN', icon: '', isHeader: true },
        { label: 'SIDEBAR.AGENCIES_MANAGEMENT', icon: 'business', route: '/dashboard/admin/agencies-management' },
        { label: 'SIDEBAR.ADD_AGENCY', icon: 'add_business', route: '/auth/register' },
      );
    }

    this.navItems.set(items);
  }

  toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
      return;
    }

    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen = false;
  }
}
