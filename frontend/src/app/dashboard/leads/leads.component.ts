import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LeadsService, Lead } from '../../services/leads.service';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { LeadStatus, getEnumValues } from '../../shared/enums';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, RouterModule, TranslatePipe],
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss']
})
export class LeadsComponent implements OnInit {
  private leadsService = inject(LeadsService);
  private router = inject(Router);
  readonly i18n = inject(I18nService);

  // Expose enums
  LeadStatus = LeadStatus;
  leadStatuses = getEnumValues(LeadStatus);

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
    if (confirm(this.i18n.translate('CONFIRM.DELETE_LEAD'))) {
      this.leadsService.deleteLead(id).subscribe(() => {
        this.loadLeads(this.currentPage);
      });
    }
  }

  getLeadStatusLabel(status: string) {
    return this.i18n.translate(`COMMON.${status}`);
  }
}
