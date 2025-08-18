import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      canManageOrders: session?.user?.role
        ? hasPermission(session.user.role, 'canManageOrders')
        : false,
      canAccessBackoffice: session?.user?.role
        ? hasPermission(session.user.role, 'canAccessBackoffice')
        : false,
      session: session,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error getting session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
