import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgencyService, VirtualNumber, AgencySettings } from '../../services/agency.service';
import { FormsModule } from '@angular/forms';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';

interface AreaCodeOption {
  code: string;
  label: string;
}

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, PhoneInputComponent],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  private agencyService = inject(AgencyService);

  areaCodeOptions: AreaCodeOption[] = [
    { code: '212', label: 'Tunisia' },
  ];

  settings: AgencySettings = { forwardingNumber: '', areaCode: '' };
  virtualNumbers: VirtualNumber[] = [];
  
  newNumber = {
    areaCode: '',
    label: ''
  };

  loading = signal(true);
  saving = false;
  provisioning = false;
  message = '';
  error = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.agencyService.getSettings().subscribe({
      next: (s) => {
        this.settings = {
          forwardingNumber: s?.forwardingNumber || '',
          areaCode: this.normalizeAreaCode(s?.areaCode || '')
        };
        this.ensureAreaCodeOptionExists(this.settings.areaCode);
        this.newNumber.areaCode = this.settings.areaCode;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });

    this.agencyService.getActiveNumbers().subscribe(nums => {
      this.virtualNumbers = nums;
    });
  }

  saveSettings() {
    this.saving = true;
    this.message = '';
    this.error = '';
    this.settings.areaCode = this.normalizeAreaCode(this.settings.areaCode);

    if (this.settings.areaCode && !this.hasValidAreaCode(this.settings.areaCode)) {
      this.error = 'Area code must be exactly 3 digits';
      this.saving = false;
      return;
    }

    this.agencyService.updateSettings(this.settings).subscribe({
      next: () => {
        this.newNumber.areaCode = this.settings.areaCode;
        this.message = 'Settings updated successfully';
        this.saving = false;
      },
      error: () => {
        this.error = 'Failed to update settings';
        this.saving = false;
      }
    });
  }

  onAreaCodeInput(value: string, target: 'settings' | 'newNumber') {
    const normalizedValue = this.normalizeAreaCode(value);
    this.ensureAreaCodeOptionExists(normalizedValue);
    if (target === 'settings') {
      this.settings.areaCode = normalizedValue;
      if (!this.newNumber.areaCode) {
        this.newNumber.areaCode = normalizedValue;
      }
      return;
    }

    this.newNumber.areaCode = normalizedValue;
  }

  hasValidAreaCode(value: string) {
    return /^\d{3}$/.test(value);
  }

  private normalizeAreaCode(value: string) {
    return (value || '').replace(/\D/g, '').slice(0, 3);
  }

  private ensureAreaCodeOptionExists(code: string) {
    if (!this.hasValidAreaCode(code) || this.areaCodeOptions.some((option) => option.code === code)) {
      return;
    }

    this.areaCodeOptions = [
      { code, label: 'Saved Area Code' },
      ...this.areaCodeOptions,
    ];
  }

  provisionNumber() {
    this.newNumber.areaCode = this.normalizeAreaCode(this.newNumber.areaCode || this.settings.areaCode);
    if (!this.hasValidAreaCode(this.newNumber.areaCode)) {
      this.error = 'Area code must be exactly 3 digits';
      return;
    }

    this.provisioning = true;
    this.message = '';
    this.error = '';
    
    this.agencyService.provisionNumber(this.newNumber.areaCode, this.newNumber.label).subscribe({
      next: () => {
        this.message = 'Number provisioned successfully';
        this.provisioning = false;
        this.newNumber = { areaCode: this.settings.areaCode, label: '' };
        this.loadData();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to provision number';
        this.provisioning = false;
      }
    });
  }
}
