import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgencyService, VirtualNumber, AgencySettings, AgencyProfile } from '../../services/agency.service';
import { FormsModule } from '@angular/forms';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { AuthService } from '../../auth/auth.service';
import { forkJoin } from 'rxjs';

interface AreaCodeOption {
  code: string;
  label: string;
}

interface ServiceOption {
  value: string;
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
  private authService = inject(AuthService);

  areaCodeOptions: AreaCodeOption[] = [
    { code: '212', label: 'Tunisia' },
  ];

  settings: AgencySettings = { forwardingNumber: '', areaCode: '' };
  agencyName = '';
  agencyLogo = '';
  ownerId?: string;
  services: string[] = ['rental'];
  private initialServices: string[] = [];
  virtualNumbers: VirtualNumber[] = [];
  savingServices = signal(false);
  servicesMessage = '';
  servicesError = '';
  
  serviceOptions: ServiceOption[] = [
    { value: 'rental', label: 'Rental' },
    { value: 'sales', label: 'Sales' },
    { value: 'short_term', label: 'Short Term' },
  ];

  newNumber = {
    areaCode: '',
    label: ''
  };

  loading = signal(true);
  logoUploading = signal(false);
  saving = signal(false);
  provisioning = signal(false);
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
        this.ownerId = profile?.ownerId;
        this.services = profile?.services || ['rental'];
        this.initialServices = [...this.services];
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
    this.saving.set(true);
    this.message = '';
    this.error = '';
    this.settings.areaCode = this.normalizeAreaCode(this.settings.areaCode);

    if (this.settings.areaCode && !this.hasValidAreaCode(this.settings.areaCode)) {
      this.error = this.i18n.translate('CONFIG.AREA_CODE_INVALID');
      this.saving.set(false);
      return;
    }

    forkJoin({
      settings: this.agencyService.updateSettings(this.settings),
      profile: this.agencyService.updateProfile({
        name: this.agencyName.trim(),
        logo: this.agencyLogo.trim(),
      }),
    }).subscribe({
      next: ({ profile }) => {
        this.agencyName = profile.name.trim();
        this.agencyLogo = this.agencyLogo.trim();
        this.newNumber.areaCode = this.settings.areaCode;
        this.message = this.i18n.translate('CONFIG.SETTINGS_UPDATED');
        this.authService.updateAgencyName(profile.name.trim());
        this.saving.set(false);
      },
      error: () => {
        this.error = this.i18n.translate('CONFIG.SETTINGS_UPDATE_FAILED');
        this.saving.set(false);
      }
    });
  }

  toggleService(value: string) {
    if (this.services.includes(value)) {
      this.services = this.services.filter(s => s !== value);
    } else {
      this.services = [...this.services, value];
    }
  }

  get servicesChanged(): boolean {
    if (this.services.length !== this.initialServices.length) return true;
    return this.services.some((s, i) => s !== this.initialServices[i]);
  }

  saveServices() {
    this.savingServices.set(true);
    this.servicesMessage = '';
    this.servicesError = '';

    this.agencyService.updateProfile({ services: this.services }).subscribe({
      next: (profile) => {
        this.initialServices = [...this.services];
        this.servicesMessage = this.i18n.translate('CONFIG.SERVICES_UPDATED') || 'Services updated';
        this.authService.updateAgencyServices(this.services);
      },
      error: () => {
        this.servicesError = this.i18n.translate('CONFIG.SERVICES_UPDATE_FAILED') || 'Failed to update services';
      },
      complete: () => {
        this.savingServices.set(false);
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

    this.provisioning.set(true);
    this.message = '';
    this.error = '';
    
    this.agencyService.provisionNumber(this.newNumber.areaCode, this.newNumber.label).subscribe({
      next: () => {
        this.message = this.i18n.translate('CONFIG.NUMBER_PROVISIONED');
        this.provisioning.set(false);
        this.newNumber = { areaCode: this.settings.areaCode, label: '' };
        this.loadData();
      },
      error: (err) => {
        this.error = err.error?.message || this.i18n.translate('CONFIG.NUMBER_PROVISION_FAILED');
        this.provisioning.set(false);
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
