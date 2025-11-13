/// <reference types="cypress" />

const seedAuth = (win: Window) => {
  win.localStorage.setItem('ms_access_token', 'dummy');
  win.localStorage.setItem('ms_user', JSON.stringify({ role: 'Ventas', username: 'tester' }));
};

const buildMonthly = () => ({
  success: true,
  message: 'ok',
  data: {
    period: { start_date: '2024-01-01', end_date: '2024-06-30', months: 6 },
    summary: {
      total_orders: 60,
      total_amount: 600000,
      months_with_data: 6,
      average_orders_per_month: 10,
      average_amount_per_month: 100000
    },
    monthly_data: [
      { year: 2024, month: 1, month_name: 'Enero', month_short: 'Ene', label: 'Enero', orders_count: 10, total_amount: 100000 },
      { year: 2024, month: 2, month_name: 'Febrero', month_short: 'Feb', label: 'Febrero', orders_count: 9, total_amount: 90000 },
      { year: 2024, month: 3, month_name: 'Marzo', month_short: 'Mar', label: 'Marzo', orders_count: 11, total_amount: 110000 },
      { year: 2024, month: 4, month_name: 'Abril', month_short: 'Abr', label: 'Abril', orders_count: 8, total_amount: 80000 },
      { year: 2024, month: 5, month_name: 'Mayo', month_short: 'May', label: 'Mayo', orders_count: 12, total_amount: 120000 },
      { year: 2024, month: 6, month_name: 'Junio', month_short: 'Jun', label: 'Junio', orders_count: 10, total_amount: 100000 }
    ]
  }
});

describe('Reporte Operativo (Ventas)', () => {
  const route = '/ventas/reporte-operativo';
  const monthlyPattern = '**/orders/reports/monthly*';
  const topClientsPattern = '**/orders/reports/top-clients*';
  const topProductsPattern = '**/orders/reports/top-products*';

  it('renderiza tarjetas y gráficos con datos', () => {
    // Stub all three endpoints used by the dashboard to avoid 401 redirections
    cy.intercept('GET', monthlyPattern, buildMonthly()).as('monthly');
    cy.intercept('GET', topClientsPattern, {
      success: true,
      message: 'ok',
      data: {
        period: { start_date: '2024-01-01', end_date: '2024-06-30', months: 6 },
        top_clients: [
          { client_id: 'C1', client_name: 'Cliente 1', orders_count: 12 },
          { client_id: 'C2', client_name: 'Cliente 2', orders_count: 11 },
          { client_id: 'C3', client_name: 'Cliente 3', orders_count: 10 },
          { client_id: 'C4', client_name: 'Cliente 4', orders_count: 9 },
          { client_id: 'C5', client_name: 'Cliente 5', orders_count: 8 }
        ]
      }
    }).as('topClients');
    cy.intercept('GET', topProductsPattern, {
      success: true,
      message: 'ok',
      data: {
        top_products: Array.from({ length: 10 }).map((_, i) => ({
          product_id: i + 1,
          product_name: `Producto ${i + 1}`,
          total_sold: 100 - i * 3
        }))
      }
    }).as('topProducts');

    cy.visit(route, { onBeforeLoad: seedAuth });
    cy.contains('h1', 'Reporte operativo').should('be.visible');
    cy.wait(['@monthly', '@topClients', '@topProducts']);
    cy.get('.loading').should('not.exist');
    cy.get('.card').should('have.length.at.least', 4);
    // Headings changed in template; assert using partial matches
    cy.contains('.card h2', 'Distribución mensual de pedidos').should('be.visible');
    cy.contains('.card h2', 'TOP 5 Clientes con más pedidos').should('be.visible');
    cy.contains('.card h2', 'TOP 10 Productos más vendidos').should('be.visible');
    cy.get('canvas').should('have.length', 3); // 3 charts
    // Tabla top clientes máximo 5 filas (excluding header)
    cy.get('table.clients-table tbody tr').its('length').should('be.lte', 5);
  });

  it('muestra estado vacío cuando no hay datos', () => {
    const empty = buildMonthly();
    empty.data.monthly_data = [];
    cy.intercept('GET', monthlyPattern, empty).as('monthlyEmpty');
    // Still stub other endpoints to avoid redirect side-effects
    cy.intercept('GET', topClientsPattern, { success: true, message: 'ok', data: { period: { start_date: '', end_date: '', months: 0 }, top_clients: [] } }).as('topClientsEmpty');
    cy.intercept('GET', topProductsPattern, { success: true, message: 'ok', data: { top_products: [] } }).as('topProductsEmpty');
    cy.visit(route, { onBeforeLoad: seedAuth });
    cy.wait(['@monthlyEmpty', '@topClientsEmpty', '@topProductsEmpty']);
    cy.get('.empty').should('contain.text', 'No hay datos');
  });

  it('muestra estado de error ante respuesta 500', () => {
    // Force both real and fallback (mock) monthly requests to fail to trigger component error state
    cy.intercept('GET', monthlyPattern, { statusCode: 500, body: { message: 'fail' } }).as('monthlyError');
    cy.intercept('GET', '**/mocks/reports/monthly.json', { statusCode: 500, body: { message: 'fail-mock' } }).as('monthlyMockError');
    cy.intercept('GET', topClientsPattern, { success: true, message: 'ok', data: { period: { start_date: '', end_date: '', months: 0 }, top_clients: [] } }).as('topClientsOk');
    cy.intercept('GET', topProductsPattern, { success: true, message: 'ok', data: { top_products: [] } }).as('topProductsOk');
    cy.visit(route, { onBeforeLoad: seedAuth });
    cy.wait(['@monthlyError', '@monthlyMockError', '@topClientsOk', '@topProductsOk']);
    // Wait until loading spinner gone, then assert error state
    cy.get('.loading', { timeout: 8000 }).should('not.exist');
    cy.get('.error', { timeout: 8000 }).should('contain.text', 'Error temporal');
  });  
});
