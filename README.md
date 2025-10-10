# Medisupply Frontend

Aplicación web de la solución medisupply desarrollada con Angular 20 y Angular Material.

## Requisitos

- Node.js 20.x
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:4200`

## Build

```bash
npm run build
```

## Pruebas Unitarias

### Ejecutar pruebas en modo watch
```bash
npm test
```

### Ejecutar pruebas con reporte de cobertura
```bash
npm run test:coverage
```

El reporte de cobertura se generará en `coverage/index.html`

### Ejecutar pruebas en CI
```bash
npm run test:ci
```

## Cobertura de Código

El proyecto requiere un mínimo de **80% de cobertura** en:
- Statements (declaraciones)
- Branches (ramas)
- Functions (funciones)
- Lines (líneas)

Para ver el reporte de cobertura después de ejecutar las pruebas:
```bash
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── auth/           # Módulo de autenticación
│   │   ├── login/      # Componente de login
│   │   ├── models/     # Modelos de datos
│   │   └── services/   # Servicios de autenticación
│   ├── core/           # Funcionalidad core (interceptors, guards)
│   └── shared/         # Componentes y utilidades compartidas
├── environments/       # Configuración de entornos
└── assets/            # Recursos estáticos
```

## CI/CD

El proyecto utiliza GitHub Actions para:
- Ejecutar pruebas unitarias
- Validar cobertura de código (mínimo 80%)
- Build de la aplicación
- Deploy automático a Heroku (rama main)

## Accesibilidad

El proyecto sigue los estándares WCAG 2.1 Level AA:
- Navegación por teclado
- Etiquetas ARIA apropiadas
- Contraste de colores adecuado
- Soporte para lectores de pantalla
