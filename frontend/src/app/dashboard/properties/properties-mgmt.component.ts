import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertiesService, Property } from '../../services/properties.service';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-properties-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, TranslatePipe],
  templateUrl: './properties-mgmt.component.html',
  styleUrls: ['./properties-mgmt.component.scss']
})
export class PropertiesMgmtComponent implements OnInit {
  private propertiesService = inject(PropertiesService);
  private router = inject(Router);
  readonly i18n = inject(I18nService);

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
    if (confirm(this.i18n.translate('CONFIRM.DELETE_PROPERTY'))) {
      this.propertiesService.deleteProperty(id).subscribe(() => {
        this.loadProperties(this.currentPage);
      });
    }
  }

  getPropertyTypeLabel(type: string) {
    return this.i18n.translate(`PROPERTIES.TYPE_${type.toUpperCase()}`);
  }

  getPropertyStatusLabel(status: string) {
    return this.i18n.translate(`PROPERTY_FORM.STATUS_${status.toUpperCase()}`);
  }
}
