import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'USER' | 'ADMIN';
    };
  }

  interface User {
    role: 'USER' | 'ADMIN';
  }
}
