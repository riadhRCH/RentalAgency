import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {
  sidebarCollapsed = false;
  mobileSidebarOpen = false;

  navItems: NavItem[] = [
    {
      label: 'SIDEBAR.OVERVIEW',
      icon: 'dashboard',
      route: '/dashboard/overview',
      subItems: [
        { label: 'SIDEBAR.LEADS', icon: 'group', route: '/dashboard/overview/leads' },
        { label: 'SIDEBAR.VISITS', icon: 'event', route: '/dashboard/overview/visits' },
        { label: 'SIDEBAR.ACTIVE_TRANSACTIONS', icon: 'contract', route: '/dashboard/overview/transactions' },
      ]
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
    { label: 'SIDEBAR.PAYMENTS', icon: 'account_balance', route: '/dashboard/bank-details' },
    { label: 'SIDEBAR.CASHOUTS', icon: 'payments', route: '/dashboard/cashouts' },
    { label: 'SIDEBAR.SYSTEM', icon: '', isHeader: true },
    { label: 'SIDEBAR.SETTINGS', icon: 'settings', route: '/dashboard/config' },
  ];

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
