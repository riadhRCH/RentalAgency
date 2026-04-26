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

  onSearch() {
    this.search.emit({
      query: this.searchQuery,
      location: this.searchLocation,
      type: this.searchType,
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