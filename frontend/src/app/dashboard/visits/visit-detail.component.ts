import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VisitsService, VisitRequest } from '../../services/visits.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './visit-detail.component.html',
  styleUrls: ['./visit-detail.component.scss']
})
export class VisitDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private visitsService = inject(VisitsService);
  readonly i18n = inject(I18nService);

  visit = signal<VisitRequest | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadVisit(id);
    }
  }

  loadVisit(id: string) {
    this.loading.set(true);
    this.visitsService.getVisit(id).subscribe({
      next: (data) => {
        this.visit.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'PENDING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'CONFIRMED': return 'text-primary bg-primary/10 border-primary/20';
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'CANCELLED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-white/5 border-white/10';
    }
  }

  openProperty(propertyId?: string) {
    if (propertyId) {
      this.router.navigate(['/dashboard/properties/edit', propertyId]);
    }
  }

  getPropertyPhoto(visit: VisitRequest | null): string {
    return visit?.propertyId?.photos?.[0] || '';
  }
}
