import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { COUNTRY_DEFAULTS } from '../constants';

@ValidatorConstraint({ name: 'isValidPhone', async: false })
export class IsValidPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Pattern: accepts 8-digit numbers, optionally prefixed with the configured country code or 0
    // Valid formats:
    // - 94669601
    // - 094669601
    // - +CC94669601
    const phonePattern = new RegExp(`^(${COUNTRY_DEFAULTS.COUNTRY_CODE})?0?[0-9]{8}$`);
    return phonePattern.test(value.trim());
  }

  defaultMessage(): string {
    return `phone must be a valid phone number (8 digits, optionally with ${COUNTRY_DEFAULTS.COUNTRY_CODE} or 0 prefix)`;
  }
}

export function IsValidPhone(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneConstraint,
    });
  };
}
