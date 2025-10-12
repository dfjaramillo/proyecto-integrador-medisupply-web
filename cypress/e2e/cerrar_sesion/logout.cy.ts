describe('Cerrar Sesión', () => {
  const BASE_URL = 'https://proyecto-integrador-medidupply-32b261732f50.herokuapp.com';

  beforeEach(() => {
    // Interceptar las llamadas API necesarias
    cy.intercept('POST', '**/auth/token', {
      statusCode: 200,
      body: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJhZG1pbkBtZWRpc3VwcGx5LmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIkFkbWluaXN0cmFkb3IiXX0sImlhdCI6MTUxNjIzOTAyMn0.mock-signature',
        expires_in: 3600,
        refresh_expires_in: 7200,
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        'not-before-policy': 0,
        session_state: 'mock-session',
        scope: 'openid profile email'
      }
    }).as('loginRequest');

    cy.intercept('GET', '**/users?page=*', {
      statusCode: 200,
      body: {
        users: [],
        total: 0,
        page: 1,
        limit: 5
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
    cy.get('input[type="email"]').type('admin@medisupply.com');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/usuarios');

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
    cy.get('input[type="email"]').type('admin@medisupply.com');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/usuarios');

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
    cy.get('input[type="email"]').type('admin@medisupply.com');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/usuarios');

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
    cy.get('input[type="email"]').type('admin@medisupply.com');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/usuarios');

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
    cy.get('input[type="email"]').type('admin@medisupply.com');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/usuarios');

    // Verificar que el sidebar muestra información del usuario
    cy.get('app-sidebar').within(() => {
      // Verificar que hay un nombre de usuario o email visible
      cy.get('.user-info, .sidebar-header').should('exist');
      
      // Verificar que el botón de logout está presente
      cy.contains('button', 'CERRAR SESIÓN').should('be.visible');
    });
  });
});
