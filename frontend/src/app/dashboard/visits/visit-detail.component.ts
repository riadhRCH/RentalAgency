import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VisitsService, VisitRequest } from '../../services/visits.service';
import { PropertiesService, Property } from '../../services/properties.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-visit-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe],
  templateUrl: './visit-detail.component.html',
  styleUrls: ['./visit-detail.component.scss']
})
export class VisitDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private visitsService = inject(VisitsService);
  private propertiesService = inject(PropertiesService);
  readonly i18n = inject(I18nService);
  private autoSave$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  visitId: string | null = null;
  visit = signal<VisitRequest | null>(null);
  loading = signal(true);
  saving = signal(false);

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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.visitId = id;
      this.loadVisit(id);
    }
    this.autoSave$.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(() => this.performAutoSave());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private triggerAutoSave() {
    this.autoSave$.next();
  }

  private loadVisit(id: string) {
    this.loading.set(true);
    this.visitsService.getVisit(id).subscribe({
      next: (visit) => {
        this.visit.set(visit);
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
        this.loadActiveProperties('');
        this.loading.set(false);
      }
    });
  }

  loadActiveProperties(agencyId: string) {
    if (!agencyId) return;
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
    this.visitsService.updateVisit(this.visitId, this.buildPayload()).subscribe();
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.visitsService.updateVisit(this.visitId!, this.buildPayload()).subscribe({
      next: () => this.saving.set(false),
      error: () => this.saving.set(false)
    });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'PENDING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'CONFIRMED': return 'text-primary bg-primary/10 border-primary/20';
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'CANCELLED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-white/5 border-white/10';
    }
  }

  getBudgetLabel(budget: string): string {
    const labels: Record<string, string> = {
      '100_120': '100 – 120 TND',
      '120_150': '120 – 150 TND',
      '150_200': '150 – 200 TND',
      '200_250': '200 – 250 TND',
      '250_300': '250 – 300 TND',
      '300_plus': '300+ TND',
    };
    return labels[budget] || budget;
  }

  getPreferredContactLabel(contact: string): string {
    const labels: Record<string, string> = {
      'PHONE': 'Téléphone',
      'EMAIL': 'E-mail',
      'SMS': 'SMS',
    };
    return labels[contact] || contact;
  }
}
