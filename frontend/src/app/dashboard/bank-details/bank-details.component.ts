import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgencyService } from '../../services/agency.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';

interface PaymentMethod {
  type: 'bank' | 'mobile' | 'poste';
  provider: string;
  rib?: string;
  accountNumber?: string;
  accountHolder: string;
  bankName?: string;
}

interface ProviderOption {
  name: string;
  type: 'bank' | 'mobile' | 'poste';
  icon: string;
}

@Component({
  selector: 'app-bank-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './bank-details.component.html',
  styleUrls: ['./bank-details.component.scss']
})
export class BankDetailsComponent implements OnInit {
  private agencyService = inject(AgencyService);
  private fb = inject(FormBuilder);
  private i18n = inject(I18nService);

  paymentMethods: PaymentMethod[] = [];
  providerOptions: ProviderOption[] = [
    { name: 'BIAT', type: 'bank', icon: 'account_balance' },
    { name: 'ATB', type: 'bank', icon: 'account_balance' },
    { name: 'STB', type: 'bank', icon: 'account_balance' },
    { name: 'BH Bank', type: 'bank', icon: 'account_balance' },
    { name: 'UIB', type: 'bank', icon: 'account_balance' },
    { name: 'WafaCash', type: 'mobile', icon: 'smartphone' },
    { name: 'Poste Tunisienne', type: 'poste', icon: 'local_post_office' },
  ];

  addForm: FormGroup = {} as any;
  editingIndex: number | null = null;
  loading = signal(true);
  saving = false;
  message = '';
  error = '';

  ngOnInit() {
    this.addForm = this.fb.group({
      type: ['bank', Validators.required],
      provider: ['', Validators.required],
      rib: [''],
      accountNumber: [''],
      accountHolder: ['', Validators.required],
      bankName: ['']
    });

    this.loadPaymentMethods();
  }

  loadPaymentMethods() {
    this.loading.set(true);
    // Assume agencyService has getPaymentMethods method
    this.agencyService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
        this.loading.set(false);
      },
      error: (err) => {
        this.error = 'Failed to load payment methods';
        this.loading.set(false);
      }
    });
  }

  onTypeChange() {
    const type = this.addForm.get('type')?.value;
    if (type === 'bank') {
      this.addForm.get('rib')?.setValidators(Validators.required);
      this.addForm.get('accountNumber')?.clearValidators();
      this.addForm.get('bankName')?.setValidators(Validators.required);
    } else {
      this.addForm.get('rib')?.clearValidators();
      this.addForm.get('accountNumber')?.setValidators(Validators.required);
      this.addForm.get('bankName')?.clearValidators();
    }
    this.addForm.get('rib')?.updateValueAndValidity();
    this.addForm.get('accountNumber')?.updateValueAndValidity();
    this.addForm.get('bankName')?.updateValueAndValidity();
  }

  addPaymentMethod() {
    if (this.addForm.valid) {
      this.saving = true;
      const method = this.addForm.value;
      this.agencyService.addPaymentMethod(method).subscribe({
        next: () => {
          this.loadPaymentMethods();
          this.addForm.reset({ type: 'bank' });
          this.message = 'Payment method added successfully';
          this.saving = false;
        },
        error: (err) => {
          this.error = 'Failed to add payment method';
          this.saving = false;
        }
      });
    }
  }

  editPaymentMethod(index: number) {
    this.editingIndex = index;
    const method = this.paymentMethods[index];
    this.addForm.patchValue(method);
  }

  updatePaymentMethod() {
    if (this.addForm.valid && this.editingIndex !== null) {
      this.saving = true;
      const method = this.addForm.value;
      this.agencyService.updatePaymentMethod(this.editingIndex, method).subscribe({
        next: () => {
          this.loadPaymentMethods();
          this.addForm.reset({ type: 'bank' });
          this.editingIndex = null;
          this.message = 'Payment method updated successfully';
          this.saving = false;
        },
        error: (err) => {
          this.error = 'Failed to update payment method';
          this.saving = false;
        }
      });
    }
  }

  deletePaymentMethod(index: number) {
    if (confirm('Are you sure you want to delete this payment method?')) {
      this.agencyService.deletePaymentMethod(index).subscribe({
        next: () => {
          this.loadPaymentMethods();
          this.message = 'Payment method deleted successfully';
        },
        error: (err) => {
          this.error = 'Failed to delete payment method';
        }
      });
    }
  }

  cancelEdit() {
    this.editingIndex = null;
    this.addForm.reset({ type: 'bank' });
  }

  getProviderIcon(provider: string): string {
    const option = this.providerOptions.find(o => o.name === provider);
    return option ? option.icon : 'payment';
  }
}