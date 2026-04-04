import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LeadsService } from '../../../services/leads.service';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';
import { TranslatePipe } from '../../../i18n/translate.pipe';

@Component({
  selector: 'app-add-lead',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, PhoneInputComponent, TranslatePipe],
  templateUrl: './add-lead.component.html',
  styleUrls: ['./add-lead.component.scss']
})
export class AddLeadComponent {
  private fb = inject(FormBuilder);
  private leadsService = inject(LeadsService);
  private router = inject(Router);

  leadForm: FormGroup;
  loading = signal(false);
  tagInput = '';
  tags = signal<string[]>([]);

  constructor() {
    this.leadForm = this.fb.group({
      customerName: [''],
      customerPhone: ['', [Validators.required]],
      notes: ['']
    });
  }

  addTag() {
    const tag = this.tagInput.trim();
    if (tag && !this.tags().includes(tag)) {
      this.tags.update(t => [...t, tag]);
      this.tagInput = '';
    }
  }

  removeTag(tag: string) {
    this.tags.update(t => t.filter(item => item !== tag));
  }

  onSubmit() {
    if (this.leadForm.valid) {
      this.loading.set(true);
      const formData = {
        ...this.leadForm.value,
        tags: this.tags()
      };
      
      this.leadsService.createLead(formData).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard/leads']);
        },
        error: (err) => {
          this.loading.set(false);
          console.error('Error creating lead', err);
        }
      });
    } else {
      this.leadForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard/leads']);
  }
}
