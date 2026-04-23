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
import { TransactionStepsService, TransactionStepKey } from '../../services/transaction-steps.service';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe, PhoneInputComponent, CalendarSelectorComponent],
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss']
})
export class TransactionDetailComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly transactionSteps = inject(TransactionStepsService);
  transactionForm: FormGroup;
  transaction: Transaction | null = null;
  isLoading = signal(true);
  isSaving = false;
  error: string | null = null;
  propertyCalendarData: any[] = [];
  selectedDates: string[] = [];
  selectedDatesControl: FormControl = new FormControl([]);
  propertyExpanded = signal(false);
  timelineExpanded = signal(false);
  customerExpanded = signal(false);
  financialExpanded = signal(false);
  documentsExpanded = signal(false);
  statusExpanded = signal(false);

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
        cinNumber: [''],
        numberOfPersons: [1, [Validators.min(1)]],
        utilityNotes: [''],
        emergencyContact: ['']
      }),
      status: ['']
    });

    this.transactionForm.get('financialDetails.paymentFrequency')?.valueChanges.subscribe(() => {
      this.updateTimelineValidators();
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
              cinNumber: data.metadata?.cinNumber || '',
              numberOfPersons: data.metadata?.numberOfPersons ?? 1,
              utilityNotes: data.metadata?.utilityNotes || '',
              emergencyContact: data.metadata?.emergencyContact || ''
            },
            status: data.status || ''
          });
          this.updateTimelineValidators();
        } catch (error) {
          console.error('Failed to patch transaction form', error);
          this.error = this.i18n.translate('TRANSACTION_DETAIL.LOAD_FAILED');
        } finally {
          this.autoOpenFirstUndoneStep();
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

  private updateTimelineValidators(): void {
    const timelineGroup = this.transactionForm.get('timeline');
    if (!timelineGroup) {
      return;
    }

    const startDateControl = timelineGroup.get('startDate');
    const durationControl = timelineGroup.get('duration');
    const endDateControl = timelineGroup.get('endDate');

    if (this.isDailyPayment()) {
      startDateControl?.clearValidators();
      durationControl?.clearValidators();
      endDateControl?.clearValidators();
    } else {
      startDateControl?.setValidators([Validators.required]);
      durationControl?.setValidators([Validators.required, Validators.min(1)]);
      endDateControl?.setValidators([Validators.required]);
    }

    startDateControl?.updateValueAndValidity({ emitEvent: false });
    durationControl?.updateValueAndValidity({ emitEvent: false });
    endDateControl?.updateValueAndValidity({ emitEvent: false });
  }

  toggleSection(section: TransactionStepKey): void {
    this.propertyExpanded.set(section === 'property' && !this.propertyExpanded());
    this.timelineExpanded.set(section === 'timeline' && !this.timelineExpanded());
    this.customerExpanded.set(section === 'customer' && !this.customerExpanded());
    this.financialExpanded.set(section === 'financial' && !this.financialExpanded());
    this.documentsExpanded.set(section === 'documents' && !this.documentsExpanded());
    this.statusExpanded.set(section === 'status' && !this.statusExpanded());
  }

  isStepDone(step: TransactionStepKey): boolean {
    return this.transactionSteps.isStepDone(step, this.transaction, this.transactionForm.getRawValue());
  }

  getPropertyPrimaryPhoto(): string | null {
    return this.transaction?.propertyId?.photos?.[0] || null;
  }

  getDocumentUrl(): string | null {
    return this.transaction?.metadata?.documents?.[0] || null;
  }

  getPaymentProofUrl(): string | null {
    return this.transaction?.metadata?.paymentProof || null;
  }

  private autoOpenFirstUndoneStep(): void {
    const firstUndoneStep = this.transactionSteps.getFirstUndoneStep(
      this.transaction,
      this.transactionForm.getRawValue(),
    );
    this.toggleSection(firstUndoneStep);
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
    const formValue = this.transactionForm.getRawValue();
    const updatePayload = {
      ...formValue,
      metadata: {
        ...formValue.metadata,
        documents: this.transaction?.metadata?.documents || [],
        paymentProof: this.transaction?.metadata?.paymentProof || '',
      }
    };

    this.transactionsService.update(this.transaction._id, updatePayload).subscribe({
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
