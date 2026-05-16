import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VisitsService } from '../../services/visits.service';
import { PropertiesService, Property } from '../../services/properties.service';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-visit-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PublicNavbarComponent,
    PublicFooterComponent
  ],
  templateUrl: './visit-request.component.html',
  styleUrl: './visit-request.component.scss',
})
export class VisitRequestComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private visitsService = inject(VisitsService);
  private propertiesService = inject(PropertiesService);
  private autoSave$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  paramId = '';
  visitId: string | null = null;
  loading = signal(true);
  saving = signal(false);
  submitted = signal(false);

  selectedDate = signal<string>('');
  selectedTime = signal<string>('');

  properties = signal<Property[]>([]);
  selectedProperties = signal<string[]>([]);

  form: FormGroup;

  budgetOptions = [
    { value: '100_120', label: '100 – 120 TND' },
    { value: '120_150', label: '120 – 150 TND' },
    { value: '150_200', label: '150 – 200 TND' },
    { value: '200_250', label: '200 – 250 TND' },
    { value: '250_300', label: '250 – 300 TND' },
  ];

  constructor() {
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern(/^(\+\d{1,3})?0?[0-9]{8}$/)]],
      customerEmail: ['', [Validators.required, Validators.email]],
      preferredContact: ['PHONE', Validators.required],
      purchaseType: [''],
      budget: [''],
    });
  }

  ngOnInit() {
    this.paramId = this.route.snapshot.params['id'];
    this.autoSave$.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(() => this.performAutoSave());
    this.loadVisit();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private triggerAutoSave() {
    if (this.visitId) {
      this.autoSave$.next();
    }
  }

  private loadVisit() {
    this.loading.set(true);
    this.visitsService.getPublicVisit(this.paramId).subscribe({
      next: (visit) => {
        this.visitId = visit._id;
        this.form.patchValue({
          customerName: visit.customerName || '',
          customerPhone: visit.customerPhone || '',
          customerEmail: visit.customerEmail || '',
          preferredContact: visit.preferredContact || 'PHONE',
          purchaseType: visit.purchaseType || '',
          budget: visit.budget || '',
        });
        if (visit.visitDate) {
          const d = new Date(visit.visitDate);
          this.selectedDate.set(d.toISOString().split('T')[0]);
        }
        if (visit.visitTime) {
          this.selectedTime.set(visit.visitTime);
        }
        if (visit.interestedProperties?.length) {
          this.selectedProperties.set(visit.interestedProperties.map((p: any) => p._id || p));
        }
        this.loadActiveProperties(visit.agencyId);
        this.loading.set(false);
        this.form.valueChanges.pipe(
          takeUntil(this.destroy$)
        ).subscribe(() => this.triggerAutoSave());
      },
      error: () => {
        this.visitId = null;
        this.loadActiveProperties(this.paramId);
        this.loading.set(false);
      }
    });
  }

  loadActiveProperties(agencyId: string) {
    this.propertiesService.getActiveProperties(agencyId).subscribe({
      next: (props) => this.properties.set(props || []),
      error: () => this.properties.set([]),
    });
  }

  toggleProperty(id: string) {
    const current = this.selectedProperties();
    if (current.includes(id)) {
      this.selectedProperties.set(current.filter(p => p !== id));
    } else {
      this.selectedProperties.set([...current, id]);
    }
    this.triggerAutoSave();
  }

  onDateChange(value: string) {
    this.selectedDate.set(value);
    console.log('????')
    this.triggerAutoSave();
  }

  onTimeChange(value: string) {
    this.selectedTime.set(value);
    this.triggerAutoSave();
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private buildPayload() {
    const formValue = this.form.value;
    const payload: any = {
      customerName: formValue.customerName,
      customerPhone: formValue.customerPhone,
      customerEmail: formValue.customerEmail,
      preferredContact: formValue.preferredContact,
      purchaseType: formValue.purchaseType || undefined,
      budget: formValue.budget || undefined,
    };
    if (this.selectedDate()) {
      payload.visitDate = this.selectedDate();
    }
    if (this.selectedTime()) {
      payload.visitTime = this.selectedTime();
    }
    if (this.selectedProperties().length > 0) {
      payload.interestedProperties = this.selectedProperties();
    }
    return payload;
  }

  private performAutoSave() {
    if (!this.visitId) return;
    this.visitsService.updatePublicVisit(this.visitId, this.buildPayload()).subscribe();
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.saving.set(true);
    const payload = this.buildPayload();

    const request = this.visitId
      ? this.visitsService.updatePublicVisit(this.visitId, payload)
      : this.visitsService.createPublic({ ...payload, agencyId: this.paramId });

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
}
