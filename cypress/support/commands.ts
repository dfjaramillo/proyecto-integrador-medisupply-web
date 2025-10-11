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

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      mockLoginSuccess(): Chainable<void>;
      mockLoginFailure(message?: string): Chainable<void>;
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