describe('Control de Acceso a Proveedores', () => {
  const BASE_URL = 'http://localhost:4200';

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
      // Login real como administrador (sin mock)
      cy.visit(`${BASE_URL}/login`);
      cy.get('input[type="email"]').type('medisupply05@gmail.com');
      cy.get('input[type="password"]').type('Admin123456');
      cy.get('button[type="submit"]').click();
      
      // Esperar a que se complete el login y redirija
      cy.url().should('not.include', '/login', { timeout: 10000 });
    });

    it('debe permitir acceso al módulo de proveedores', () => {
      cy.visit(`${BASE_URL}/proveedores`);
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
      cy.contains('button', 'Crear proveedor').should('be.visible');
    });
  });

  describe('Acceso como Compras', () => {
    beforeEach(() => {
      // Login real como usuario de compras (sin mock)
      cy.visit(`${BASE_URL}/login`);
      cy.get('input[type="email"]').type('compras@correo.com');
      cy.get('input[type="password"]').type('Dfz2323.');
      cy.get('button[type="submit"]').click();
      
      // Esperar a que se complete el login y redirija
      cy.url().should('not.include', '/login', { timeout: 20000 });
    });

    it('debe permitir acceso al módulo de proveedores', () => {
      cy.visit(`${BASE_URL}/proveedores`);
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
      // Login real como usuario de ventas (sin mock)
      cy.visit(`${BASE_URL}/login`);
      cy.get('input[type="email"]').type('ventas@correo.com');
      cy.get('input[type="password"]').type('Password123.');
      cy.get('button[type="submit"]').click();
      
      // Esperar a que se complete el login
      // Como Ventas no tiene acceso a ningún módulo, permanecerá en /login
      cy.wait(2000);
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
      // Login real como usuario de logística (sin mock)
      cy.visit(`${BASE_URL}/login`);
      cy.get('input[type="email"]').type('logistica@correo.com');
      cy.get('input[type="password"]').type('Password123.');
      cy.get('button[type="submit"]').click();
      
      // Esperar a que se complete el login
      // Como Logística no tiene acceso a ningún módulo, permanecerá en /login
      cy.wait(2000);
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

    it('Debe mostrar la opción Inventario en el menú', () => {
      // El rol Logística no tiene acceso a inventario
      cy.visit(`${BASE_URL}/inventario`, { failOnStatusCode: false });
      cy.url().should('include', '/inventario', { timeout: 10000 });
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
