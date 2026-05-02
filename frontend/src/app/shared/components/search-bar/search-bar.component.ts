import { Component, Input, Output, EventEmitter, inject, PLATFORM_ID, signal, output } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentType } from '../../enums';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface SearchFilters {
  query: string;
  location: string;
  type: string;
  rooms?: string;
  paymentType?: PaymentType[];
}

@Component({
  selector: 'app-shared-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SharedSearchBarComponent {
  @Input() searchQuery = '';
  @Input() searchLocation = '';
  @Input() searchType = '';
  @Input() searchRooms = '';
  @Input() selectedPaymentTab: 'LOCATION' | 'VENTE' | 'COURT-SEJOUR' = 'LOCATION';

  paymentTypeMap = {
    'LOCATION': [PaymentType.MONTHLY, PaymentType.WEEKLY],
    'VENTE': [PaymentType.DIRECT_SALE],
    'COURT-SEJOUR': [PaymentType.DAILY]
  };

  @Output() search = new EventEmitter<SearchFilters>();
  @Output() filtersChange = new EventEmitter<SearchFilters>();

  onSearch() {
    this.search.emit({
      query: this.searchQuery,
      location: this.searchLocation,
      type: this.searchType,
      rooms: this.searchRooms,
      paymentType: this.paymentTypeMap[this.selectedPaymentTab]
    });
  }

  onInputChange() {
    this.filtersChange.emit({
      query: this.searchQuery,
      location: this.searchLocation,
      type: this.searchType,
      rooms: this.searchRooms,
      paymentType: this.paymentTypeMap[this.selectedPaymentTab]
    });
  }

  onPaymentTabChange(tab: 'LOCATION' | 'VENTE' | 'COURT-SEJOUR') {
    this.selectedPaymentTab = tab;
    this.onInputChange();
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      fromEvent(window, 'resize')
        .pipe(takeUntilDestroyed())
        .subscribe(() => {
          this.isMobile.set(this.getIsMobile());
        });
    }
  }
  private platformId = inject(PLATFORM_ID);

  isMobile = signal(this.getIsMobile());

  private getIsMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }


  isExpanded = false;

tabs: {
  value: 'LOCATION' | 'VENTE' | 'COURT-SEJOUR',
  label: string
}[] = [
  { value: 'LOCATION', label: 'Location' },
  { value: 'VENTE', label: 'Vente' },
  { value: 'COURT-SEJOUR', label: 'Family Escape' }
];

onToggleSearch =output<boolean>()
toggleSearch() {
  this.isExpanded = !this.isExpanded;
  this.onToggleSearch.emit(this.isExpanded)
}

getTabLabel(value: string): string {
  return this.tabs.find(t => t.value === value)?.label ?? value;
}

hasActiveFilters(): boolean {
  return !!(this.searchLocation || this.searchQuery || this.searchType || this.searchRooms);
}

getFilterSummary(): string {
  const parts = [this.searchLocation, this.searchType, this.searchQuery ? `${this.searchQuery} TND` : '']
    .filter(Boolean);
  return parts.join(' · ') || 'Filters applied';
}
}