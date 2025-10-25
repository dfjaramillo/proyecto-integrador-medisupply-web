describe('Crear Producto', () => {
  const BASE_URL = 'http://localhost:4200';

  beforeEach(() => {
    // Interceptar lista de productos vacía
    cy.intercept('GET', '**/inventory/products?page=1&per_page=5', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Productos obtenidos exitosamente',
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
    }).as('getProductos');

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

    // Interceptar lista de proveedores
    cy.intercept('GET', '**/providers*', {
      statusCode: 200,
      body: {
        message: 'Proveedores obtenidos exitosamente',
        data: {
          providers: [
            {
              id: 'provider-123',
              name: 'Farmacia Test',
              email: 'test@farmacia.com',
              phone: '3001234567',
              logo_filename: '',
              logo_url: ''
            }
          ],
          pagination: {
            page: 1,
            per_page: 10,
            total: 1,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            next_page: null,
            prev_page: null
          }
        }
      }
    }).as('getProveedores');

    // Login
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });
    
    // Navegar a inventario
    cy.visit(`${BASE_URL}/inventario`);
    cy.wait('@getProductos');
  });

  it('Debería abrir el formulario de crear producto', () => {
    // Click en botón "Crear producto"
    cy.contains('button', 'Crear producto').should('be.visible').click();
    
    // Verificar que se abre el formulario
    cy.contains('h2', 'Crear producto').should('be.visible');
    cy.get('input[formcontrolname="sku"]').should('be.visible');
    cy.get('input[formcontrolname="name"]').should('be.visible');
  });

  it('Debería validar campos requeridos', () => {
    // Abrir formulario
    cy.contains('button', 'Crear producto').click();
    cy.contains('h2', 'Crear producto').should('be.visible');
    
    // Verificar que el botón Guardar está deshabilitado cuando el formulario está vacío
    cy.contains('button', 'Guardar').should('be.disabled');
    
    // Verificar que los campos están marcados como inválidos
    cy.get('input[formcontrolname="sku"]').should('have.class', 'ng-invalid');
  });

  it('Debería crear un producto exitosamente', () => {
    // Interceptar la creación del producto
    cy.intercept('POST', '**/inventory/products', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Producto creado exitosamente',
        data: {
          id: 1,
          sku: 'TEST-001',
          name: 'Producto Test',
          expiration_date: '2025-12-31',
          quantity: 100,
          price: 50000,
          location: 'A-01-01',
          description: 'Producto de prueba',
          product_type: 'Cadena fría',
          provider_id: 'provider-123',
          photo_filename: null,
          photo_url: null,
          created_at: '2025-10-25T00:00:00Z',
          updated_at: '2025-10-25T00:00:00Z'
        }
      }
    }).as('createProducto');

    // Interceptar la lista actualizada con el nuevo producto
    cy.intercept('GET', '**/inventory/products?page=1&per_page=5', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Productos obtenidos exitosamente',
        data: {
          products: [
            {
              id: 1,
              sku: 'TEST-001',
              name: 'Producto Test',
              expiration_date: '2025-12-31',
              quantity: 100,
              price: 50000,
              location: 'A-01-01',
              description: 'Producto de prueba',
              product_type: 'Cadena fría',
              provider_id: 'provider-123',
              photo_filename: null,
              photo_url: null,
              created_at: '2025-10-25T00:00:00Z',
              updated_at: '2025-10-25T00:00:00Z'
            }
          ],
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
    }).as('getProductosUpdated');

    // Abrir formulario
    cy.contains('button', 'Crear producto').click();
    cy.contains('h2', 'Crear producto').should('be.visible');
    
    // Llenar formulario
    cy.get('input[formcontrolname="sku"]').type('TEST-001');
    cy.get('input[formcontrolname="name"]').type('Producto Test');
    cy.get('input[formcontrolname="expiration_date"]').type('2025-12-31');
    cy.get('input[formcontrolname="quantity"]').clear().type('100');
    cy.get('input[formcontrolname="price"]').clear().type('50000');
    cy.get('input[formcontrolname="location"]').type('A-01-01', {force: true});
    cy.get('textarea[formcontrolname="description"]').type('Producto de prueba');
    
    // Seleccionar tipo de producto
    cy.get('mat-select[formcontrolname="product_type"]').click();
    cy.get('mat-option').contains('Cadena fría').click();
    
    // Seleccionar proveedor
    cy.wait(500); // Esperar a que carguen los proveedores
    cy.get('input[formcontrolname="provider_id"]').type('Farmacia Test');
    cy.get('mat-option').contains('Farmacia Test').click();
    
    // Guardar
    cy.contains('button', 'Guardar').click();
    
    // Verificar que se hizo la petición
    cy.wait('@createProducto');
    
    // Verificar que el producto aparece en la lista
    cy.wait('@getProductosUpdated');
    cy.contains('TEST-001').should('be.visible');
    cy.contains('Producto Test').should('be.visible');
  });

  it('Debería mostrar error cuando el SKU ya existe', () => {
    // Interceptar error de SKU duplicado
    cy.intercept('POST', '**/inventory/products', {
      statusCode: 422,
      body: {
        success: false,
        error: 'Error de validación',
        details: 'El SKU ya existe en el sistema. Utilice un SKU único.'
      }
    }).as('createProductoDuplicado');

    // Abrir formulario
    cy.contains('button', 'Crear producto').click();
    
    // Llenar formulario
    cy.get('input[formcontrolname="sku"]').type('TEST-001');
    cy.get('input[formcontrolname="name"]').type('Producto Test');
    cy.get('input[formcontrolname="expiration_date"]').type('2025-12-31');
    cy.get('input[formcontrolname="quantity"]').clear().type('100');
    cy.get('input[formcontrolname="price"]').clear().type('50000');
    cy.get('input[formcontrolname="location"]').type('A-01-01', {force: true});
    cy.get('textarea[formcontrolname="description"]').type('Producto de prueba');
    
    cy.get('mat-select[formcontrolname="product_type"]').click();
    cy.get('mat-option').contains('Cadena fría').click();
    
    cy.wait(500);
    cy.get('input[formcontrolname="provider_id"]').type('Farmacia Test');
    cy.get('mat-option').contains('Farmacia Test').click();
    
    // Guardar
    cy.contains('button', 'Guardar').click();
    cy.wait('@createProductoDuplicado');
    
    // Verificar mensaje de error
    cy.contains('El SKU ya existe').should('be.visible');
  });

  it('Debería cerrar el formulario al cancelar', () => {
    // Abrir formulario
    cy.contains('button', 'Crear producto').click();
    cy.contains('h2', 'Crear producto').should('be.visible');
    
    // Cerrar con el botón X
    cy.get('button[aria-label="Cerrar formulario de crear producto"]').click();
    
    // Verificar que el formulario se cerró
    cy.contains('h2', 'Crear producto').should('not.exist');
  });
});
