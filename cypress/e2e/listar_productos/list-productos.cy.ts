describe('Listar Productos', () => {
  const BASE_URL = 'http://localhost:3000';

  const mockProductos = [
    {
      id: 1,
      sku: 'MED-001',
      name: 'Acetaminofén 500mg',
      expiration_date: '2025-12-31',
      quantity: 100,
      price: 8500,
      location: 'A-03-01',
      description: 'Analgésico y antipirético',
      product_type: 'Alto valor',
      provider_id: 'provider-123',
      photo_filename: null,
      photo_url: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      sku: 'MED-002',
      name: 'Ibuprofeno 400mg',
      expiration_date: '2026-06-30',
      quantity: 50,
      price: 12500,
      location: 'B-02-03',
      description: 'Antiinflamatorio no esteroideo',
      product_type: 'Cadena fría',
      provider_id: 'provider-456',
      photo_filename: null,
      photo_url: null,
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    // Login como administrador
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });

    // Interceptar historial de cargue vacío
    cy.intercept('GET', '**/inventory/products/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          history: [],
          pagination: {
            page: 1,
            per_page: 5,
            total: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('getHistory');
  });

  it('Debería mostrar la lista de productos', () => {
    // Interceptar lista de productos
    cy.intercept('GET', '**/inventory/products?page=1&per_page=5', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Productos obtenidos exitosamente',
        data: {
          products: mockProductos,
          pagination: {
            page: 1,
            per_page: 5,
            total: 2,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('getProductos');

    // Navegar a inventario
    cy.visit(`${BASE_URL}/inventario`);
    cy.wait('@getProductos');
    
    // Verificar que los productos se muestran
    cy.contains('MED-001').should('be.visible');
    cy.contains('Acetaminofén 500mg').should('be.visible');
    cy.contains('MED-002').should('be.visible');
    cy.contains('Ibuprofeno 400mg').should('be.visible');
  });

  it('Debería mostrar mensaje cuando no hay productos', () => {
    // Interceptar lista vacía
    cy.intercept('GET', '**/inventory/products?page=1&per_page=5', {
      statusCode: 200,
      body: {
        success: true,
        message: 'No hay productos',
        data: {
          products: [],
          pagination: {
            page: 1,
            per_page: 5,
            total: 0,
            total_pages: 0,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('getProductosEmpty');

    cy.visit(`${BASE_URL}/inventario`);
    cy.wait('@getProductosEmpty');
    
    // Verificar mensaje de lista vacía
    cy.contains('No se encontraron productos').should('be.visible');
  });

  it('Debería filtrar productos por SKU', () => {
    // Interceptar lista inicial
    cy.intercept('GET', '**/inventory/products?page=1&per_page=5', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          products: mockProductos,
          pagination: {
            page: 1,
            per_page: 5,
            total: 2,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('getProductos');

    // Interceptar filtro por SKU
    cy.intercept('GET', '**/inventory/products?page=1&per_page=5&sku=med-0001', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          products: [mockProductos[0]],
          pagination: {
            page: 1,
            per_page: 5,
            total: 1,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('filterBySku');

    cy.visit(`${BASE_URL}/inventario`);
    cy.wait('@getProductos');
    
    // Aplicar filtro
    cy.get('input[placeholder="Buscar SKU"]').type('MED-0001');
    cy.wait(1000); // Esperar debounce
    cy.wait('@filterBySku');
    
    // Verificar que solo se muestra el producto filtrado
    cy.contains('MED-001').should('be.visible');    
  });

  it('Debería filtrar productos por nombre', () => {
    cy.intercept('GET', '**/inventory/products?page=1&per_page=5', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          products: mockProductos,
          pagination: {
            page: 1,
            per_page: 5,
            total: 2,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('getProductos');

    cy.intercept('GET', '**/inventory/products*name*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          products: [mockProductos[1]],
          pagination: {
            page: 1,
            per_page: 5,
            total: 1,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('filterByName');

    cy.visit(`${BASE_URL}/inventario`);
    cy.wait('@getProductos');
    
    // Aplicar filtro
    cy.get('input[placeholder="Buscar Nombre"]').type('Ibuprofeno');
    cy.wait(1000);
    cy.wait('@filterByName');
    
    // Verificar resultado
    cy.contains('Ibuprofeno 400mg').should('be.visible');
    cy.contains('Acetaminofén 500mg').should('not.exist');
  });

  it('Debería limpiar todos los filtros', () => {
    cy.intercept('GET', '**/inventory/products?page=1&per_page=5', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          products: mockProductos,
          pagination: {
            page: 1,
            per_page: 5,
            total: 2,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('getProductos');

    cy.visit(`${BASE_URL}/inventario`);
    cy.wait('@getProductos');
    
    // Aplicar filtros
    cy.get('input[placeholder="Buscar SKU"]').type('MED-001');
    cy.get('input[placeholder="Buscar Nombre"]').type('Test');
    
    // Limpiar filtros
    cy.get('input[placeholder="Buscar SKU"]').clear();
    cy.get('input[placeholder="Buscar Nombre"]').clear();
    
    // Verificar que los inputs están vacíos
    cy.get('input[placeholder="Buscar SKU"]').should('have.value', '');
    cy.get('input[placeholder="Buscar Nombre"]').should('have.value', '');
  });

  it('Debería navegar entre páginas', () => {
    // Primera página
    cy.intercept('GET', '**/inventory/products?page=1&per_page=5', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          products: [mockProductos[0]],
          pagination: {
            page: 1,
            per_page: 5,
            total: 10,
            total_pages: 2,
            has_next: true,
            has_prev: false,
            next_page: 2,
            prev_page: null
          }
        }
      }
    }).as('getProductosPage1');

    // Segunda página
    cy.intercept('GET', '**/inventory/products?page=2&per_page=5', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          products: [mockProductos[1]],
          pagination: {
            page: 2,
            per_page: 5,
            total: 10,
            total_pages: 2,
            has_next: false,
            has_prev: true,
            next_page: null,
            prev_page: 1
          }
        }
      }
    }).as('getProductosPage2');

    cy.visit(`${BASE_URL}/inventario`);
    cy.wait('@getProductosPage1');
    
    // Verificar producto de la primera página
    cy.contains('MED-001').should('be.visible');
    
    // Navegar a la segunda página
    cy.contains('button', '2').click();
    cy.wait('@getProductosPage2');
    
    // Verificar producto de la segunda página
    cy.contains('MED-002').should('be.visible');
  });
});
