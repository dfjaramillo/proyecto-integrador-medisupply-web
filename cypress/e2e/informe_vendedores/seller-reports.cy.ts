describe('Seller Reports - Informe de Vendedores', () => {
  const baseUrl = 'http://localhost:3000';
  const apiUrl = 'https://medisupply-gateway-gw-d7fde8rj.uc.gateway.dev';

  const setupCommonInterceptors = () => {
    cy.intercept('GET', `${apiUrl}/auth/user?page=1&per_page=100&role=Ventas`, {
      statusCode: 200,
      body: {
        users: [
          {
            id: 'seller-1',
            name: 'Juan Pérez',
            email: 'juan.perez@medisupply.com',
            role: 'Ventas',
            institution_type: 'Ventas',
            phone: '3001234567',
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: 'seller-2',
            name: 'María García',
            email: 'maria.garcia@medisupply.com',
            role: 'Ventas',
            institution_type: 'Ventas',
            phone: '3007654321',
            created_at: '2024-02-20T10:00:00Z'
          }
        ],
        total: 2
      }
    }).as('getSellers');

    cy.intercept('GET', `${apiUrl}/orders/reports/seller/seller-1/status-summary`, {
      statusCode: 200,
      body: {
        data: {
          seller_id: 'seller-1',
          summary: {
            total_orders: 21,
            total_amount: 5250000
          },
          status_summary: [
            { status: 'Recibido', count: 2, percentage: 10, total_amount: 500000 },
            { status: 'En Preparación', count: 9, percentage: 43, total_amount: 2250000 },
            { status: 'En Tránsito', count: 4, percentage: 19, total_amount: 1000000 },
            { status: 'Entregado', count: 5, percentage: 24, total_amount: 1250000 },
            { status: 'Devuelto', count: 1, percentage: 5, total_amount: 250000 }
          ]
        }
      }
    }).as('getStatusSummary');

    cy.intercept('GET', `${apiUrl}/orders/reports/seller/seller-1/clients-summary*`, {
      statusCode: 200,
      body: {
        data: {
          seller_id: 'seller-1',
          summary: {
            total_clients: 5,
            total_orders: 21,
            total_amount: 5250000
          },
          clients: [
            { client_id: 'client-1', client_name: 'Hospital con Logo', orders_count: 8, total_amount: 1950000 },
            { client_id: 'client-2', client_name: 'Hospital Test 2176', orders_count: 6, total_amount: 1450000 },
            { client_id: 'client-3', client_name: 'Laboratorio Central', orders_count: 4, total_amount: 900000 },
            { client_id: 'client-4', client_name: 'Laboratorio Médico', orders_count: 2, total_amount: 250000 },
            { client_id: 'client-5', client_name: 'Clínica Especializada', orders_count: 1, total_amount: 100000 }
          ],
          pagination: {
            page: 1,
            per_page: 10,
            total: 5,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('getClientsSummary');

    cy.intercept('GET', `${apiUrl}/orders/reports/seller/seller-1/monthly-summary`, {
      statusCode: 200,
      body: {
        data: {
          seller_id: 'seller-1',
          period: {
            start_date: '2024-12-01',
            end_date: '2025-11-20',
            months: 12
          },
          summary: {
            total_orders: 120,
            total_amount: 15000000
          },
          monthly_data: [
            { year: 2025, month: 11, month_name: 'noviembre', month_short: 'nov', label: 'nov-2025', orders_count: 15, total_amount: 2500000 },
            { year: 2025, month: 10, month_name: 'octubre', month_short: 'oct', label: 'oct-2025', orders_count: 12, total_amount: 1800000 },
            { year: 2025, month: 9, month_name: 'septiembre', month_short: 'sep', label: 'sep-2025', orders_count: 10, total_amount: 1500000 },
            { year: 2025, month: 8, month_name: 'agosto', month_short: 'ago', label: 'ago-2025', orders_count: 11, total_amount: 1600000 },
            { year: 2025, month: 7, month_name: 'julio', month_short: 'jul', label: 'jul-2025', orders_count: 9, total_amount: 1200000 },
            { year: 2025, month: 6, month_name: 'junio', month_short: 'jun', label: 'jun-2025', orders_count: 8, total_amount: 1000000 },
            { year: 2025, month: 5, month_name: 'mayo', month_short: 'may', label: 'may-2025', orders_count: 10, total_amount: 1400000 },
            { year: 2025, month: 4, month_name: 'abril', month_short: 'abr', label: 'abr-2025', orders_count: 9, total_amount: 1300000 },
            { year: 2025, month: 3, month_name: 'marzo', month_short: 'mar', label: 'mar-2025', orders_count: 11, total_amount: 1500000 },
            { year: 2025, month: 2, month_name: 'febrero', month_short: 'feb', label: 'feb-2025', orders_count: 10, total_amount: 1100000 },
            { year: 2025, month: 1, month_name: 'enero', month_short: 'ene', label: 'ene-2025', orders_count: 8, total_amount: 600000 },
            { year: 2024, month: 12, month_name: 'diciembre', month_short: 'dic', label: 'dic-2024', orders_count: 7, total_amount: 500000 }
          ]
        }
      }
    }).as('getMonthlySummary');
  };

  describe('Como Administrador', () => {
    beforeEach(() => {
      setupCommonInterceptors();
      // Login programático para obtener token válido y evitar flakiness UI
      cy.request('POST', `${apiUrl}/auth/token`, {
        user: 'medisupply05@gmail.com',
        password: 'Admin123456'
      }).then(({ body }) => {
        // Guardar tokens en localStorage como hace AuthService
        window.localStorage.setItem('ms_access_token', body.access_token);
        window.localStorage.setItem('ms_refresh_token', body.refresh_token);
        window.localStorage.setItem('ms_user', JSON.stringify({
          email: body.email || 'medisupply05@gmail.com',
            name: body.name || 'Admin Medisupply',
            role: body.role || 'Administrador',
            id: body.id || 'admin-1'
        }));
      });
    });

  it('debe mostrar el título y breadcrumb correctamente', () => {
    cy.visit(`${baseUrl}/ventas/informe-vendedores`);
    
    cy.contains('h1', 'Informe de vendedores').should('be.visible');
    cy.get('.breadcrumb').should('contain', 'Ventas');
    cy.get('.breadcrumb').should('contain', 'Informe de vendedores');
  });

  it('debe mostrar el selector de vendedores para Administrador', () => {
    cy.visit(`${baseUrl}/ventas/informe-vendedores`);
    
    cy.wait('@getSellers');
    
    // Verificar que el selector es visible para Admin
    cy.get('.selector-container').should('be.visible');
    cy.get('.selector-container mat-select').should('be.visible');
  });

  it('debe mostrar estado vacío cuando no se selecciona vendedor', () => {
    cy.visit(`${baseUrl}/ventas/informe-vendedores`);
    
    cy.wait('@getSellers');
    
    cy.get('.empty-state').should('be.visible');
    cy.get('.empty-state').should('contain', 'Seleccione un vendedor para ver su informe de desempeño');
    cy.get('mat-icon.empty-icon').should('contain', 'assessment');
  });
  });

  describe('Como usuario Ventas', () => {
    beforeEach(() => {
      setupCommonInterceptors();
      cy.request('POST', `${apiUrl}/auth/token`, {
        user: 'ventas@correo.com',
        password: 'Password123.'
      }).then(({ body }) => {
        window.localStorage.setItem('ms_access_token', body.access_token);
        window.localStorage.setItem('ms_refresh_token', body.refresh_token);
        window.localStorage.setItem('ms_user', JSON.stringify({
          email: body.email || 'ventas@correo.com',
          name: body.name || 'Vendedor Uno',
          role: body.role || 'Ventas',
          id: body.id || 'seller-1'
        }));
      });
    });

    it('debe mostrar el título sin el selector', () => {
      cy.visit(`${baseUrl}/ventas/informe-vendedores`);
      
      cy.contains('h1', 'Informe de vendedores').should('be.visible');
      cy.get('.breadcrumb').should('contain', 'Ventas');
      cy.get('.breadcrumb').should('contain', 'Informe de vendedores');
      
      // Confirmar que no existe el selector
      cy.get('.selector-container').should('not.exist');
    });
  });
});
