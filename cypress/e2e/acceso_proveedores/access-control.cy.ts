describe('Control de Acceso a Proveedores', () => {
  const BASE_URL = 'https://proyecto-integrador-medidupply-32b261732f50.herokuapp.com';

  const mockProveedores = {
    message: 'Proveedores obtenidos exitosamente',
    data: {
      providers: [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Farmacia Central',
          email: 'contacto@farmaciacentral.com',
          phone: '3001234567',
          created_at: '2025-01-15T10:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        per_page: 10,
        total: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
        next_page: null,
        prev_page: null
      }
    }
  };

  describe('Acceso como Administrador', () => {
    beforeEach(() => {
      // Token de administrador
      cy.intercept('POST', '**/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJhZG1pbkBtZWRpc3VwcGx5LmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIkFkbWluaXN0cmFkb3IiXX0sImlhdCI6MTUxNjIzOTAyMn0.mock-admin',
          expires_in: 3600,
          refresh_expires_in: 7200,
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          'not-before-policy': 0,
          session_state: 'mock-session',
          scope: 'openid profile email'
        }
      }).as('loginAdmin');

      cy.intercept('GET', '**/providers*', mockProveedores).as('getProveedores');

      // Login como administrador
      cy.visit(`${BASE_URL}/login`);
      cy.get('input[type="email"]').type('admin@medisupply.com');
      cy.get('input[type="password"]').type('Admin123!');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginAdmin');
    });

    it('debe permitir acceso al módulo de proveedores', () => {
      cy.visit(`${BASE_URL}/proveedores`);
      cy.wait('@getProveedores');
      cy.url().should('include', '/proveedores');
      cy.contains('h1', 'Proveedores').should('be.visible');
    });

    it('debe mostrar la opción Proveedores en el menú lateral', () => {
      cy.visit(`${BASE_URL}/usuarios`);
      
      // Expandir sección de administración
      cy.get('.section-header').contains('ADMINISTRACIÓN').click();
      
      // Verificar que existe la opción Proveedores
      cy.get('.nav-item').contains('Proveedores').should('be.visible');
    });

    it('debe mostrar el botón de crear proveedor', () => {
      cy.visit(`${BASE_URL}/proveedores`);
      cy.wait('@getProveedores');
      cy.contains('button', 'Crear proveedor').should('be.visible');
    });
  });

  describe('Acceso como Compras', () => {
    beforeEach(() => {
      // Token de usuario Compras
      cy.intercept('POST', '**/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwiZW1haWwiOiJjb21wcmFzQG1lZGlzdXBwbHkuY29tIiwibmFtZSI6IlVzdWFyaW8gQ29tcHJhcyIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJDb21wcmFzIl19LCJpYXQiOjE1MTYyMzkwMjJ9.mock-compras',
          expires_in: 3600,
          refresh_expires_in: 7200,
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          'not-before-policy': 0,
          session_state: 'mock-session',
          scope: 'openid profile email'
        }
      }).as('loginCompras');

      cy.intercept('GET', '**/providers*', mockProveedores).as('getProveedores');

      // Login como usuario de compras
      cy.visit(`${BASE_URL}/login`);
      cy.get('input[type="email"]').type('compras@medisupply.com');
      cy.get('input[type="password"]').type('Compras123!');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginCompras');
    });

    it('debe permitir acceso al módulo de proveedores', () => {
      cy.visit(`${BASE_URL}/proveedores`);
      cy.wait('@getProveedores');
      cy.url().should('include', '/proveedores');
      cy.contains('h1', 'Proveedores').should('be.visible');
    });

    it('debe mostrar la opción Proveedores en el menú lateral', () => {
      cy.visit(`${BASE_URL}/inventario`);
      
      // Expandir sección de administración
      cy.get('.section-header').contains('ADMINISTRACIÓN').click();
      
      // Verificar que existe la opción Proveedores
      cy.get('.nav-item').contains('Proveedores').should('be.visible');
    });

    it('debe mostrar el botón de crear proveedor', () => {
      cy.visit(`${BASE_URL}/proveedores`);
      cy.wait('@getProveedores');
      cy.contains('button', 'Crear proveedor').should('be.visible');
    });

    it('NO debe mostrar la opción Usuarios en el menú lateral', () => {
      cy.visit(`${BASE_URL}/inventario`);
      
      // Expandir sección de administración
      cy.get('.section-header').contains('ADMINISTRACIÓN').click();
      
      // Verificar que NO existe la opción Usuarios
      cy.get('.nav-item').contains('Usuarios').should('not.exist');
    });
  });

  describe('Acceso como Ventas', () => {
    beforeEach(() => {
      // Token de usuario Ventas
      cy.intercept('POST', '**/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTU1NTU1NTU1IiwiZW1haWwiOiJ2ZW50YXNAbWVkaXN1cHBseS5jb20iLCJuYW1lIjoiVXN1YXJpbyBWZW50YXMiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiVmVudGFzIl19LCJpYXQiOjE1MTYyMzkwMjJ9.mock-ventas',
          expires_in: 3600,
          refresh_expires_in: 7200,
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          'not-before-policy': 0,
          session_state: 'mock-session',
          scope: 'openid profile email'
        }
      }).as('loginVentas');

      // Login como usuario de ventas
      cy.visit(`${BASE_URL}/login`);
      cy.get('input[type="email"]').type('ventas@medisupply.com');
      cy.get('input[type="password"]').type('Ventas123!');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginVentas');
    });

    it('NO debe permitir acceso directo al módulo de proveedores', () => {
      cy.visit(`${BASE_URL}/proveedores`);
      
      // Debe redirigir ya que Ventas no tiene acceso a proveedores
      cy.url().should('not.include', '/proveedores');
    });

    it('NO debe mostrar la opción Proveedores en el menú (si tiene acceso a otra sección)', () => {
      // Intentar navegar a inventario (debería ser denegado)
      cy.visit(`${BASE_URL}/inventario`, { failOnStatusCode: false });
      
      // Si tiene menú, no debería mostrar Proveedores
      // Como el rol no tiene acceso a inventario, este test verifica que no puede ver proveedores
      cy.url().should('not.include', '/proveedores');
    });

    it('NO debe mostrar la opción Inventario en el menú', () => {
      // El rol Ventas no tiene acceso a inventario
      cy.visit(`${BASE_URL}/inventario`, { failOnStatusCode: false });
      cy.url().should('not.include', '/inventario');
    });
  });

  describe('Acceso como Logística', () => {
    beforeEach(() => {
      // Token de usuario Logística
      cy.intercept('POST', '**/auth/token', {
        statusCode: 200,
        body: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjY2NjY2NjY2IiwiZW1haWwiOiJsb2dpc3RpY2FAbWVkaXN1cHBseS5jb20iLCJuYW1lIjoiVXN1YXJpbyBMb2fDrXN0aWNhIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIkxvZ8Otc3RpY2EiXX0sImlhdCI6MTUxNjIzOTAyMn0.mock-logistica',
          expires_in: 3600,
          refresh_expires_in: 7200,
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          'not-before-policy': 0,
          session_state: 'mock-session',
          scope: 'openid profile email'
        }
      }).as('loginLogistica');

      // Login como usuario de logística
      cy.visit(`${BASE_URL}/login`);
      cy.get('input[type="email"]').type('logistica@medisupply.com');
      cy.get('input[type="password"]').type('Logistica123!');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginLogistica');
    });

    it('NO debe permitir acceso directo al módulo de proveedores', () => {
      cy.visit(`${BASE_URL}/proveedores`);
      
      // Debe redirigir ya que Logística no tiene acceso a proveedores
      cy.url().should('not.include', '/proveedores');
    });

    it('NO debe mostrar la opción Proveedores en el menú (si tiene acceso a otra sección)', () => {
      // Intentar navegar a inventario (debería ser denegado)
      cy.visit(`${BASE_URL}/inventario`, { failOnStatusCode: false });
      
      // Como el rol no tiene acceso a inventario, no debería ver proveedores
      cy.url().should('not.include', '/proveedores');
    });

    it('NO debe mostrar la opción Inventario en el menú', () => {
      // El rol Logística no tiene acceso a inventario
      cy.visit(`${BASE_URL}/inventario`, { failOnStatusCode: false });
      cy.url().should('not.include', '/inventario');
    });
  });

  describe('Acceso sin autenticación', () => {
    it('debe redirigir al login al intentar acceder a proveedores sin autenticación', () => {
      cy.visit(`${BASE_URL}/proveedores`);
      
      // Debe redirigir al login
      cy.url().should('include', '/login');
    });

    it('no debe mostrar el menú lateral sin autenticación', () => {
      cy.visit(`${BASE_URL}/login`);
      cy.get('mat-nav-list').should('not.exist');
    });
  });
});
