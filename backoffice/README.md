# SafeTap Admin Dashboard 🚀

The administrative dashboard (backoffice) for SafeTap, built as an independent Next.js application.

This project is private and confidential.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Development](#development)
- [Testing](#testing)
- [Clean Code Conventions](#clean-code-conventions)
- [Authentication & Security](#authentication--security)
- [Analytics](#analytics)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🚀 Features

- **Order Management**: View and manage all sticker orders
- **User Management**: Administer users and their profiles
- **Analytics Dashboard**: Engagement metrics and sales data
- **Reporting**: Data export and custom reports
- **Real-time Updates**: Live data synchronization

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **UI Framework**: Tailwind CSS + Lucide Icons
- **Charts**: Recharts & Chart.js
- **Testing**: Vitest with Testing Library

## 📋 Requirements

- **Node.js**: 20+ (recommended LTS)
- **npm**: 10+
- **Database**: Access to SafeTap PostgreSQL database
- **Google OAuth**: Configured OAuth application (required for admin access)

## 🚀 Installation

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Database (same as main SafeTap app)
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-here"

# Main Application URL (for QR code generation)
NEXT_PUBLIC_MAIN_APP_URL="http://localhost:3001"  # In development
# NEXT_PUBLIC_MAIN_APP_URL="https://safetap.cl"  # In production

# Google OAuth (required for admin authentication)
GOOGLE_CLIENT_ID="123456789-abc123.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456"

# Email configuration (optional - for admin notifications)
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="admin@yourdomain.com"
SMTP_PASS="your-app-password"
```

3. **Generate Prisma client**

```bash
npm run postinstall
```

4. **Run in development mode**

```bash
npm run dev
```

Available at `http://localhost:3001`

### Google OAuth Configuration

The backoffice requires Google OAuth for admin authentication. Follow these steps:

1. **Create Google Cloud Project** (if not already done):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or use existing SafeTap project

2. **Configure OAuth Consent Screen**:
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Choose "Internal" for organization users or "External" for broader access
   - Fill required fields: App name, user support email, developer contact

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "SafeTap Admin Dashboard"
   - Authorized redirect URIs:
     - Development: `http://localhost:3001/api/auth/callback/google`
     - Production: `https://admin.yourdomain.com/api/auth/callback/google`

4. **Copy Credentials**:
   - Copy the Client ID and Client Secret
   - Add them to your `.env.local` file

5. **Restrict Access** (Production):
   - In Google Cloud Console, configure user access restrictions
   - Only allow admin email addresses to authenticate

## 🔧 Development

### Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Code quality
npm run lint
npm run format

# Database operations
npx prisma db pull

# Run with detailed logs
DEBUG=* npm run dev
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run all quality checks
npm run check-all
```

## 📐 Clean Code Conventions

This project follows the same clean code principles as the main SafeTap application with additional guidelines for admin interfaces:

### 🏗️ Component Architecture

#### Dashboard Components

```typescript
// ✅ Well-structured dashboard component
interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ComponentType<{ className?: string }>;
}

export function DashboardCard({ title, value, change, icon: Icon }: DashboardCardProps) {
  const changeColor = change?.type === 'increase' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="dashboard-card p-6 bg-white rounded-lg shadow-sm">
      <div className="dashboard-card__header flex items-center justify-between">
        <h3 className="dashboard-card__title text-sm font-medium text-gray-500">
          {title}
        </h3>
        {Icon && <Icon className="dashboard-card__icon h-5 w-5 text-gray-400" />}
      </div>

      <div className="dashboard-card__content mt-2">
        <p className="dashboard-card__value text-3xl font-semibold text-gray-900">
          {value}
        </p>
        {change && (
          <p className={`dashboard-card__change text-sm ${changeColor}`}>
            {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
          </p>
        )}
      </div>
    </div>
  );
}
```

### 🎯 API Route Guidelines

#### Error Handling

```typescript
// ✅ Consistent API error handling
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input validation
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    // 3. Business logic
    const updatedOrder = await prisma.sticker.update({
      where: { id: params.id },
      data: validatedData,
    });

    // 4. Success response
    return NextResponse.json(updatedOrder);
  } catch (error) {
    // 5. Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 📊 Data Management Patterns

#### Custom Hooks for Admin Operations

```typescript
// ✅ Custom hook for order management
export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (options.status) searchParams.set('status', options.status);
      if (options.limit) searchParams.set('limit', options.limit.toString());

      const response = await fetch(`/api/admin/orders?${searchParams}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();
      setOrders(data.orders);
    } catch (err) {
      setError(err as Error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [options.status, options.limit]);

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      try {
        const response = await fetch(`/api/admin/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) throw new Error('Failed to update order status');

        // Optimistic update
        setOrders((prev) =>
          prev.map((order) => (order.id === id ? { ...order, status } : order))
        );
      } catch (err) {
        setError(err as Error);
        await fetchOrders(); // Revert optimistic update
      }
    },
    [fetchOrders]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders, updateOrderStatus };
}
```

### 🔒 Security Best Practices

#### Role-Based Access Control

```typescript
// ✅ Middleware for admin routes
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Additional logic if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return token?.role === 'ADMIN' || token?.role === 'SUPER_ADMIN';
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
```

### 📈 Performance Guidelines

#### Chart Component Optimization

```typescript
// ✅ Optimized chart component
export const AnalyticsChart = memo(function AnalyticsChart({
  data,
  title,
  color = '#3B82F6'
}: AnalyticsChartProps) {
  const processedData = useMemo(() => {
    return data.map(point => ({
      ...point,
      date: new Date(point.date).toLocaleDateString()
    }));
  }, [data]);

  return (
    <div className="analytics-chart p-6 bg-white rounded-lg shadow-sm">
      <h3 className="analytics-chart__title text-lg font-medium text-gray-900 mb-4">
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
```

## 🔐 Authentication & Security

- **Authentication**: NextAuth.js handles secure authentication
- **Authorization**: Only users with `ADMIN` role can access
- **Session Management**: Secure sessions with JWT/database sessions
- **CSRF Protection**: Built-in CSRF protection enabled

## 📊 Analytics

### Orders

- Total orders by period
- Order status distribution (pending, paid, shipped, etc.)
- Revenue by period
- Payment conversion rates

### Users

- User registrations by period
- Active users
- Geographic distribution
- Engagement metrics

### Stickers

- Active vs inactive stickers
- Profile access statistics
- Usage by country

## 🚢 Deployment

### Vercel Deployment

1. **Create Vercel project**:
   - Connect your repository
   - Configure root directory (leave blank for separate repo)
   - Set framework preset to Next.js

2. **Environment Variables**:

   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_URL="https://admin.yourdomain.com"
   NEXTAUTH_SECRET="your-production-secret-different-from-dev"
   GOOGLE_CLIENT_ID="123456789-production.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-production-secret"
   SMTP_SERVER="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="admin@yourdomain.com"
   SMTP_PASS="your-production-app-password"
   ```

   **Important**: Use different Google OAuth credentials for production than development.

3. **Domain Configuration**:
   - Add subdomain: `admin.yourdomain.com`
   - Configure DNS CNAME to `cname.vercel-dns.com`

4. **Post-Deployment**:
   ```bash
   # Create super admin
   node make-admin.js your-email@example.com SUPER_ADMIN
   ```

### Troubleshooting

**Authentication Issues**:

- Verify `NEXTAUTH_URL` matches your domain exactly
- Check Google OAuth redirect URIs include your domain
- Ensure Google OAuth credentials are for the correct environment
- Verify the user's email is authorized for admin access

**Google OAuth Specific**:

- Check OAuth consent screen is properly configured
- Verify the Google project has the necessary APIs enabled
- Ensure redirect URIs match exactly (including http/https)
- Check that the OAuth app is not in testing mode with restricted users

**Database Issues**:

- Confirm `DATABASE_URL` is accessible from Vercel
- Check database connection limits and pooling
- Verify Prisma schema is up to date

**Build/Deployment Issues**:

- Check Vercel logs for specific error messages
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly
- Check that build commands match the configuration

## 🤝 Contributing

1. **Fork the project**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding conventions** outlined in this README
4. **Write tests** for your changes
5. **Run quality checks**: `npm run check-all`
6. **Commit changes**: `git commit -m 'feat: add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open Pull Request**

### Review Guidelines

- Follow the same guidelines as the main SafeTap application
- Ensure admin-specific security measures are in place
- Test with different user roles and permissions
- Verify responsive design on different screen sizes
- Check that all analytics calculations are accurate

---

Made with ❤️ by the SafeTap team
