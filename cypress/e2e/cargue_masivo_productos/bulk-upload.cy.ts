describe('Cargue Masivo de Productos', () => {
  const BASE_URL = 'http://localhost:3000';

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

  it('Debería abrir el diálogo de cargue masivo', () => {
    // Click en botón "Cargue masivo"
    cy.contains('button', 'Cargue masivo').should('be.visible').click();
    
    // Verificar que se abre el diálogo
    cy.contains('h2', 'Cargue masivo').should('be.visible');
    cy.contains('Descargar plantilla').should('be.visible');
    cy.contains('Cargar plantilla').should('be.visible');
  });

  it('Debería permitir descargar la plantilla', () => {
    // Abrir diálogo
    cy.contains('button', 'Cargue masivo').click();
    cy.contains('h2', 'Cargue masivo').should('be.visible');
    
    // Click en descargar plantilla
    cy.contains('button', 'Descargar plantilla').should('be.visible').click();
    
    // Verificar que aparece mensaje de éxito (el archivo se descarga en el navegador)
    cy.contains('Plantilla descargada exitosamente', { timeout: 3000 }).should('be.visible');
  });

  it('Debería validar el tipo de archivo', () => {
    // Abrir diálogo
    cy.contains('button', 'Cargue masivo').click();
    
    // Intentar cargar un archivo inválido (simular)
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('invalid content'),
      fileName: 'test.pdf',
      mimeType: 'application/pdf'
    }, { force: true });
    
    // Verificar mensaje de error
    cy.contains('Por favor seleccione un archivo CSV o Excel válido').should('be.visible');
  });

  it('Debería cargar un archivo CSV válido', () => {
    // Abrir diálogo
    cy.contains('button', 'Cargue masivo').click();
    
    // Preparar archivo CSV de prueba
    const csvContent = `sku,name,expiration_date,quantity,price,location,description,product_type,provider_id
TEST-001,Producto Test,2025-12-31,100,50000,A-01-01,Descripción test,Cadena fría,provider-123`;
    
    // Cargar archivo
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(csvContent),
      fileName: 'productos_test.csv',
      mimeType: 'text/csv'
    }, { force: true });
    
    // Verificar que el archivo se cargó
    cy.contains('productos_test.csv').should('be.visible');    
  });

  it('Debería permitir eliminar el archivo seleccionado', () => {
    // Abrir diálogo
    cy.contains('button', 'Cargue masivo').click();
    
    // Cargar archivo
    const csvContent = `sku,name,expiration_date,quantity,price,location,description,product_type,provider_id
TEST-001,Producto Test,2025-12-31,100,50000,A-01-01,Descripción test,Cadena fría,provider-123`;
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(csvContent),
      fileName: 'productos_test.csv',
      mimeType: 'text/csv'
    }, { force: true });
    
    // Verificar que el archivo está cargado
    cy.contains('productos_test.csv').should('be.visible');
    
    // Click en el botón de eliminar archivo
    cy.get('button[aria-label="Eliminar archivo seleccionado"]').click();
    
    // Verificar que el archivo fue eliminado
    cy.contains('productos_test.csv').should('not.exist');
    cy.contains('button', 'Cargar plantilla').should('be.visible');
  });

  it('Debería cargar archivo exitosamente', () => {
    // Interceptar cargue exitoso
    cy.intercept('POST', '**/inventory/products/import', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Archivo procesado exitosamente',
        data: {
          history_id: 'history-123'
        }
      }
    }).as('uploadFile');

    // Interceptar historial actualizado
    cy.intercept('GET', '**/inventory/products/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          history: [
            {
              id: 'history-123',
              file_name: 'productos_test.csv',
              status: 'Completado',
              created_at: '2025-10-25T10:00:00Z',
              result: 'Procesado correctamente',
              user_name: 'Usuario Compras'
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
    }).as('getHistoryUpdated');

    // Abrir diálogo
    cy.contains('button', 'Cargue masivo').click();
    
    // Cargar archivo
    const csvContent = `sku,name,expiration_date,quantity,price,location,description,product_type,provider_id
TEST-001,Producto Test,2025-12-31,100,50000,A-01-01,Descripción test,Cadena fría,provider-123`;
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(csvContent),
      fileName: 'productos_test.csv',
      mimeType: 'text/csv'
    }, { force: true });
    
    // Click en guardar
    cy.contains('button', 'Guardar').should('not.be.disabled').click();
    cy.wait('@uploadFile');
    
    // Verificar mensaje de éxito
    cy.contains('Archivo cargado exitosamente', { timeout: 3000 }).should('be.visible');
  });

  it('Debería mostrar error cuando el archivo tiene más de 100 productos', () => {
    // Interceptar error de validación
    cy.intercept('POST', '**/inventory/products/import', {
      statusCode: 400,
      body: {
        success: false,
        error: 'Error de validación',
        details: 'Solo se permiten cargar 100 productos. El archivo contiene 1000 registros'
      }
    }).as('uploadFileError');

    // Abrir diálogo
    cy.contains('button', 'Cargue masivo').click();
    
    // Cargar archivo grande
    let csvContent = 'sku,name,expiration_date,quantity,price,location,description,product_type,provider_id\n';
    for (let i = 1; i <= 1000; i++) {
      csvContent += `TEST-${i.toString().padStart(3, '0')},Producto ${i},2025-12-31,100,50000,A-01-01,Descripción,Cadena fría,provider-123\n`;
    }
    
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from(csvContent),
      fileName: 'productos_1000.csv',
      mimeType: 'text/csv'
    }, { force: true });
    
    // Click en guardar
    cy.contains('button', 'Guardar').click();
    cy.wait('@uploadFileError');
    
    // Verificar mensaje de error específico
    cy.contains('Solo se permiten cargar 100 productos').should('be.visible');
    cy.contains('El archivo contiene 1000 registros').should('be.visible');
  });

  it('Debería mostrar el historial de cargues en el panel de expansión', () => {
    // Interceptar historial con registros
    cy.intercept('GET', '**/inventory/products/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          history: [
            {
              id: 'history-123',
              file_name: 'productos_cargue_1.csv',
              status: 'Completado',
              created_at: '2025-10-25T10:00:00Z',
              result: 'Procesado correctamente: 50 productos',
              user_name: 'Usuario Compras'
            },
            {
              id: 'history-124',
              file_name: 'productos_cargue_2.csv',
              status: 'Error',
              created_at: '2025-10-24T15:30:00Z',
              result: 'Error en la línea 10: SKU duplicado',
              user_name: 'Usuario Compras'
            }
          ],
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
    }).as('getHistoryWithData');

    // Navegar a inventario
    cy.visit(`${BASE_URL}/inventario`);
    cy.wait('@getHistoryWithData');
    
    // Expandir el panel de historial
    cy.contains('Historial de Cargues Masivos').click();
    
    // Verificar que se muestran los registros
    cy.contains('productos_cargue_1.csv').should('be.visible');
    cy.contains('productos_cargue_2.csv').should('be.visible');
    cy.contains('Completado').should('be.visible');
    cy.contains('Error').should('be.visible');
  });

  it('Debería cerrar el diálogo al cancelar', () => {
    // Abrir diálogo
    cy.contains('button', 'Cargue masivo').click();
    cy.contains('h2', 'Cargue masivo').should('be.visible');
    
    // Cerrar con el botón X
    cy.get('button[aria-label="Cerrar formulario de cargue masivo"]').click();
    
    // Verificar que el diálogo se cerró
    cy.contains('h2', 'Cargue masivo').should('not.exist');
  });
});
