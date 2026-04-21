import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../../services/personnel.service';
import { PropertiesService, Property } from '../../services/properties.service';
import { CalendarSelectorComponent } from '../../shared/components/calendar/calendar-selector.component';
import { FormControl } from '@angular/forms';

interface OwnerDashboardData {
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  properties: Property[];
}

interface PropertyEditMode {
  [key: string]: 'view' | 'edit-availability' | 'edit-price';
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarSelectorComponent],
  templateUrl: './owner-dashboard.component.html',
  styleUrl: './owner-dashboard.component.scss',
})
export class OwnerDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private personnelService = inject(PersonnelService);
  private propertiesService = inject(PropertiesService);

  dashboardData: OwnerDashboardData | null = null;
  loading = false;
  error: string | null = null;
  token: string = '';

  propertyEditMode: PropertyEditMode = {};
  editingPrices: { [key: string]: number } = {};
  selectedPropertyCalendar: { [key: string]: any } = {};
  selectedDatesControls: { [key: string]: FormControl } = {};

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;
    
    this.personnelService.getOwnerDashboard(this.token).subscribe({
      next: (data) => {
        this.dashboardData = data;
        
        // Initialize edit modes and controls for each property
        data.properties.forEach((prop: Property) => {
          this.propertyEditMode[prop._id] = 'view';
          this.editingPrices[prop._id] = prop.price;
          this.selectedDatesControls[prop._id] = new FormControl([]);
        });
        
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard. The token may be invalid or expired.';
        this.loading = false;
      }
    });
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
        // Update local data
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
        // Update local data
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