import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Router } from '@angular/router';

export interface Country {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
}

const COUNTRIES: Country[] = [
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳', dialCode: '+216' },
];

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './phone-input.component.html',
  styleUrls: ['./phone-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ]
})
export class PhoneInputComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'Phone number';
  @Input() required: boolean = false;
  @Input() personnelId?: string;
  @Input() preferredContact?: string = 'PHONE';
  @Input() personnelEmail?: string;
  @Input() personnelInstagram?: string;
  @Input() personnelFacebook?: string;
  @Input() personnelTelegram?: string;

  countries = COUNTRIES;
  selectedCountry = signal<Country>(COUNTRIES[0]);
  phoneNumber = signal<string>('');
  showDropdown = signal<boolean>(false);

  fullNumber = computed(() => {
    const phone = this.phoneNumber().replace(/\s+/g, '');
    return phone ? `${this.selectedCountry().dialCode}${phone}` : '';
  });

  private onChange: any = () => {};
  private onTouched: any = () => {};

  constructor(private router: Router) {}

  writeValue(value: any): void {
    if (!value) {
      this.phoneNumber.set('');
      return;
    }

    const country = this.countries.find(c => value.startsWith(c.dialCode));
    if (country) {
      this.selectedCountry.set(country);
      this.phoneNumber.set(value.replace(country.dialCode, ''));
    } else {
      this.phoneNumber.set(value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  selectCountry(country: Country) {
  }

  onPhoneChange() {
    this.onChange(this.fullNumber());
  }

  toggleDropdown() {
  }

  navigateToPersonnel() {
    console.log('utl', '/dashboard/personnel/profile', this.personnelId)
    if (this.personnelId) {
      this.router.navigate(['/dashboard/personnel/profile', this.personnelId]);
    }
  }

  launchContactIntent() {
    const contact = this.preferredContact || 'PHONE';
    let url = '';

    switch (contact) {
      case 'PHONE':
      case 'SMS':
        url = `tel:${this.fullNumber()}`;
        break;
      case 'WHATSAPP':
        const phoneDigits = this.fullNumber().replace(/[^0-9]/g, '');
        url = `https://wa.me/${phoneDigits}`;
        break;
      case 'EMAIL':
        url = `mailto:${this.personnelEmail || ''}`;
        break;
      case 'INSTAGRAM':
        url = this.personnelInstagram
          ? this.personnelInstagram.startsWith('http')
            ? this.personnelInstagram
            : `https://instagram.com/${this.personnelInstagram.replace('@', '')}`
          : 'https://instagram.com';
        break;
      case 'FACEBOOK':
        url = this.personnelFacebook
          ? this.personnelFacebook.startsWith('http')
            ? this.personnelFacebook
            : `https://facebook.com/${this.personnelFacebook}`
          : 'https://facebook.com';
        break;
      case 'TELEGRAM':
        url = this.personnelTelegram
          ? this.personnelTelegram.startsWith('http')
            ? this.personnelTelegram
            : `https://t.me/${this.personnelTelegram.replace('@', '')}`
          : 'https://t.me';
        break;
      default:
        url = `tel:${this.fullNumber()}`;
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && (contact === 'PHONE' || contact === 'SMS' || contact === 'WHATSAPP')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  }

  getContactIcon(): string {
    switch (this.preferredContact) {
      case 'EMAIL':
        return 'mail';
      case 'WHATSAPP':
        return 'chat';
      case 'INSTAGRAM':
        return 'photo_camera';
      case 'FACEBOOK':
        return 'thumb_up';
      case 'TELEGRAM':
        return 'send';
      case 'SMS':
        return 'sms';
      default:
        return 'phone';
    }
  }

  getContactIconImage(): string {
    switch (this.preferredContact) {
      case 'EMAIL':
        return '/assets/icons/social/email.svg';
      case 'WHATSAPP':
        return '/assets/icons/social/whatsapp.svg';
      case 'INSTAGRAM':
        return '/assets/icons/social/instagram.svg';
      case 'FACEBOOK':
        return '/assets/icons/social/facebook.svg';
      case 'TELEGRAM':
        return '/assets/icons/social/telegram.svg';
      case 'SMS':
        return '/assets/icons/social/sms.svg';
      default:
        return '/assets/icons/social/phone.svg';
    }
  }

  getContactTooltip(): string {
    switch (this.preferredContact) {
      case 'EMAIL':
        return 'Contact via Email';
      case 'WHATSAPP':
        return 'Contact via WhatsApp';
      case 'INSTAGRAM':
        return 'Contact via Instagram';
      case 'FACEBOOK':
        return 'Contact via Facebook';
      case 'TELEGRAM':
        return 'Contact via Telegram';
      case 'SMS':
        return 'Send SMS';
      default:
        return 'Call';
    }
  }
}
