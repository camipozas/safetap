# SafeTap 🚀

A modern emergency profile management system with QR code stickers. This is the main application (MVP Phase 1) with Zod validations and accessibility features.

## 📋 Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Development](#development)
- [Testing](#testing)
- [Database Migrations](#database-migrations)
- [Clean Code Conventions](#clean-code-conventions)
- [Tech Stack](#tech-stack)
- [Scripts Reference](#scripts-reference)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

## ✨ Features

- **Emergency Profiles**: Create and manage emergency contact information
- **QR Code Stickers**: Generate personalized QR codes for emergency access
- **User Authentication**: Secure email-based authentication with NextAuth
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Testing**: Comprehensive unit and E2E testing coverage
- **Accessibility**: WCAG-compliant design and functionality

## 📋 Requirements

- **Node.js**: 20+ (recommended LTS)
- **npm**: 10+
- **Database**: PostgreSQL
- **Email Provider**: SMTP server for authentication
- **Optional**: Prisma Accelerate for enhanced performance

## 🚀 Installation

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment variables**

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Email configuration
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="SafeTap <no-reply@safetap.app>"

# App configuration
PUBLIC_BASE_URL="http://localhost:3000"

# Google OAuth (optional - for Google authentication)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**With Prisma Accelerate** (optional):

```bash
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your-api-key"
```

⚠️ **Security Note**: Never commit real API keys to version control.

3. **Generate Prisma client and build**

```bash
npm run build
```

## 🔧 Development

1. **Start development server**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

2. **Run type checking**

```bash
npm run type-check
```

3. **Lint and format code**

```bash
npm run lint
npm run format
```

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### End-to-End Tests

```bash
# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui
```

### Accessibility Testing

```bash
npm run accessibility
```

### Run All Tests

```bash
npm run test:all
```

## 🗄️ Database Migrations

### Traditional PostgreSQL

```bash
npx prisma migrate dev --name init
```

### With Prisma Accelerate

Since Accelerate doesn't support shadow databases, use local migrations:

1. Generate migrations locally against a PostgreSQL database
2. Deploy schema to your main database through your CI/CD pipeline
3. Apply migrations using Prisma Migrate in production

```bash
npx prisma migrate deploy
```

### Migration Synchronization with Backoffice

Since the main project and backoffice share the same database, their migrations must be synchronized:

#### Manual Sync

```bash
# Run from project root
./scripts/sync-migrations.sh
```

#### Automatic CI Checks

Both CI pipelines now include:

- **Migration Status Check**: Verifies all migrations are applied
- **Sync Verification**: Ensures backoffice migrations match main project (backoffice only)

#### When to Sync

- ✅ After creating a new migration in the main project
- ✅ Before deploying the backoffice
- ✅ When getting migration-related errors in production

#### Troubleshooting

If you get "table does not exist" errors in the backoffice:

1. Run `./scripts/sync-migrations.sh`
2. Check that both projects have the same migration files
3. Verify migrations are applied: `npx prisma migrate status`

## 📐 Clean Code Conventions

This project follows strict clean code principles to ensure maintainability, readability, and team collaboration.

### 🏗️ Architecture Principles

#### 1. **Single Responsibility Principle (SRP)**

- Each function, class, and module should have one reason to change
- Components should have a single, well-defined purpose

```typescript
// ✅ Good - Single responsibility
function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

// ❌ Bad - Multiple responsibilities
function processUser(email: string, name: string) {
  // Validates email, saves to database, sends email, updates analytics
}
```

#### 2. **Open/Closed Principle (OCP)**

- Open for extension, closed for modification
- Use composition and dependency injection

```typescript
// ✅ Good - Extensible through composition
interface EmailProvider {
  send(email: EmailMessage): Promise<void>;
}

class EmailService {
  constructor(private provider: EmailProvider) {}
}
```

#### 3. **Dependency Inversion Principle (DIP)**

- Depend on abstractions, not concretions
- Use interfaces and dependency injection

### 🎯 Naming Conventions

#### Functions and Variables

```typescript
// ✅ Use descriptive, intention-revealing names
const getUserActiveProfiles = () => {
  /* ... */
};
const isEmailValid = (email: string) => {
  /* ... */
};
const maxRetryAttempts = 3;

// ❌ Avoid abbreviations and unclear names
const getUsrActProf = () => {
  /* ... */
};
const chkEmail = (e: string) => {
  /* ... */
};
const x = 3;
```

#### Components and Classes

```typescript
// ✅ Use PascalCase for components and classes
class UserProfileService {}
const ContactFormModal = () => {};

// ❌ Avoid generic names
class Manager {}
const Component = () => {};
```

#### Constants and Enums

```typescript
// ✅ Use SCREAMING_SNAKE_CASE for constants
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const API_ENDPOINTS = {
  USERS: '/api/users',
  PROFILES: '/api/profiles',
} as const;

// ✅ Use PascalCase for enums
enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
}
```

### 🧩 Code Organization

#### File Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── forms/            # Form-specific components
├── lib/                  # Utility functions and configurations
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

#### Import Organization

```typescript
// ✅ Organize imports by source
// 1. Node modules
import React from 'react';
import { NextPage } from 'next';

// 2. Internal modules (absolute paths)
import { Button } from '@/components/ui/button';
import { validateEmail } from '@/lib/validators';

// 3. Relative imports
import './styles.css';
```

### 🔧 Function Guidelines

#### Function Size and Complexity

```typescript
// ✅ Keep functions small and focused (max 20 lines)
function calculateTotalPrice(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

// ✅ Extract complex logic into separate functions
function processOrder(order: Order): OrderResult {
  const validatedOrder = validateOrder(order);
  const calculatedTotal = calculateOrderTotal(validatedOrder);
  const processedPayment = processPayment(calculatedTotal);

  return createOrderResult(validatedOrder, processedPayment);
}
```

### 🎨 React Component Guidelines

#### Component Structure

```typescript
// ✅ Well-structured component
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  // 1. Hooks at the top
  const [isEditing, setIsEditing] = useState(false);

  // 2. Derived state and computations
  const displayName = user.firstName + ' ' + user.lastName;
  const canEdit = Boolean(onEdit);

  // 3. Event handlers
  const handleEditClick = () => {
    setIsEditing(true);
    onEdit?.(user);
  };

  // 4. Early returns for loading/error states
  if (!user) {
    return <div>User not found</div>;
  }

  // 5. Main render
  return (
    <div className={cn('user-card', className)}>
      <h3>{displayName}</h3>
      {canEdit && (
        <button onClick={handleEditClick}>
          Edit
        </button>
      )}
    </div>
  );
}
```

### 📝 Documentation Guidelines

#### Code Comments

```typescript
// ✅ Explain WHY, not WHAT
// Retry logic needed because external API has occasional timeouts
const MAX_RETRY_ATTEMPTS = 3;

// ✅ Document complex business logic
/**
 * Calculates shipping cost based on weight and destination.
 * Uses tiered pricing model: base cost + weight multiplier + distance factor.
 *
 * @param weight - Package weight in kilograms
 * @param destination - Destination country code (ISO 3166-1 alpha-2)
 * @returns Shipping cost in USD cents
 */
function calculateShippingCost(weight: number, destination: string): number {
  // Implementation...
}
```

### 🧪 Testing Standards

#### Test Structure

```typescript
// ✅ Follow AAA pattern (Arrange, Act, Assert)
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };
      const mockUser = { id: '1', ...userData };
      mockPrisma.user.create.mockResolvedValue(mockUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });
  });
});
```

### 🔒 Security Guidelines

#### Input Validation

```typescript
// ✅ Always validate user input
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(150),
});

function createUser(data: unknown) {
  const validated = createUserSchema.parse(data);
  // Use validated data...
}
```

### 🚀 Git Commit Guidelines

#### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js with email magic links
- **Database**: PostgreSQL with Prisma ORM
- **Performance**: Optional Prisma Accelerate
- **Styling**: TailwindCSS
- **Validation**: Zod schemas
- **Forms**: React Hook Form
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Code Quality**: ESLint + Prettier + Husky

## 📜 Scripts Reference

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing

- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run e2e` - Run E2E tests
- `npm run test:all` - Run all tests

### Quality Assurance

- `npm run check-all` - Run all quality checks
- `npm run accessibility` - Run accessibility tests

### Database

- `npm run postinstall` - Generate Prisma client

## 🌍 Environment Variables

| Variable               | Description                  | Required | Example                                         |
| ---------------------- | ---------------------------- | -------- | ----------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string | Yes      | `postgresql://user:pass@localhost:5432/safetap` |
| `NEXTAUTH_URL`         | Application URL              | Yes      | `http://localhost:3000`                         |
| `NEXTAUTH_SECRET`      | NextAuth secret key          | Yes      | `your-secret-here`                              |
| `EMAIL_SERVER`         | SMTP server configuration    | Yes      | `smtp://user:pass@smtp.gmail.com:587`           |
| `EMAIL_FROM`           | From email address           | Yes      | `SafeTap <no-reply@safetap.app>`                |
| `PUBLIC_BASE_URL`      | Public base URL              | Yes      | `http://localhost:3000`                         |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID       | No\*     | `123456789-abc123.apps.googleusercontent.com`   |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret   | No\*     | `GOCSPX-abc123def456`                           |

\*Required if using Google OAuth authentication

### Google OAuth Setup

To enable Google authentication:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google+ API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`

4. **Configure Environment Variables**:

   ```bash
   GOOGLE_CLIENT_ID="your-client-id-here"
   GOOGLE_CLIENT_SECRET="your-client-secret-here"
   ```

5. **Security Notes**:
   - Never commit real credentials to version control
   - Use different credentials for development and production
   - Regularly rotate secrets in production
   - Restrict OAuth origins to your actual domains

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding conventions** outlined in this README
4. **Write tests** for your changes
5. **Run quality checks**: `npm run check-all`
6. **Commit changes**: `git commit -m 'feat: add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Pull Request Guidelines

- Use descriptive titles and descriptions
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed
- Follow the code review checklist

---

Made with ❤️ by the SafeTap team
