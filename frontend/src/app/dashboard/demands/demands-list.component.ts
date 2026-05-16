import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DemandsService, Demand } from '../../services/demands.service';
import { PersonnelCardComponent } from '../../shared/components/personnel-card/personnel-card.component';

@Component({
  selector: 'app-demands-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PersonnelCardComponent],
  templateUrl: './demands-list.component.html',
  styleUrls: ['./demands-list.component.scss'],
})
export class DemandsListComponent implements OnInit {
  private demandsService = inject(DemandsService);
  private router = inject(Router);

  demands: Demand[] = [];
  loading = signal(true);
  currentPage = 1;
  totalPages = 1;

  ngOnInit() {
    this.loadDemands();
  }

  loadDemands(page = 1) {
    this.loading.set(true);
    this.demandsService.getDemands(page, 10).subscribe({
      next: (res) => {
        this.demands = res?.data || [];
        this.totalPages = res?.totalPages || 1;
        this.currentPage = res?.page || 1;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'NEW': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'CONTACTED': return 'text-primary bg-primary/10 border-primary/20';
      case 'MATCHED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'CLOSED': return 'text-slate-500 bg-white/5 border-white/10';
      default: return 'text-slate-400 bg-white/5 border-white/10';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'NEW': return 'Nouveau';
      case 'CONTACTED': return 'Contacté';
      case 'MATCHED': return 'Correspondance trouvée';
      case 'CLOSED': return 'Clôturé';
      default: return status;
    }
  }

  getBudgetLabel(budget: string): string {
    const labels: Record<string, string> = {
      '100K_120K': '100K – 120K €',
      '120K_150K': '120K – 150K €',
      '150K_200K': '150K – 200K €',
      '200K_250K': '200K – 250K €',
      '250K_300K': '250K – 300K €',
      '300K_plus': '300K+ €',
    };
    return labels[budget] || budget;
  }

  deleteDemand(id: string) {
    if (confirm('Supprimer cette demande ?')) {
      this.demandsService.deleteDemand(id).subscribe(() => {
        this.loadDemands(this.currentPage);
      });
    }
  }
}
