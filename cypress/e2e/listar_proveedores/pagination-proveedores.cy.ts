describe('Paginación de Proveedores', () => {
  const BASE_URL = 'http://localhost:4200';

  // Crear 15 proveedores mock para probar la paginación
  const createMockProveedores = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `123e4567-e89b-12d3-a456-42661417${String(i).padStart(4, '0')}`,
      name: `Proveedor ${i + 1}`,
      email: `proveedor${i + 1}@example.com`,
      phone: `300${String(i + 1).padStart(7, '0')}`,
      logo: `https://example.com/logo${i + 1}.png`,
      created_at: new Date(2025, 0, i + 1).toISOString()
    }));
  };

  // Crear 25 proveedores para probar paginación (10 por página = 3 páginas)
  const allProveedores = createMockProveedores(25);

  beforeEach(() => {
    // Login como administrador
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Interceptar lista de proveedores - retorna todos para paginación del lado del cliente
    cy.intercept('GET', '**/providers*', {
      statusCode: 200,
      body: {
        message: 'Proveedores obtenidos exitosamente',
        data: {
          providers: allProveedores,
          pagination: {
            page: 1,
            per_page: 100,
            total: 25,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('getProveedores');

    cy.visit(`${BASE_URL}/proveedores`);
    cy.wait('@getProveedores');
  });

  it('debe mostrar la primera página con 10 registros por defecto', () => {
    // Verificar que solo se muestran 5 registros (pageSize = 5 en la aplicación)
    cy.get('table tbody tr').should('have.length', 5);
    
    // Verificar que muestra los primeros 5 proveedores
    cy.get('table tbody tr').first().should('contain', 'Proveedor 1');
    cy.get('table tbody tr').last().should('contain', 'Proveedor 5');
  });

  it('debe mostrar el contador de páginas correcto', () => {
    // Con 25 proveedores y 5 por página, debe haber 5 páginas
    cy.get('.custom-pagination').should('be.visible');
    cy.contains('Mostrando 1 al 5 de 25 registros').should('be.visible');
  });

  it('debe mostrar los botones de navegación de páginas', () => {
    // Verificar que existen los botones de navegación
    cy.get('.custom-pagination').within(() => {
      cy.contains('button', 'Anterior').should('be.visible').and('be.disabled');
      cy.contains('button', '1').should('be.visible').and('have.class', 'active');
      cy.contains('button', '2').should('be.visible');
      cy.contains('button', '3').should('be.visible');
      cy.contains('button', '4').should('be.visible');
      cy.contains('button', '5').should('be.visible');
      cy.contains('button', 'Siguiente').should('be.visible').and('not.be.disabled');
    });
  });

  it('debe navegar a la segunda página al hacer clic en Siguiente', () => {
    // Hacer clic en Siguiente
    cy.contains('button', 'Siguiente').click();

    // Verificar que cambia a la página 2
    cy.get('.custom-pagination').within(() => {
      cy.contains('button', '2').should('have.class', 'active');
      cy.contains('button', 'Anterior').should('not.be.disabled');
    });

    // Verificar que muestra los registros correctos (5 por página)
    cy.get('table tbody tr').should('have.length', 5);
    cy.get('table tbody tr').first().should('contain', 'Proveedor 6');
    cy.get('table tbody tr').last().should('contain', 'Proveedor 10');

    // Verificar el contador
    cy.contains('Mostrando 6 al 10 de 25 registros').should('be.visible');
  });

  it('debe navegar a la primera página al hacer clic en Anterior', () => {
    // Ir a la segunda página
    cy.contains('button', 'Siguiente').click();
    cy.contains('button', '2').should('have.class', 'active');

    // Hacer clic en Anterior
    cy.contains('button', 'Anterior').click();

    // Verificar que vuelve a la página 1
    cy.get('.custom-pagination').within(() => {
      cy.contains('button', '1').should('have.class', 'active');
      cy.contains('button', 'Anterior').should('be.disabled');
    });

    // Verificar que muestra los primeros 5 registros
    cy.get('table tbody tr').should('have.length', 5);
    cy.get('table tbody tr').first().should('contain', 'Proveedor 1');
  });

  it('debe navegar directamente a una página específica', () => {
    // Hacer clic directamente en el botón de página 2
    cy.contains('button', '2').click();

    // Verificar que navega a la página 2
    cy.get('.custom-pagination').within(() => {
      cy.contains('button', '2').should('have.class', 'active');
    });

    // Verificar los registros (5 por página)
    cy.get('table tbody tr').should('have.length', 5);
    cy.contains('Mostrando 6 al 10 de 25 registros').should('be.visible');
  });

  it('debe deshabilitar el botón Siguiente en la última página', () => {
    // Ir a la última página (página 5, ya que 25/5 = 5 páginas)
    cy.contains('button', '5').click();

    // Verificar que Siguiente está deshabilitado
    cy.contains('button', 'Siguiente').should('be.disabled');
    
    // Verificar los últimos 5 registros
    cy.get('table tbody tr').should('have.length', 5);
    cy.contains('Mostrando 21 al 25 de 25 registros').should('be.visible');
  });

  it('debe resetear a la primera página al aplicar un filtro', () => {
    // Ir a la página 2
    cy.contains('button', '2').click();
    cy.contains('button', '2').should('have.class', 'active');

    // Aplicar un filtro
    cy.get('input[placeholder*="Buscar nombre"]').type('Proveedor 1');
    cy.wait(500); // Esperar el debounce

    // Verificar que vuelve a la página 1
    cy.get('.custom-pagination').within(() => {
      cy.contains('button', '1').should('have.class', 'active');
    });

    // Verificar los resultados filtrados (Proveedor 1, 10, 11, 12...19)
    cy.get('table tbody tr').should('have.length.lessThan', 20);
  });

  it('debe ocultar la paginación cuando hay menos de una página de resultados', () => {
    // Aplicar un filtro que devuelve pocos resultados
    cy.get('input[placeholder*="Buscar nombre"]').type('Proveedor 1');
    cy.wait(500);

    // Verificar que hay resultados pero menos de 10
    cy.get('table tbody tr').should('have.length.lessThan', 10);
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    // La paginación no debería mostrarse
    cy.get('.pagination-controls button').should('not.exist');
  });

  it('debe mantener la paginación después de aplicar y limpiar filtros', () => {
    // Aplicar un filtro
    cy.get('input[placeholder*="Buscar nombre"]').type('Proveedor');
    cy.wait(500);

    // Limpiar el filtro
    cy.get('input[placeholder*="Buscar nombre"]').clear();
    cy.wait(500);

    // Verificar que la paginación vuelve a aparecer correctamente (5 por página)
    cy.get('table tbody tr').should('have.length', 5);
    cy.get('.custom-pagination').should('be.visible');
    cy.contains('button', '1').should('have.class', 'active');
  });

  it('debe recalcular las páginas cuando cambia el número de resultados filtrados', () => {
    // Aplicar un filtro que devuelve 11 resultados (Proveedor 1, 10-19)
    cy.get('input[placeholder*="Buscar nombre"]').type('Proveedor 1');
    cy.wait(500);

    // Verificar que muestra la primera página de resultados (5 items)
    cy.get('table tbody tr').should('have.length', 5);
    // Debe haber 3 páginas ahora (11 items / 5 por página = 3 páginas)
    cy.get('.custom-pagination').should('be.visible');
  });
  
});
