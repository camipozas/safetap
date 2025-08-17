import { canAccessBackoffice } from '@/types/shared';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(_req) {
    // Additional middleware if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // In development mode, allow all access
        if (process.env.NODE_ENV === 'development') {
          return true;
        }

        // Only allow access to users with roles that can access backoffice
        if (
          req.nextUrl.pathname.startsWith('/dashboard') ||
          req.nextUrl.pathname.startsWith('/api/admin')
        ) {
          return Boolean(
            token?.role && canAccessBackoffice(token.role as string)
          );
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
