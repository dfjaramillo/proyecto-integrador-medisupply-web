describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('https://proyecto-integrador-medidupply-32b261732f50.herokuapp.com/login');
  });

  it('debe mostrar el formulario de inicio de sesión', () => {
    cy.get('h2').should('contain', 'Inicio de sesión');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('debe mostrar errores de validación para el formulario vacío', () => {
    cy.get('button[type="submit"]').click();
    cy.get('mat-error').should('contain', 'El correo es obligatorio');
    cy.get('mat-error').should('contain', 'La contraseña es obligatoria');
  });

  it('debe mostrar error para formato de correo inválido', () => {
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('input[type="email"]').blur();
    cy.get('mat-error').should('contain', 'Formato de correo inválido');
  });

  it('debe mostrar error para contraseña corta', () => {
    cy.get('input[type="password"]').type('short');
    cy.get('input[type="password"]').blur();
    cy.get('mat-error').should('contain', 'Mínimo 8 caracteres');
  });

  it('debe alternar la visibilidad de la contraseña', () => {
    cy.get('input[type="password"]').should('exist');
    cy.get('button[aria-label*="Mostrar"]').click();
    cy.get('input[type="text"]').should('exist');
    cy.get('button[aria-label*="Ocultar"]').click();
    cy.get('input[type="password"]').should('exist');
  });

  it('debe iniciar sesión correctamente con credenciales válidas', () => {
    // Interceptar la llamada a la API
    cy.intercept('POST', '**/auth/token', {
      statusCode: 200,
      body: {
        access_token: 'mock-token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        'not-before-policy': 0,
        session_state: 'mock-session',
        scope: 'openid profile email'
      }
    }).as('loginRequest');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/usuarios');
  });

  it('debe mostrar un mensaje de error en caso de fallo en el inicio de sesión', () => {
    cy.intercept('POST', '**/auth/token', {
      statusCode: 401,
      body: {
        error: {
          "error": "invalid_grant",
          "error_description": "Invalid user credentials"
        }
      }
    }).as('loginRequest');

    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.contains('Invalid credentials').should('be.visible');
  });

  it('debe tener los atributos de accesibilidad adecuados', () => {
    cy.get('form').should('have.attr', 'role', 'form');
    cy.get('form').should('have.attr', 'aria-label');
    cy.get('input[type="email"]').should('have.attr', 'aria-required', 'true');
    cy.get('input[type="password"]').should('have.attr', 'aria-required', 'true');
    cy.get('button[aria-label*="contraseña"]').should('exist');
  });

});
