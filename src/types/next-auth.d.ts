import { DefaultSession } from 'next-auth';

import { Role } from '@/types/shared';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      country?: string;
      totalSpent: number;
      emailVerified?: Date;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: Role;
    country?: string;
    totalSpent?: number;
    emailVerified?: Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    isNewUser?: boolean;
  }
}
