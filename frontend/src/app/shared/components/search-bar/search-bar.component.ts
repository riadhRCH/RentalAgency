import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SearchFilters {
  query: string;
  location: string;
  type: string;
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

  @Output() search = new EventEmitter<SearchFilters>();
  @Output() filtersChange = new EventEmitter<SearchFilters>();

  readonly propertyTypes = [
    { value: '', label: 'All types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'house', label: 'House' },
    { value: 'land', label: 'Land' },
  ];

  onSearch() {
    this.search.emit({
      query: this.searchQuery,
      location: this.searchLocation,
      type: this.searchType,
    });
  }

  onClear() {
    this.searchQuery = '';
    this.searchLocation = '';
    this.searchType = '';
    this.filtersChange.emit({
      query: '',
      location: '',
      type: '',
    });
    this.search.emit({
      query: '',
      location: '',
      type: '',
    });
  }

  onInputChange() {
    this.filtersChange.emit({
      query: this.searchQuery,
      location: this.searchLocation,
      type: this.searchType,
    });
  }
}