import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TransactionsService, Transaction } from '../../services/transactions.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { CalendarSelectorComponent } from '../../shared/components/calendar/calendar-selector.component';
import { PropertiesService } from '../../services/properties.service';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe, PhoneInputComponent, CalendarSelectorComponent],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss']
})
export class TransactionDetailComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  transactionForm: FormGroup;
  transaction: Transaction | null = null;
  isLoading = signal(true);
  isSaving = false;
  error: string | null = null;
  propertyCalendarData: any[] = [];
  selectedDates: string[] = [];
  selectedDatesControl: FormControl = new FormControl([]);

  constructor(
    private fb: FormBuilder,
    private transactionsService: TransactionsService,
    private propertiesService: PropertiesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.transactionForm = this.fb.group({
      personnelId: [''],
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern(/^(\+\d{1,3})?0?[0-9]{8}$/)]],
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
        renewalDate: [''],
        selectedDates: [[]]
      }),
      metadata: this.fb.group({
        utilityNotes: [''],
        emergencyContact: ['']
      }),
      status: ['']
    });
  }

  private formatDateForInput(date: string | Date | undefined | null): string {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString().split('T')[0];
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
        const timeline = data.timeline ?? {};

        // Load property calendar data if payment is daily
        if (data.financialDetails?.paymentFrequency === 'DAILY' && data.propertyId?._id) {
          this.loadPropertyCalendarData(data.propertyId._id);
        }

        // Handle selected dates for daily payments
        if (data.financialDetails?.paymentFrequency === 'DAILY' && timeline.selectedDates) {
          this.selectedDates = timeline.selectedDates.map((date: string | Date) =>
            typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0]
          );
          this.selectedDatesControl.setValue(this.selectedDates);
        }

        try {
          this.transactionForm.patchValue({
            personnelId: data.personnelId?._id || data.personnelId,
            customerName: `${data.personnelId?.firstName || ''} ${data.personnelId?.lastName || ''}`.trim(),
            customerPhone: data.personnelId?.phone || '',
            customerEmail: data.personnelId?.email || '',
            identityVerificationStatus: data.identityVerificationStatus || '',
            financialDetails: {
              rentAmount: data.financialDetails?.rentAmount ?? 0,
              depositAmount: data.financialDetails?.depositAmount ?? 0,
              paymentFrequency: data.financialDetails?.paymentFrequency || ''
            },
            timeline: {
              startDate: this.formatDateForInput(timeline.startDate),
              duration: timeline.duration ?? 12,
              endDate: this.formatDateForInput(timeline.endDate),
              renewalDate: this.formatDateForInput(timeline.renewalDate),
              selectedDates: this.selectedDates
            },
            metadata: {
              utilityNotes: data.metadata?.utilityNotes || '',
              emergencyContact: data.metadata?.emergencyContact || ''
            },
            status: data.status || ''
          });
        } catch (error) {
          console.error('Failed to patch transaction form', error);
          this.error = this.i18n.translate('TRANSACTION_DETAIL.LOAD_FAILED');
        } finally {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.error = this.i18n.translate('TRANSACTION_DETAIL.LOAD_FAILED');
        this.isLoading.set(false);
      }
    });
  }

  private loadPropertyCalendarData(propertyId: string): void {
    this.propertiesService.getProperty(propertyId).subscribe({
      next: (property: any) => {
        this.propertyCalendarData = property.calendarData || [];
      },
      error: (error: any) => {
        console.error('Failed to load property calendar data', error);
      }
    });
  }

  isDailyPayment(): boolean {
    return this.transactionForm.get('financialDetails.paymentFrequency')?.value === 'DAILY';
  }

  onDatesSelected(dates: Date[]): void {
    this.selectedDates = dates.map(date => date.toISOString().split('T')[0]);
    this.selectedDatesControl.setValue(this.selectedDates);
    // Update the form with selected dates
    const timeline = this.transactionForm.get('timeline');
    if (timeline) {
      timeline.patchValue({
        selectedDates: this.selectedDates
      });
    }
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

  openContractEditor(): void {
    if (!this.transaction?._id) {
      return;
    }

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/dashboard/transactions', this.transaction._id, 'contract'])
    );

     this.router.navigate(['/dashboard/transactions', this.transaction._id, 'contract']);
  }
}
