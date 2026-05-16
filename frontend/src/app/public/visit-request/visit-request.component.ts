import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VisitsService, VisitRequest } from '../../services/visits.service';
import { PropertiesService, Property } from '../../services/properties.service';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';

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
export class VisitRequestComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private visitsService = inject(VisitsService);
  private propertiesService = inject(PropertiesService);

  mode = signal<'create' | 'edit'>('create');
  paramId = '';
  loading = signal(true);
  saving = signal(false);
  submitted = signal(false);

  visitRequest = signal<VisitRequest | null>(null);
  properties = signal<Property[]>([]);
  selectedProperties = signal<string[]>([]);

  form: FormGroup;

  budgetOptions = [
    { value: '100K_120K', label: '100K – 120K €' },
    { value: '120K_150K', label: '120K – 150K €' },
    { value: '150K_200K', label: '150K – 200K €' },
    { value: '200K_250K', label: '200K – 250K €' },
    { value: '250K_300K', label: '250K – 300K €' },
  ];

  constructor() {
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern(/^(\+\d{1,3})?0?[0-9]{8}$/)]],
      customerEmail: ['', [Validators.required, Validators.email]],
      preferredContact: ['PHONE', Validators.required],
      availability: ['', Validators.required],
      purchaseType: [''],
      budget: [''],
    });
  }

  ngOnInit() {
    this.paramId = this.route.snapshot.params['id'];
    this.tryLoadVisit();
  }

  tryLoadVisit() {
    this.loading.set(true);
    this.visitsService.getPublicVisit(this.paramId).subscribe({
      next: (visit) => {
        this.visitRequest.set(visit);
        this.mode.set('edit');
        this.loading.set(false);
      },
      error: () => {
        this.mode.set('create');
        this.loadActiveProperties();
        this.loading.set(false);
      }
    });
  }

  loadActiveProperties() {
    this.propertiesService.getActiveProperties(this.paramId).subscribe({
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
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    const payload: any = {
      agencyId: this.paramId,
      customerName: formValue.customerName,
      customerPhone: formValue.customerPhone,
      customerEmail: formValue.customerEmail,
      preferredContact: formValue.preferredContact,
      availability: formValue.availability,
      purchaseType: formValue.purchaseType || undefined,
      budget: formValue.budget || undefined,
    };

    if (this.selectedProperties().length > 0) {
      payload.interestedProperties = this.selectedProperties();
    }

    this.visitsService.createPublic(payload).subscribe({
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
