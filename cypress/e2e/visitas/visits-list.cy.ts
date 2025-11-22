/// <reference types="cypress" />

describe('Visitas - Listado y evidencia', () => {
  /**
   * Interceptamos la llamada para garantizar datos determinísticos y evitar dependencia del backend.
   * Usamos solo una página de resultados (fixture videos-page1.json).
   */
  beforeEach(() => {
    cy.intercept('GET', '**/videos-processed*', { fixture: 'videos-page1.json' }).as('getVideos');
    cy.visit('/ventas/visitas', {
      onBeforeLoad: (win) => {
        // Tokens y rol requeridos por ventasGuard
        win.localStorage.setItem('ms_access_token', 'header.payload.signature');
        win.localStorage.setItem('ms_refresh_token', 'refresh-token');
        win.localStorage.setItem('ms_user', JSON.stringify({ role: 'Ventas' }));
      }
    });
  });

  /**
   * Verifica render básico y provee diagnósticos si la aplicación no está construida
   * o si el guard redirige a /login.
   */
  it('muestra filtros y tabla', () => {
    // Esperar a que la API responda
    cy.wait('@getVideos', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
    
    // Verificar que no redirigió a login
    cy.location('pathname').then(path => {
      if (path === '/login') {
        throw new Error('Redirigido a /login: asegúrate de configurar tokens y rol antes de visitar /ventas/visitas');
      }
    });
    
    // Verificar que la app está construida
    cy.get('body').then(body => {
      if (body.text().includes('Application not built')) {
        throw new Error('La aplicación no está construida. Ejecuta `npm run build` y luego `npm start` antes de las pruebas E2E.');
      }
    });
    
    // Esperar a que la tabla esté visible (indica que terminó de cargar)
    cy.get('[data-cy=visits-table]', { timeout: 10000 }).should('be.visible');
    
    // Verificar que los filtros están presentes
    cy.get('[data-cy=filter-id]').should('exist');
  });

  it('muestra paginación si hay registros', () => {
    cy.get('body').then(body => {
      if (body.find('[data-cy=pagination]').length) {
        cy.get('[data-cy=pagination]').should('be.visible');
      }
    });
  });

  it('verifica botones de evidencia y abre diálogo si disponible', () => {
    // Esperar explícitamente a que la tabla esté visible antes de buscar botones
    cy.get('[data-cy=visits-table]', { timeout: 10000 }).should('be.visible');
    
    // Verificar que existan botones de evidencia
    cy.get('[data-cy=evidence-btn]').should('have.length.greaterThan', 0);
    
    // Intentar hacer clic en el primer botón habilitado si existe
    cy.get('body').then(body => {
      const enabled = body.find('[data-cy=evidence-btn]:not([disabled])');
      if (enabled.length > 0) {
        cy.wrap(enabled.first()).click();
        cy.get('mat-dialog-container', { timeout: 5000 }).should('exist');
      }
    });
  });
});
