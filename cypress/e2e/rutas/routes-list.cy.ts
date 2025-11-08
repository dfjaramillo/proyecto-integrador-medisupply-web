// E2E tests for listado de rutas (logística)
// Assumes baseUrl set to http://localhost:3000

describe('Logística - Listado de rutas', () => {
  beforeEach(() => {
    // Interceptar listado inicial antes de navegar
    cy.intercept('GET', '**/logistics/routes*', {
      statusCode: 200,
      body: { data: { routes: [], pagination: { total: 0, page: 1, per_page: 5, total_pages: 1 } } }
    }).as('getRoutesInit');

    // Sembrar sesión válida en onBeforeLoad para que el guard deje entrar
    cy.visit('/logistica/rutas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('ms_access_token', 'e2e.token');
        win.localStorage.setItem('ms_user', JSON.stringify({ role: 'Logistica', email: 'e2e@medisupply.com', name: 'E2E' }));
      }
    });
    cy.wait('@getRoutesInit');
  });

  it('muestra el título y botón de crear', () => {
    cy.contains('h1', 'Logística').should('be.visible');
    cy.contains('button', 'Crear ruta de entrega').should('be.visible');
  });

  it('aplica filtros de código y camión (debounce)', () => {
    // Interceptar la carga para validar parámetros
    cy.intercept('GET', '**/logistics/routes*').as('getRoutes');
    cy.get('input[aria-label="Filtrar por código de ruta"]').type('RUTA-001');
    cy.get('input[aria-label="Filtrar por camión"]').type('CAM-001');
    // Esperar por al menos una petición tras debounce
    cy.wait('@getRoutes').then((interception) => {
      const url = interception.request.url;
      expect(url).to.include('route_code=RUTA-001');
      expect(url).to.include('assigned_truck=CAM-001');
    });
  });

  it('abre detalle de mapa al hacer click en ver ruta', () => {
    // Mockear respuesta de rutas
    cy.intercept('GET', '**/logistics/routes*', {
      statusCode: 200,
      body: {
        data: {
          routes: [
            { id: 10, route_code: 'RUTA-010', assigned_truck: 'CAM-010', delivery_date: '2025-11-10', orders_count: 0 },
          ],
          pagination: { total: 1, page: 1, per_page: 5, total_pages: 1 }
        }
      }
    }).as('getRoutesOnce');
    cy.intercept('GET', '**/logistics/routes/10', {
      statusCode: 200,
      body: {
        data: {
          id: 10,
          route_code: 'RUTA-010',
          assigned_truck: 'CAM-010',
          delivery_date: '2025-11-10',
          clients: []
        }
      }
    }).as('getDetail10');
    cy.reload();
    cy.wait('@getRoutesOnce');
    cy.contains('.routes-table td', 'RUTA-010').should('be.visible');
    cy.get('button[aria-label="Ver ruta en mapa"]').first().click();
    cy.wait('@getDetail10');
    cy.get('.map-view').should('be.visible');
    cy.get('.back-btn').click();
    cy.get('.routes-table').should('be.visible');
  });

  it('maneja paginación básica', () => {
    // Mock varias páginas
    cy.intercept('GET', '**/logistics/routes*', (req) => {
      const url = new URL(req.url);
      const page = url.searchParams.get('page') || '1';
      const p = Number(page);
      const all = Array.from({ length: 8 }).map((_, i) => ({
        id: i + 1,
        route_code: 'RUTA-' + String(i + 1).padStart(3, '0'),
        assigned_truck: 'CAM-' + String(i + 1).padStart(3, '0'),
        delivery_date: '2025-11-11',
        orders_count: 0
      }));
      const start = (p - 1) * 5;
      const pageItems = all.slice(start, start + 5);
      req.reply({
        data: {
          routes: pageItems,
          pagination: { total: all.length, page: p, per_page: 5, total_pages: Math.ceil(all.length / 5) }
        }
      });
    }).as('getPaged');

    cy.reload();
    cy.wait('@getPaged');
    cy.contains('button', 'Siguiente').click();
    cy.wait('@getPaged');
    cy.contains('button', 'Anterior').click();
    cy.wait('@getPaged');
  });
});