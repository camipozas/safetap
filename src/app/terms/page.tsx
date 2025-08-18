export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">
          Términos y Condiciones
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 mb-8">
            Estos términos y condiciones rigen el uso del servicio safetap. Al
            usar nuestro servicio, aceptas estos términos en su totalidad.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              1. Descripción del Servicio
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>
                safetap es un servicio que proporciona stickers inteligentes con
                códigos QR y tecnología de proximidad (NFC) que permiten acceso
                rápido a información de emergencia personalizada.
              </p>
              <p>El servicio incluye:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Stickers físicos personalizados con tu nombre y bandera</li>
                <li>Plataforma web para gestionar tu perfil de emergencia</li>
                <li>
                  Página pública accesible mediante QR o acercando el teléfono
                  (NFC)
                </li>
                <li>Actualizaciones gratuitas de tu información</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              2. Registro y Cuenta
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>
                Para usar safetap, debes crear una cuenta proporcionando
                información exacta y completa. Eres responsable de mantener la
                confidencialidad de tu cuenta y contraseña.
              </p>
              <p>
                Debes tener al menos 18 años para usar nuestro servicio. Si eres
                menor de edad, necesitas el consentimiento y supervisión de un
                padre o tutor.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              3. Uso Aceptable
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>Te comprometes a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Proporcionar información exacta y actualizada en tu perfil
                </li>
                <li>
                  Usar el servicio únicamente para propósitos legítimos de
                  emergencia
                </li>
                <li>
                  No compartir información falsa, engañosa o potencialmente
                  dañina
                </li>
                <li>Respetar los derechos de propiedad intelectual</li>
                <li>
                  No usar el servicio para actividades ilegales o no autorizadas
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              4. Pago y Facturación
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>
                Los precios están claramente indicados en el sitio web e
                incluyen todos los impuestos aplicables. El pago se procesa
                mediante transferencia bancaria.
              </p>
              <p>
                El procesamiento y envío de tu pedido comenzará una vez que
                confirmemos el pago. Los tiempos de entrega son estimados y
                pueden variar.
              </p>
              <p>
                <strong>Política de reembolso:</strong> Ofrecemos reembolsos
                completos si solicitas la cancelación dentro de 24 horas de
                realizar el pedido y antes de que hayamos iniciado la
                producción.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              5. Privacidad e Información Personal
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>
                Tu privacidad es importante para nosotros. Consulta nuestra
                <a href="/privacy" className="text-brand hover:underline">
                  {' '}
                  Política de Privacidad
                </a>
                para obtener información detallada sobre cómo manejamos tu
                información personal.
              </p>
              <p>
                <strong>Importante:</strong> La información que incluyas en tu
                perfil público será visible para cualquier persona que escanee
                tu código QR o acerque su teléfono (NFC). Incluye solo la
                información que estés cómodo compartiendo en emergencias.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              6. Propiedad Intelectual
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>
                safetap y todos sus contenidos, características y
                funcionalidades son propiedad de la empresa y están protegidos
                por derechos de autor, marcas comerciales y otras leyes de
                propiedad intelectual.
              </p>
              <p>
                Mantienes todos los derechos sobre la información personal que
                proporcionas, pero nos otorgas una licencia para usar esa
                información según sea necesario para proporcionar el servicio.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              7. Disponibilidad del Servicio
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>
                Nos esforzamos por mantener el servicio disponible 24/7, pero no
                podemos garantizar un tiempo de actividad del 100%. Podemos
                experimentar interrupciones por mantenimiento, actualizaciones o
                circunstancias fuera de nuestro control.
              </p>
              <p>
                Tu sticker físico funcionará independientemente de nuestra
                plataforma web, pero necesitas conexión a internet para
                actualizar tu información.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              8. Limitación de Responsabilidad
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>
                safetap es una herramienta de asistencia y no reemplaza los
                servicios médicos profesionales o de emergencia. En caso de
                emergencia real, siempre contacta primero a los servicios de
                emergencia locales.
              </p>
              <p>No somos responsables por:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Retrasos en el acceso a tu información debido a problemas
                  técnicos
                </li>
                <li>Información incorrecta o desactualizada en tu perfil</li>
                <li>
                  Decisiones médicas tomadas basándose en la información de tu
                  perfil
                </li>
                <li>Pérdida o daño de tu sticker físico</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              9. Terminación
            </h2>
            <div className="space-y-4 text-slate-700">
              <p>
                Puedes terminar tu cuenta en cualquier momento contactándonos.
                También podemos terminar o suspender tu cuenta si violas estos
                términos.
              </p>
              <p>
                Al terminar tu cuenta, tu perfil público dejará de estar
                disponible, pero tu sticker físico seguirá siendo tuyo.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              10. Ley Aplicable
            </h2>
            <p className="text-slate-700">
              Estos términos se rigen por las leyes de Chile. Cualquier disputa
              se resolverá en los tribunales competentes de Santiago, Chile.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              11. Modificaciones
            </h2>
            <p className="text-slate-700">
              Nos reservamos el derecho de modificar estos términos en cualquier
              momento. Te notificaremos sobre cambios significativos por correo
              electrónico o mediante un aviso en nuestro sitio web.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              12. Contacto
            </h2>
            <div className="text-slate-700">
              <p className="mb-4">
                Si tienes preguntas sobre estos términos y condiciones, puedes
                contactarnos:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p>
                  <strong>Email:</strong> legal@safetap.cl
                </p>
                <p>
                  <strong>Dirección:</strong> Santiago, Chile
                </p>
              </div>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              <strong>Última actualización:</strong> 18 de agosto de 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
