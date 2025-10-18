import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { of } from 'rxjs';
import {
  skuFormatValidator,
  productNameValidator,
  futureDateValidator,
  cantidadValidator,
  precioValidator,
  ubicacionFormatValidator,
  imagenValidator
} from './producto.validators';
import { InventarioService } from '../services/inventario.service';

describe('Producto Validators', () => {
  describe('skuFormatValidator', () => {
    it('should return null for valid SKU format', () => {
      const control = new FormControl('MED-0001');
      const validator = skuFormatValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid SKU format', () => {
      const control = new FormControl('INVALID');
      const validator = skuFormatValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['skuFormat']).toBeDefined();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      const validator = skuFormatValidator();
      expect(validator(control)).toBeNull();
    });

    it('should validate SKU with exactly 4 digits', () => {
      const validCases = ['MED-0001', 'MED-9999', 'MED-1234'];
      const validator = skuFormatValidator();
      
      validCases.forEach(sku => {
        const control = new FormControl(sku);
        expect(validator(control)).toBeNull();
      });
    });

    it('should reject SKU with less or more than 4 digits', () => {
      const invalidCases = ['MED-001', 'MED-00001', 'MED-12'];
      const validator = skuFormatValidator();
      
      invalidCases.forEach(sku => {
        const control = new FormControl(sku);
        expect(validator(control)).toBeTruthy();
      });
    });
  });

  describe('productNameValidator', () => {
    it('should return null for valid product name', () => {
      const control = new FormControl('Acetaminofén 500mg');
      const validator = productNameValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for name with invalid characters', () => {
      const control = new FormControl('Producto@#$');
      const validator = productNameValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['productName']).toBeDefined();
      expect(result?.['productName'].message).toContain('caracteres alfanuméricos');
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      const validator = productNameValidator();
      expect(validator(control)).toBeNull();
    });

    it('should accept names with letters, numbers and spaces', () => {
      const validNames = ['Paracetamol', 'Vitamina B12', 'Producto 123'];
      const validator = productNameValidator();
      
      validNames.forEach(name => {
        const control = new FormControl(name);
        expect(validator(control)).toBeNull();
      });
    });
  });

  describe('futureDateValidator', () => {
    it('should return null for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const control = new FormControl(futureDate);
      const validator = futureDateValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const control = new FormControl(pastDate);
      const validator = futureDateValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['futureDate']).toBeDefined();
      expect(result?.['futureDate'].message).toContain('posterior');
    });

    it('should return error for today\'s date', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const control = new FormControl(today);
      const validator = futureDateValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['futureDate']).toBeDefined();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      const validator = futureDateValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('cantidadValidator', () => {
    it('should return null for valid quantity', () => {
      const control = new FormControl(100);
      const validator = cantidadValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for quantity less than 1', () => {
      const control = new FormControl(0);
      const validator = cantidadValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['cantidad']).toBeDefined();
      expect(result?.['cantidad'].message).toContain('entre 1 y 9999');
    });

    it('should return error for quantity greater than 9999', () => {
      const control = new FormControl(10000);
      const validator = cantidadValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['cantidad']).toBeDefined();
    });

    it('should return null for minimum valid quantity (1)', () => {
      const control = new FormControl(1);
      const validator = cantidadValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for maximum valid quantity (9999)', () => {
      const control = new FormControl(9999);
      const validator = cantidadValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      const validator = cantidadValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('precioValidator', () => {
    it('should return null for valid price', () => {
      const control = new FormControl(8500);
      const validator = precioValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for negative price', () => {
      const control = new FormControl(-100);
      const validator = precioValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['precio']).toBeDefined();
      expect(result?.['precio'].message).toContain('positivo');
    });

    it('should return error for zero price', () => {
      const control = new FormControl(0);
      const validator = precioValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['precio']).toBeDefined();
    });

    it('should return null for decimal price', () => {
      const control = new FormControl(8500.50);
      const validator = precioValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      const validator = precioValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('ubicacionFormatValidator', () => {
    it('should return null for valid location format', () => {
      const control = new FormControl('A-03-01');
      const validator = ubicacionFormatValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid location format', () => {
      const control = new FormControl('INVALID');
      const validator = ubicacionFormatValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['ubicacionFormat']).toBeDefined();
      expect(result?.['ubicacionFormat'].message).toContain('P-EE-NN');
    });

    it('should accept valid location formats', () => {
      const validLocations = ['A-01-01', 'Z-99-99', 'B-12-34'];
      const validator = ubicacionFormatValidator();
      
      validLocations.forEach(location => {
        const control = new FormControl(location);
        expect(validator(control)).toBeNull();
      });
    });

    it('should reject invalid location formats', () => {
      const invalidLocations = ['1-01-01', 'A-1-01', 'A-01-1', 'AA-01-01'];
      const validator = ubicacionFormatValidator();
      
      invalidLocations.forEach(location => {
        const control = new FormControl(location);
        expect(validator(control)).toBeTruthy();
      });
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      const validator = ubicacionFormatValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('imagenValidator', () => {
    it('should return null for valid image file (JPG)', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      const control = new FormControl(file);
      const validator = imagenValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid image file (PNG)', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      const control = new FormControl(file);
      const validator = imagenValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid image file (GIF)', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      const control = new FormControl(file);
      const validator = imagenValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return error for invalid file type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const control = new FormControl(file);
      const validator = imagenValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['imagenTipo']).toBeDefined();
      expect(result?.['imagenTipo'].message).toContain('JPG, PNG o GIF');
    });

    it('should return error for file larger than 2MB', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 }); // 3MB
      const control = new FormControl(file);
      const validator = imagenValidator();
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['imagenTamano']).toBeDefined();
      expect(result?.['imagenTamano'].message).toContain('2MB');
    });

    it('should return null for file at exactly 2MB', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB
      const control = new FormControl(file);
      const validator = imagenValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      const validator = imagenValidator();
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty value', () => {
      const control = new FormControl('');
      const validator = imagenValidator();
      expect(validator(control)).toBeNull();
    });
  });
});
