import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VisitsService, VisitRequest } from '../../services/visits.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
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
  notes = signal('');
  saving = signal(false);

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
        this.notes.set(data.notes || '');
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

  getBudgetLabel(budget: string): string {
    const labels: Record<string, string> = {
      '100_120': '100 – 120 TND',
      '120_150': '120 – 150 TND',
      '150_200': '150 – 200 TND',
      '200_250': '200 – 250 TND',
      '250_300': '250 – 300 TND',
      '300_plus': '300+ TND',
    };
    return labels[budget] || budget;
  }

  getPreferredContactLabel(contact: string): string {
    const labels: Record<string, string> = {
      'PHONE': 'Téléphone',
      'EMAIL': 'E-mail',
      'SMS': 'SMS',
    };
    return labels[contact] || contact;
  }

  saveNotes() {
    const visitId = this.visit()?._id;
    if (!visitId) return;
    this.saving.set(true);
    this.visitsService.updateVisit(visitId, { notes: this.notes() }).subscribe({
      next: () => {
        this.visit.update(v => ({ ...v!, notes: this.notes() }));
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }
}
