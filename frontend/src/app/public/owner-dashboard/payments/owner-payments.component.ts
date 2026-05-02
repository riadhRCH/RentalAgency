import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashoutsService, Cashout, CashoutStatus } from '../../../services/cashouts.service';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../i18n/translate.pipe';

@Component({
  selector: 'app-owner-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './owner-payments.component.html',
  styleUrl: './owner-payments.component.scss'
})
export class OwnerPaymentsComponent implements OnInit {
  @Input() token: string = '';
  @Input() properties: any[] = [];
  @Input() ownerId: string = '';
  @Input() agencyId: string = '';
  @Input() transactions: any[] = [];
  @Input() initialCashouts: Cashout[] = [];
  @Input() balance: number = 0;

  private cashoutsService = inject(CashoutsService);

  cashouts = signal<Cashout[]>([]);
  totalBalance = signal(0);
  loading = signal(false);
  cashoutAmount = 0;
  cashoutNotes = '';

  ngOnInit() {
    this.cashouts.set(this.initialCashouts);
    this.totalBalance.set(this.balance);
  }

  loadCashouts() {
    this.cashoutsService.getOwnerCashouts().subscribe({
      next: (res) => this.cashouts.set(res),
      error: (err) => console.error('Error loading cashouts', err)
    });
  }

  calculateBalance() {
    // This is a placeholder. In a real app, you'd fetch transactions from backend
    // for this owner's properties.
    // For now, let's assume balance is provided or calculated from properties.
    this.totalBalance.set(5000); // Dummy value
  }

  requestCashout() {
    if (this.cashoutAmount <= 0) return;
    if (this.cashoutAmount > this.totalBalance()) return;

    this.loading.set(true);
    this.cashoutsService.create({
      amount: this.cashoutAmount,
      notes: this.cashoutNotes,
      agencyId: this.agencyId
    }).subscribe({
      next: (res) => {
        this.cashouts.update(c => [res, ...c]);
        this.cashoutAmount = 0;
        this.cashoutNotes = '';
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error requesting cashout', err);
        this.loading.set(false);
      }
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
