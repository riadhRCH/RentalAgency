import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RentalsService } from '../../services/rentals.service';
import { LeadsService } from '../../services/leads.service';
import { VisitsService } from '../../services/visits.service';
import { PropertiesService, Property } from '../../services/properties.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-rental-provisioning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe, PhoneInputComponent],
  templateUrl: './rental-provisioning.component.html',
  styleUrls: ['./rental-provisioning.component.scss']
})
export class RentalProvisioningComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  rentalForm: FormGroup;
  isLoading = false;
  properties: Property[] = [];
  sourceInfo: { type: string, id: string } | null = null;
  notification: string | null = null;

  private phonePattern = /^(\+\d{1,3})?0?[0-9]{8}$/;

  constructor(
    private fb: FormBuilder,
    private rentalsService: RentalsService,
    private leadsService: LeadsService,
    private visitsService: VisitsService,
    private propertiesService: PropertiesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.rentalForm = this.fb.group({
      propertyId: ['', Validators.required],
      personnelId: [''],
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
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
        renewalDate: ['']
      }),
      metadata: this.fb.group({
        utilityNotes: [''],
        emergencyContact: ['']
      })
    });

    // Automatically calculate end date when start date or duration changes
    this.rentalForm.get('timeline.startDate')?.valueChanges.subscribe(() => this.updateEndDate());
    this.rentalForm.get('timeline.duration')?.valueChanges.subscribe(() => this.updateEndDate());
  }

  ngOnInit(): void {
    this.loadProperties();
    this.checkQueryParams();
  }

  loadProperties(): void {
    this.propertiesService.getProperties().subscribe(data => {
      this.properties = data.data.filter((p: Property) => p.status === 'available');
    });
  }

  checkQueryParams(): void {
    const leadId = this.route.snapshot.queryParamMap.get('leadId');
    const visitId = this.route.snapshot.queryParamMap.get('visitId');

    if (leadId) {
      this.sourceInfo = { type: 'LEAD', id: leadId };
      this.loadLeadData(leadId);
      this.notification = this.i18n.translate('RENTAL_FORM.NOTIFICATION_LEAD');
    } else if (visitId) {
      this.sourceInfo = { type: 'VISIT', id: visitId };
      this.loadVisitData(visitId);
      this.notification = this.i18n.translate('RENTAL_FORM.NOTIFICATION_VISIT');
    }
  }

  loadLeadData(id: string): void {
    this.leadsService.getLead(id).subscribe(lead => {
      this.rentalForm.patchValue({
        customerName: lead.customerName || '',
        customerPhone: lead.customerPhone || ''
      });
    });
  }

  loadVisitData(id: string): void {
    // Note: VisitsService needs a getVisit method if not already there
    this.visitsService.getVisit(id).subscribe(visit => {
      this.rentalForm.patchValue({
        propertyId: visit.propertyId?._id || visit.propertyId,
        personnelId: visit.visitorId?._id || visit.visitorId,
        customerName: `${visit.visitorId?.firstName || ''} ${visit.visitorId?.lastName || ''}`.trim(),
        customerPhone: visit.visitorId?.phone || ''
      });
    });
  }

  updateEndDate(): void {
    const start = this.rentalForm.get('timeline.startDate')?.value;
    const duration = this.rentalForm.get('timeline.duration')?.value;

    if (start && duration) {
      const endDate = new Date(start);
      endDate.setMonth(endDate.getMonth() + duration);
      this.rentalForm.patchValue({
        timeline: {
          endDate: endDate.toISOString().split('T')[0]
        }
      });
    }
  }

  onSubmit(): void {
    if (this.rentalForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formData = this.rentalForm.value;
    
    if (this.sourceInfo) {
      formData.source = {
        sourceType: this.sourceInfo.type,
        sourceId: this.sourceInfo.id
      };
    } else {
      formData.source = { sourceType: 'DIRECT' };
    }

    this.rentalsService.create(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard/rentals']);
      },
      error: () => {
        this.isLoading = false;
        alert(this.i18n.translate('RENTAL_FORM.CREATE_FAILED'));
      }
    });
  }
}
