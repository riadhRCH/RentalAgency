import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeadsService, Lead } from '../../services/leads.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
})
export class ClientListComponent implements OnInit {
  private leadsService = inject(LeadsService);
  private router = inject(Router);

  allLeads = signal<Lead[]>([]);
  filteredLeads = signal<Lead[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  totalClients = signal(0);
  stageFilter = signal('');
  searchQuery = signal('');
  sortField = signal('');
  sortDir = signal<'asc' | 'desc'>('asc');

  ngOnInit() {
    this.loadClients();
  }

  loadClients(page = 1) {
    this.loading.set(true);
    this.leadsService.getLeads(page, 50, undefined, this.stageFilter() || undefined).subscribe({
      next: (res) => {
        this.allLeads.set(res?.data || []);
        this.totalClients.set(res?.total || 0);
        this.totalPages.set(res?.totalPages || 1);
        this.currentPage.set(res?.page || 1);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  onSearchQueryChange(value: string) {
    this.searchQuery.set(value);
    this.applyFilters();
  }

  onStageFilterChange(value: string) {
    this.stageFilter.set(value);
    this.loadClients(1);
  }

  applyFilters() {
    let filtered = [...this.allLeads()];

    const query = this.searchQuery();
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(l =>
        (l.customerName && l.customerName.toLowerCase().includes(q)) ||
        l.customerPhone.toLowerCase().includes(q) ||
        (l.customerProfile?.firstName && l.customerProfile.firstName.toLowerCase().includes(q)) ||
        (l.customerProfile?.lastName && l.customerProfile.lastName.toLowerCase().includes(q)) ||
        (l.customerProfile?.email && l.customerProfile.email.toLowerCase().includes(q))
      );
    }

    const field = this.sortField();
    const dir = this.sortDir();
    if (field) {
      filtered.sort((a, b) => {
        let valA: any, valB: any;
        if (field === 'pipelineStage') {
          valA = a.pipelineStage; valB = b.pipelineStage;
        } else if (field === 'customerName') {
          valA = this.getFullName(a).toLowerCase(); valB = this.getFullName(b).toLowerCase();
        } else if (field === 'createdAt') {
          valA = new Date(a.createdAt).getTime(); valB = new Date(b.createdAt).getTime();
        } else {
          valA = a[field as keyof Lead]; valB = b[field as keyof Lead];
        }
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredLeads.set(filtered);
  }

  sortBy(field: string) {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.applyFilters();
  }

  viewProfile(lead: Lead) {
    if (lead.customerProfile?._id) {
      this.router.navigate(['/dashboard/personnel/profile', lead.customerProfile._id]);
    }
  }

  getFullName(lead: Lead): string {
    const p = lead.customerProfile;
    if (p?.firstName || p?.lastName) {
      return [p.firstName, p.lastName].filter(Boolean).join(' ');
    }
    return lead.customerName || lead.customerPhone;
  }

  getBudgetColor(budget: string): string {
    const colors: Record<string, string> = {
      'UNDER_50K': '#22c55e',
      'FROM_50K_TO_100K': '#84cc16',
      'FROM_100K_TO_200K': '#eab308',
      'FROM_200K_TO_500K': '#f97316',
      'ABOVE_500K': '#ef4444',
    };
    return colors[budget] || '#6b7280';
  }

  getBudgetLabel(budget: string): string {
    const labels: Record<string, string> = {
      'UNDER_50K': '< 50K',
      'FROM_50K_TO_100K': '50K-100K',
      'FROM_100K_TO_200K': '100K-200K',
      'FROM_200K_TO_500K': '200K-500K',
      'ABOVE_500K': '> 500K',
    };
    return labels[budget] || budget;
  }

  getAgentName(lead: Lead): string {
    if (!lead.customerProfile) return '-';
    const p = lead.customerProfile;
    return [p.firstName, p.lastName].filter(x => x).join(' ') || p.phone;
  }
}
