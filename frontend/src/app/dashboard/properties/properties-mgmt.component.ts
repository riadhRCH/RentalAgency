import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertiesService, Property } from '../../services/properties.service';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-properties-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  templateUrl: './properties-mgmt.component.html',
  styleUrls: ['./properties-mgmt.component.scss']
})
export class PropertiesMgmtComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private router = inject(Router);

  properties: Property[] = [];
  loading = signal(true);
  currentPage = 1;
  totalPages = 1;
  typeFilter = '';

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties(page = 1) {
    this.loading.set(true);
    this.propertiesService.getProperties(page, 10, { type: this.typeFilter || undefined }).subscribe({
      next: (res) => {
        this.properties = res?.data || [];
        this.totalPages = res?.totalPages || 1;
        this.currentPage = res?.page || 1;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }

  onFilterChange() {
    this.loadProperties(1);
  }

  clearFilter() {
    this.typeFilter = '';
    this.loadProperties(1);
  }

  navigateToAddProperty() {
    this.router.navigate(['/dashboard/properties/add']);
  }

  navigateToEditProperty(id: string) {
    this.router.navigate(['/dashboard/properties/edit', id]);
  }

  deleteProperty(id: string) {
    if (confirm('Are you sure you want to delete this property?')) {
      this.propertiesService.deleteProperty(id).subscribe(() => {
        this.loadProperties(this.currentPage);
      });
    }
  }
}
