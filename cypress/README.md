# Pruebas E2E con Cypress

Este proyecto incluye pruebas end-to-end (E2E) usando Cypress para validar los flujos principales de la aplicación.

## 🧪 Pruebas Disponibles

### 1. Iniciar Sesión (`cypress/e2e/iniciar_sesion/`)
- Validación del formulario de login
- Credenciales válidas e inválidas
- Navegación después del login exitoso
- Mensajes de error

### 2. Cerrar Sesión (`cypress/e2e/cerrar_sesion/`)
- Proceso completo de logout
- Limpieza del estado de la sesión
- Redireccionamiento al login
- Manejo de errores en logout
- Prevención de acceso a rutas protegidas después del logout

### 3. Crear Usuario (`cypress/e2e/crear_usuario/`)
- Apertura del diálogo de creación
- Validación de campos obligatorios
- Validación de formato de email
- Validación de nombre completo
- Validación de fortaleza de contraseña
- Validación de coincidencia de contraseñas
- Creación exitosa de usuario
- Manejo de emails duplicados
- Selección de roles
- Estados de carga (spinner y botón deshabilitado)

## 🚀 Comandos Disponibles

### Ejecutar todas las pruebas en modo headless
```bash
npm run e2e
# o
npm run cypress:run
```

### Abrir la interfaz de Cypress
```bash
npm run e2e:open
# o
npm run cypress:open
```

### Ejecutar un archivo específico
```bash
npx cypress run --spec "cypress/e2e/iniciar_sesion/login.cy.ts"
npx cypress run --spec "cypress/e2e/cerrar_sesion/logout.cy.ts"
npx cypress run --spec "cypress/e2e/crear_usuario/create-user.cy.ts"
```

## 🛠️ Comandos Personalizados

Se han creado comandos personalizados en `cypress/support/commands.ts`:

### `cy.login(email, password)`
Realiza el proceso de login completo.

```typescript
cy.login('admin@medisupply.com', 'Admin123!');
```

### `cy.mockLoginSuccess()`
Intercepta la API de login con una respuesta exitosa.

```typescript
cy.mockLoginSuccess();
cy.login('admin@medisupply.com', 'Admin123!');
```

### `cy.mockLoginFailure(message?)`
Intercepta la API de login con una respuesta de error.

```typescript
cy.mockLoginFailure('Invalid credentials');
cy.login('wrong@email.com', 'wrongpass');
```

### `cy.loginAsAdmin()`
Inicia sesión como administrador usando sesión de Cypress.

```typescript
cy.loginAsAdmin();
cy.visit('/usuarios');
```

### `cy.mockGetUsers(users?)`
Intercepta la API de obtener usuarios.

```typescript
cy.mockGetUsers([
  { id: '1', name: 'Test User', email: 'test@example.com', role: 'COMPRAS' }
]);
```

### `cy.mockCreateUser(statusCode?)`
Intercepta la API de crear usuario.

```typescript
cy.mockCreateUser(201); // Success
cy.mockCreateUser(409); // Conflict
```

## 📋 Estructura de las Pruebas

```
cypress/
├── e2e/
│   ├── iniciar_sesion/
│   │   └── login.cy.ts
│   ├── cerrar_sesion/
│   │   └── logout.cy.ts
│   └── crear_usuario/
│       └── create-user.cy.ts
├── fixtures/
│   └── example.json
└── support/
    ├── commands.ts        # Comandos personalizados
    └── e2e.ts            # Configuración global
```

## 🔧 Configuración

La configuración de Cypress se encuentra en `cypress.config.ts`. Por defecto, las pruebas apuntan a:

- **Producción**: `https://proyecto-integrador-medidupply-32b261732f50.herokuapp.com`

Para cambiar la URL base, modifica el archivo `cypress.config.ts`:

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
```

## 🧩 Interceptores de Red

Todas las pruebas utilizan `cy.intercept()` para mockear las respuestas de la API, lo que permite:

1. **Pruebas más rápidas**: No dependen del backend real
2. **Pruebas aisladas**: Control total sobre las respuestas
3. **Pruebas de casos edge**: Simular errores y casos límite
4. **Pruebas estables**: Sin flakiness por problemas de red

## 📊 Cobertura de Pruebas

### Cerrar Sesión (5 tests)
- ✅ Logout exitoso desde el sidebar
- ✅ Limpieza completa del estado
- ✅ Manejo de errores en la API
- ✅ Prevención de acceso a rutas protegidas
- ✅ Verificación de información del usuario

### Crear Usuario (12 tests)
- ✅ Visibilidad del botón (solo admin)
- ✅ Apertura del diálogo
- ✅ Validación de campos obligatorios
- ✅ Validación de formato de email
- ✅ Validación de nombre completo
- ✅ Validación de fortaleza de contraseña
- ✅ Validación de coincidencia de contraseñas
- ✅ Creación exitosa
- ✅ Manejo de email duplicado
- ✅ Cancelación del diálogo
- ✅ Toggle de visibilidad de contraseña
- ✅ Roles disponibles (sin Administrador)
- ✅ Estados de carga

## 🐛 Debugging

### Ver las pruebas en el navegador
```bash
npm run e2e:open
```

### Ver los resultados en la consola
```bash
npm run e2e
```

### Modo de depuración con pausa
En cualquier prueba, agrega `cy.debug()` o `cy.pause()`:

```typescript
it('mi prueba', () => {
  cy.visit('/login');
  cy.debug(); // Pausa y abre DevTools
  cy.get('input').type('test');
});
```

## 📝 Buenas Prácticas Implementadas

1. **Selectores estables**: Uso de atributos específicos (formcontrolname, aria-label)
2. **Esperas explícitas**: `cy.wait()` para interceptores de red
3. **Cleanup**: `beforeEach()` para setup consistente
4. **Aserciones claras**: Mensajes descriptivos en cada `should()`
5. **Modularidad**: Comandos reutilizables
6. **Mockeo completo**: Todas las llamadas API interceptadas

## 🔗 Referencias

- [Documentación de Cypress](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Angular Testing with Cypress](https://docs.cypress.io/guides/component-testing/angular/overview)
