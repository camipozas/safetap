import {
  AlertTriangle,
  CheckCircle,
  QrCode,
  Shield,
  Smartphone,
  Wifi,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function NfcGuidePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Wifi className="h-10 w-10" />
          <h1 className="text-3xl font-bold">Guía NFC para SafeTap</h1>
        </div>
        <p className="text-lg text-blue-100">
          Aprende cómo vincular tu sticker SafeTap con tecnología NFC para
          acceso instantáneo a tu información de emergencia con solo tocar.
        </p>
      </div>

      {/* What is NFC */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="h-6 w-6 text-blue-600 mr-2" />
          ¿Qué es NFC?
        </h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>NFC (Near Field Communication)</strong> es una tecnología de
            comunicación inalámbrica de corto alcance que permite transferir
            datos entre dispositivos cuando están muy cerca (2-4 cm
            aproximadamente).
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                Ventajas del NFC
              </h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Acceso instantáneo (sin necesidad de cámara)</li>
                <li>• Funciona incluso con pantalla bloqueada</li>
                <li>• No requiere aplicaciones especiales</li>
                <li>• Más rápido que escanear códigos QR</li>
                <li>• Funciona sin conexión a internet</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                Casos de Uso Ideales
              </h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Emergencias médicas rápidas</li>
                <li>• Deportes de alto riesgo</li>
                <li>• Entornos con poca luz</li>
                <li>• Cuando las manos tiemblan</li>
                <li>• Acceso para personas mayores</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          📋 Requisitos Previos
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Smartphone className="h-5 w-5 text-blue-500 mr-2" />
              Dispositivo Compatible
            </h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  <strong>Android:</strong> Versión 4.0+ con NFC habilitado
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  <strong>iPhone:</strong> iPhone 7+ con iOS 11+
                </span>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  Verifica que tu dispositivo tenga NFC en Configuración
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="h-5 w-5 text-green-500 mr-2" />
              Perfil SafeTap Activo
            </h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  Cuenta SafeTap creada y verificada
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  Perfil de emergencia completado
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  Sticker con pago confirmado (estado ACTIVE)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step by step guide */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          🚀 Guía Paso a Paso
        </h2>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Accede al Backoffice de SafeTap
              </h3>
              <p className="text-gray-700 mb-3">
                El QR real y la información NFC se gestionan desde el panel de
                administración. Solo usuarios autorizados pueden acceder a esta
                sección.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>URL del Backoffice:</strong>
                </p>
                <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                  https://admin.safetap.cl
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  * Requiere permisos de administrador
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Localiza tu Sticker en el Sistema
              </h3>
              <p className="text-gray-700 mb-3">
                En el backoffice, busca tu sticker usando el número de serie o
                información del usuario.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  Información Necesaria:
                </h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Número de serie del sticker (ej: STK-ABC12345)</li>
                  <li>• Email de la cuenta SafeTap</li>
                  <li>• ID de referencia del pago</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Configura el Enlace NFC
              </h3>
              <p className="text-gray-700 mb-3">
                Desde el backoffice, configura el enlace que apuntará a tu
                perfil personal de emergencia.
              </p>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">
                    <strong>URL Objetivo:</strong> El NFC debe apuntar a tu
                    perfil único
                  </p>
                  <code className="text-green-700 text-xs block mt-1">
                    https://safetap.cl/qr/[tu-profile-id]
                  </code>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  {' '}
                  <p className="text-yellow-800 text-sm">
                    <strong>Importante:</strong> Solo perfiles con status
                    &quot;ACTIVE&quot; y pago &quot;VERIFIED&quot; son
                    accesibles públicamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Programa el Chip NFC
              </h3>
              <p className="text-gray-700 mb-3">
                Usando una app de programación NFC, escribe la URL en el chip
                del sticker.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Apps Android Recomendadas:
                  </h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• NFC Tools (gratuita)</li>
                    <li>• TagWriter (gratuita)</li>
                    <li>• NFC TagInfo (lectura/escritura)</li>
                  </ul>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Apps iOS Recomendadas:
                  </h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• NFC Tools (gratuita)</li>
                    <li>• TagWriter (gratuita)</li>
                    <li>• Shortcuts (app nativa)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              5
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Prueba el Funcionamiento
              </h3>
              <p className="text-gray-700 mb-3">
                Verifica que el NFC funcione correctamente acercando diferentes
                dispositivos al sticker.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">
                  Lista de Verificación:
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" disabled />
                    <span className="text-green-700 text-sm">
                      El dispositivo detecta el chip NFC al acercarlo
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" disabled />
                    <span className="text-green-700 text-sm">
                      Se abre automáticamente el navegador
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" disabled />
                    <span className="text-green-700 text-sm">
                      Carga la página de emergencia correcta
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" disabled />
                    <span className="text-green-700 text-sm">
                      Muestra información médica y contactos
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFC vs QR Comparison */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          ⚖️ NFC vs QR: ¿Cuál elegir?
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Wifi className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-blue-800">Tecnología NFC</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-blue-700 text-sm">
                  Acceso instantáneo (0.5 segundos)
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-blue-700 text-sm">
                  Funciona con pantalla bloqueada
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-blue-700 text-sm">
                  Ideal para condiciones adversas
                </span>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                <span className="text-blue-700 text-sm">
                  Requiere dispositivos compatibles
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <QrCode className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Código QR</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  Compatible con cualquier smartphone
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  No requiere contacto físico
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  Visible desde cierta distancia
                </span>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                <span className="text-gray-700 text-sm">
                  Requiere app de cámara activa
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>Recomendación:</strong> Usa ambas tecnologías en el mismo
            sticker. El NFC para acceso rápido y el QR como respaldo universal.
          </p>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          🛠️ Solución de Problemas
        </h2>

        <div className="space-y-4">
          <details className="group">
            <summary className="flex justify-between items-center font-medium text-gray-900 cursor-pointer">
              El dispositivo no detecta el NFC
              <span className="ml-6 flex-shrink-0">+</span>
            </summary>
            <div className="mt-3 text-gray-600 pl-4 border-l-2 border-gray-200">
              <ul className="space-y-1 text-sm">
                <li>• Verifica que NFC esté habilitado en el dispositivo</li>
                <li>• Acerca el dispositivo más (1-2 cm del chip)</li>
                <li>
                  • Mueve el dispositivo ligeramente para encontrar el chip
                </li>
                <li>
                  • Comprueba que el chip NFC esté programado correctamente
                </li>
              </ul>
            </div>
          </details>

          <details className="group">
            <summary className="flex justify-between items-center font-medium text-gray-900 cursor-pointer">
              El enlace no abre la página correcta
              <span className="ml-6 flex-shrink-0">+</span>
            </summary>
            <div className="mt-3 text-gray-600 pl-4 border-l-2 border-gray-200">
              <ul className="space-y-1 text-sm">
                <li>• Verifica que la URL programada sea correcta</li>
                <li>
                  • Confirma que el perfil tenga status &quot;ACTIVE&quot;
                </li>
                <li>
                  • Asegúrate de que el pago esté en estado &quot;VERIFIED&quot;
                </li>
                <li>
                  • Contacta al administrador para verificar la configuración
                </li>
              </ul>
            </div>
          </details>

          <details className="group">
            <summary className="flex justify-between items-center font-medium text-gray-900 cursor-pointer">
              Error &quot;Perfil no encontrado&quot;
              <span className="ml-6 flex-shrink-0">+</span>
            </summary>
            <div className="mt-3 text-gray-600 pl-4 border-l-2 border-gray-200">
              <ul className="space-y-1 text-sm">
                <li>• El perfil debe tener consentimiento público activado</li>
                <li>• El sticker debe estar en estado &quot;ACTIVE&quot;</li>
                <li>• Verifica que el Profile ID en la URL sea correcto</li>
                <li>• Contacta soporte si el problema persiste</li>
              </ul>
            </div>
          </details>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">
          ¿Necesitas ayuda con la configuración NFC?
        </h2>
        <p className="text-lg text-blue-100 mb-6">
          Nuestro equipo técnico puede ayudarte a configurar tu sticker NFC para
          que funcione perfectamente.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/guide"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Guía General
          </Link>
          <Link
            href="/dashboard"
            className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
