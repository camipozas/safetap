"use client";
import { useState } from 'react';

export default function DevLoginPage() {
  const [email, setEmail] = useState('test@example.com');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleDevLogin() {
    setLoading(true);
    try {
      const res = await fetch('/api/dev-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Error al crear sesión' });
    }
    setLoading(false);
  }

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h1 className="text-xl font-semibold text-red-900 mb-2">Acceso denegado</h1>
          <p className="text-red-700">Esta página solo está disponible en desarrollo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Herramientas de Desarrollo</h1>
        <p className="text-slate-600">Login rápido para pruebas sin configuración de email</p>
      </div>

      {/* Alert */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">Solo para desarrollo</h3>
            <p className="text-yellow-700 text-sm">
              Esta herramienta te permite autenticarte instantáneamente sin configurar email. 
              Útil para probar todas las funcionalidades de la aplicación.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Crear sesión de prueba</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2" htmlFor="email">
              Email del usuario
            </label>
            <input 
              id="email"
              type="email" 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
            <p className="text-slate-600 text-sm mt-1">
              Si el usuario no existe, se creará automáticamente.
            </p>
          </div>

          <button 
            className="w-full bg-brand hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            onClick={handleDevLogin}
            disabled={loading || !email}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando sesión...
              </>
            ) : (
              <>
                Crear sesión de desarrollo
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-8 space-y-4">
            {result.error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-800 font-medium">Error: {result.error}</p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-semibold text-green-800">¡Sesión creada exitosamente!</h3>
                </div>
                
                <div className="space-y-3">
                  <p className="text-green-700">
                    <strong>Usuario:</strong> {result.user?.email}
                  </p>
                  
                  {result.loginUrl && (
                    <div className="pt-4">
                      <a 
                        href={result.loginUrl}
                        className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        🚀 Iniciar sesión automáticamente
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
                
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-green-700 hover:text-green-800">
                    Ver respuesta completa de la API
                  </summary>
                  <pre className="mt-2 text-xs bg-green-100 p-3 rounded-lg overflow-auto border border-green-200">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Cómo usar esta herramienta
        </h3>
        <ol className="text-blue-700 space-y-2 list-decimal list-inside">
          <li>Ingresa cualquier email (se creará automáticamente si no existe)</li>
          <li>Haz click en "Crear sesión de desarrollo"</li>
          <li>Haz click en "Iniciar sesión automáticamente"</li>
          <li>Serás redirigido a tu cuenta en <code className="bg-blue-100 px-1 rounded">/account</code></li>
          <li>¡Ya puedes probar todas las funcionalidades de safetap!</li>
        </ol>
        
        <div className="mt-4 pt-4 border-t border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Funcionalidades para probar:</h4>
          <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside ml-4">
            <li>Comprar stickers en <code className="bg-blue-100 px-1 rounded">/buy</code></li>
            <li>Crear perfiles de emergencia en <code className="bg-blue-100 px-1 rounded">/profile/new</code></li>
            <li>Ver perfiles públicos en <code className="bg-blue-100 px-1 rounded">/s/[slug]</code></li>
            <li>Gestionar tu cuenta en <code className="bg-blue-100 px-1 rounded">/account</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
