import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionsService } from '../../services/transactions.service';
import { PropertiesService } from '../../services/properties.service';
import { PersonnelService } from '../../services/personnel.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { CalendarSelectorComponent } from '../../shared/components/calendar/calendar-selector.component';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';
import { PaymentFrequency } from '../../shared/enums';

interface Transaction {
  _id: string;
  propertyId: any;
  personnelId?: any;
  financialDetails: {
    rentAmount: number;
    paymentFrequency: string;
  };
  timeline: {
    selectedDates: Date[];
  };
  metadata: {
    documents?: string[];
    cinNumber?: string;
    paymentProof?: string;
  };
  agency: {
    name: string;
    paymentMethods: {
      type: string;
      provider: string;
      rib?: string;
      accountNumber?: string;
      accountHolder: string;
      bankName?: string;
    }[];
  };
}

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    CalendarSelectorComponent,
    PublicNavbarComponent,
    PublicFooterComponent
  ],
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss'
})
export class TransactionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private transactionsService = inject(TransactionsService);
  private propertiesService = inject(PropertiesService);
  private personnelService = inject(PersonnelService);
  readonly i18n = inject(I18nService);

  transactionId: string = '';
  transaction = signal<Transaction | null>(null);
  loading = signal(true);
  saving = signal(false);

  // Forms
  customerForm: FormGroup;
  documentsForm: FormGroup;
  paymentForm: FormGroup;

  // File storage
  selectedFiles: { [key: string]: File } = {};

  // Steps
  customerInfoExpanded = signal(true);
  calendarExpanded = signal(false);
  documentsExpanded = signal(false);
  paymentExpanded = signal(false);

  // Step completion
  customerInfoDone = signal(false);
  calendarDone = signal(false);
  documentsDone = signal(false);

  // Calendar data
  propertyCalendarData: any[] = [];
  selectedDatesControl = this.fb.control<Date[]>([]);

  constructor() {
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^(\+216|0)[0-9]{8}$/)]],
      email: ['', [Validators.email]]
    });

    this.documentsForm = this.fb.group({
      cinDocument: [null, Validators.required]
    });

    this.paymentForm = this.fb.group({
      paymentProof: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.transactionId = this.route.snapshot.params['id'];
    this.loadTransaction();
  }

  loadTransaction() {
    this.loading.set(true);
    this.transactionsService.getPublicTransaction(this.transactionId).subscribe({
      next: (transaction: Transaction) => {
        this.transaction.set(transaction);
        this.loadPropertyCalendar();
        this.initializeForms();
        this.autoOpenFirstUndoneStep();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // Handle error
      }
    });
  }

  loadPropertyCalendar() {
    const prop = this.transaction()?.propertyId;
    if (prop && prop.calendarData) {
      this.propertyCalendarData = prop.calendarData;
    }
  }

  initializeForms() {
    const transaction = this.transaction();
    if (transaction?.personnelId) {
      this.customerForm.patchValue({
        firstName: transaction.personnelId.firstName,
        lastName: transaction.personnelId.lastName,
        phone: transaction.personnelId.phone,
        email: transaction.personnelId.email
      });
      this.checkCustomerInfoDone();
    }
  }

  autoOpenFirstUndoneStep() {
    if (!this.customerInfoDone()) {
      this.customerInfoExpanded.set(true);
    } else if (!this.calendarDone()) {
      this.calendarExpanded.set(true);
    } else if (!this.documentsDone()) {
      this.documentsExpanded.set(true);
    } else {
      this.paymentExpanded.set(true);
    }
  }

  toggleSection(section: string) {
    this.customerInfoExpanded.set(section === 'customerInfo' && !this.customerInfoExpanded());
    this.calendarExpanded.set(section === 'calendar' && !this.calendarExpanded());
    this.documentsExpanded.set(section === 'documents' && !this.documentsExpanded());
    this.paymentExpanded.set(section === 'payment' && !this.paymentExpanded());
  }

  checkCustomerInfoDone() {
    this.customerInfoDone.set(this.customerForm.valid);
  }

  checkCalendarDone() {
    const transaction = this.transaction();
    if (transaction?.financialDetails.paymentFrequency === PaymentFrequency.DAILY) {
      this.calendarDone.set((this.selectedDatesControl.value?.length ?? 0) > 0);
    } else {
      this.calendarDone.set(true); // For non-daily, consider done
    }
  }

  checkDocumentsDone() {
    this.documentsDone.set(this.documentsForm.valid);
  }

  onCustomerInfoSubmit() {
    if (this.customerForm.valid) {
      this.saving.set(true);
      const formValue = this.customerForm.value;

      // Create or update personnel
      const personnelData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        email: formValue.email
      };

      this.personnelService.createOrUpdatePersonnel(personnelData).subscribe({
        next: (personnel) => {
          // Update transaction with personnel ID
          this.transactionsService.updatePublicTransaction(this.transactionId, {
            personnelId: personnel._id
          }).subscribe({
            next: () => {
              this.saving.set(false);
              this.customerInfoDone.set(true);
              this.customerInfoExpanded.set(false);
              this.autoOpenFirstUndoneStep();
            },
            error: () => {
              this.saving.set(false);
            }
          });
        },
        error: () => {
          this.saving.set(false);
        }
      });
    }
  }

  onCalendarSubmit() {
    const selectedDates = this.selectedDatesControl.value;
    if (selectedDates && selectedDates.length > 0) {
      this.saving.set(true);
      this.transactionsService.updatePublicTransaction(this.transactionId, {
        timeline: { selectedDates }
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.calendarDone.set(true);
          this.calendarExpanded.set(false);
          this.autoOpenFirstUndoneStep();
        },
        error: () => {
          this.saving.set(false);
        }
      });
    }
  }

  onDocumentsSubmit() {
    if (this.documentsForm.valid && this.selectedFiles['cinDocument']) {
      this.saving.set(true);
      const formData = new FormData();
      formData.append('cinDocument', this.selectedFiles['cinDocument']);

      // For now, just mark as done since file upload handling would need backend support
      // In a real implementation, you'd upload the file and get back a URL
      this.transactionsService.updatePublicTransaction(this.transactionId, {
        metadata: {
          documents: ['cin_document_uploaded'] // Placeholder
        }
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.documentsDone.set(true);
          this.documentsExpanded.set(false);
          this.autoOpenFirstUndoneStep();
        },
        error: () => {
          this.saving.set(false);
        }
      });
    }
  }

  onPaymentSubmit() {
    if (this.paymentForm.valid && this.selectedFiles['paymentProof']) {
      this.saving.set(true);
      const formData = new FormData();
      formData.append('paymentProof', this.selectedFiles['paymentProof']);

      // For now, just mark as done since file upload handling would need backend support
      // In a real implementation, you'd upload the file and get back a URL
      this.transactionsService.updatePublicTransaction(this.transactionId, {
        metadata: {
          paymentProof: 'payment_proof_uploaded' // Placeholder
        }
      }).subscribe({
        next: () => {
          this.saving.set(false);
          // Mark payment as done and close the section
          this.paymentExpanded.set(false);
          // Could navigate to success page or show completion message
        },
        error: () => {
          this.saving.set(false);
        }
      });
    }
  }

  onDatesSelected(dates: Date[]) {
    this.selectedDatesControl.setValue(dates);
    this.checkCalendarDone();
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[fieldName] = file;
      if (fieldName === 'cinDocument') {
        this.documentsForm.patchValue({ cinDocument: file });
        this.checkDocumentsDone();
      } else if (fieldName === 'paymentProof') {
        this.paymentForm.patchValue({ paymentProof: file });
      }
    }
  }
}
