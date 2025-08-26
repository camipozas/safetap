'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  console.log('🚨 Auth error page loaded with error:', error);

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Hay un problema con la configuración del servidor.';
      case 'AccessDenied':
        return 'Se denegó el acceso. Es posible que no tengas permisos.';
      case 'Verification':
        return 'El token ha expirado o ya se ha usado.';
      case 'OAuthSignin':
        return 'Error al construir la URL de autorización.';
      case 'OAuthCallback':
        return 'Error al manejar la respuesta de OAuth.';
      case 'OAuthCreateAccount':
        return 'No se pudo crear la cuenta de OAuth en la base de datos.';
      case 'EmailCreateAccount':
        return 'No se pudo crear la cuenta de email en la base de datos.';
      case 'Callback':
        return 'Error en la URL de callback.';
      case 'OAuthAccountNotLinked':
        return 'Para confirmar tu identidad, inicia sesión con la misma cuenta que usaste originalmente.';
      case 'EmailSignin':
        return 'No se pudo enviar el email.';
      case 'CredentialsSignin':
        return 'Fallo en el inicio de sesión. Verifica que los detalles que ingresaste sean correctos.';
      case 'SessionRequired':
        return 'Por favor inicia sesión para acceder a esta página.';
      default:
        return error || 'Ha ocurrido un error inesperado.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Error de autenticación
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
          {error && (
            <p className="mt-2 text-center text-xs text-gray-500">
              Código de error: {error}
            </p>
          )}
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex flex-col space-y-4">
            <Link
              href="/login"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              Intentar de nuevo
            </Link>
            <Link
              href="/"
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
