import { FormControl } from '@angular/forms';
import {
  proveedorNameValidator,
  proveedorEmailValidator,
  proveedorPhoneValidator,
  logoValidator
} from './proveedor.validators';

describe('Proveedor Validators', () => {
  
  describe('proveedorNameValidator', () => {
    let validator: any;

    beforeEach(() => {
      validator = proveedorNameValidator();
    });

    it('should return null for valid names', () => {
      const validNames = [
        'Farmacia Central',
        'Droguería del Norte',
        'ABC Medicamentos',
        'Farmacia María José',
        'Distribuidora XYZ',
        'Laboratorio 123'
      ];

      validNames.forEach(name => {
        const control = new FormControl(name);
        expect(validator(control)).toBeNull();
      });
    });

    it('should return null for names with accents', () => {
      const control = new FormControl('Farmacia José María');
      expect(validator(control)).toBeNull();
    });

    it('should return error for names shorter than 3 characters', () => {
      const control = new FormControl('AB');
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result!['proveedorName']).toBeDefined();
      expect(result!['proveedorName'].message).toBe('El nombre debe tener al menos 3 caracteres');
    });

    it('should return error for names with special characters', () => {
      const invalidNames = [
        'Farmacia@Central',
        'Droguería#Norte',
        'Farmacia$Central',
        'Lab%Medicamentos'
      ];

      invalidNames.forEach(name => {
        const control = new FormControl(name);
        const result = validator(control);
        
        expect(result).not.toBeNull();
        expect(result!['proveedorName']).toBeDefined();
        expect(result!['proveedorName'].message).toContain('solo puede contener letras');
      });
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should accept names with numbers', () => {
      const control = new FormControl('Farmacia 123');
      expect(validator(control)).toBeNull();
    });

    it('should accept names with spaces', () => {
      const control = new FormControl('Farmacia Del Norte');
      expect(validator(control)).toBeNull();
    });
  });

  describe('proveedorEmailValidator', () => {
    let validator: any;

    beforeEach(() => {
      validator = proveedorEmailValidator();
    });

    it('should return null for valid emails', () => {
      const validEmails = [
        'contacto@farmacia.com',
        'ventas@drogueria.com.co',
        'info@laboratorio.net',
        'admin@empresa.co',
        'test.user@example.com',
        'usuario+tag@dominio.com'
      ];

      validEmails.forEach(email => {
        const control = new FormControl(email);
        expect(validator(control)).toBeNull();
      });
    });

    it('should return error for emails without @', () => {
      const control = new FormControl('emailsinarroba.com');
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result!['proveedorEmail']).toBeDefined();
      expect(result!['proveedorEmail'].message).toContain('debe contener @');
    });

    it('should return error for emails without domain', () => {
      const invalidEmails = [
        'email@',
        '@dominio.com',
        'email@.com'
      ];

      invalidEmails.forEach(email => {
        const control = new FormControl(email);
        const result = validator(control);
        
        expect(result).not.toBeNull();
        expect(result!['proveedorEmail']).toBeDefined();
      });
    });

    it('should return error for emails with spaces', () => {
      const control = new FormControl('email con espacios@dominio.com');
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result!['proveedorEmail']).toBeDefined();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid format', () => {
      const invalidEmails = [
        'notanemail',
        'still@not@valid.com',
        'missing.domain@',
        '@onlyat.com'
      ];

      invalidEmails.forEach(email => {
        const control = new FormControl(email);
        const result = validator(control);
        
        expect(result).not.toBeNull();
        expect(result!['proveedorEmail']).toBeDefined();
      });
    });
  });

  describe('proveedorPhoneValidator', () => {
    let validator: any;

    beforeEach(() => {
      validator = proveedorPhoneValidator();
    });

    it('should return null for valid phone numbers', () => {
      const validPhones = [
        '3001234567',
        '3109876543',
        '3201112222',
        '12345678',
        '1234567890'
      ];

      validPhones.forEach(phone => {
        const control = new FormControl(phone);
        expect(validator(control)).toBeNull();
      });
    });

    it('should return error for phones shorter than 7 digits', () => {
      const control = new FormControl('123456');
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result!['proveedorPhone']).toBeDefined();
      expect(result!['proveedorPhone'].message).toBe('El teléfono debe tener al menos 7 dígitos');
    });

    it('should return error for phones with letters', () => {
      const invalidPhones = [
        '300ABC1234',
        '310-987-6543',
        '320.111.2222',
        'phone1234567'
      ];

      invalidPhones.forEach(phone => {
        const control = new FormControl(phone);
        const result = validator(control);
        
        expect(result).not.toBeNull();
        expect(result!['proveedorPhone']).toBeDefined();
        expect(result!['proveedorPhone'].message).toBe('El teléfono solo puede contener números');
      });
    });

    it('should return error for phones with special characters', () => {
      const invalidPhones = [
        '300-123-4567',
        '(310) 9876543',
        '+57 3001234567',
        '320.111.2222'
      ];

      invalidPhones.forEach(phone => {
        const control = new FormControl(phone);
        const result = validator(control);
        
        expect(result).not.toBeNull();
        expect(result!['proveedorPhone']).toBeDefined();
      });
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should accept exactly 7 digits', () => {
      const control = new FormControl('1234567');
      expect(validator(control)).toBeNull();
    });

    it('should accept more than 7 digits', () => {
      const control = new FormControl('12345678901234');
      expect(validator(control)).toBeNull();
    });
  });

  describe('logoValidator', () => {
    let validator: any;

    beforeEach(() => {
      validator = logoValidator();
    });

    it('should return null for valid image files', () => {
      const validFiles = [
        new File([''], 'logo.jpg', { type: 'image/jpeg' }),
        new File([''], 'logo.png', { type: 'image/png' }),
        new File([''], 'logo.gif', { type: 'image/gif' })
      ];

      validFiles.forEach(file => {
        const control = new FormControl(file);
        expect(validator(control)).toBeNull();
      });
    });

    it('should return error for invalid file types', () => {
      const invalidFiles = [
        new File([''], 'document.pdf', { type: 'application/pdf' }),
        new File([''], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        new File([''], 'image.bmp', { type: 'image/bmp' }),
        new File([''], 'image.svg', { type: 'image/svg+xml' })
      ];

      invalidFiles.forEach(file => {
        const control = new FormControl(file);
        const result = validator(control);
        
        expect(result).not.toBeNull();
        expect(result!['logoTipo']).toBeDefined();
        expect(result!['logoTipo'].message).toBe('El logo debe ser una imagen JPG, PNG o GIF');
      });
    });

    it('should return error for files larger than 2MB', () => {
      // Crear un buffer de más de 2MB
      const buffer = new ArrayBuffer(2 * 1024 * 1024 + 1);
      const largeFile = new File([buffer], 'large-logo.jpg', { type: 'image/jpeg' });
      
      const control = new FormControl(largeFile);
      const result = validator(control);
      
      expect(result).not.toBeNull();
      expect(result!['logoTamano']).toBeDefined();
      expect(result!['logoTamano'].message).toBe('El logo no debe superar los 2MB');
    });

    it('should return null for files exactly 2MB', () => {
      const content = new Array(2 * 1024 * 1024).join('a');
      const file = new File([content], 'logo.jpg', { type: 'image/jpeg' });
      
      const control = new FormControl(file);
      expect(validator(control)).toBeNull();
    });

    it('should return null for small valid files', () => {
      const smallFile = new File(['small content'], 'logo.png', { type: 'image/png' });
      
      const control = new FormControl(smallFile);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should handle non-File values gracefully', () => {
      const control = new FormControl('not a file');
      expect(validator(control)).toBeNull();
    });

    it('should accept JPG with uppercase extension', () => {
      const file = new File([''], 'LOGO.JPG', { type: 'image/jpeg' });
      const control = new FormControl(file);
      expect(validator(control)).toBeNull();
    });

    it('should accept PNG with uppercase extension', () => {
      const file = new File([''], 'LOGO.PNG', { type: 'image/png' });
      const control = new FormControl(file);
      expect(validator(control)).toBeNull();
    });

    it('should accept file at size boundary (1.99MB)', () => {
      const content = new Array(Math.floor(1.99 * 1024 * 1024)).join('a');
      const file = new File([content], 'logo.jpg', { type: 'image/jpeg' });
      
      const control = new FormControl(file);
      expect(validator(control)).toBeNull();
    });
  });
});
