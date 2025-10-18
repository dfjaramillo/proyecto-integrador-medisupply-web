import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator para el nombre del proveedor
 * Acepta solo caracteres alfanuméricos y espacios, mínimo 3 caracteres
 */
export function proveedorNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // El validator 'required' maneja valores vacíos
    }

    const value = control.value.toString();

    // Mínimo 3 caracteres
    if (value.length < 3) {
      return {
        proveedorName: {
          message: 'El nombre debe tener al menos 3 caracteres'
        }
      };
    }

    // Solo letras, números y espacios
    const regex = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$/;
    if (!regex.test(value)) {
      return {
        proveedorName: {
          message: 'El nombre solo puede contener letras, números y espacios'
        }
      };
    }

    return null;
  };
}

/**
 * Validator para el email del proveedor
 * Valida formato básico de email
 */
export function proveedorEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString();

    // Regex para validar formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(value)) {
      return {
        proveedorEmail: {
          message: 'Ingrese un correo electrónico válido (debe contener @ y un dominio válido)'
        }
      };
    }

    return null;
  };
}

/**
 * Validator para el teléfono del proveedor
 * Solo números, mínimo 7 dígitos
 */
export function proveedorPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString();

    // Solo números
    const regex = /^\d+$/;
    if (!regex.test(value)) {
      return {
        proveedorPhone: {
          message: 'El teléfono solo puede contener números'
        }
      };
    }

    // Mínimo 7 dígitos
    if (value.length < 7) {
      return {
        proveedorPhone: {
          message: 'El teléfono debe tener al menos 7 dígitos'
        }
      };
    }

    return null;
  };
}

/**
 * Validator para el logo del proveedor
 * Valida tipo de archivo (JPG, PNG, GIF) y tamaño máximo (2MB)
 */
export function logoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value;

    if (!file || !(file instanceof File)) {
      return null; // No hay archivo o no es un File
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return {
        logoTipo: {
          message: 'El logo debe ser una imagen JPG, PNG o GIF'
        }
      };
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB en bytes
    if (file.size > maxSize) {
      return {
        logoTamano: {
          message: 'El logo no debe superar los 2MB'
        }
      };
    }

    return null;
  };
}
