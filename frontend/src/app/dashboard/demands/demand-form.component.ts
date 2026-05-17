import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DemandsService } from '../../services/demands.service';

@Component({
  selector: 'app-demand-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './demand-form.component.html',
  styleUrls: ['./demand-form.component.scss'],
})
export class DemandFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private demandsService = inject(DemandsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  demandId: string | null = null;
  loading = signal(true);
  saving = signal(false);
  submitted = signal(false);

  form: FormGroup;

  bedroomOptions = [
    { value: 'Studio', label: 'Studio' },
    { value: 'Une', label: 'Une' },
    { value: 'Deux', label: 'Deux' },
    { value: 'Trois', label: 'Trois' },
    { value: 'Quatre_ou_plus', label: 'Quatre ou plus' },
  ];

  featureOptions = [
    { value: 'Garage', label: 'Garage' },
    { value: 'Piscine', label: 'Piscine' },
    { value: 'Jardin', label: 'Jardin' },
    { value: 'Balcon', label: 'Balcon' },
  ];

  budgetOptions = [
    { value: '100_120', label: '100 – 120 TND' },
    { value: '120_150', label: '120 – 150 TND' },
    { value: '150_200', label: '150 – 200 TND' },
    { value: '200_250', label: '200 – 250 TND' },
    { value: '250_300', label: '250 – 300 TND' },
    { value: '300_plus', label: '300+ TND' },
  ];

  selectedBedrooms = signal<string[]>([]);
  selectedFeatures = signal<string[]>([]);

  constructor() {
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      additionalNotes: [''],
      budget: ['', Validators.required],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.demandId = id;
      this.loadDemand();
    } else {
      this.loading.set(false);
    }
  }

  private loadDemand() {
    this.loading.set(true);
    this.demandsService.getDemand(this.demandId!).subscribe({
      next: (demand) => {
        this.form.patchValue({
          customerName: demand.customerName || '',
          customerEmail: demand.customerEmail || '',
          additionalNotes: demand.additionalNotes || '',
          budget: demand.budget || '',
        });
        this.selectedBedrooms.set(demand.nbBedrooms || []);
        this.selectedFeatures.set(demand.mustHaveFeatures || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleSelection(arr: WritableSignal<string[]>, value: string) {
    const current = arr();
    if (current.includes(value)) {
      arr.set(current.filter((v: string) => v !== value));
    } else {
      arr.set([...current, value]);
    }
  }

  onSubmit() {
    if (this.form.invalid || this.selectedBedrooms().length === 0) return;

    this.saving.set(true);
    const formValue = this.form.value;

    const payload = {
      customerName: formValue.customerName,
      customerEmail: formValue.customerEmail,
      nbBedrooms: this.selectedBedrooms(),
      mustHaveFeatures: this.selectedFeatures(),
      additionalNotes: formValue.additionalNotes,
      budget: formValue.budget,
    };

    const request = this.demandId
      ? this.demandsService.updateDemand(this.demandId, payload)
      : this.demandsService.createDemand(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.submitted.set(true);
      },
      error: () => this.saving.set(false),
    });
  }
}
