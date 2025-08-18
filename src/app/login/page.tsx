import { redirect } from 'next/navigation';

import LoginForm from '@/app/login/ui/LoginForm';
import { auth } from '@/lib/auth';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/account');
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Bienvenido de vuelta
        </h1>
        <p className="text-slate-600">Accede a tu cuenta de safetap</p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <LoginForm />
      </div>

      <div className="text-center mt-6">
        <p className="text-slate-600 text-sm">
          ¿No tienes cuenta? Se creará automáticamente al iniciar sesión.
        </p>
      </div>
    </div>
  );
}
