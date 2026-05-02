import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentType } from '../../enums';

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
}