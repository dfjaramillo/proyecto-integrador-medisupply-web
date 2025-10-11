import { FormControl, FormGroup } from '@angular/forms';
import { passwordStrengthValidator, matchFieldsValidator, fullNameValidator } from './user.validators';

describe('User Validators', () => {
  describe('passwordStrengthValidator', () => {
    it('should return null for valid password', () => {
      const control = new FormControl('Password123!');
      const result = passwordStrengthValidator()(control);
      expect(result).toBeNull();
    });

    it('should return error for password shorter than 8 characters', () => {
      const control = new FormControl('Pass1!');
      const result = passwordStrengthValidator()(control);
      expect(result).toEqual({ 
        passwordStrength: {
          hasMinLength: false,
          hasUpperCase: true,
          hasLowerCase: true,
          hasNumber: true,
          hasSpecialChar: true
        }
      });
    });

    it('should return error for password without uppercase letter', () => {
      const control = new FormControl('password123!');
      const result = passwordStrengthValidator()(control);
      expect(result).toEqual({ 
        passwordStrength: {
          hasMinLength: true,
          hasUpperCase: false,
          hasLowerCase: true,
          hasNumber: true,
          hasSpecialChar: true
        }
      });
    });

    it('should return error for password without lowercase letter', () => {
      const control = new FormControl('PASSWORD123!');
      const result = passwordStrengthValidator()(control);
      expect(result).toEqual({ 
        passwordStrength: {
          hasMinLength: true,
          hasUpperCase: true,
          hasLowerCase: false,
          hasNumber: true,
          hasSpecialChar: true
        }
      });
    });

    it('should return error for password without number', () => {
      const control = new FormControl('Password!');
      const result = passwordStrengthValidator()(control);
      expect(result).toEqual({ 
        passwordStrength: {
          hasMinLength: true,
          hasUpperCase: true,
          hasLowerCase: true,
          hasNumber: false,
          hasSpecialChar: true
        }
      });
    });

    it('should return error for password without special character', () => {
      const control = new FormControl('Password123');
      const result = passwordStrengthValidator()(control);
      expect(result).toEqual({ 
        passwordStrength: {
          hasMinLength: true,
          hasUpperCase: true,
          hasLowerCase: true,
          hasNumber: true,
          hasSpecialChar: false
        }
      });
    });

    it('should return null for empty password (required validator should handle this)', () => {
      const control = new FormControl('');
      const result = passwordStrengthValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for null password', () => {
      const control = new FormControl(null);
      const result = passwordStrengthValidator()(control);
      expect(result).toBeNull();
    });

    it('should accept various special characters', () => {
      const validPasswords = [
        'Password1@',
        'Password1#',
        'Password1$',
        'Password1%',
        'Password1&',
        'Password1*',
        'Password1!'
      ];

      validPasswords.forEach(password => {
        const control = new FormControl(password);
        const result = passwordStrengthValidator()(control);
        expect(result).toBeNull();
      });
    });

    it('should validate minimum length is exactly 8 characters', () => {
      const control = new FormControl('Pass12!A');
      const result = passwordStrengthValidator()(control);
      expect(result).toBeNull();
    });

    it('should validate very long passwords', () => {
      const control = new FormControl('VeryLongPassword123!WithManyCharacters');
      const result = passwordStrengthValidator()(control);
      expect(result).toBeNull();
    });
  });

  describe('matchFieldsValidator', () => {
    it('should return null when passwords match', () => {
      const formGroup = new FormGroup({
        password: new FormControl('Password123!'),
        confirmPassword: new FormControl('Password123!')
      });

      const validator = matchFieldsValidator('password');
      const result = validator(formGroup.get('confirmPassword')!);
      expect(result).toBeNull();
    });

    it('should return error when passwords do not match', () => {
      const formGroup = new FormGroup({
        password: new FormControl('Password123!'),
        confirmPassword: new FormControl('Different123!')
      });

      const validator = matchFieldsValidator('password');
      const result = validator(formGroup.get('confirmPassword')!);
      expect(result).toEqual({ fieldsMismatch: true });
    });

    it('should return error when confirm password is empty but password is not', () => {
      const formGroup = new FormGroup({
        password: new FormControl('Password123!'),
        confirmPassword: new FormControl('')
      });

      const validator = matchFieldsValidator('password');
      const result = validator(formGroup.get('confirmPassword')!);
      expect(result).toEqual({ fieldsMismatch: true });
    });

    it('should return error when password is empty but confirm password is not', () => {
      const formGroup = new FormGroup({
        password: new FormControl(''),
        confirmPassword: new FormControl('Password123!')
      });

      const validator = matchFieldsValidator('password');
      const result = validator(formGroup.get('confirmPassword')!);
      expect(result).toEqual({ fieldsMismatch: true });
    });

    it('should return null when both fields are empty', () => {
      const formGroup = new FormGroup({
        password: new FormControl(''),
        confirmPassword: new FormControl('')
      });

      const validator = matchFieldsValidator('password');
      const result = validator(formGroup.get('confirmPassword')!);
      expect(result).toBeNull();
    });

    it('should handle null values', () => {
      const formGroup = new FormGroup({
        password: new FormControl(null),
        confirmPassword: new FormControl(null)
      });

      const validator = matchFieldsValidator('password');
      const result = validator(formGroup.get('confirmPassword')!);
      expect(result).toBeNull();
    });

    it('should be case-sensitive', () => {
      const formGroup = new FormGroup({
        password: new FormControl('Password123!'),
        confirmPassword: new FormControl('password123!')
      });

      const validator = matchFieldsValidator('password');
      const result = validator(formGroup.get('confirmPassword')!);
      expect(result).toEqual({ fieldsMismatch: true });
    });

    it('should work with different field names', () => {
      const formGroup = new FormGroup({
        email: new FormControl('test@example.com'),
        confirmEmail: new FormControl('test@example.com')
      });

      const validator = matchFieldsValidator('email');
      const result = validator(formGroup.get('confirmEmail')!);
      expect(result).toBeNull();
    });
  });

  describe('fullNameValidator', () => {
    it('should return null for valid names with letters only', () => {
      const validNames = [
        'John',
        'john',
        'JOHN',
        'María',
        'José',
        'Ángel',
        'Sofía'
      ];

      validNames.forEach(name => {
        const control = new FormControl(name);
        const result = fullNameValidator()(control);
        expect(result).toBeNull();
      });
    });

    it('should return null for valid names with spaces', () => {
      const validNames = [
        'John Doe',
        'María García',
        'José Luis',
        'Ana María López'
      ];

      validNames.forEach(name => {
        const control = new FormControl(name);
        const result = fullNameValidator()(control);
        expect(result).toBeNull();
      });
    });

    it('should return null for names with Spanish accents', () => {
      const validNames = [
        'José',
        'María',
        'Ángel',
        'Sofía',
        'Martín',
        'Andrés'
      ];

      validNames.forEach(name => {
        const control = new FormControl(name);
        const result = fullNameValidator()(control);
        expect(result).toBeNull();
      });
    });

    it('should return error for names with numbers', () => {
      const invalidNames = [
        'John123',
        'John 123',
        '123John',
        'John Doe 3'
      ];

      invalidNames.forEach(name => {
        const control = new FormControl(name);
        const result = fullNameValidator()(control);
        expect(result).toEqual({ invalidName: true });
      });
    });

    it('should return error for names with special characters', () => {
      const invalidNames = [
        'John@Doe',
        'John.Doe',
        'John-Doe',
        'John_Doe',
        'John!Doe',
        'John#Doe'
      ];

      invalidNames.forEach(name => {
        const control = new FormControl(name);
        const result = fullNameValidator()(control);
        expect(result).toEqual({ invalidName: true });
      });
    });

    it('should return null for empty name (required validator should handle this)', () => {
      const control = new FormControl('');
      const result = fullNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should return null for null name', () => {
      const control = new FormControl(null);
      const result = fullNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should handle names with multiple spaces', () => {
      const control = new FormControl('John  Doe'); // double space
      const result = fullNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should handle names with leading/trailing spaces', () => {
      const control = new FormControl(' John Doe ');
      const result = fullNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should handle single letter names', () => {
      const control = new FormControl('A');
      const result = fullNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should handle very long names', () => {
      const control = new FormControl('María de los Ángeles García López de la Torre');
      const result = fullNameValidator()(control);
      expect(result).toBeNull();
    });

    it('should reject names with mixed letters and symbols', () => {
      const control = new FormControl('John@María');
      const result = fullNameValidator()(control);
      expect(result).toEqual({ invalidName: true });
    });
  });
});
