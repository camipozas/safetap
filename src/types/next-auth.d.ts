import { Role } from '@prisma/client';
import { DefaultSession } from 'next-auth';

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
  }
}
