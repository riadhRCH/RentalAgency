import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TransactionsService, Transaction } from '../../services/transactions.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss']
})
export class TransactionDetailComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  transactionForm: FormGroup;
  transaction: Transaction | null = null;
  isLoading = true;
  isSaving = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private transactionsService: TransactionsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.transactionForm = this.fb.group({
      personnelId: [''],
      customerName: ['', Validators.required],
      customerPhone: ['', Validators.required],
      customerEmail: [''],
      identityVerificationStatus: [''],
      financialDetails: this.fb.group({
        rentAmount: [0, [Validators.required, Validators.min(0)]],
        depositAmount: [0, [Validators.required, Validators.min(0)]],
        paymentFrequency: ['']
      }),
      timeline: this.fb.group({
        startDate: ['', Validators.required],
        duration: [12, [Validators.required, Validators.min(1)]],
        endDate: ['', Validators.required],
        renewalDate: ['']
      }),
      metadata: this.fb.group({
        utilityNotes: [''],
        emergencyContact: ['']
      }),
      status: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTransaction(id);
    }
  }

  loadTransaction(id: string): void {
    this.transactionsService.findOne(id).subscribe({
      next: (data) => {
        this.transaction = data;
        this.transactionForm.patchValue({
          ...data,
          personnelId: data.personnelId?._id || data.personnelId,
          customerName: `${data.personnelId?.firstName || ''} ${data.personnelId?.lastName || ''}`.trim(),
          customerPhone: data.personnelId?.phone || '',
          customerEmail: data.personnelId?.email || '',
          timeline: {
            ...data.timeline,
            startDate: new Date(data.timeline.startDate).toISOString().split('T')[0],
            endDate: new Date(data.timeline.endDate).toISOString().split('T')[0],
            renewalDate: data.timeline.renewalDate ? new Date(data.timeline.renewalDate).toISOString().split('T')[0] : ''
          }
        });
        this.isLoading = false;
      },
      error: () => {
        this.error = this.i18n.translate('TRANSACTION_DETAIL.LOAD_FAILED');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.transactionForm.invalid || !this.transaction?._id) {
      return;
    }

    this.isSaving = true;
    this.transactionsService.update(this.transaction._id, this.transactionForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/dashboard/transactions']);
      },
      error: () => {
        this.isSaving = false;
        alert(this.i18n.translate('TRANSACTION_DETAIL.UPDATE_FAILED'));
      }
    });
  }

  closeTransaction(): void {
    if (this.transaction?._id && confirm(this.i18n.translate('CONFIRM.CLOSE_TRANSACTION'))) {
      this.transactionsService.closeTransaction(this.transaction._id).subscribe(() => {
        this.router.navigate(['/dashboard/transactions']);
      });
    }
  }
}
