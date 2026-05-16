import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DemandsService, Demand } from '../../services/demands.service';
import { PublicNavbarComponent } from '../../shared/components/public-navbar/public-navbar.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-demand-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PublicNavbarComponent,
    PublicFooterComponent,
    TranslatePipe,
  ],
  templateUrl: './demand-form.component.html',
  styleUrl: './demand-form.component.scss',
})
export class DemandFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private demandsService = inject(DemandsService);

  demandId = '';
  loading = signal(true);
  saving = signal(false);
  submitted = signal(false);

  demand = signal<Demand | null>(null);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      budget: [''],
      additionalNotes: [''],
    });
  }

  ngOnInit() {
    this.demandId = this.route.snapshot.params['id'];
    if (this.demandId) {
      this.loadDemand();
    } else {
      this.loading.set(false);
    }
  }

  loadDemand() {
    this.loading.set(true);
    this.demandsService.getPublicDemand(this.demandId).subscribe({
      next: (demand) => {
        this.demand.set(demand);
        if (demand.customerName) {
          this.form.patchValue({
            customerName: demand.customerName,
            customerEmail: demand.customerEmail,
            budget: demand.budget,
            additionalNotes: demand.additionalNotes,
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    this.demandsService.updatePublicDemand(this.demandId, {
      customerName: formValue.customerName,
      customerEmail: formValue.customerEmail,
      budget: formValue.budget || undefined,
      additionalNotes: formValue.additionalNotes || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
