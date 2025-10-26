describe('Listar Proveedores', () => {
  const BASE_URL = 'http://localhost:3000';

  const mockProveedores = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Farmacia Central',
      email: 'contacto@farmaciacentral.com',
      phone: '3001234567',
      logo: 'https://example.com/logo1.png',
      created_at: '2025-01-15T10:00:00Z'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Distribuidora MediPlus',
      email: 'ventas@mediplus.com',
      phone: '3109876543',
      logo: 'https://example.com/logo2.png',
      created_at: '2025-01-16T11:30:00Z'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174003',
      name: 'Laboratorios Unidos',
      email: 'info@labunidos.com',
      phone: '3201112222',
      logo: 'https://example.com/logo3.png',
      created_at: '2025-01-17T09:15:00Z'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174004',
      name: 'Droguería La Salud',
      email: 'contacto@lasalud.com',
      phone: '3153334444',
      logo: 'https://example.com/logo4.png',
      created_at: '2025-01-18T14:20:00Z'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174005',
      name: 'Suministros Médicos Express',
      email: 'pedidos@medexpress.com',
      phone: '3175556666',
      logo: 'https://example.com/logo5.png',
      created_at: '2025-01-19T16:45:00Z'
    }
  ];

  beforeEach(() => {
    // Login como administrador
    cy.visit(`${BASE_URL}/login`);
    cy.get('input[type="email"]').type('medisupply05@gmail.com');
    cy.get('input[type="password"]').type('Admin123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login', { timeout: 10000 });
    
    // Interceptar lista de proveedores con datos
    cy.intercept('GET', '**/providers*', {
      statusCode: 200,
      body: {
        message: 'Proveedores obtenidos exitosamente',
        data: {
          providers: mockProveedores,
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
    }).as('getProveedores');

    // Navegar a proveedores
    cy.visit(`${BASE_URL}/proveedores`);
    cy.wait('@getProveedores');
  });

  it('debe mostrar el título de la página', () => {
    cy.contains('h1', 'Proveedores').should('be.visible');
  });

  it('debe mostrar la lista de proveedores', () => {
    // Verificar que la tabla está visible
    cy.get('table').should('be.visible');
    
    // Verificar que muestra los 5 proveedores
    cy.get('table tbody tr').should('have.length', 5);
  });

  it('debe mostrar las columnas correctas en la tabla', () => {
    // Verificar encabezados de la tabla
    cy.get('table thead').within(() => {
      cy.contains('NOMBRE').should('be.visible');
      cy.contains('CORREO DE CONTACTO').should('be.visible');
      cy.contains('TELÉFONO').should('be.visible');
    });
  });

  it('debe mostrar los datos correctos de cada proveedor', () => {
    // Verificar que se muestran los datos del primer proveedor
    cy.get('table tbody tr').first().within(() => {
      cy.contains('Farmacia Central').should('be.visible');
      cy.contains('contacto@farmaciacentral.com').should('be.visible');
      cy.contains('3001234567').should('be.visible');
    });
  });

  it('debe mostrar los filtros de búsqueda', () => {
    // Verificar que los filtros están presentes
    cy.get('input[placeholder*="Buscar nombre"]').should('be.visible');
    cy.get('input[placeholder*="Buscar correo"]').should('be.visible');
    cy.get('input[placeholder*="Buscar teléfono"]').should('be.visible');
  });

  it('debe filtrar por nombre correctamente', () => {
    // Escribir en el filtro de nombre
    cy.get('input[placeholder*="Buscar nombre"]').type('Farmacia');
    
    // Esperar el debounce (400ms)
    cy.wait(500);

    // Verificar que se filtran los resultados
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('table tbody tr').first().should('contain', 'Farmacia Central');
  });

  it('debe filtrar por correo correctamente', () => {
    // Escribir en el filtro de correo
    cy.get('input[placeholder*="Buscar correo"]').type('mediplus');
    
    // Esperar el debounce (400ms)
    cy.wait(500);

    // Verificar que se filtran los resultados
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('table tbody tr').first().should('contain', 'ventas@mediplus.com');
  });

  it('debe filtrar por teléfono correctamente', () => {
    // Escribir en el filtro de teléfono
    cy.get('input[placeholder*="Buscar teléfono"]').type('320');
    
    // Esperar el debounce (400ms)
    cy.wait(500);

    // Verificar que se filtran los resultados
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('table tbody tr').first().should('contain', '3201112222');
  });

  it('debe combinar múltiples filtros correctamente', () => {
    // Escribir en varios filtros
    cy.get('input[placeholder*="Buscar nombre"]').type('Laboratorios');
    cy.get('input[placeholder*="Buscar correo"]').type('labunidos');
    
    // Esperar el debounce (400ms)
    cy.wait(500);

    // Verificar que se filtran los resultados
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('table tbody tr').first().should('contain', 'Laboratorios Unidos');
  });
  
  it('debe limpiar los filtros al borrar el texto', () => {
    // Escribir y luego limpiar el filtro
    cy.get('input[placeholder*="Buscar nombre"]').type('Farmacia');
    cy.wait(500);
    cy.get('table tbody tr').should('have.length', 1);

    // Limpiar el filtro
    cy.get('input[placeholder*="Buscar nombre"]').clear();
    cy.wait(500);

    // Verificar que se muestran todos los proveedores
    cy.get('table tbody tr').should('have.length', 5);
  });

  it('debe mostrar el contador de registros', () => {
    // Verificar que se muestra el contador (solo si hay paginación)
    // Con 5 proveedores y 10 por página, NO debe mostrar paginación
    cy.get('.custom-pagination').should('not.exist');
  });

  it('debe mostrar el estado de carga', () => {
    // Interceptar con delay para ver el spinner
    cy.intercept('GET', '**/providers*', (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: {
          message: 'Proveedores obtenidos exitosamente',
          data: {
            providers: mockProveedores,
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
      });
    }).as('getProveedoresDelay');

    // Recargar la página
    cy.visit(`${BASE_URL}/proveedores`);

    // Verificar que se muestra el spinner
    cy.get('mat-spinner').should('be.visible');
    cy.contains('Cargando proveedores...').should('be.visible');

    // Esperar a que termine de cargar
    cy.wait('@getProveedoresDelay');
    cy.get('mat-spinner').should('not.exist');
  });

  it('debe ser accesible desde el menú lateral', () => {
    // Ir al inicio
    cy.visit(`${BASE_URL}/usuarios`);

    // Expandir sección de administración si no está expandida
    cy.get('.section-header').contains('ADMINISTRACIÓN').click();

    // Hacer clic en Proveedores en el menú lateral
    cy.get('.nav-item').contains('Proveedores').click();

    // Verificar que navegó a proveedores
    cy.url().should('include', '/proveedores');
    cy.contains('h1', 'Proveedores').should('be.visible');
  });
});
