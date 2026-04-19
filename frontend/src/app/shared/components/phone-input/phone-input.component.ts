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

  countries = COUNTRIES;
  selectedCountry = signal<Country>(COUNTRIES[0]);
  phoneNumber = signal<string>('');
  showDropdown = signal<boolean>(false); // Not used anymore, but keeping for compatibility

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
    // Not used since only Tunisia is supported
  }

  onPhoneChange() {
    this.onChange(this.fullNumber());
  }

  toggleDropdown() {
    // Not used since only Tunisia is supported
  }
}
