export default async function DatosBancariosPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const resolvedSearchParams = await searchParams;
  const reference = resolvedSearchParams?.ref || 'N/A';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Datos para Transferencia Bancaria
            </h1>
            <p className="text-gray-600">
              Realiza la transferencia con los siguientes datos
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-blue-900 mb-4">
              Datos Bancarios
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Razón Social:</span>
                <span className="font-medium">SafeTap SpA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">RUT:</span>
                <span className="font-medium">77.123.456-7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Banco:</span>
                <span className="font-medium">Banco Estado</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo de Cuenta:</span>
                <span className="font-medium">Cuenta Corriente</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Número de Cuenta:</span>
                <span className="font-medium">123-456-789</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">pagos@safetap.cl</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-yellow-900 mb-4">
              Importante: Incluir en el comentario
            </h2>
            <div className="bg-white rounded p-3 border">
              <span className="text-gray-600">Referencia:</span>
              <span className="font-mono text-lg font-bold ml-2 text-blue-600">
                {reference}
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              Es fundamental que incluyas esta referencia en el comentario de la
              transferencia para poder identificar tu pago automáticamente.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="font-semibold text-green-900 mb-2">
              ¿Qué pasa después?
            </h2>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Verificaremos tu pago en 1-2 días hábiles</li>
              <li>• Tu sticker entrará en cola de impresión</li>
              <li>• Te notificaremos cuando esté listo para envío</li>
              <li>• Recibirás tu sticker en 3-5 días hábiles</li>
            </ul>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => window.close()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cerrar ventana
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
