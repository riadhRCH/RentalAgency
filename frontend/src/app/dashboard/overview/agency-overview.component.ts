import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AgencyService } from '../../services/agency.service';
import { filter } from 'rxjs/operators';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-agency-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="min-h-screen bg-background-dark text-slate-300">
      <!-- Stats Navigation Header -->
      <div class="sticky top-0 z-30 bg-background-dark/80 backdrop-blur-xl border-b border-white/5 py-8">
        <div class="max-w-7xl mx-auto px-8">
          <div class="flex justify-center">
            <div class="glass-card flex p-1.5 rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
              <button 
                [routerLink]="['leads']" 
                routerLinkActive="bg-primary/10 text-primary border-primary/20 shadow-inner shadow-primary/5"
                class="group relative flex flex-col items-center justify-center py-4 px-10 rounded-xl transition-all duration-300 hover:bg-white/5 min-w-[160px]">
                <span class="text-3xl font-black silver-glow mb-1 tracking-tighter group-hover:scale-110 transition-transform duration-300">
                  {{ stats.totalLeads }}
                </span>
                <span class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                  {{ 'SIDEBAR.LEADS' | translate }}
                </span>
                <div routerLinkActive="opacity-100 scale-100" class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full blur-[2px] opacity-0 scale-50 transition-all duration-300"></div>
              </button>
              
              <div class="w-px h-12 my-auto bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

              <button 
                [routerLink]="['visits']" 
                routerLinkActive="bg-primary/10 text-primary border-primary/20 shadow-inner shadow-primary/5"
                class="group relative flex flex-col items-center justify-center py-4 px-10 rounded-xl transition-all duration-300 hover:bg-white/5 min-w-[160px]">
                <span class="text-3xl font-black silver-glow mb-1 tracking-tighter group-hover:scale-110 transition-transform duration-300">
                  {{ stats.totalVisits }}
                </span>
                <span class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                  {{ 'SIDEBAR.VISITS' | translate }}
                </span>
                <div routerLinkActive="opacity-100 scale-100" class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full blur-[2px] opacity-0 scale-50 transition-all duration-300"></div>
              </button>
              
              <div class="w-px h-12 my-auto bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

              <button 
                [routerLink]="['transactions']" 
                routerLinkActive="bg-primary/10 text-primary border-primary/20 shadow-inner shadow-primary/5"
                class="group relative flex flex-col items-center justify-center py-4 px-10 rounded-xl transition-all duration-300 hover:bg-white/5 min-w-[160px]">
                <span class="text-3xl font-black silver-glow mb-1 tracking-tighter group-hover:scale-110 transition-transform duration-300">
                  {{ stats.totalRentals }}
                </span>
                <span class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                  {{ 'TRANSACTIONS.TITLE' | translate }}
                </span>
                <div routerLinkActive="opacity-100 scale-100" class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full blur-[2px] opacity-0 scale-50 transition-all duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sub-page Content Area -->
      <main class="relative z-0">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .glass-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .silver-glow {
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.2),
                   0 0 20px rgba(255, 255, 255, 0.1);
      background: linear-gradient(to bottom, #ffffff 0%, #a3a3a3 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  `]
})
export class AgencyOverviewComponent implements OnInit {
  private agencyService = inject(AgencyService);
  private router = inject(Router);

  stats = {
    totalLeads: 0,
    totalVisits: 0,
    totalRentals: 0
  };

  ngOnInit() {
    this.loadStats();
    
    // Refresh stats when navigating
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadStats();
    });
  }

  loadStats() {
    this.agencyService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => console.error('Error loading stats', err)
    });
  }
}
