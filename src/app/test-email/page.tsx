'use client';

import { useState } from 'react';

export default function EmailTestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">No disponible en producción</h1>
          <p className="text-gray-600 mt-2">Esta página solo está disponible en desarrollo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Test de Email</h1>
          <p className="text-gray-600 mb-8">
            Prueba la configuración de email de SafeTap enviando un email de prueba.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de destino
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={testEmail}
                  disabled={loading || !email}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      📧 Enviar Test
                    </>
                  )}
                </button>
              </div>
            </div>

            {result && (
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start">
                  <div className={`w-5 h-5 mt-0.5 mr-3 ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                    {result.success ? (
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.success ? '✅ Email enviado exitosamente' : '❌ Error al enviar email'}
                    </h3>
                    <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.message || result.error}
                    </p>
                    {result.messageId && (
                      <p className="text-xs text-green-600 mt-1 font-mono">
                        ID: {result.messageId}
                      </p>
                    )}
                    {result.details && (
                      <p className="text-xs text-red-600 mt-1 font-mono">
                        Detalles: {result.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">ℹ️ Información</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Este test verifica la configuración SMTP de Gmail</li>
                <li>• Revisa tu bandeja de entrada y spam después del envío</li>
                <li>• Solo disponible en modo desarrollo</li>
                <li>• Los logs aparecen en la consola del servidor</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">🔧 Variables de entorno</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>EMAIL_FROM:</strong> {process.env.EMAIL_FROM || 'No configurado'}</p>
                <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || 'No configurado'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
