import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TransactionsService } from '../../services/transactions.service';
import { LeadsService } from '../../services/leads.service';
import { VisitsService } from '../../services/visits.service';
import { PropertiesService, Property } from '../../services/properties.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { CalendarSelectorComponent } from '../../shared/components/calendar/calendar-selector.component';

@Component({
  selector: 'app-transaction-provisioning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe, CalendarSelectorComponent],
  templateUrl: './transaction-provisioning.component.html',
  styleUrls: ['./transaction-provisioning.component.scss']
})
export class TransactionProvisioningComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  transactionForm: FormGroup;
  isLoading = false;
  properties: Property[] = [];
  selectedProperty = signal<Property | undefined>(undefined)
  sourceInfo: { type: string, id: string } | null = null;
  notification: string | null = null;

  constructor(
    private fb: FormBuilder,
    private transactionsService: TransactionsService,
    private leadsService: LeadsService,
    private visitsService: VisitsService,
    private propertiesService: PropertiesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.transactionForm = this.fb.group({
      propertyId: ['', Validators.required],
      personnelId: [''],
      customerName: ['', Validators.required],
      customerPhone: ['', Validators.required],
      customerEmail: [''],
      identityVerificationStatus: ['PENDING'],
      financialDetails: this.fb.group({
        rentAmount: [0, [Validators.required, Validators.min(0)]],
        depositAmount: [0, [Validators.required, Validators.min(0)]],
        paymentFrequency: ['MONTHLY']
      }),
      timeline: this.fb.group({
        startDate: ['', Validators.required],
        duration: [12, [Validators.required, Validators.min(1)]],
        endDate: ['', Validators.required],
        renewalDate: [''],
        selectedDates: [[], []]
      }),
      metadata: this.fb.group({
        utilityNotes: [''],
        emergencyContact: ['']
      })
    });

    // Automatically calculate end date when start date or duration changes
    this.transactionForm.get('timeline.startDate')?.valueChanges.subscribe(() => this.updateEndDate());
    this.transactionForm.get('timeline.duration')?.valueChanges.subscribe(() => this.updateEndDate());
    
    // Update selected property when propertyId changes and auto-fill form
    this.transactionForm.get('propertyId')?.valueChanges.subscribe(v => {
      this.selectedProperty.set(this.properties.find(p => p._id === v) || undefined);
      this.autoFillFormFromProperty();
    });

    effect(() => {
      console.log('this.selectedProperty()', this.selectedProperty())
    })
  }

  ngOnInit(): void {
    this.loadProperties();
    this.checkQueryParams();
  }

  loadProperties(): void {
    this.propertiesService.getProperties().subscribe(data => {
      this.properties = data.data.filter((p: Property) => p.status === 'available');
      console.log('this.properties', this.properties)
    });
  }

  checkQueryParams(): void {
    const leadId = this.route.snapshot.queryParamMap.get('leadId');
    const visitId = this.route.snapshot.queryParamMap.get('visitId');

    if (leadId) {
      this.sourceInfo = { type: 'LEAD', id: leadId };
      this.loadLeadData(leadId);
      this.notification = this.i18n.translate('TRANSACTION_FORM.NOTIFICATION_LEAD');
    } else if (visitId) {
      this.sourceInfo = { type: 'VISIT', id: visitId };
      this.loadVisitData(visitId);
      this.notification = this.i18n.translate('TRANSACTION_FORM.NOTIFICATION_VISIT');
    }
  }

  loadLeadData(id: string): void {
    this.leadsService.getLead(id).subscribe(lead => {
      this.transactionForm.patchValue({
        customerName: lead.customerName || '',
        customerPhone: lead.customerPhone || ''
      });
    });
  }

  loadVisitData(id: string): void {
    // Note: VisitsService needs a getVisit method if not already there
    this.visitsService.getVisit(id).subscribe(visit => {
      this.transactionForm.patchValue({
        propertyId: visit.propertyId?._id || visit.propertyId,
        personnelId: visit.visitorId?._id || visit.visitorId,
        customerName: `${visit.visitorId?.firstName || ''} ${visit.visitorId?.lastName || ''}`.trim(),
        customerPhone: visit.visitorId?.phone || ''
      });
    });
  }

  private autoFillFormFromProperty(): void {
    const property = this.selectedProperty();
    if (!property) return;

    const financialDetails = this.transactionForm.get('financialDetails');
    const currentRentAmount = financialDetails?.get('rentAmount')?.value;
    const currentPaymentFrequency = financialDetails?.get('paymentFrequency')?.value;

    // Auto-fill rentAmount from property price (only if not already set)
    if (!currentRentAmount || currentRentAmount === 0) {
      financialDetails?.patchValue({
        rentAmount: property.price
      });
    }

    // Auto-fill paymentFrequency from property paymentFrequency
    if (!currentPaymentFrequency || currentPaymentFrequency === 'MONTHLY') {
      financialDetails?.patchValue({
        paymentFrequency: property.paymentFrequency || 'MONTHLY'
      });
    }
  }

  updateEndDate(): void {
    const start = this.transactionForm.get('timeline.startDate')?.value;
    const duration = this.transactionForm.get('timeline.duration')?.value;

    if (start && duration) {
      const endDate = new Date(start);
      endDate.setMonth(endDate.getMonth() + duration);
      this.transactionForm.patchValue({
        timeline: {
          endDate: endDate.toISOString().split('T')[0]
        }
      });
    }
  }

  onSelectedDates(dates: Date[]): void {
    const dateStrings = dates.map(d => d.toISOString().split('T')[0]);
    this.transactionForm.patchValue({
      timeline: {
        selectedDates: dateStrings
      }
    });
  }

  getSelectedDatesControl(): FormControl {
    return (this.transactionForm.get('timeline.selectedDates') as FormControl) || new FormControl([]);
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formData = this.transactionForm.value;
    
    if (this.sourceInfo) {
      formData.source = {
        sourceType: this.sourceInfo.type,
        sourceId: this.sourceInfo.id
      };
    } else {
      formData.source = { sourceType: 'DIRECT' };
    }

    this.transactionsService.create(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard/transactions']);
      },
      error: () => {
        this.isLoading = false;
        alert(this.i18n.translate('TRANSACTION_FORM.CREATE_FAILED'));
      }
    });
  }
}
