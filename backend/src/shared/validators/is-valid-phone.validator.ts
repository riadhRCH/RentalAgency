import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidPhone', async: false })
export class IsValidPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Pattern: accepts 8-digit numbers, optionally prefixed with +216 or 0
    // Valid formats:
    // - 94669601
    // - 094669601
    // - +21694669601
    const phonePattern = /^(\+216)?0?[0-9]{8}$/;
    return phonePattern.test(value.trim());
  }

  defaultMessage(): string {
    return 'phone must be a valid phone number (8 digits, optionally with +216 or 0 prefix)';
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
