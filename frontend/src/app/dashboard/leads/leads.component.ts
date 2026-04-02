import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LeadsService, Lead } from '../../services/leads.service';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, RouterModule],
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss']
})
export class LeadsComponent implements OnInit {
  private leadsService = inject(LeadsService);
  private router = inject(Router);

  leads: Lead[] = [];
  loading = signal(true);
  currentPage = 1;
  totalPages = 1;
  totalLeads = 0;
  statusFilter = '';

  ngOnInit() {
    this.loadLeads();
  }

  loadLeads(page = 1) {
    this.loading.set(true);
    this.leadsService.getLeads(page, 10, this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.leads = res?.data || [];
        this.totalLeads = res?.total || 0;
        this.totalPages = res?.totalPages || 1;
        this.currentPage = res?.page || 1;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }

  onFilterChange() {
    this.loadLeads(1);
  }

  clearFilter() {
    this.statusFilter = '';
    this.loadLeads(1);
  }

  navigateToAddLead() {
    this.router.navigate(['/dashboard/leads/add']);
  }

  changeStatus(lead: Lead, status: any) {
    this.leadsService.updateLead(lead._id, { status }).subscribe(() => {
      lead.status = status;
    });
  }

  deleteLead(id: string) {
    if (confirm('Are you sure you want to delete this lead?')) {
      this.leadsService.deleteLead(id).subscribe(() => {
        this.loadLeads(this.currentPage);
      });
    }
  }
}
