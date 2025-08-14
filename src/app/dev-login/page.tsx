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
    return <div className="text-center p-8">Esta página solo está disponible en desarrollo.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h1 className="text-xl font-semibold text-yellow-800 mb-2">🔧 Dev Login Tool</h1>
        <p className="text-yellow-700 text-sm">
          Esta herramienta es solo para desarrollo. Te permite autenticarte sin configurar email.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email para autenticar</label>
          <input 
            id="email"
            type="email" 
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>

        <button 
          className="btn w-full"
          onClick={handleDevLogin}
          disabled={loading || !email}
        >
          {loading ? 'Creando sesión...' : 'Crear sesión de desarrollo'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Resultado:</h3>
            
            {result.error ? (
              <div className="text-red-600">
                Error: {result.error}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-green-600">✅ {result.message}</p>
                <p><strong>Usuario:</strong> {result.user?.email}</p>
                
                {result.loginUrl && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Haz click aquí para autenticarte:</p>
                    <a 
                      href={result.loginUrl}
                      className="btn inline-block"
                    >
                      🚀 Iniciar sesión automáticamente
                    </a>
                  </div>
                )}
              </div>
            )}
            
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600">Ver respuesta completa</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">📋 Instrucciones:</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Ingresa cualquier email (se creará automáticamente)</li>
          <li>Haz click en "Crear sesión de desarrollo"</li>
          <li>Haz click en el botón "Iniciar sesión automáticamente"</li>
          <li>Serás redirigido a tu cuenta (/account)</li>
          <li>¡Ya puedes probar todas las funcionalidades!</li>
        </ol>
      </div>
    </div>
  );
}
