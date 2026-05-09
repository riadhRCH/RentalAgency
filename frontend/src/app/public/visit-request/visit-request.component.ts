import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VisitsService } from '../../services/visits.service';
import { PersonnelService } from '../../services/personnel.service';
import { I18nService } from '../../i18n/i18n.service';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-visit-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PublicNavbarComponent,
    PublicFooterComponent,
    PhoneInputComponent
  ],
  templateUrl: './visit-request.component.html',
  styleUrl: './visit-request.component.scss'
})
export class VisitRequestComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private visitsService = inject(VisitsService);
  private personnelService = inject(PersonnelService);
  readonly i18n = inject(I18nService);

  visitRequestId: string = '';
  visitRequest = signal<any>(null);
  loading = signal(true);
  saving = signal(false);

  customerForm: FormGroup;

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

  loadVisitRequest() {
    this.loading.set(true);
    this.visitsService.getPublicVisit(this.visitRequestId).subscribe({
      next: (visit) => {
        this.visitRequest.set(visit);
        this.initializeForm();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
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
      this.customerForm.patchValue({ visitDate: d.toISOString().split('T')[0] });
      this.visitDateDone.set(true);
    }
    this.checkCustomerInfoDone();
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  selectDate(dateStr: string) {
    this.customerForm.patchValue({ visitDate: dateStr });
    this.visitDateDone.set(!!dateStr);
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
          this.visitsService.updatePublicVisit(this.visitRequestId, {
            customerName: `${formValue.firstName} ${formValue.lastName}`.trim(),
            customerPhone: formValue.phone,
            customerEmail: formValue.email?.trim() || undefined,
            notes: formValue.notes || undefined,
            visitDate: formValue.visitDate || undefined
          }).subscribe({
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
