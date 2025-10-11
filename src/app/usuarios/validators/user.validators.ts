import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator for password strength
 * Requires at least 8 characters, including:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasMinLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const passwordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    if (!passwordValid) {
      return {
        passwordStrength: {
          hasMinLength,
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasSpecialChar
        }
      };
    }

    return null;
  };
}

/**
 * Validator to check if two fields match
 */
export function matchFieldsValidator(fieldName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) {
      return null;
    }

    const field = control.parent.get(fieldName);
    if (!field) {
      return null;
    }

    if (control.value !== field.value) {
      return { fieldsMismatch: true };
    }

    return null;
  };
}

/**
 * Validator for full name (only alphabetic characters and spaces)
 */
export function fullNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const isValid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value);

    return isValid ? null : { invalidName: true };
  };
}
