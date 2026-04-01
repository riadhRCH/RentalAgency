import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadsService } from '../../services/leads.service';
import { AgencyService } from '../../services/agency.service';
import { AuthService } from '../../auth/auth.service';
import { RouterModule } from '@angular/router';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {
  private leadsService = inject(LeadsService);
  private agencyService = inject(AgencyService);
  public authService = inject(AuthService);

  stats = {
    totalLeads: 0,
    newLeads: 0,
    activeNumbers: 0,
    conversionRate: 0
  };

  recentLeads: any[] = [];
  loading = signal(false);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    // Fetch leads for stats and recent list
    this.leadsService.getLeads(1, 5, 'NEW').subscribe({
      next: (res) => {
        this.loading.set(false);
        this.stats.totalLeads = res?.total || 0;
        this.recentLeads = res?.data || [];
        console.log('loading', this.loading());
       
      },
      error: () => this.loading.set(false)
    });

    // Fetch active numbers
    this.agencyService.getActiveNumbers().subscribe(nums => {
      this.stats.activeNumbers = Array.isArray(nums) ? nums.length : 0;
    });
  }
}
