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
  const apiPattern = '**/orders/reports/monthly*';

  it('renderiza tarjetas y gráficos con datos', () => {
    cy.intercept('GET', apiPattern, buildMonthly()).as('monthly');
    cy.visit(route, { onBeforeLoad: seedAuth });
    cy.contains('h1', 'Reporte operativo').should('be.visible');
    cy.wait('@monthly');
    cy.get('.loading').should('not.exist');
    cy.get('.card').should('have.length.at.least', 4);
    cy.contains('.card h2', 'Distribución mensual').should('be.visible');
    cy.contains('.card h2', 'TOP 5 Clientes').should('be.visible');
    cy.get('canvas').should('have.length', 3); // 3 charts
    // Tabla top clientes máximo 5 filas (excluding header)
    cy.get('table.clients-table tbody tr').its('length').should('be.lte', 5);
  });

  it('muestra estado vacío cuando no hay datos', () => {
    const empty = buildMonthly();
    empty.data.monthly_data = [];
    cy.intercept('GET', apiPattern, empty).as('monthlyEmpty');
    cy.visit(route, { onBeforeLoad: seedAuth });
    cy.wait('@monthlyEmpty');
    cy.get('.empty').should('contain.text', 'No hay datos');
  });

  it('muestra estado de error ante respuesta 500', () => {
    cy.intercept('GET', apiPattern, { statusCode: 500, body: { message: 'fail' } }).as('monthlyError');
    cy.visit(route, { onBeforeLoad: seedAuth });
    cy.wait('@monthlyError');
    cy.get('.error').should('contain.text', 'Error temporal');
  });

  it('filtra clientes por nombre con debounce', () => {
    cy.intercept('GET', apiPattern, buildMonthly()).as('monthly');
    cy.visit(route, { onBeforeLoad: seedAuth });
    cy.wait('@monthly');
    cy.get('mat-form-field input[placeholder="Nombre cliente"]').type('Ene');
    cy.wait(400); // debounce 300ms + margen
    cy.get('table.clients-table tbody tr').each($row => {
      cy.wrap($row).should('contain.text', 'Ene');
    });
  });
});
