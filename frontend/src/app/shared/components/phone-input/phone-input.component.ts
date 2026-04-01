import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface Country {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
}

const COUNTRIES: Country[] = [
  { name: 'France', code: 'FR', flag: '🇫🇷', dialCode: '+33' },
  { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦', dialCode: '+212' },
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳', dialCode: '+216' },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿', dialCode: '+213' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', dialCode: '+971' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', dialCode: '+966' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦', dialCode: '+974' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', dialCode: '+49' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', dialCode: '+34' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', dialCode: '+39' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1' },
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

  countries = COUNTRIES;
  selectedCountry = signal<Country>(COUNTRIES.find(c => c.code === 'TN') || COUNTRIES[0]);
  phoneNumber = signal<string>('');
  showDropdown = signal<boolean>(false);

  fullNumber = computed(() => {
    const phone = this.phoneNumber().replace(/\s+/g, '');
    return phone ? `${this.selectedCountry().dialCode}${phone}` : '';
  });

  private onChange: any = () => {};
  private onTouched: any = () => {};

  writeValue(value: any): void {
    if (!value) {
      this.phoneNumber.set('');
      return;
    }

    // Attempt to parse existing full number
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
    this.selectedCountry.set(country);
    this.showDropdown.set(false);
    this.onPhoneChange();
  }

  onPhoneChange() {
    this.onChange(this.fullNumber());
  }

  toggleDropdown() {
    this.showDropdown.update(v => !v);
  }
}
