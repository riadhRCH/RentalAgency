import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadsService } from '../../services/leads.service';
import { AgencyService } from '../../services/agency.service';
import { AuthService } from '../../auth/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
  loading = true;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    // Fetch leads for stats and recent list
    this.leadsService.getLeads(1, 5).subscribe({
      next: (res) => {
        this.stats.totalLeads = res.total;
        this.recentLeads = res.data;
        
        // Count new leads (status === 'NEW')
        this.leadsService.getLeads(1, 100, 'NEW').subscribe(newRes => {
          this.stats.newLeads = newRes.total;
        });
      },
      complete: () => this.loading = false
    });

    // Fetch active numbers
    this.agencyService.getActiveNumbers().subscribe(nums => {
      this.stats.activeNumbers = nums.length;
    });
  }
}
