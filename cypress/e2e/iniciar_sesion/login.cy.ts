describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/login');
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
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login', { timeout: 10000 });
  });

  it('debe mostrar un mensaje de error en caso de fallo en el inicio de sesión', () => {
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Verificar que aparece un snackbar con mensaje de error
    cy.get('.mat-mdc-snack-bar-container, simple-snack-bar, .mdc-snackbar').should('be.visible');
  });

  it('debe tener los atributos de accesibilidad adecuados', () => {
    cy.get('form').should('have.attr', 'role', 'form');
    cy.get('form').should('have.attr', 'aria-label');
    cy.get('input[type="email"]').should('have.attr', 'aria-required', 'true');
    cy.get('input[type="password"]').should('have.attr', 'aria-required', 'true');
    cy.get('button[aria-label*="contraseña"]').should('exist');
  });

});
