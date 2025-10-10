# Guía de Pruebas Unitarias

## Configuración

El proyecto está configurado con:
- **Jasmine**: Framework de testing
- **Karma**: Test runner
- **Karma Coverage**: Reporte de cobertura de código
- **Umbral mínimo**: 80% en todas las métricas

## Comandos Disponibles

### Desarrollo Local

```bash
# Ejecutar pruebas en modo watch (recomendado para desarrollo)
npm test

# Ejecutar pruebas con reporte de cobertura
npm run test:coverage

# Ejecutar pruebas una sola vez (sin watch)
npm test -- --watch=false
```

### CI/CD

```bash
# Ejecutar pruebas en modo CI (headless)
npm run test:ci
```

## Estructura de Pruebas

### LoginComponent (`src/app/auth/login/login.spec.ts`)

Cobertura de pruebas:
- ✅ Inicialización del componente
- ✅ Validación de formulario (email y password)
- ✅ Toggle de visibilidad de contraseña
- ✅ Manejo de errores de validación
- ✅ Login exitoso (navegación y mensajes)
- ✅ Login fallido (manejo de errores)
- ✅ Estados de carga (loading)

### AuthService (`src/app/auth/services/auth.service.spec.ts`)

Cobertura de pruebas:
- ✅ Login con credenciales válidas
- ✅ Login con credenciales inválidas
- ✅ Almacenamiento de tokens (access y refresh)
- ✅ Recuperación de tokens
- ✅ Verificación de autenticación
- ✅ Logout y limpieza de tokens
- ✅ Manejo de errores HTTP

## Métricas de Cobertura

El proyecto requiere un mínimo de **80%** en:

| Métrica | Descripción | Umbral |
|---------|-------------|--------|
| Statements | Declaraciones ejecutadas | ≥ 80% |
| Branches | Ramas de código ejecutadas | ≥ 80% |
| Functions | Funciones ejecutadas | ≥ 80% |
| Lines | Líneas de código ejecutadas | ≥ 80% |

## Ver Reporte de Cobertura

Después de ejecutar `npm run test:coverage`, abre el reporte HTML:

**Windows:**
```bash
start coverage/index.html
```

**macOS:**
```bash
open coverage/index.html
```

**Linux:**
```bash
xdg-open coverage/index.html
```

## Archivos Excluidos de Cobertura

Los siguientes archivos están excluidos del cálculo de cobertura:
- `src/**/*.spec.ts` - Archivos de prueba
- `src/test.ts` - Configuración de testing
- `src/environments/**` - Archivos de configuración
- `src/main.ts` - Bootstrap de la aplicación

## Buenas Prácticas

### 1. Estructura de Pruebas

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => { /* ... */ });
  
  // Pruebas agrupadas por funcionalidad
  describe('Feature Name', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 2. Uso de Spies

```typescript
const serviceSpy = jasmine.createSpyObj('ServiceName', ['method1', 'method2']);
serviceSpy.method1.and.returnValue(of(mockData));
```

### 3. Testing de Observables

```typescript
service.getData().subscribe(data => {
  expect(data).toEqual(expectedData);
  done(); // Para pruebas asíncronas
});
```

### 4. Testing de Formularios

```typescript
component.form.patchValue({ field: 'value' });
expect(component.form.valid).toBe(true);
expect(component.form.get('field')?.hasError('required')).toBe(false);
```

## Debugging de Pruebas

### Ver pruebas en el navegador

```bash
npm test
```

Esto abrirá Chrome con Karma, donde puedes:
- Ver resultados en tiempo real
- Usar DevTools para debugging
- Ver stack traces completos

### Ejecutar una sola prueba

```typescript
// Cambiar 'it' por 'fit' (focused it)
fit('should do something', () => {
  // ...
});

// O cambiar 'describe' por 'fdescribe'
fdescribe('Feature', () => {
  // ...
});
```

### Saltar pruebas temporalmente

```typescript
// Cambiar 'it' por 'xit' (excluded it)
xit('should do something', () => {
  // Esta prueba será saltada
});
```

## CI/CD Integration

### GitHub Actions

El workflow de CI ejecuta automáticamente:

1. **Install dependencies**
2. **Build** - Compila la aplicación
3. **Run tests with coverage** - Ejecuta pruebas y genera reporte
4. **Check coverage thresholds** - Valida que se cumpla el 80%
5. **Upload coverage** - Sube reporte a Codecov (opcional)

Si las pruebas fallan o la cobertura es menor al 80%, el build falla.

### Ver resultados en GitHub

1. Ve a la pestaña "Actions" en tu repositorio
2. Selecciona el workflow run
3. Revisa los logs de "Run tests with coverage"
4. Descarga el artifact "coverage-report" si está disponible

## Troubleshooting

### Error: "Chrome not found"

**Solución:** Instala Chrome o usa ChromeHeadless:
```bash
npm test -- --browsers=ChromeHeadless
```

### Error: "Timeout - Async callback was not invoked"

**Solución:** Aumenta el timeout o usa `done()` callback:
```typescript
it('should do async operation', (done) => {
  service.getData().subscribe(() => {
    expect(true).toBe(true);
    done();
  });
}, 10000); // 10 segundos timeout
```

### Cobertura baja en un archivo

**Solución:** Revisa el reporte HTML para ver qué líneas no están cubiertas:
1. Abre `coverage/index.html`
2. Click en el archivo
3. Las líneas rojas no están cubiertas
4. Agrega pruebas para esas líneas

## Recursos

- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Configuration](https://karma-runner.github.io/latest/config/configuration-file.html)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Testing Best Practices](https://angular.dev/guide/testing/best-practices)
