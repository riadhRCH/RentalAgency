import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TransactionsService, Transaction } from '../../services/transactions.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent, TranslatePipe],
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.scss']
})
export class TransactionsListComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  isLoading = signal(true);
  error: string | null = null;
  paymentFilter = 'ALL';
  completionFilter = 'ALL';
  lifecycleFilter = 'ALL';

  constructor(public router: Router, private transactionsService: TransactionsService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading.set(true);
    this.transactionsService.findAll().subscribe({
      next: (data) => {
        this.transactions = data;
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error = this.i18n.translate('TRANSACTIONS.LOAD_FAILED');
        this.isLoading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CURRENT': return 'bg-green-100 text-green-800';
      case 'EXPIRING_SOON': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPaymentBadgeClass(status: string | undefined): string {
    return status === 'PAID'
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-orange-100 text-orange-800';
  }

  applyFilters(): void {
    this.filteredTransactions = this.transactions.filter((transaction) => {
      const matchesPayment =
        this.paymentFilter === 'ALL' || transaction.completion?.paymentStatus === this.paymentFilter;

      const matchesCompletion =
        this.completionFilter === 'ALL'
        || (this.completionFilter === 'COMPLETE' && !!transaction.completion?.isComplete)
        || (this.completionFilter === 'INCOMPLETE' && !transaction.completion?.isComplete);

      const matchesLifecycle =
        this.lifecycleFilter === 'ALL' || transaction.status === this.lifecycleFilter;

      return matchesPayment && matchesCompletion && matchesLifecycle;
    });
  }

  onFilterChange(type: 'payment' | 'completion' | 'lifecycle', value: string): void {
    if (type === 'payment') {
      this.paymentFilter = value;
    } else if (type === 'completion') {
      this.completionFilter = value;
    } else {
      this.lifecycleFilter = value;
    }

    this.applyFilters();
  }

  closeTransaction(id: string): void {
    if (confirm(this.i18n.translate('CONFIRM.CLOSE_TRANSACTION_AND_RELEASE'))) {
      this.transactionsService.closeTransaction(id).subscribe(() => {
        this.loadTransactions();
      });
    }
  }

  deleteTransaction(id: string): void {
    if (confirm(this.i18n.translate('CONFIRM.DELETE_TRANSACTION'))) {
      this.transactionsService.delete(id).subscribe(() => {
        this.loadTransactions();
      });
    }
  }

  getTransactionStatusLabel(status: string) {
    return this.i18n.translate(`COMMON.${status}`);
  }

  onNewTransaction() {
    this.router.navigate(['/dashboard/transactions/provision'])
  }

  copyTransactionLink(id: string): void {
    const url = `${window.location.origin}/transaction/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(this.i18n.translate('TRANSACTIONS.LINK_COPIED'));
    });
  }

  viewTransaction(transactionId?: string): void {
    this.router.navigate(['/dashboard/transactions', transactionId]);
  }
}
