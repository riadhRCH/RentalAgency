import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VisitsService, VisitRequest } from '../../services/visits.service';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-visits',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, RouterModule, TranslatePipe],
  templateUrl: './visits.component.html',
  styleUrls: ['./visits.component.scss']
})
export class VisitsComponent implements OnInit {
  private visitsService = inject(VisitsService);
  readonly i18n = inject(I18nService);

  visits: VisitRequest[] = [];
  loading = signal(true);
  currentPage = 1;
  totalPages = 1;
  statusFilter = '';

  ngOnInit() {
    this.loadVisits();
  }

  loadVisits(page = 1) {
    this.loading.set(true);
    this.visitsService.getVisits(page, 10, this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.visits = res?.data || [];
        this.totalPages = res?.totalPages || 1;
        this.currentPage = res?.page || 1;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }

  updateStatus(visit: VisitRequest, status: any) {
    this.visitsService.updateVisit(visit._id, { status }).subscribe(() => {
      visit.status = status;
    });
  }

  deleteVisit(id: string) {
    if (confirm(this.i18n.translate('CONFIRM.DELETE_VISIT'))) {
      this.visitsService.deleteVisit(id).subscribe(() => {
        this.loadVisits(this.currentPage);
      });
    }
  }

  getVisitStatusLabel(status: string) {
    return this.i18n.translate(`COMMON.${status}`);
  }

  getPropertyTypeLabel(type: string | undefined) {
    if (!type) {
      return '';
    }

    return this.i18n.translate(`PROPERTIES.TYPE_${type.toUpperCase()}`);
  }
}
