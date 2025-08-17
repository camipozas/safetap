'use client';

import { BarChart3, Shield, Users } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-safetap-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            SafeTap Admin Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede al panel de administración
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-900">
                  Gestión de usuarios
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-900">
                  Analytics y reportes
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-safetap-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Iniciar sesión con Google
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Solo usuarios con permisos de administrador pueden acceder
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
