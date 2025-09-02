'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginForm({
  callbackUrl = '/welcome?cta=sticker',
}: {
  callbackUrl?: string;
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('📧 Starting email login process for:', email);
    setError(null);
    setIsLoading(true);

    try {
      // Use our custom endpoint that DOES work
      console.log('📤 Sending login request to custom endpoint');
      const res = await fetch('/api/custom-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, callbackUrl }),
      });

      const data = await res.json();
      console.log('📥 Login response status:', res.status);

      if (!res.ok) {
        console.log('❌ Login request failed:', data.error);
        throw new Error(data.error || 'No se pudo enviar el enlace.');
      }

      console.log('✅ Login email sent successfully');
      setSubmitted(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Login error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    console.log('🔐 Starting Google sign-in process');
    setIsGoogleLoading(true);
    setError(null);

    try {
      console.log('🔗 Initiating Google OAuth with callback to', callbackUrl);
      console.log('🌍 Environment:', process.env.NODE_ENV);
      console.log('🔗 Base URL:', window.location.origin);

      const result = await signIn('google', {
        callbackUrl,
        redirect: false,
      });

      console.log('📡 Google sign-in result:', result);

      if (result?.error) {
        console.error('❌ Google sign-in error:', result.error);
        throw new Error(result.error);
      }

      if (result?.url) {
        console.log('✅ Redirecting to:', result.url);
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('❌ Error signing in with Google:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(`No se pudo iniciar sesión con Google: ${errorMessage}`);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Revisa tu correo
        </h2>
        <p className="text-slate-600">
          Hemos enviado un enlace de acceso a <strong>{email}</strong>. Haz clic
          en el enlace para iniciar sesión.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-brand hover:underline"
        >
          ¿No recibiste el correo? Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="space-y-6"
        aria-labelledby="login-title"
      >
        <div>
          <label
            className="block text-sm font-semibold text-slate-900 mb-2"
            htmlFor="email"
          >
            Dirección de correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <button
          className="w-full bg-brand hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          type="submit"
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Enviando...
            </>
          ) : (
            <>
              Enviar enlace de acceso
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z"
                />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6 mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">O</span>
          </div>
        </div>
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isGoogleLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Conectando con Google...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 mt-3 text-center">
        Al continuar con Google, se creará tu cuenta automáticamente si es tu
        primera vez.
      </p>
    </div>
  );
}
