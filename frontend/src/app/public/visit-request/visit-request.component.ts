import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VisitsService } from '../../services/visits.service';
import { PersonnelService } from '../../services/personnel.service';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import flatpickr from 'flatpickr';

@Component({
  selector: 'app-visit-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    PublicNavbarComponent,
    PublicFooterComponent,
    PhoneInputComponent
  ],
  templateUrl: './visit-request.component.html',
  styleUrl: './visit-request.component.scss',
   encapsulation: ViewEncapsulation.None  // add this
})
export class VisitRequestComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private visitsService = inject(VisitsService);
  private personnelService = inject(PersonnelService);
  readonly i18n = inject(I18nService);

  @ViewChild('datePickerInput') datePickerInput!: ElementRef;

  visitRequestId: string = '';
  visitRequest = signal<any>(null);
  loading = signal(true);
  saving = signal(false);

  customerForm: FormGroup;
  private fp: any;

  selectedDate = signal<string>('');
  selectedTime = signal<string>('');
  customerInfoExpanded = signal(true);
  customerInfoDone = signal(false);
  visitDateDone = signal(false);
  submitted = signal(false);

  private phonePattern = /^(\+\d{1,3})?0?[0-9]{8}$/;

  constructor() {
    this.customerForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
      email: ['', [Validators.email]],
      notes: [''],
      visitDate: ['']
    });
  }

  ngOnInit() {
    this.visitRequestId = this.route.snapshot.params['id'];
    this.loadVisitRequest();
  }

  ngOnDestroy() {
    if (this.fp) {
      this.fp.destroy();
    }
  }

  loadVisitRequest() {
    this.loading.set(true);
    this.visitsService.getPublicVisit(this.visitRequestId).subscribe({
      next: (visit) => {
        this.visitRequest.set(visit);
        this.initializeForm();
        this.loading.set(false);
        setTimeout(() => this.initFlatpickr());
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private initFlatpickr() {
    if (this.fp || !this.datePickerInput?.nativeElement) return;

    this.fp = flatpickr(this.datePickerInput.nativeElement, {
      disableMobile: true,
      dateFormat: 'Y-m-d',
      minDate: this.today(),
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.selectDate(dateStr, selectedDates[0]);
      },
    });

    const dateVal = this.customerForm.get('visitDate')?.value;
    if (dateVal) {
      this.fp.setDate(dateVal);
    }
  }

  initializeForm() {
    const visit = this.visitRequest();
    if (visit?.customerPhone) {
      this.customerForm.patchValue({ phone: visit.customerPhone });
    }
    if (visit?.customerName) {
      const parts = visit.customerName.split(' ');
      this.customerForm.patchValue({ firstName: parts[0] || '', lastName: parts.slice(1).join(' ') });
    }
    if (visit?.customerEmail) {
      this.customerForm.patchValue({ email: visit.customerEmail });
    }
    if (visit?.notes) {
      this.customerForm.patchValue({ notes: visit.notes });
    }
    if (visit?.visitDate) {
      const d = new Date(visit.visitDate);
      const dateStr = d.toISOString().split('T')[0];
      this.selectedDate.set(dateStr);
      this.customerForm.patchValue({ visitDate: dateStr });
      this.visitDateDone.set(true);
    }
    if (visit?.visitTime) {
      this.selectedTime.set(visit.visitTime);
    }
    this.checkCustomerInfoDone();
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  selectDate(dateStr: string, dateObj?: Date) {
    this.selectedDate.set(dateStr);
    this.customerForm.patchValue({ visitDate: dateStr });
    this.visitDateDone.set(!!dateStr);
    if (dateStr && dateObj) {
      const time = this.selectedTime() || '12:00';
      const [hours, minutes] = time.split(':').map(Number);
      const isoDate = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hours, minutes)).toISOString();
      this.visitsService.updatePublicVisit(this.visitRequestId, { visitDate: isoDate, visitTime: time }).subscribe({
        error: (err) => console.error('Failed to update visit date:', err),
      });
    }
  }

  onTimeChange(time: string) {
    this.selectedTime.set(time);
    const dateStr = this.selectedDate();
    if (dateStr) {
      const [hours, minutes] = time.split(':').map(Number);
      const d = new Date(dateStr + 'T12:00:00');
      const isoDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes)).toISOString();
      this.visitsService.updatePublicVisit(this.visitRequestId, { visitDate: isoDate, visitTime: time }).subscribe({
        error: (err) => console.error('Failed to update visit time:', err),
      });
    }
  }

  openDatePicker() {
    this.fp?.open();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  checkCustomerInfoDone() {
    this.customerInfoDone.set(this.customerForm.valid);
  }

  onSubmit() {
    if (this.customerForm.valid) {
      this.saving.set(true);
      const formValue = this.customerForm.value;

      const personnelData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        email: formValue.email?.trim() || undefined
      };

      this.personnelService.createOrUpdatePersonnel(personnelData).subscribe({
        next: () => {
          const time = this.selectedTime() || '12:00';
          const [hours, minutes] = time.split(':').map(Number);
          const visitDateStr = formValue.visitDate;
          const visitPayload: any = {
            customerName: `${formValue.firstName} ${formValue.lastName}`.trim(),
            customerPhone: formValue.phone,
            customerEmail: formValue.email?.trim() || undefined,
            notes: formValue.notes || undefined,
          };
          if (visitDateStr) {
            const d = new Date(visitDateStr + 'T12:00:00');
            visitPayload.visitDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours, minutes)).toISOString();
            visitPayload.visitTime = time;
          }
          this.visitsService.updatePublicVisit(this.visitRequestId, visitPayload).subscribe({
            next: () => {
              this.saving.set(false);
              this.customerInfoDone.set(true);
              this.submitted.set(true);
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
}
