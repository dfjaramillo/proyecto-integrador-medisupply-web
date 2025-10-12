/// <reference types="cypress" />
// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Custom command to mock successful login
Cypress.Commands.add('mockLoginSuccess', () => {
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
});

// Custom command to mock failed login
Cypress.Commands.add('mockLoginFailure', (message = 'Invalid credentials') => {
  cy.intercept('POST', '**/auth/token', {
    statusCode: 401,
    body: { message }
  }).as('loginRequest');
});

// Custom command to login with admin credentials
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin-session', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@medisupply.com');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/usuarios');
  });
});

// Custom command to mock get users API
Cypress.Commands.add('mockGetUsers', (users = []) => {
  cy.intercept('GET', '**/users?page=*', {
    statusCode: 200,
    body: {
      users: users,
      total: users.length,
      page: 1,
      limit: 5
    }
  }).as('getUsers');
});

// Custom command to mock create user API
Cypress.Commands.add('mockCreateUser', (statusCode = 201) => {
  if (statusCode === 201) {
    cy.intercept('POST', '**/users', {
      statusCode: 201,
      body: {
        message: 'Usuario creado exitosamente',
        data: {
          id: 'mock-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'COMPRAS'
        }
      }
    }).as('createUser');
  } else {
    cy.intercept('POST', '**/users', {
      statusCode: statusCode,
      body: {
        message: 'Error creating user'
      }
    }).as('createUser');
  }
});

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      mockLoginSuccess(): Chainable<void>;
      mockLoginFailure(message?: string): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      mockGetUsers(users?: any[]): Chainable<void>;
      mockCreateUser(statusCode?: number): Chainable<void>;
    }
  }
}
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }