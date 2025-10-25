describe('Cerrar Sesión', () => {
  const BASE_URL = 'http://localhost:4200';

  beforeEach(() => {
    // Interceptar las llamadas API necesarias
    cy.intercept('GET', '**/auth/user**', {
      statusCode: 200,
      body: {
        data: {
          users: [],
          pagination: {
            total: 0,
            page: 1,
            per_page: 5,
            total_pages: 0,
            has_next: false,
            has_prev: false
          }
        }
      }
    }).as('getUsers');

    cy.intercept('POST', '**/auth/logout', {
      statusCode: 200,
      body: { message: 'Logout successful' }
    }).as('logoutRequest');
  });

  it('debe cerrar sesión correctamente desde el sidebar', () => {
    // Login primero
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Verificar que el sidebar está visible
    cy.get('app-sidebar').should('be.visible');
    
    // Buscar y hacer clic en el botón de cerrar sesión en el sidebar
    cy.get('app-sidebar').within(() => {
      cy.contains('button', 'CERRAR SESIÓN').should('be.visible').click();
    });

    // Verificar que se llamó a la API de logout
    cy.wait('@logoutRequest');

    // Verificar que se redirige al login
    cy.url().should('include', '/login');

    // Verificar que el token fue removido del localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('ms_access_token')).to.be.null;
      expect(win.localStorage.getItem('ms_refresh_token')).to.be.null;
    });
  });

  it('debe limpiar el estado de la sesión al cerrar sesión', () => {
    // Login primero
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Verificar que el token está en localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('ms_access_token')).to.not.be.null;
    });

    // Cerrar sesión
    cy.get('app-sidebar').within(() => {
      cy.contains('button', 'CERRAR SESIÓN').click();
    });

    cy.wait('@logoutRequest');

    // Verificar que todo el estado fue limpiado
    cy.window().then((win) => {
      expect(win.localStorage.getItem('ms_access_token')).to.be.null;
      expect(win.localStorage.getItem('ms_refresh_token')).to.be.null;
    });

    // Verificar que está en el login
    cy.url().should('include', '/login');
  });

  it('debe redirigir al login incluso si la API de logout falla', () => {
    // Interceptar logout con error
    cy.intercept('POST', '**/auth/logout', {
      statusCode: 500,
      body: { message: 'Server error' }
    }).as('logoutError');

    // Login primero
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Cerrar sesión
    cy.get('app-sidebar').within(() => {
      cy.contains('button', 'CERRAR SESIÓN').click();
    });

    // Debe redirigir al login incluso con error
    cy.url().should('include', '/login');

    // Verificar que el token fue removido
    cy.window().then((win) => {
      expect(win.localStorage.getItem('ms_access_token')).to.be.null;
    });
  });

  it('debe prevenir el acceso a rutas protegidas después de cerrar sesión', () => {
    // Login primero
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Cerrar sesión
    cy.get('app-sidebar').within(() => {
      cy.contains('button', 'CERRAR SESIÓN').click();
    });

    cy.wait('@logoutRequest');
    cy.url().should('include', '/login');

    // Intentar acceder a una ruta protegida
    cy.visit(`${BASE_URL}/usuarios`);

    // Debe redirigir al login porque no hay token
    cy.url().should('include', '/login');
  });

  it('debe mostrar el nombre del usuario antes de cerrar sesión', () => {
    // Login primero
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Verificar que el sidebar muestra información del usuario
    cy.get('app-sidebar').within(() => {
      // Verificar que hay un nombre de usuario o email visible
      cy.get('.user-info, .sidebar-header').should('exist');
      
      // Verificar que el botón de logout está presente
      cy.contains('button', 'CERRAR SESIÓN').should('be.visible');
    });
  });
});
