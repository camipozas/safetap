import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './ui/LoginForm';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/account');
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>
      <LoginForm />
    </div>
  );
}
