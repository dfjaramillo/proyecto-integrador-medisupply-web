// E2E tests for mapa de ruta (vista de detalle)

describe('Logística - Mapa de ruta', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/logistics/routes*', {
      statusCode: 200,
      body: { data: { routes: [], pagination: { total: 0, page: 1, per_page: 5, total_pages: 1 } } }
    }).as('routesInit');
    cy.visit('/logistica/rutas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('ms_access_token', 'e2e.token');
        win.localStorage.setItem('ms_user', JSON.stringify({ role: 'Logistica', email: 'e2e@medisupply.com', name: 'E2E' }));
      }
    });
    cy.wait('@routesInit');
  });

  it('muestra overlay de carga del mapa y permite volver', () => {
    // Mockear una ruta y abrir el mapa
    cy.intercept('GET', '**/logistics/routes*', {
      statusCode: 200,
      body: {
        data: {
          routes: [
            { id: 42, route_code: 'RUTA-042', assigned_truck: 'CAM-042', delivery_date: '2025-12-01', orders_count: 0 }
          ],
          pagination: { total: 1, page: 1, per_page: 5, total_pages: 1 }
        }
      }
    }).as('getRoutes');
    // Interceptar detalle de ruta para el mapa
    cy.intercept('GET', '**/logistics/routes/42', {
      statusCode: 200,
      body: {
        data: {
          id: 42,
          route_code: 'RUTA-042',
          assigned_truck: 'CAM-042',
          delivery_date: '2025-12-01',
          clients: [
            { id: 1, name: 'Cliente A', address: 'Dir A', latitude: 4.65, longitude: -74.1 },
            { id: 2, name: 'Cliente B', address: 'Dir B', latitude: 4.63, longitude: -74.09 }
          ]
        }
      }
    }).as('getRouteDetail');
    cy.reload();
    cy.wait('@getRoutes');
  cy.get('button[aria-label="Ver ruta en mapa"]').first().click();
  // Asegurar que se solicita detalle y se muestra overlay mientras carga/espera Google Maps
  cy.wait('@getRouteDetail');
  cy.get('.loading-overlay').should('exist');
    cy.get('.back-btn').click();
    cy.get('.routes-table').should('be.visible');
  });
});