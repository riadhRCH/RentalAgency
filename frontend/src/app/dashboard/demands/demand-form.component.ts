import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
    { value: '100K_120K', label: '100K – 120K €' },
    { value: '120K_150K', label: '120K – 150K €' },
    { value: '150K_200K', label: '150K – 200K €' },
    { value: '200K_250K', label: '200K – 250K €' },
    { value: '250K_300K', label: '250K – 300K €' },
    { value: '300K_plus', label: '300K+ €' },
  ];

  selectedBedrooms = signal<string[]>([]);
  selectedZones = signal<string[]>([]);
  selectedFeatures = signal<string[]>([]);

  zones = [
    { value: 'Centre-ville', label: 'Centre-ville' },
    { value: 'Quartier résidentiel', label: 'Quartier résidentiel' },
    { value: 'Banlieue', label: 'Banlieue' },
    { value: 'Zone industrielle', label: 'Zone industrielle' },
    { value: 'Proche plage', label: 'Proche plage' },
    { value: 'Proche école', label: 'Proche école' },
    { value: 'Proche commerce', label: 'Proche commerce' },
  ];

  constructor() {
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      additionalNotes: [''],
      budget: ['', Validators.required],
    });
  }

  ngOnInit() {}

  toggleSelection(arr: WritableSignal<string[]>, value: string) {
    const current = arr();
    if (current.includes(value)) {
      arr.set(current.filter((v: string) => v !== value));
    } else {
      arr.set([...current, value]);
    }
  }

  onSubmit() {
    if (this.form.invalid || this.selectedBedrooms().length === 0 || this.selectedZones().length === 0) return;

    this.saving.set(true);
    const formValue = this.form.value;

    this.demandsService.createDemand({
      customerName: formValue.customerName,
      customerEmail: formValue.customerEmail,
      nbBedrooms: this.selectedBedrooms(),
      zones: this.selectedZones(),
      mustHaveFeatures: this.selectedFeatures(),
      additionalNotes: formValue.additionalNotes,
      budget: formValue.budget,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.submitted.set(true);
      },
      error: () => this.saving.set(false),
    });
  }
}
