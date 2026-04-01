import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitsService, VisitRequest } from '../../services/visits.service';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-visits',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  templateUrl: './visits.component.html',
  styleUrls: ['./visits.component.scss']
})
export class VisitsComponent implements OnInit {
  private visitsService = inject(VisitsService);

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
    if (confirm('Are you sure you want to delete this visit request?')) {
      this.visitsService.deleteVisit(id).subscribe(() => {
        this.loadVisits(this.currentPage);
      });
    }
  }
}
