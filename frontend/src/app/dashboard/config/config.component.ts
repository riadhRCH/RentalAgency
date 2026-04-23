import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgencyService, VirtualNumber, AgencySettings } from '../../services/agency.service';
import { FormsModule } from '@angular/forms';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { forkJoin } from 'rxjs';

interface AreaCodeOption {
  code: string;
  label: string;
}

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, PhoneInputComponent, TranslatePipe],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  private agencyService = inject(AgencyService);
  private i18n = inject(I18nService);

  areaCodeOptions: AreaCodeOption[] = [
    { code: '212', label: 'Tunisia' },
  ];

  settings: AgencySettings = { forwardingNumber: '', areaCode: '' };
  agencyName = '';
  agencyLogo = '';
  virtualNumbers: VirtualNumber[] = [];
  
  newNumber = {
    areaCode: '',
    label: ''
  };

  loading = signal(true);
  logoUploading = signal(false);
  saving = false;
  provisioning = false;
  message = '';
  error = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      settings: this.agencyService.getSettings(),
      profile: this.agencyService.getProfile(),
    }).subscribe({
      next: ({ settings, profile }) => {
        this.settings = {
          forwardingNumber: settings?.forwardingNumber || '',
          areaCode: this.normalizeAreaCode(settings?.areaCode || '')
        };
        this.agencyName = profile?.name || '';
        this.agencyLogo = profile?.logo || '';
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
      this.error = this.i18n.translate('CONFIG.AREA_CODE_INVALID');
      this.saving = false;
      return;
    }

    forkJoin({
      settings: this.agencyService.updateSettings(this.settings),
      profile: this.agencyService.updateProfile({
        name: this.agencyName.trim(),
        logo: this.agencyLogo.trim()
      }),
    }).subscribe({
      next: ({ profile }) => {
        this.agencyName = profile.name.trim();
        this.agencyLogo = this.agencyLogo.trim();
        this.newNumber.areaCode = this.settings.areaCode;
        this.message = this.i18n.translate('CONFIG.SETTINGS_UPDATED');
        this.saving = false;
      },
      error: () => {
        this.error = this.i18n.translate('CONFIG.SETTINGS_UPDATE_FAILED');
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
      { code, label: this.i18n.translate('CONFIG.SAVED_AREA_CODE') },
      ...this.areaCodeOptions,
    ];
  }

  provisionNumber() {
    this.newNumber.areaCode = this.normalizeAreaCode(this.newNumber.areaCode || this.settings.areaCode);
    if (!this.hasValidAreaCode(this.newNumber.areaCode)) {
      this.error = this.i18n.translate('CONFIG.AREA_CODE_INVALID');
      return;
    }

    this.provisioning = true;
    this.message = '';
    this.error = '';
    
    this.agencyService.provisionNumber(this.newNumber.areaCode, this.newNumber.label).subscribe({
      next: () => {
        this.message = this.i18n.translate('CONFIG.NUMBER_PROVISIONED');
        this.provisioning = false;
        this.newNumber = { areaCode: this.settings.areaCode, label: '' };
        this.loadData();
      },
      error: (err) => {
        this.error = err.error?.message || this.i18n.translate('CONFIG.NUMBER_PROVISION_FAILED');
        this.provisioning = false;
      }
    });
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.logoUploading.set(true);
    this.error = '';

    this.agencyService.uploadLogo(file).subscribe({
      next: (result) => {
        this.agencyLogo = result.url;
        this.logoUploading.set(false);
        input.value = '';
      },
      error: () => {
        this.error = this.i18n.translate('CONFIG.LOGO_UPLOAD_FAILED');
        this.logoUploading.set(false);
        input.value = '';
      }
    });
  }

  clearLogo() {
    this.agencyLogo = '';
  }
}
