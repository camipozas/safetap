'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User, Lock } from 'lucide-react';

export default function DevLoginPage() {
  const [email, setEmail] = useState('cpozasg1103@gmail.com');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Login exitoso! Redirigiendo...');
        // En una implementación real, aquí configuraríamos la sesión
        // Por ahora, vamos a simular el acceso directo
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-orange-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            SafeTap Admin - DEV
          </h2>
          <p className="mt-2 text-sm text-orange-600 font-medium">
            🚧 Modo Desarrollo - Solo para testing
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email de Admin
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-safetap-500 focus:border-safetap-500"
                  placeholder="admin@safetap.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-safetap-600 hover:bg-safetap-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-safetap-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Verificando...' : 'Acceso de Desarrollo'}
            </button>

            {message && (
              <div
                className={`text-center text-sm ${
                  message.includes('✅') ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message}
              </div>
            )}
          </form>

          <div className="mt-6 border-t pt-6">
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Solo disponible en modo desarrollo</p>
              <p>• Verifica que el email tenga rol ADMIN</p>
              <p>• Para producción, usa Google OAuth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
