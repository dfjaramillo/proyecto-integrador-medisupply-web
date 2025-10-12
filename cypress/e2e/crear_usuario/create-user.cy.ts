describe('Crear Usuario', () => {
  const BASE_URL = 'https://proyecto-integrador-medidupply-32b261732f50.herokuapp.com';

  beforeEach(() => {
    // Interceptar login con token de administrador
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

    // Interceptar lista de usuarios
    cy.intercept('GET', '**/users?page=*', {
      statusCode: 200,
      body: {
        users: [],
        total: 0,
        page: 1,
        limit: 5
      }
    }).as('getUsers');

    // Login como administrador
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('admin@medisupply.com');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');
    cy.url().should('include', '/usuarios', { timeout: 10000 });
    // Esperar a que el botón de crear esté visible
    cy.contains('button', 'Crear usuario', { timeout: 10000 }).should('be.visible');
  });

  it('debe mostrar el botón de crear usuario solo para administradores', () => {
    // Verificar que el botón de crear usuario está visible
    cy.contains('button', 'Crear usuario').should('be.visible');
  });

  it('debe abrir el diálogo de crear usuario al hacer clic en el botón', () => {
    // Hacer clic en crear usuario
    cy.contains('button', 'Crear usuario').click();

    // Verificar que el diálogo se abre
    cy.get('mat-dialog-container').should('be.visible');
    cy.get('mat-dialog-container').within(() => {
      cy.contains('h2', 'Crear usuario').should('be.visible');
    });
  });

  it('debe mostrar el formulario con todos los campos necesarios', () => {
    cy.contains('button', 'Crear usuario').click();
    cy.get('mat-dialog-container').should('be.visible');

    // Verificar que los campos están presentes
    cy.contains('mat-label', 'Nombre completo').should('be.visible');
    cy.contains('mat-label', 'Correo electrónico').should('be.visible');
    cy.contains('mat-label', 'Contraseña').should('be.visible');
    cy.contains('mat-label', 'Confirmar contraseña').should('be.visible');
    cy.contains('mat-label', 'Rol').should('be.visible');
    
    // Verificar botones
    cy.contains('button', 'Guardar').should('be.visible');
  });

  it('debe validar que los campos son obligatorios', () => {
    cy.contains('button', 'Crear usuario').click();
    cy.get('mat-dialog-container').should('be.visible');

    // Intentar guardar sin llenar campos
    cy.contains('button', 'Guardar').click();

    // Verificar que aparecen mensajes de error
    cy.get('mat-error').should('exist');
    cy.get('mat-error').should('contain', 'obligatorio');
  });

  it('debe validar el formato del correo electrónico', () => {
    cy.contains('button', 'Crear usuario').click();
    cy.get('mat-dialog-container').should('be.visible');

    // Escribir un correo inválido en el campo de email (segundo input en el formulario)
    cy.get('mat-dialog-container').find('input[type="email"]').type('correo-invalido');
    cy.contains('button', 'Guardar').click(); // Trigger validation

    // Verificar mensaje de error
    cy.get('mat-error').should('contain', 'Formato de correo inválido');
  });

  it('debe permitir alternar la visibilidad de la contraseña', () => {
    cy.contains('button', 'Crear usuario').click();
    cy.get('mat-dialog-container').should('be.visible');

    // Verificar que hay botones para mostrar/ocultar contraseña
    cy.get('button[aria-label*="contraseña"]').should('have.length.at.least', 2);
    
    // Hacer clic en el primer botón (Contraseña)
    cy.get('button[aria-label*="Mostrar contraseña"]').first().click();
    
    // Verificar que cambió el icono o el aria-label
    cy.get('button[aria-label*="Ocultar contraseña"]').should('exist');
  });

  it('debe cerrar el diálogo al hacer clic en el botón de cerrar', () => {
    cy.contains('button', 'Crear usuario').click();
    cy.get('mat-dialog-container').should('be.visible');

    // Hacer clic en el botón X de cerrar
    cy.get('mat-dialog-container').within(() => {
      cy.get('button.close-btn').click();
    });

    // Verificar que el diálogo se cerró
    cy.get('mat-dialog-container').should('not.exist');
  });
});
