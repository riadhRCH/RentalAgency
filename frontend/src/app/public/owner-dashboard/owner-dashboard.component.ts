import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonnelService, Personnel } from '../../services/personnel.service';
import { PropertiesService, Property } from '../../services/properties.service';
import { CalendarSelectorComponent } from '../../shared/components/calendar/calendar-selector.component';
import { FormControl } from '@angular/forms';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar/sidebar.component';
import { OwnerPaymentsComponent } from './payments/owner-payments.component';
import { TranslatePipe } from '../../i18n/translate.pipe';

interface OwnerDashboardData {
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  properties: Property[];
  agencyId: string;
  balance: number;
  cashouts: any;
  transactions: any;
}

interface PropertyEditMode {
  [key: string]: 'view' | 'edit-availability' | 'edit-price';
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarSelectorComponent, SidebarComponent, OwnerPaymentsComponent, TranslatePipe],
  templateUrl: './owner-dashboard.component.html',
  styleUrl: './owner-dashboard.component.scss',
})
export class OwnerDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private personnelService = inject(PersonnelService);
  private propertiesService = inject(PropertiesService);

  dashboardData: OwnerDashboardData | null = null;
  loading = signal(false);
  error: string | null = null;
  token: string = '';
  currentView: 'overview' | 'payments' | 'profile' = 'overview';

  sidebarCollapsed = false;
  mobileSidebarOpen = false;

  navItems: NavItem[] = [];

  propertyEditMode: PropertyEditMode = {};
  editingPrices: { [key: string]: number } = {};
  selectedDatesControls: { [key: string]: FormControl } = {};

  ownerProfile = signal<Personnel | null>(null);
  profileLoading = signal(false);
  profileSaving = signal(false);
  profileSaveSuccess = signal(false);

  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: 'PHONE',
    instagram: '',
    facebook: '',
    telegram: '',
    profilePicture: '',
  };

  preferredContactOptions = [
    { value: 'PHONE', label: 'Phone' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'TELEGRAM', label: 'Telegram' },
    { value: 'SMS', label: 'SMS' },
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.loadDashboardData();
      }
    });

    this.route.url.subscribe(url => {
      const urlString = url.map(segment => segment.path).join('/');
      if (urlString.includes('payments')) {
        this.currentView = 'payments';
      } else if (urlString.includes('profile')) {
        this.currentView = 'profile';
        this.loadOwnerProfile();
      } else {
        this.currentView = 'overview';
      }
      this.updateNavItems();
    });
  }

  updateNavItems() {
    this.navItems = [
      {
        label: 'SIDEBAR.OVERVIEW',
        icon: 'dashboard',
        route: `/owner-dashboard/${this.token}`,
        exact: true
      },
      {
        label: 'SIDEBAR.PAYMENTS',
        icon: 'account_balance',
        route: `/owner-dashboard/${this.token}/payments`
      },
      {
        label: 'SIDEBAR.PROFILE',
        icon: 'person',
        route: `/owner-dashboard/${this.token}/profile`
      },
    ];
  }

  loadDashboardData() {
    this.loading.set(true);
    this.error = null;

    this.personnelService.getOwnerDashboard(this.token).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.updateNavItems();

        data.properties.forEach((prop: Property) => {
          this.propertyEditMode[prop._id] = 'view';
          this.editingPrices[prop._id] = prop.price;
          this.selectedDatesControls[prop._id] = new FormControl([]);
        });

        this.loading.set(false);
      },
      error: () => {
        this.error = 'Failed to load dashboard. The token may be invalid or expired.';
        this.loading.set(false);
      }
    });
  }

  loadOwnerProfile() {
    this.profileLoading.set(true);
    this.personnelService.getOwnerDashboard(this.token).subscribe({
      next: (data) => {
        this.ownerProfile.set(data.owner);
        this.profileForm = {
          firstName: data.owner.firstName || '',
          lastName: data.owner.lastName || '',
          email: data.owner.email || '',
          phone: data.owner.phone || '',
          preferredContact: 'PHONE',
          instagram: '',
          facebook: '',
          telegram: '',
          profilePicture: '',
        };
        this.profileLoading.set(false);
      },
      error: () => {
        this.profileLoading.set(false);
      }
    });
  }

  saveProfile() {
    this.profileSaving.set(true);
    this.profileSaveSuccess.set(false);

    this.personnelService.updateOwnerProfile(this.token, this.profileForm).subscribe({
      next: (data) => {
        this.ownerProfile.set(data);
        this.profileSaving.set(false);
        this.profileSaveSuccess.set(true);
        setTimeout(() => this.profileSaveSuccess.set(false), 3000);
      },
      error: () => {
        this.profileSaving.set(false);
      }
    });
  }

  onProfileFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.profileSaving.set(true);

      this.personnelService.uploadOwnerProfilePicture(this.token, file).subscribe({
        next: (response) => {
          this.profileForm.profilePicture = response.profilePicture;
          this.profileSaving.set(false);
        },
        error: () => {
          this.profileSaving.set(false);
        }
      });
    }
  }

  isFieldRequired(): boolean {
    const pc = this.profileForm.preferredContact;
    return pc === 'EMAIL' || pc === 'PHONE' || pc === 'WHATSAPP' || pc === 'SMS';
  }

  getRequiredFieldName(): string | null {
    const pc = this.profileForm.preferredContact;
    switch (pc) {
      case 'EMAIL': return 'email';
      case 'PHONE':
      case 'WHATSAPP':
      case 'SMS': return 'phone';
      default: return null;
    }
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen = false;
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleAvailabilityEdit(propertyId: string) {
    if (this.propertyEditMode[propertyId] === 'edit-availability') {
      this.propertyEditMode[propertyId] = 'view';
    } else {
      this.propertyEditMode[propertyId] = 'edit-availability';
    }
  }

  togglePriceEdit(propertyId: string) {
    if (this.propertyEditMode[propertyId] === 'edit-price') {
      this.propertyEditMode[propertyId] = 'view';
    } else {
      this.propertyEditMode[propertyId] = 'edit-price';
      this.editingPrices[propertyId] = this.getPropertyPrice(propertyId);
    }
  }

  saveAvailability(propertyId: string) {
    const calendarData = this.selectedDatesControls[propertyId].value || [];

    this.personnelService.updatePropertyAvailability(this.token, propertyId, calendarData).subscribe({
      next: () => {
        this.propertyEditMode[propertyId] = 'view';
        const property = this.dashboardData?.properties.find(p => p._id === propertyId);
        if (property) {
          property.calendarData = calendarData;
        }
      },
      error: () => {
        this.error = 'Failed to update availability';
      }
    });
  }

  savePrice(propertyId: string) {
    const newPrice = this.editingPrices[propertyId];

    this.personnelService.updatePropertyPrice(this.token, propertyId, newPrice).subscribe({
      next: () => {
        this.propertyEditMode[propertyId] = 'view';
        const property = this.dashboardData?.properties.find(p => p._id === propertyId);
        if (property) {
          property.price = newPrice;
        }
      },
      error: () => {
        this.error = 'Failed to update price';
      }
    });
  }

  cancelEdit(propertyId: string) {
    this.propertyEditMode[propertyId] = 'view';
  }

  getPropertyPrice(propertyId: string): number {
    return this.dashboardData?.properties.find(p => p._id === propertyId)?.price || 0;
  }

  getPropertyCalendarData(propertyId: string): any[] {
    return this.dashboardData?.properties.find(p => p._id === propertyId)?.calendarData || [];
  }

  getSelectedDatesForProperty(propertyId: string): string[] {
    const control = this.selectedDatesControls[propertyId];
    const dates = control?.value || [];
    return dates.map((date: any) => {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      return date as string;
    });
  }

  onPropertyDatesSelected(propertyId: string, dates: Date[]) {
    this.selectedDatesControls[propertyId]?.setValue(dates);
  }
}
