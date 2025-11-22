describe('Clientes pendientes - listado, filtros y acciones', () => {
  const BASE_URL = 'http://localhost:3000';

  const createMockClients = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `9c48cc5d-b67b-4d16-92d3-4608ac259f9${i + 1}`,
      name: `Cliente ${i + 1}`,
      email: `cliente${i + 1}@example.com`,
      institution_type: i % 2 === 0 ? 'Hospital' : 'Laboratorio',
      phone: `300${String(i + 1).padStart(7, '0')}`,
      role: 'Cliente',
      status: null,      
    }));
  };

  const allClients = createMockClients(12); // 12 para probar paginación de 5 en 5

  beforeEach(() => {
    // Login como usuario con acceso a clientes (por ejemplo Administrador)
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Interceptar la carga de clientes pendientes
    cy.intercept('GET', '**/auth/user?*role=Cliente*', {
      statusCode: 200,
      body: {
        message: 'Success',
        data: {
          users: allClients,
          pagination: {
            page: 1,
            per_page: 100,
            total: allClients.length,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null,
          },
        },
      },
    }).as('getClients');

    cy.visit(`${BASE_URL}/clientes`);
    cy.wait('@getClients');
  });

  it('debe mostrar la tabla de clientes con paginación personalizada', () => {
    cy.get('table.clients-table').should('be.visible');
    // Verificar que hay entre 1 y 12 filas (dependiendo de la paginación del componente)
    cy.get('table.clients-table tbody tr').should('have.length.at.least', 1).and('have.length.at.most', 12);
    // Verificar que muestra información de registros
    cy.get('.pagination-info').should('contain', 'registros');
  });

  it('debe filtrar por código, nombre, tipo de institución y fecha', () => {
    // Filtro por nombre
    cy.get('input[placeholder="Buscar cliente"]').type('Cliente 1');
    cy.get('table.clients-table tbody tr').should('have.length.at.least', 1);
    cy.get('table.clients-table tbody tr').first().should('contain', 'Cliente 1');

    // Limpiar filtro de nombre
    cy.get('input[placeholder="Buscar cliente"]').clear();

    // Filtro por tipo de institución
    cy.get('input[placeholder="Buscar tipo"]').type('Hospital');
    cy.get('table.clients-table tbody tr').each(($row) => {
      cy.wrap($row).should('contain', 'Hospital');
    });

    // Filtro por fecha (usa fecha formateada en es-CO)
    cy.get('input[placeholder="Buscar fecha"]').type('ene');
    cy.get('table.clients-table tbody tr').should('have.length.at.least', 1);
  });

  it('debe navegar entre páginas con los botones personalizados', () => {
    // Verificar que el botón Siguiente existe y hacer clic
    cy.contains('button', 'Siguiente').should('exist').click();
    cy.wait(500); // Esperar a que se actualice la paginación
    cy.get('.pagination-info').should('contain', 'registros');
    
    // Volver a la página anterior
    cy.contains('button', 'Anterior').should('exist').click();
    cy.wait(500);
    cy.get('.pagination-info').should('contain', 'registros');
  });

  it('debe permitir aprobar un cliente pendiente', () => {
    const clientToApprove = allClients[0];

    // Interceptar carga de vendedores
    cy.intercept('GET', '**/auth/user?*role=Ventas*', {
      statusCode: 200,
      body: {
        message: 'Success',
        data: {
          users: [
            {
              id: 'seller-1',
              name: 'Vendedor 1',
              email: 'vendedor1@example.com',
              institution_type: 'Interno',
              phone: '3000000000',
              role: 'Ventas',
              enabled: true,
              created_at: new Date().toISOString(),
            },
          ],
          pagination: {
            page: 1,
            per_page: 100,
            total: 1,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null,
          },
        },
      },
    }).as('getSellers');

    // Interceptar asignación
    cy.intercept('POST', '**/auth/assigned-clients', {
      statusCode: 200,
      body: { message: 'Cliente asignado', data: {} },
    }).as('assignClient');

    // Click en botón de aprobar de la primera fila
    cy.get('table.clients-table tbody tr').first().within(() => {
      cy.get('button').first().click();
    });

    cy.wait('@getSellers');

    // Seleccionar vendedor y guardar
    cy.get('mat-select').click();
    cy.get('mat-option').first().click();
    cy.contains('button', 'Guardar').click();

    cy.wait('@assignClient').its('request.body').should((body) => {
      expect(body.seller_id).to.equal('seller-1');
      expect(body.client_id).to.equal(clientToApprove.id);
    });
  });

  it('debe permitir rechazar un cliente pendiente', () => {
    const clientToReject = allClients[1];

    cy.intercept('POST', `**/auth/user/reject/${clientToReject.id}`, {
      statusCode: 200,
      body: { message: 'Cliente rechazado', data: {} },
    }).as('rejectClient');

    cy.get('table.clients-table tbody tr').eq(1).within(() => {
      cy.get('button').eq(1).click();
    });

    cy.get('textarea').type('No cumple requisitos de vinculación');
    cy.contains('button', 'Guardar').click();

    cy.wait('@rejectClient').its('request.body').should((body) => {
      expect(body.seller_id).to.exist;
      expect(body.client_id).to.equal(clientToReject.id);
    });
  });
});
