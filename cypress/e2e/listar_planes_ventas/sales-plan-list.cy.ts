/// <reference types="cypress" />

describe('Listar Planes de Ventas', () => {
  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    // Interceptar lista de planes de ventas
    cy.intercept('GET', '**/sales-plan**', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Planes de ventas obtenidos exitosamente',
        data: {
          items: [
            {
              id: 1,
              name: 'Plan Estratégico Q1 2026',
              start_date: '2026-01-01T00:00:00.000Z',
              end_date: '2026-03-31T00:00:00.000Z',
              target_revenue: 50000000,
              objectives: 'Aumentar ventas en 25% durante el primer trimestre',
              seller_id: '550e8400-e29b-41d4-a716-446655440000',
              seller_name: 'Juan Pérez',
              client_id: '660e8400-e29b-41d4-a716-446655440001',
              client_name: 'Clínica San Juan',
              created_at: '2025-11-01T10:00:00.000Z',
              updated_at: '2025-11-01T10:00:00.000Z'
            },
            {
              id: 2,
              name: 'Plan Especial Navidad 2025',
              start_date: '2025-12-01T00:00:00.000Z',
              end_date: '2025-12-31T00:00:00.000Z',
              target_revenue: 30000000,
              objectives: 'Maximizar ventas durante temporada navideña',
              seller_id: '550e8400-e29b-41d4-a716-446655440000',
              seller_name: 'Juan Pérez',
              client_id: '770e8400-e29b-41d4-a716-446655440002',
              client_name: 'Farmacia Central',
              created_at: '2025-11-01T11:00:00.000Z',
              updated_at: '2025-11-01T11:00:00.000Z'
            }
          ],
          pagination: {
            page: 1,
            per_page: 10,
            total: 2,
            total_pages: 1
          }
        }
      }
    }).as('getSalesPlans');

    // Login como administrador
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Navegar directamente a la página de planes de ventas
    cy.visit(`${BASE_URL}/planes-ventas`);
  });

  it('debe mostrar la lista de planes de ventas', () => {
    // Verificar que estamos en la página correcta
    cy.contains('h1', 'Planes de ventas').should('be.visible');

    // Verificar que se muestran los planes
    cy.contains('Plan Estratégico Q1 2026').should('be.visible');
    cy.contains('Plan Especial Navidad 2025').should('be.visible');
  });

  it('debe mostrar la información correcta de cada plan', () => {
    // Verificar que se muestra la información de los planes
    // Las fechas en la tabla se formatean como 'Ene 01, 2026' por el componente
    cy.contains('Plan Estratégico Q1 2026').parent().parent().within(() => {
      cy.contains(/Ene 01, 2026|Dic 31, 2025/).should('be.visible'); // Fecha inicio (aceptar zona horaria)
      cy.contains(/Mar 31, 2026|Mar 30, 2026/).should('be.visible'); // Fecha fin
      cy.contains('Clínica San Juan').should('be.visible'); // Cliente
    });

    cy.contains('Plan Especial Navidad 2025').parent().parent().within(() => {
      cy.contains(/Dic 01, 2025|Nov 30, 2025/).should('be.visible'); // Fecha inicio
      cy.contains(/Dic 31, 2025/).should('be.visible'); // Fecha fin
      cy.contains('Farmacia Central').should('be.visible'); // Cliente
    });
  });

  it('debe mostrar el botón de crear plan de ventas', () => {
    cy.contains('button', 'Crear plan de ventas').should('be.visible');
  });

  it('debe mostrar los filtros de búsqueda', () => {
    // Verificar que existen los campos de filtro
    cy.get('input[placeholder="Buscar nombre"]').should('be.visible');
    cy.get('input[placeholder="Buscar fecha inicio"]').should('be.visible');
    cy.get('input[placeholder="Buscar fecha fin"]').should('be.visible');
    cy.get('input[placeholder="Buscar cliente"]').should('be.visible');
  });

  it('debe filtrar por nombre correctamente', () => {
    // Interceptar la búsqueda filtrada
    cy.intercept('GET', '**/sales-plan**', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Planes de ventas obtenidos exitosamente',
        data: {
          items: [
            {
              id: 1,
              name: 'Plan Estratégico Q1 2026',
              start_date: '2026-01-01T00:00:00.000Z',
              end_date: '2026-03-31T00:00:00.000Z',
              target_revenue: 50000000,
              objectives: 'Aumentar ventas en 25% durante el primer trimestre',
              seller_id: '550e8400-e29b-41d4-a716-446655440000',
              seller_name: 'Juan Pérez',
              client_id: '660e8400-e29b-41d4-a716-446655440001',
              client_name: 'Clínica San Juan',
              created_at: '2025-11-01T10:00:00.000Z',
              updated_at: '2025-11-01T10:00:00.000Z'
            }
          ],
          pagination: {
            page: 1,
            per_page: 10,
            total: 1,
            total_pages: 1
          }
        }
      }
    }).as('filterByName');

  // Escribir en el campo de búsqueda
  cy.get('input[placeholder="Buscar nombre"]').type('Plan Estratégico');

  // Esperar la petición filtrada y luego verificar que se actualiza la UI
  cy.wait('@filterByName');
  cy.contains('Plan Estratégico Q1 2026').should('be.visible');
  cy.contains('Plan Especial Navidad 2025').should('not.exist');
  });

  it('debe mostrar mensaje cuando no hay planes', () => {
    // Interceptar respuesta vacía
    cy.intercept('GET', '**/sales-plan**', {
      statusCode: 200,
      body: {
        success: true,
        message: 'No se encontraron planes de ventas',
        data: {
          items: [],
          pagination: {
            page: 1,
            per_page: 10,
            total: 0,
            total_pages: 0
          }
        }
      }
    }).as('emptySalesPlans');

    // Recargar la página para aplicar el nuevo intercept
    cy.reload();

    // Verificar mensaje de no data
    cy.contains('No se encontraron planes con los filtros aplicados.').should('be.visible');
  });

  it('debe mostrar el botón de ver detalle para cada plan', () => {
    // Verificar que existen botones de acción para cada fila
    cy.get('button[aria-label="Ver detalle del plan"]').should('have.length', 2);
  });
});