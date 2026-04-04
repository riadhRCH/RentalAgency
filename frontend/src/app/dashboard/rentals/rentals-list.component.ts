import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RentalsService, Rental } from '../../services/rentals.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-rentals-list',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent, TranslatePipe],
  templateUrl: './rentals-list.component.html',
  styleUrls: ['./rentals-list.component.scss']
})
export class RentalsListComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  rentals: Rental[] = [];
  isLoading = signal(true);
  error: string | null = null;

  constructor(private rentalsService: RentalsService) {}

  ngOnInit(): void {
    this.loadRentals();
  }

  loadRentals(): void {
    this.isLoading.set(true);
    this.rentalsService.findAll().subscribe({
      next: (data) => {
        this.rentals = data;
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error = this.i18n.translate('RENTALS.LOAD_FAILED');
        this.isLoading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CURRENT': return 'bg-green-100 text-green-800';
      case 'EXPIRING_SOON': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  closeRental(id: string): void {
    if (confirm(this.i18n.translate('CONFIRM.CLOSE_RENTAL_AND_RELEASE'))) {
      this.rentalsService.closeRental(id).subscribe(() => {
        this.loadRentals();
      });
    }
  }

  deleteRental(id: string): void {
    if (confirm(this.i18n.translate('CONFIRM.DELETE_RENTAL'))) {
      this.rentalsService.delete(id).subscribe(() => {
        this.loadRentals();
      });
    }
  }

  getRentalStatusLabel(status: string) {
    return this.i18n.translate(`COMMON.${status}`);
  }
}
