import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Download,
  Heart,
  MessageCircle,
  Phone,
  QrCode,
  Shield,
  Smartphone,
  User,
  Zap,
} from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-safetap-600 to-safetap-700 rounded-lg p-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-10 w-10" />
          <h1 className="text-3xl font-bold">Guía de Uso de SafeTap</h1>
        </div>
        <p className="text-lg text-safetap-100">
          Aprende cómo usar SafeTap para mantenerte seguro y conectado con tus
          seres queridos en situaciones de emergencia.
        </p>
      </div>

      {/* Intro Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="h-6 w-6 text-safetap-600 mr-2" />
          ¿Qué es SafeTap?
        </h2>
        <p className="text-gray-700 mb-4">
          SafeTap es un sistema de emergencia personal que utiliza códigos QR
          inteligentes para proporcionar acceso rápido a información médica
          vital y contactos de emergencia. Cada sticker SafeTap contiene un
          código QR único que permite a los socorristas acceder a tu información
          crítica sin desbloquear tu teléfono.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            💡 <strong>Dato importante:</strong> SafeTap permite acceder a tu
            información de emergencia sin necesidad de desbloquear tu teléfono
            personal, ya que cualquier persona puede escanear el código QR con
            su propio dispositivo móvil.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <QrCode className="h-6 w-6 text-safetap-600 mr-2" />
          ¿Cómo funciona SafeTap?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-safetap-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-safetap-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              1. Configura tu perfil
            </h3>
            <p className="text-gray-600 text-sm">
              Crea tu cuenta y completa tu información médica, contactos de
              emergencia y datos personales.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-safetap-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Download className="h-8 w-8 text-safetap-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              2. Descarga tu sticker
            </h3>
            <p className="text-gray-600 text-sm">
              Genera y descarga tu sticker personalizado con código QR único
              para imprimir y usar.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-safetap-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-safetap-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              3. Úsalo en emergencias
            </h3>
            <p className="text-gray-600 text-sm">
              Los socorristas escanean el QR para acceder instantáneamente a tu
              información vital.
            </p>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <AlertTriangle className="h-6 w-6 text-safetap-600 mr-2" />
          Casos de Uso Reales
        </h2>
        <div className="space-y-6">
          {/* Case 1 */}
          <div className="border-l-4 border-red-400 pl-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              📱 Emergencia Médica sin Acceso al Teléfono
            </h3>
            <p className="text-gray-700 mb-3">
              <strong>Situación:</strong> María sufre un desmayo en el metro.
              Lleva un sticker SafeTap en la funda de su teléfono.
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Solución:</strong> Los paramédicos escanean el código QR
              del sticker con sus propios dispositivos móviles y acceden
              instantáneamente a:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Su información médica (diabetes tipo 2)</li>
              <li>Medicamentos que toma (metformina)</li>
              <li>Alergias (penicilina)</li>
              <li>Contacto de emergencia (esposo - Juan: +56 9 6001 2345)</li>
            </ul>
          </div>

          {/* Case 2 */}
          <div className="border-l-4 border-orange-400 pl-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              🚗 Accidente de Tráfico
            </h3>
            <p className="text-gray-700 mb-3">
              <strong>Situación:</strong> Carlos tiene un accidente de moto.
              Está inconsciente y lleva SafeTap en su casco.
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Solución:</strong> Los servicios de emergencia escanean el
              QR con sus dispositivos móviles y obtienen:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Su grupo sanguíneo (O-)</li>
              <li>Condiciones médicas (marcapasos)</li>
              <li>Contactos de emergencia (madre y hermana)</li>
              <li>Información del seguro médico</li>
            </ul>
          </div>

          {/* Case 3 */}
          <div className="border-l-4 border-blue-400 pl-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              🏃‍♂️ Emergencia Durante Ejercicio
            </h3>
            <p className="text-gray-700 mb-3">
              <strong>Situación:</strong> Ana sale a correr por el parque. Sufre
              una caída y queda inconsciente. Lleva SafeTap en su pulsera
              deportiva.
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Solución:</strong> Otros corredores encuentran su SafeTap
              en la pulsera deportiva y escanean el código con sus teléfonos:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Ven sus condiciones médicas (asma, inhalador de rescate)</li>
              <li>Contactan a su hermano directamente</li>
              <li>Obtienen información sobre su seguro médico</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Placement */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          📍 ¿Dónde colocar tu SafeTap?
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-green-700 mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Lugares Recomendados
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>
                  <strong>Funda del móvil:</strong> Siempre accesible y visible
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>
                  <strong>Pulsera/reloj deportivo:</strong> Para actividades
                  físicas
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>
                  <strong>Casco (moto/bici):</strong> Para usuarios de vehículos
                  de dos ruedas
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>
                  <strong>Mochila/bolso:</strong> Como respaldo adicional
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>
                  <strong>Llavero:</strong> Siempre lo llevas contigo
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-red-700 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Lugares NO Recomendados
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                <span>
                  <strong>Dentro de la cartera:</strong> Puede no ser visible
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                <span>
                  <strong>En bolsillos internos:</strong> Difícil acceso
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                <span>
                  <strong>Lugares ocultos:</strong> Los socorristas deben
                  encontrarlo fácilmente
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* What to include */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          📋 ¿Qué información incluir en tu perfil?
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Heart className="h-5 w-5 text-red-500 mr-2" />
              Información Médica Crítica
            </h3>
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <h4 className="font-medium text-red-800 mb-1">
                  Condiciones Médicas
                </h4>
                <p className="text-red-700 text-sm">
                  Diabetes, epilepsia, problemas cardíacos, marcapasos, etc.
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <h4 className="font-medium text-orange-800 mb-1">
                  Medicamentos
                </h4>
                <p className="text-orange-700 text-sm">
                  Medicamentos que tomas regularmente, dosis importantes
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="font-medium text-yellow-800 mb-1">Alergias</h4>
                <p className="text-yellow-700 text-sm">
                  Alergias a medicamentos, alimentos, materiales (látex, etc.)
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <h4 className="font-medium text-purple-800 mb-1">
                  Datos Vitales
                </h4>
                <p className="text-purple-700 text-sm">
                  Grupo sanguíneo, donante de órganos, etc.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 text-blue-500 mr-2" />
              Contactos de Emergencia
            </h3>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-medium text-blue-800 mb-1">
                  Contacto Principal
                </h4>
                <p className="text-blue-700 text-sm">
                  Familiar directo o pareja que siempre esté disponible
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <h4 className="font-medium text-green-800 mb-1">
                  Contacto Secundario
                </h4>
                <p className="text-green-700 text-sm">
                  Familiar alternativo o amigo cercano como respaldo
                </p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
                <h4 className="font-medium text-indigo-800 mb-1">
                  Médico de Cabecera
                </h4>
                <p className="text-indigo-700 text-sm">
                  Información de tu médico personal si es relevante
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          ✅ Mejores Prácticas
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-green-700">
              Mantén todo actualizado
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>Revisa tu perfil cada 3-6 meses</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>Actualiza medicamentos cuando cambien</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <span>Verifica números de contacto regularmente</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-blue-700">
              Usa múltiples stickers
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <span>Uno en el móvil para uso diario</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <span>Otro en equipamiento deportivo</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <span>Backup en mochila o cartera</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example Step-by-Step */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          🚀 Ejemplo: Configuración Paso a Paso
        </h2>
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Ejemplo de perfil: Laura, ciclista de 34 años
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  📋 Información Personal
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Nombre: Laura González Martín</li>
                  <li>• Edad: 34 años</li>
                  <li>• Grupo sanguíneo: A+</li>
                  <li>• Donante de órganos: Sí</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  🏥 Información Médica
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Condición: Asma leve</li>
                  <li>• Medicación: Ventolin (emergencia)</li>
                  <li>• Alergias: Frutos secos, abejas</li>
                  <li>• Seguro: Fonasa 12345678</li>
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">
                📞 Contactos de Emergencia
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded p-3 border">
                  <p className="font-medium">Principal</p>
                  <p>David González (pareja)</p>
                  <p>+34 600 123 456</p>
                </div>
                <div className="bg-white rounded p-3 border">
                  <p className="font-medium">Secundario</p>
                  <p>Carmen Martín (madre)</p>
                  <p>+34 650 789 012</p>
                </div>
                <div className="bg-white rounded p-3 border">
                  <p className="font-medium">Médico</p>
                  <p>Dr. López (Hospital Central)</p>
                  <p>+34 91 234 5678</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <MessageCircle className="h-6 w-6 text-safetap-600 mr-2" />
          Preguntas Frecuentes
        </h2>
        <div className="space-y-4">
          <details className="group">
            <summary className="flex justify-between items-center font-medium text-gray-900 cursor-pointer">
              ¿Qué pasa si pierdo mi teléfono?
              <span className="ml-6 flex-shrink-0">+</span>
            </summary>
            <div className="mt-3 text-gray-600">
              Tu SafeTap funciona independientemente de tu teléfono. Los
              socorristas pueden escanear el código QR desde cualquier
              dispositivo con cámara y acceder a tu información de emergencia.
            </div>
          </details>

          <details className="group">
            <summary className="flex justify-between items-center font-medium text-gray-900 cursor-pointer">
              ¿Es segura mi información personal?
              <span className="ml-6 flex-shrink-0">+</span>
            </summary>
            <div className="mt-3 text-gray-600">
              Sí, tu información está protegida y encriptada. Solo se muestra la
              información de emergencia esencial cuando alguien escanea tu
              código QR, y se registra cada acceso para tu seguridad.
            </div>
          </details>

          <details className="group">
            <summary className="flex justify-between items-center font-medium text-gray-900 cursor-pointer">
              ¿Cuánto tiempo duran los stickers?
              <span className="ml-6 flex-shrink-0">+</span>
            </summary>
            <div className="mt-3 text-gray-600">
              Los códigos QR no tienen fecha de caducidad, pero recomendamos
              revisar y actualizar tu información cada 6 meses. Los stickers
              físicos deben reemplazarse cuando se desgasten.
            </div>
          </details>

          <details className="group">
            <summary className="flex justify-between items-center font-medium text-gray-900 cursor-pointer">
              ¿Puede cualquiera ver mi información?
              <span className="ml-6 flex-shrink-0">+</span>
            </summary>
            <div className="mt-3 text-gray-600">
              Solo se muestra información de emergencia básica. Los datos
              sensibles están protegidos y solo son visibles para profesionales
              médicos autorizados en situaciones de emergencia.
            </div>
          </details>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-safetap-600 to-safetap-700 rounded-lg p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">
          ¿Listo para configurar tu SafeTap?
        </h2>
        <p className="text-lg text-safetap-100 mb-6">
          Crea tu perfil de emergencia en pocos minutos y mantente protegido
          donde quiera que vayas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/dashboard/users"
            className="bg-white text-safetap-600 px-6 py-3 rounded-lg font-semibold hover:bg-safetap-50 transition-colors"
          >
            Ver Perfiles de Usuario
          </a>
          <a
            href="/dashboard/settings"
            className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-safetap-600 transition-colors"
          >
            Configuración del Sistema
          </a>
        </div>
      </div>
    </div>
  );
}
