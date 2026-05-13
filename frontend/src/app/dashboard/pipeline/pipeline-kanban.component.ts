import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LeadsService, Lead } from '../../services/leads.service';
import { VisitsService, VisitRequest } from '../../services/visits.service';

interface StageColumn {
  key: string;
  label: string;
  icon: string;
  color: string;
  items: (Lead | VisitRequest)[];
}

@Component({
  selector: 'app-pipeline-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pipeline-kanban.component.html',
  styleUrls: ['./pipeline-kanban.component.scss'],
})
export class PipelineKanbanComponent implements OnInit {
  private leadsService = inject(LeadsService);
  private visitsService = inject(VisitsService);

  columns = signal<StageColumn[]>([
    { key: 'PROSPECT', label: 'Prospect', icon: 'person_search', color: '#6b7280', items: [] },
    { key: 'VISITE_A_PLANIFIER', label: 'Visite à planifier', icon: 'event', color: '#3b82f6', items: [] },
  ]);

  totalItems = computed(() => {
    const cols = this.columns();
    return cols[0].items.length + cols[1].items.length;
  });

  private circumference = 2 * Math.PI * 50;

  prospectOffset = computed(() => this.getDonutOffset('PROSPECT'));
  visiteOffset = computed(() => this.getDonutOffset('VISITE_A_PLANIFIER'));

  ngOnInit() {
    this.loadPipeline();
  }

  loadPipeline() {
    forkJoin({
      leads: this.leadsService.getLeads(1, 100),
      visits: this.visitsService.getVisits(1, 100)
    }).subscribe(({ leads, visits }) => {
      const current = this.columns();
      current[0].items = leads.data || [];
      current[1].items = visits.data || [];
      this.columns.set([...current]);
    });
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
      'UNDER_50K': '< 50K €',
      'FROM_50K_TO_100K': '50K-100K €',
      'FROM_100K_TO_200K': '100K-200K €',
      'FROM_200K_TO_500K': '200K-500K €',
      'ABOVE_500K': '> 500K €',
    };
    return labels[budget] || budget;
  }

  getDonutOffset(stage: string): number {
    const cols = this.columns();
    const total = cols[0].items.length + cols[1].items.length;
    if (total === 0) return this.circumference;
    const count = stage === 'PROSPECT'
      ? cols[0].items.length
      : cols[1].items.length;
    const ratio = count / total;
    return this.circumference * (1 - ratio);
  }

  getVisitStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': '#f59e0b',
      'CONFIRMED': '#22c55e',
      'COMPLETED': '#3b82f6',
      'CANCELLED': '#ef4444',
    };
    return colors[status] || '#6b7280';
  }

  getLeadItems(column: StageColumn): Lead[] {
    return column.items as Lead[];
  }

  getVisitItems(column: StageColumn): VisitRequest[] {
    return column.items as VisitRequest[];
  }

  getVisitStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmé',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé',
    };
    return labels[status] || status;
  }
}
