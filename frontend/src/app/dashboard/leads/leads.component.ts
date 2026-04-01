import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadsService, Lead } from '../../services/leads.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss']
})
export class LeadsComponent implements OnInit {
  private leadsService = inject(LeadsService);

  leads: Lead[] = [];
  loading = true;
  currentPage = 1;
  totalPages = 1;
  totalLeads = 0;
  statusFilter = '';

  ngOnInit() {
    this.loadLeads();
  }

  loadLeads(page = 1) {
    this.loading = true;
    this.leadsService.getLeads(page, 10, this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.leads = res.data;
        this.totalLeads = res.total;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
      },
      complete: () => this.loading = false
    });
  }

  onFilterChange() {
    this.loadLeads(1);
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
