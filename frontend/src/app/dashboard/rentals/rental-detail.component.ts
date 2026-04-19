import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RentalsService, Rental } from '../../services/rentals.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-rental-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe, PhoneInputComponent],
  templateUrl: './rental-detail.component.html',
  styleUrls: ['./rental-detail.component.scss']
})
export class RentalDetailComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  rentalForm: FormGroup;
  rental: Rental | null = null;
  isLoading = true;
  isSaving = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private rentalsService: RentalsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.rentalForm = this.fb.group({
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
      this.loadRental(id);
    }
  }

  loadRental(id: string): void {
    this.rentalsService.findOne(id).subscribe({
      next: (data) => {
        this.rental = data;
        this.rentalForm.patchValue({
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
        this.error = this.i18n.translate('RENTAL_DETAIL.LOAD_FAILED');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.rentalForm.invalid || !this.rental?._id) {
      return;
    }

    this.isSaving = true;
    this.rentalsService.update(this.rental._id, this.rentalForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/dashboard/rentals']);
      },
      error: () => {
        this.isSaving = false;
        alert(this.i18n.translate('RENTAL_DETAIL.UPDATE_FAILED'));
      }
    });
  }

  closeRental(): void {
    if (this.rental?._id && confirm(this.i18n.translate('CONFIRM.CLOSE_RENTAL'))) {
      this.rentalsService.closeRental(this.rental._id).subscribe(() => {
        this.router.navigate(['/dashboard/rentals']);
      });
    }
  }
}
