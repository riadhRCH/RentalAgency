import { Component, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
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
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
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
    numberOfPersons?: number;
    paymentProof?: string;
  };
  agency: {
    name: string;
    paymentMethods: {
      type: 'bank' | 'mobile' | 'poste';
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
    PublicFooterComponent,
    PhoneInputComponent
  ],
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss'
})
export class TransactionComponent implements OnInit, OnDestroy {
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
  documentUploading = signal(false);
  paymentUploading = signal(false);
  cinDocumentPreview = signal<string | null>(null);
  paymentProofPreview = signal<string | null>(null);

  // Forms
  customerForm: FormGroup;
  documentsForm: FormGroup;
  paymentForm: FormGroup;

  // File storage
  selectedFiles: { [key: string]: File } = {};

  // Steps
  customerInfoExpanded = signal(false);
  calendarExpanded = signal(false);
  documentsExpanded = signal(false);
  paymentExpanded = signal(false);

  // Step completion
  customerInfoDone = signal(false);
  calendarDone = signal(false);
  documentsDone = signal(false);

  private phonePattern = /^(\+\d{1,3})?0?[0-9]{8}$/;

  // Calendar data
  propertyCalendarData: any[] = [];
  selectedDatesControl = this.fb.control<Date[]>([]);
  private readonly objectPreviewUrls = new Set<string>();

  constructor() {
    this.customerForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
      email: ['', [Validators.email]],
      cinNumber: ['', Validators.required],
      numberOfPersons: [1, [Validators.required, Validators.min(1)]]
    });

    this.documentsForm = this.fb.group({
      cinDocument: [null, Validators.required]
    });

    this.paymentForm = this.fb.group({
      paymentProof: [null, Validators.required]
    });

    effect(() => {
      console.log('this.customerInfoDone()', this.customerInfoDone())
      console.log('this.calendarDone()', this.calendarDone())
      console.log('this.documentsDone()', this.documentsDone())
    })
  }

  ngOnInit() {
    this.transactionId = this.route.snapshot.params['id'];
    this.loadTransaction();
  }

  ngOnDestroy() {
    this.revokeObjectPreviewUrls();
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
    if (transaction?.financialDetails?.paymentFrequency === PaymentFrequency.DAILY) {
      const selectedDates = transaction.timeline?.selectedDates ?? [];
      this.selectedDatesControl.setValue(selectedDates);
      this.checkCalendarDone();
    }

    if (transaction?.personnelId) {
      this.customerForm.patchValue({
        firstName: transaction.personnelId.firstName,
        lastName: transaction.personnelId.lastName,
        phone: transaction.personnelId.phone,
        email: transaction.personnelId.email,
        cinNumber: transaction.metadata?.cinNumber || '',
        numberOfPersons: transaction.metadata?.numberOfPersons ?? 1
      });
    } else {
      this.customerForm.patchValue({
        cinNumber: transaction?.metadata?.cinNumber || '',
        numberOfPersons: transaction?.metadata?.numberOfPersons ?? 1
      });
    }

    if (transaction?.metadata?.documents?.length) {
      const cinDocument = transaction.metadata.documents[0];
      this.documentsForm.patchValue({ cinDocument });
      this.cinDocumentPreview.set(cinDocument);
    }

    if (transaction?.metadata?.paymentProof) {
      const paymentProof = transaction.metadata.paymentProof;
      this.paymentForm.patchValue({ paymentProof });
      this.paymentProofPreview.set(paymentProof);
    }

    this.checkCustomerInfoDone();
    this.checkDocumentsDone();
  }

  autoOpenFirstUndoneStep() {
    const isDailyPayment = this.isDailyPayment();

    if (isDailyPayment && !this.calendarDone()) {
      this.calendarExpanded.set(true);
    } else if (!this.customerInfoDone()) {
      this.customerInfoExpanded.set(true);
      this.customerForm.markAllAsTouched();
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
    console.log('this.customerForm.valid', this.customerForm.valid, this.customerForm)
    console.log('this.isCustomerPhoneValid', this.isCustomerPhoneValid())
    this.customerInfoDone.set(this.customerForm.valid || this.isCustomerPhoneValid());
  }

  private isCustomerPhoneValid(): boolean {
    const phone = this.customerForm.get('phone')?.value || this.transaction()?.personnelId?.phone;
    return !!phone && this.phonePattern.test(phone);
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
    const hasUploadedDocument = !!this.transaction()?.metadata?.documents?.length;
    this.documentsDone.set(this.documentsForm.valid || hasUploadedDocument);
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
        email: formValue.email?.trim() || undefined
      };

      this.personnelService.createOrUpdatePersonnel(personnelData).subscribe({
        next: (personnel) => {
          // Update transaction with personnel ID
          this.transactionsService.updatePublicTransaction(this.transactionId, {
            personnelId: personnel._id,
            metadata: {
              cinNumber: formValue.cinNumber,
              numberOfPersons: Number(formValue.numberOfPersons)
            }
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
    if (this.documentsDone() && !this.documentUploading()) {
      this.documentsExpanded.set(false);
      this.autoOpenFirstUndoneStep();
    }
  }

  onPaymentSubmit() {
    if (this.paymentForm.valid && !this.paymentUploading()) {
      this.paymentExpanded.set(false);
      this.router.navigate(['/thank-you']);
    }
  }

  onDatesSelected(dates: Date[]) {
    this.selectedDatesControl.setValue(dates);
    this.checkCalendarDone();
  }

  getSelectedDatesAsStrings(): string[] {
    const dates = this.selectedDatesControl.value || [];
    return dates.map(date => {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      return date as string;
    });
  }

  isDailyPayment(): boolean {
    return this.transaction()?.financialDetails?.paymentFrequency === PaymentFrequency.DAILY;
  }

  getSelectedDaysCount(): number {
    return this.selectedDatesControl.value?.length ?? this.transaction()?.timeline?.selectedDates?.length ?? 0;
  }

  getDailyRate(): number {
    return Number(this.transaction()?.financialDetails?.rentAmount ?? 0);
  }

  getTotalAmountToPay(): number {
    if (this.isDailyPayment()) {
      return this.getSelectedDaysCount() * this.getDailyRate();
    }

    return this.getDailyRate();
  }

  getGuaranteeAmount(): number {
    return this.getTotalAmountToPay() * 0.2;
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  getPaymentMethodLogo(method: Transaction['agency']['paymentMethods'][number]): string {
    if (method.type === 'poste') {
      return '/assets/payment-providers/poste-tunisienne.svg';
    }

    const normalized = `${method.provider || ''} ${method.bankName || ''}`.toLowerCase();

    if (normalized.includes('biat')) {
      return '/assets/payment-providers/biat.svg';
    }
    if (normalized.includes('atb')) {
      return '/assets/payment-providers/atb.svg';
    }
    if (normalized.includes('stb')) {
      return '/assets/payment-providers/stb.svg';
    }
    if (normalized.includes('bh')) {
      return '/assets/payment-providers/bh-bank.svg';
    }
    if (normalized.includes('uib')) {
      return '/assets/payment-providers/uib.svg';
    }
    if (normalized.includes('wafa')) {
      return '/assets/payment-providers/wafacash.svg';
    }

    return '/assets/payment-providers/generic-provider.svg';
  }

  getPaymentMethodBadge(method: Transaction['agency']['paymentMethods'][number]): string {
    if (method.type === 'poste') {
      return this.i18n.translate('TRANSACTION.POSTAL_ACCOUNT');
    }

    if (method.type === 'bank') {
      return this.i18n.translate('TRANSACTION.BANK_TRANSFER');
    }

    return method.type;
  }

  onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[fieldName] = file;
      if (fieldName === 'cinDocument') {
        this.documentsForm.patchValue({ cinDocument: file });
        this.setPreviewFromFile(fieldName, file);
        this.uploadTransactionFile(file, 'document');
      } else if (fieldName === 'paymentProof') {
        this.paymentForm.patchValue({ paymentProof: file });
        this.setPreviewFromFile(fieldName, file);
        this.uploadTransactionFile(file, 'payment-proof');
      }
    }
  }

  private uploadTransactionFile(file: File, kind: 'document' | 'payment-proof') {
    if (kind === 'document') {
      this.documentUploading.set(true);
    } else {
      this.paymentUploading.set(true);
    }

    this.transactionsService.uploadFile(file).subscribe({
      next: (uploadResult) => {
        const transactionPatch = {
          metadata: {
            cinNumber: this.customerForm.get('cinNumber')?.value || this.transaction()?.metadata?.cinNumber,
            numberOfPersons: Number(this.customerForm.get('numberOfPersons')?.value ?? this.transaction()?.metadata?.numberOfPersons ?? 1),
            documents:
              kind === 'document'
                ? [uploadResult.url]
                : (this.transaction()?.metadata?.documents ?? []),
            paymentProof:
              kind === 'payment-proof'
                ? uploadResult.url
                : this.transaction()?.metadata?.paymentProof,
          }
        };

        this.transactionsService.updatePublicTransaction(this.transactionId, transactionPatch).subscribe({
          next: () => {
            const currentTransaction = this.transaction();
            if (currentTransaction) {
              const nextMetadata = {
                ...currentTransaction.metadata,
                ...transactionPatch.metadata,
              };
              this.transaction.set({
                ...currentTransaction,
                metadata: nextMetadata,
              });
            }

            if (kind === 'document') {
              this.documentsForm.patchValue({ cinDocument: uploadResult.url });
              this.cinDocumentPreview.set(uploadResult.url);
              this.documentUploading.set(false);
              this.checkDocumentsDone();
            } else {
              this.paymentForm.patchValue({ paymentProof: uploadResult.url });
              this.paymentProofPreview.set(uploadResult.url);
              this.paymentUploading.set(false);
            }
          },
          error: () => {
            if (kind === 'document') {
              this.documentsForm.patchValue({ cinDocument: null });
              this.documentUploading.set(false);
              this.checkDocumentsDone();
            } else {
              this.paymentForm.patchValue({ paymentProof: null });
              this.paymentUploading.set(false);
            }
          }
        });
      },
      error: () => {
        if (kind === 'document') {
          this.documentsForm.patchValue({ cinDocument: null });
          this.documentUploading.set(false);
          this.checkDocumentsDone();
        } else {
          this.paymentForm.patchValue({ paymentProof: null });
          this.paymentUploading.set(false);
        }
      }
    });
  }

  private setPreviewFromFile(fieldName: string, file: File) {
    const currentPreview =
      fieldName === 'cinDocument' ? this.cinDocumentPreview() : this.paymentProofPreview();

    if (currentPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(currentPreview);
      this.objectPreviewUrls.delete(currentPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    this.objectPreviewUrls.add(previewUrl);

    if (fieldName === 'cinDocument') {
      this.cinDocumentPreview.set(previewUrl);
      return;
    }

    this.paymentProofPreview.set(previewUrl);
  }

  private revokeObjectPreviewUrls() {
    for (const previewUrl of this.objectPreviewUrls) {
      URL.revokeObjectURL(previewUrl);
    }
    this.objectPreviewUrls.clear();
  }

  isImageDocument(source: string | null, fieldName?: string): boolean {
    if (!source) {
      return false;
    }

    const selectedFile = fieldName ? this.selectedFiles[fieldName] : undefined;

    if (source.startsWith('blob:') && selectedFile) {
      return selectedFile.type.startsWith('image/');
    }

    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(source);
  }

  isPdfDocument(source: string | null, fieldName?: string): boolean {
    if (!source) {
      return false;
    }

    const selectedFile = fieldName ? this.selectedFiles[fieldName] : undefined;
    if (source.startsWith('blob:') && selectedFile) {
      return selectedFile.type === 'application/pdf';
    }

    return /\.pdf(\?|$)/i.test(source);
  }

  getDocumentFileName(source: string | null, fieldName: string): string {
    const selectedFile = this.selectedFiles[fieldName];
    if (selectedFile) {
      return selectedFile.name;
    }

    if (!source) {
      return '';
    }

    try {
      const parsed = new URL(source, window.location.origin);
      const path = parsed.pathname.split('/').filter(Boolean).pop();
      return path || 'document';
    } catch {
      return source.split('/').filter(Boolean).pop() || 'document';
    }
  }
}
