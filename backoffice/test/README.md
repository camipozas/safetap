# Tests del Backoffice de SafeTap

Este directorio contiene todos los tests para el panel de administración del backoffice de SafeTap.

## Estructura de Tests

```
test/
├── setup.ts                           # Configuración global de tests
├── README.md                          # Esta documentación
├── components/                        # Tests de componentes React
│   ├── orders-table.test.tsx         # Tabla de órdenes
│   ├── users-table.test.tsx          # Tabla de usuarios
│   └── confirmation-modal.test.tsx   # Modal de confirmación
├── api/                              # Tests de rutas API
│   └── orders.test.ts                # API de órdenes
├── utils/                            # Tests de utilidades
│   └── utils.test.ts                 # Funciones helper
├── pages/                            # Tests de páginas
│   └── orders.test.tsx               # Página de órdenes
└── integration/                      # Tests de integración
    └── orders-workflow.test.tsx      # Flujo completo de órdenes
```

## Comandos de Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Ejecutar tests con coverage
npm test -- --coverage

# Ejecutar tests específicos
npm test -- orders
npm test -- components
npm test -- api
```

## Tecnologías Utilizadas

- **Vitest**: Framework de testing rápido compatible con Vite
- **@testing-library/react**: Utilidades para testing de componentes React
- **@testing-library/jest-dom**: Matchers adicionales para DOM testing
- **jsdom**: Entorno DOM simulado para Node.js

## Configuración

### setup.ts

Contiene:

- Configuración global de Jest DOM
- Mocks de Next.js (router, navigation)
- Mocks de NextAuth
- Mocks de Prisma client
- Variables de entorno para testing

### vitest.config.ts

Configuración de Vitest con:

- Plugin de React
- Entorno jsdom
- Alias de rutas (@)
- Setup files

## Tipos de Tests

### 1. Tests de Componentes

Prueban componentes React de forma aislada:

- Renderizado correcto
- Interacciones del usuario
- Props y estado
- Callbacks y eventos

**Ejemplo:**

```typescript
it('renders orders correctly', () => {
  render(<OrdersTable orders={mockOrders} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

### 2. Tests de API

Prueban las rutas de API:

- Requests y responses
- Validación de datos
- Manejo de errores
- Autenticación y autorización

**Ejemplo:**

```typescript
it('updates order status successfully', async () => {
  const response = await PUT(request, { params: { id: 'test-id' } });
  expect(response.status).toBe(200);
});
```

### 3. Tests de Utilidades

Prueban funciones helper:

- Formateo de datos
- Cálculos
- Validaciones
- Transformaciones

### 4. Tests de Páginas

Prueban páginas completas:

- Renderizado de layouts
- Carga de datos
- Integración de componentes

### 5. Tests de Integración

Prueban flujos completos:

- Workflow de órdenes
- Interacciones entre componentes
- Flows de usuario end-to-end

## Mocking

### Next.js

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard',
}));
```

### NextAuth

```typescript
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'ADMIN' } } }),
}));
```

### Prisma

```typescript
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sticker: { findMany: vi.fn(), update: vi.fn() },
  },
}));
```

### Fetch API

```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true }),
});
```

## Patrones de Testing

### 1. Arrange-Act-Assert

```typescript
it('should update order status', async () => {
  // Arrange
  const mockOrder = { id: '1', status: 'ORDERED' };

  // Act
  render(<OrdersTable orders={[mockOrder]} />);
  fireEvent.change(dropdown, { target: { value: 'PAID' } });

  // Assert
  expect(fetch).toHaveBeenCalledWith('/api/orders/1', {
    method: 'PUT',
    body: JSON.stringify({ status: 'PAID' }),
  });
});
```

### 2. Test Data Builders

```typescript
const createMockOrder = (overrides = {}) => ({
  id: 'default-id',
  status: 'ORDERED',
  owner: { name: 'Test User' },
  ...overrides,
});
```

### 3. Custom Render con Providers

```typescript
const renderWithProviders = (component) => {
  return render(
    <SessionProvider session={mockSession}>
      {component}
    </SessionProvider>
  );
};
```

## Mejores Prácticas

### ✅ Hacer

- Usar nombres descriptivos para tests
- Testear comportamiento, no implementación
- Usar `screen.getBy*` para elementos que deben existir
- Usar `screen.queryBy*` para elementos que pueden no existir
- Limpiar mocks entre tests con `beforeEach`
- Testear casos edge y manejo de errores

### ❌ Evitar

- Tests que dependen de implementación interna
- Tests muy acoplados a estructura DOM específica
- Mocks excesivos que no reflejan comportamiento real
- Tests que no aportan valor (solo coverage)

## Coverage Targets

- **Componentes**: >90%
- **API Routes**: >95%
- **Utilidades**: >95%
- **Integration**: Flujos críticos cubiertos

## Ejecución en CI/CD

Los tests se ejecutan automáticamente en:

- Pull requests
- Push a ramas principales
- Antes de deployments

```bash
# Comando usado en CI
npm run check-all  # type-check + lint + format + test
```
