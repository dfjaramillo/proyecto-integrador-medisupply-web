/// <reference types="cypress" />

describe('Crear Plan de Ventas', () => {
  const BASE_URL = 'http://localhost:3000';

  // Función para generar nombre único
  const generateUniqueName = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `Plan de Prueba ${timestamp}${random}`;
  };

  beforeEach(() => {
    // Interceptar lista de vendedores
    cy.intercept('GET', '**/users**', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: {
          items: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Juan Pérez',
              email: 'juan.perez@medisupply.com',
              role: 'seller'
            },
            {
              id: '660e8400-e29b-41d4-a716-446655440001',
              name: 'María García',
              email: 'maria.garcia@medisupply.com',
              role: 'seller'
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
    }).as('getSellers');

    // Interceptar lista de clientes
    cy.intercept('GET', '**/clients**', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Clientes obtenidos exitosamente',
        data: {
          items: [
            {
              id: '660e8400-e29b-41d4-a716-446655440001',
              name: 'Clínica San Juan',
              email: 'contacto@clinicasanjuan.com',
              phone: '+57 1 2345678',
              address: 'Calle 123 #45-67, Bogotá'
            },
            {
              id: '770e8400-e29b-41d4-a716-446655440002',
              name: 'Farmacia Central',
              email: 'info@farmaciacentral.com',
              phone: '+57 1 3456789',
              address: 'Carrera 89 #12-34, Medellín'
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
    }).as('getClients');

    // Interceptar creación de plan de ventas
    cy.intercept('POST', '**/sales-plan**', (req) => {
      // Responder con el nombre que se envió en la petición
      const requestBody = req.body;
      req.reply({
        statusCode: 201,
        body: {
          success: true,
          message: 'Plan de ventas creado exitosamente',
          data: {
            id: 3,
            name: requestBody.name || 'Plan de Prueba',
            start_date: '2026-04-01T00:00:00.000Z',
            end_date: '2026-06-30T00:00:00.000Z',
            target_revenue: 75000000,
            objectives: 'Objetivo de prueba para e2e',
            seller_id: '550e8400-e29b-41d4-a716-446655440000',
            seller_name: 'Juan Pérez',
            client_id: '660e8400-e29b-41d4-a716-446655440001',
            client_name: 'Clínica San Juan',
            created_at: '2025-11-01T12:00:00.000Z',
            updated_at: '2025-11-01T12:00:00.000Z'
          }
        }
      });
    }).as('createSalesPlan');

    // Login como administrador
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Navegar directamente a la página de planes de ventas
    cy.visit(`${BASE_URL}/planes-ventas`);

    // Abrir el diálogo de crear plan de ventas
    cy.contains('button', 'Crear plan de ventas').click();
  });

  it('debe abrir el diálogo de crear plan de ventas', () => {
    // Verificar que el diálogo se abre
    cy.contains('h2', 'Crear Plan de Ventas').should('be.visible');
  });

  it('debe mostrar todos los campos del formulario', () => {
    // Verificar campos obligatorios existen
    cy.get('input[formcontrolname="name"]').should('exist');
    cy.get('input[formcontrolname="start_date"]').should('exist');
    cy.get('input[formcontrolname="end_date"]').should('exist');
    cy.get('input[formcontrolname="target_revenue"]').should('exist');
    cy.get('textarea[formcontrolname="objectives"]').should('exist');

    // Verificar selectores
    cy.get('mat-select[formcontrolname="client_id"]').should('be.visible');
  });

  it('debe crear un plan de ventas exitosamente', () => {
    const planName = generateUniqueName();

    // Llenar el formulario
    cy.get('input[formcontrolname="name"]').type(planName);
    cy.get('input[formcontrolname="start_date"]').type('2026-04-01', { force: true });
    cy.get('input[formcontrolname="end_date"]').type('2026-06-30', { force: true });
    cy.get('input[formcontrolname="target_revenue"]').type('75000000');
    cy.get('textarea[formcontrolname="objectives"]').type('Objetivo de prueba para e2e');

    // Seleccionar cliente usando una estrategia más robusta
    cy.get('mat-select[formcontrolname="client_id"]').click({ force: true });
    cy.get('mat-option').first().click();

    // Verificar que el botón está habilitado antes de hacer clic
    cy.contains('button', 'Guardar').should('not.be.disabled');

    // Enviar el formulario
    cy.contains('button', 'Guardar').click({ force: true });

    // Verificar que el diálogo se cerró (lo que indica éxito)
    cy.contains('h2', 'Crear Plan de Ventas').should('not.exist');
  });

  it('debe mostrar errores de validación para campos requeridos', () => {
    // Intentar enviar formulario vacío
    cy.contains('button', 'Guardar').click({ force: true });

    // Verificar mensajes de error
    cy.contains('Este campo es obligatorio').should('be.visible');
  });

  it('debe validar que la fecha de fin sea posterior a la fecha de inicio', () => {
    // Llenar fechas inválidas
    cy.get('input[formcontrolname="start_date"]').type('2026-06-30', { force: true });
    cy.get('input[formcontrolname="end_date"]').type('2026-04-01', { force: true });

    // Verificar error de validación
    cy.contains('La fecha de inicio debe ser menor o igual a la fecha de fin').should('be.visible');
  });

  it('debe validar formato de objetivo de ingresos', () => {
    // Ingresar valor negativo y tocar el campo para activar validación
    cy.get('input[formcontrolname="target_revenue"]').type('-100').blur();

    // Verificar que hay algún mensaje de error en el campo
    cy.get('input[formcontrolname="target_revenue"]').parents('mat-form-field').find('mat-error').should('be.visible');
  });

  it('debe cancelar la creación del plan', () => {
    // Llenar algunos campos
    cy.get('input[formcontrolname="name"]').type('Plan Cancelado');

    // Cancelar usando el botón de cerrar (X)
    cy.get('button[aria-label="Cerrar formulario de crear plan de ventas"]').click();

    // Verificar que el diálogo se cerró
    cy.contains('h2', 'Crear Plan de Ventas').should('not.exist');

    // Verificar que no se creó el plan (no debería aparecer en la lista)
    cy.contains('Plan Cancelado').should('not.exist');
  });

  it('no debe crear un plan de ventas si hay errores de validación', () => {
    const planName = generateUniqueName();

    // Interceptar error del servidor
    cy.intercept('POST', '**/sales-plan**', {
      statusCode: 400,
      body: {
        success: false,
        message: 'Error al crear el plan de ventas',
        error: 'Datos inválidos'
      }
    }).as('createSalesPlanError');

    // Llenar y enviar formulario
    cy.get('input[formcontrolname="name"]').type("Plan con Error -");
    cy.get('input[formcontrolname="start_date"]').type('2026-04-01', { force: true });
    cy.get('input[formcontrolname="end_date"]').type('2026-06-30', { force: true });
    cy.get('input[formcontrolname="target_revenue"]').type('75000000');
    cy.get('textarea[formcontrolname="objectives"]').type('Objetivo de prueba');

    cy.get('mat-select[formcontrolname="client_id"]').click({ force: true });
    cy.get('mat-option').first().click();

    cy.contains('button', 'Guardar').should('be.disabled');    
  });
});