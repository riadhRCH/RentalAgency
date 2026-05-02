import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashoutsService, Cashout, CashoutStatus } from '../../services/cashouts.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-agency-cashouts',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './agency-cashouts.component.html',
  styleUrl: './agency-cashouts.component.scss'
})
export class AgencyCashoutsComponent implements OnInit {
  private cashoutsService = inject(CashoutsService);

  cashouts = signal<Cashout[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadCashouts();
  }

  loadCashouts() {
    this.loading.set(true);
    this.cashoutsService.getAgencyCashouts().subscribe({
      next: (res) => {
        this.cashouts.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading agency cashouts', err);
        this.loading.set(false);
      }
    });
  }

  confirmCashout(id: string) {
    if (!confirm('Are you sure you want to confirm this cashout?')) return;

    this.cashoutsService.confirm(id).subscribe({
      next: () => this.loadCashouts(),
      error: (err) => console.error('Error confirming cashout', err)
    });
  }

  rejectCashout(id: string) {
    if (!confirm('Are you sure you want to reject this cashout?')) return;

    this.cashoutsService.reject(id).subscribe({
      next: () => this.loadCashouts(),
      error: (err) => console.error('Error rejecting cashout', err)
    });
  }

  getStatusClass(status: CashoutStatus) {
    switch (status) {
      case CashoutStatus.PENDING: return 'text-amber-500 bg-amber-500/10';
      case CashoutStatus.CONFIRMED: return 'text-emerald-500 bg-emerald-500/10';
      case CashoutStatus.REJECTED: return 'text-red-500 bg-red-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  }
}
