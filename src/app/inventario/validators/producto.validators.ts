import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, switchMap } from 'rxjs/operators';
import { InventarioService } from '../services/inventario.service';

/**
 * Validador para el formato de SKU: MED-XXXX
 */
export function skuFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const skuPattern = /^MED-\d{4}$/;
    const valid = skuPattern.test(control.value);

    return valid ? null : { skuFormat: { value: control.value } };
  };
}


/**
 * Validador para nombres de producto (alfanuméricos y espacios, mínimo 3 caracteres)
 */
export function productNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const namePattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/;
    const valid = namePattern.test(control.value) && control.value.length >= 3;

    if (!valid) {
      return { 
        productName: { 
          value: control.value,
          message: 'El nombre debe contener solo caracteres alfanuméricos y espacios, mínimo 3 caracteres'
        } 
      };
    }

    return null;
  };
}

/**
 * Validador para fecha de vencimiento (debe ser futura)
 */
export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const inputDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate <= today) {
      return { 
        futureDate: { 
          value: control.value,
          message: 'La fecha de vencimiento debe ser posterior a la fecha actual'
        } 
      };
    }

    return null;
  };
}

/**
 * Validador para cantidad (enteros positivos entre 1-9999)
 */
export function cantidadValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }

    const value = Number(control.value);
    
    if (!Number.isInteger(value) || value < 1 || value > 9999) {
      return { 
        cantidad: { 
          value: control.value,
          message: 'La cantidad debe ser un número entero entre 1 y 9999'
        } 
      };
    }

    return null;
  };
}

/**
 * Validador para precio (valores positivos)
 */
export function precioValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null;
    }

    const value = Number(control.value);
    
    if (isNaN(value) || value <= 0) {
      return { 
        precio: { 
          value: control.value,
          message: 'El precio debe ser un valor numérico positivo'
        } 
      };
    }

    return null;
  };
}

/**
 * Validador para formato de ubicación: P-EE-NN
 * P: Pasillo (A-Z)
 * EE: Estante (01-99)
 * NN: Nivel (01-99)
 */
export function ubicacionFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const ubicacionPattern = /^[A-Z]-(0[1-9]|[1-9][0-9])-(0[1-9]|[1-9][0-9])$/;
    const valid = ubicacionPattern.test(control.value);

    if (!valid) {
      return { 
        ubicacionFormat: { 
          value: control.value,
          message: 'La ubicación debe tener el formato P-EE-NN (ej: A-03-02)'
        } 
      };
    }

    return null;
  };
}

/**
 * Validador para archivos de imagen (JPG, PNG, GIF, máximo 2MB)
 */
export function imagenValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value;

    if (!file) {
      return null; // La foto es opcional
    }

    // Si es un string (URL), es válido
    if (typeof file === 'string') {
      return null;
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        imagenTipo: { 
          value: file.type,
          message: 'Solo se permiten archivos JPG, PNG o GIF'
        } 
      };
    }

    // Validar tamaño (2MB máximo)
    const maxSize = 2 * 1024 * 1024; // 2MB en bytes
    if (file.size > maxSize) {
      return { 
        imagenTamano: { 
          value: file.size,
          message: 'El tamaño máximo permitido es 2MB'
        } 
      };
    }

    return null;
  };
}
