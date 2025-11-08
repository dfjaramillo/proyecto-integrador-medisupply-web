// E2E tests for creación de rutas de logística

describe('Logística - Crear ruta de entrega', () => {
  beforeEach(() => {
    // Intercept listado inicial
    cy.intercept('GET', '**/logistics/routes*', {
      statusCode: 200,
      body: { data: { routes: [], pagination: { total: 0, page: 1, per_page: 5, total_pages: 1 } } }
    }).as('getRoutesInit');

    // Entrar con sesión válida
    cy.visit('/logistica/rutas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('ms_access_token', 'e2e.token');
        win.localStorage.setItem('ms_user', JSON.stringify({ role: 'Logistica', email: 'e2e@medisupply.com', name: 'E2E' }));
      }
    });
    cy.wait('@getRoutesInit');
  });

  it('muestra errores de validación al tocar campos vacíos', () => {
    cy.contains('button', 'Crear ruta de entrega').click();
    cy.get('.create-route-dialog').should('be.visible');
    // Abrir y cerrar selects con ESC para marcar touched
    cy.get('mat-select[formcontrolname="assigned_truck"]').click().type('{esc}');
    cy.get('mat-select[formcontrolname="product_type"]').click().type('{esc}');
    // Focus/blur en fecha
    cy.get('input[formcontrolname="delivery_date"]').focus().blur();
    // Verificar múltiples errores requeridos
    cy.get('mat-error').should('have.length.greaterThan', 1);
    cy.get('mat-error').first().should('contain.text', 'Este campo es obligatorio');
  });

  it('crea ruta exitosamente', () => {
    // Interceptar creación
    cy.intercept('POST', '**/logistics/routes', {
      statusCode: 201,
      body: {
        data: { id: 99, route_code: 'RUTA-099', assigned_truck: 'CAM-001', delivery_date: '2025-11-15', orders_count: 0 }
      }
    }).as('createRoute');
    // Interceptar recarga de listado
    cy.intercept('GET', '**/logistics/routes*', {
      statusCode: 200,
      body: {
        data: {
          routes: [ { id: 99, route_code: 'RUTA-099', assigned_truck: 'CAM-001', delivery_date: '2025-11-15', orders_count: 0 } ],
          pagination: { total: 1, page: 1, per_page: 5, total_pages: 1 }
        }
      }
    }).as('reloadList');

    cy.contains('button', 'Crear ruta de entrega').click();
    cy.get('mat-select[formcontrolname="assigned_truck"]').click();
    cy.get('mat-option').contains('CAM-001').click();

    cy.get('mat-select[formcontrolname="product_type"]').click();
    cy.get('mat-option').first().click();

    // Seleccionar fecha usando datepicker (simple: escribir)
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  cy.get('input[formcontrolname="delivery_date"]').type(`${mm}/${dd}/${yyyy}`);

    cy.contains('button', 'Generar ruta').click();
    cy.wait('@createRoute');
    cy.wait('@reloadList');
    cy.contains('.routes-table td', 'RUTA-099').should('be.visible');
  });

  it('marca camión no disponible si hay conflicto en la fecha', () => {
    // Cuando se valida disponibilidad se hace GET con assigned_truck y delivery_date
    cy.intercept('GET', '**/logistics/routes*', (req) => {
      const url = new URL(req.url);
      if (url.searchParams.get('assigned_truck') === 'CAM-002') {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              routes: [ { id: 10, route_code: 'RUTA-010', assigned_truck: 'CAM-002', delivery_date: '2025-11-20', orders_count: 0 } ],
              pagination: { total: 1, page: 1, per_page: 5, total_pages: 1 }
            }
          }
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            data: { routes: [], pagination: { total: 0, page: 1, per_page: 5, total_pages: 1 } }
          }
        });
      }
    }).as('availability');

    cy.contains('button', 'Crear ruta de entrega').click();
    cy.get('.create-route-dialog').should('be.visible');
    cy.get('mat-select[formcontrolname="assigned_truck"]').click();
    cy.get('mat-option').contains('CAM-002').click(); // cierra overlay
    // Fecha conflictiva (triggers dateChange)
    cy.get('input[formcontrolname="delivery_date"]').type('11/20/2025').blur();
    cy.wait('@availability');
    // Esperar aparición del error; puede necesitar forzado porque snackbar overlay puede cubrir momentáneamente
    cy.contains('mat-error', 'El camión ya tiene una ruta asignada en esta fecha', { timeout: 8000 }).should('be.visible');
  });
});