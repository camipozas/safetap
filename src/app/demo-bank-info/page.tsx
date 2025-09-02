import BankAccountInfo from '@/components/BankAccountInfo';

export default function DemoBankInfoPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Demostración: Información Bancaria
      </h1>

      <div className="space-y-8">
        {/* Sin referencia de pago */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Solo Datos Bancarios (sin referencia)
          </h2>
          <BankAccountInfo />
        </div>

        {/* Con referencia de pago */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Datos Bancarios + Referencia de Pago
          </h2>
          <BankAccountInfo
            paymentReference={{
              reference: 'SAFETAP-2024-001',
              amount: 15000,
              description: 'Sticker personalizado SafeTap',
            }}
          />
        </div>

        {/* Con referencia de pago más compleja */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Datos Bancarios + Referencia Compleja
          </h2>
          <BankAccountInfo
            paymentReference={{
              reference: 'SAFETAP-2024-002-EMERGENCY',
              amount: 25000,
              description: 'Kit de emergencia SafeTap + Sticker premium',
            }}
          />
        </div>
      </div>

      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Características del Componente
        </h3>
        <ul className="text-blue-800 space-y-2">
          <li>
            • <strong>Datos bancarios estáticos:</strong> Empresa, RUT, banco,
            cuenta, etc.
          </li>
          <li>
            • <strong>Referencia de pago dinámica:</strong> Se muestra solo
            cuando se proporciona
          </li>
          <li>
            • <strong>Botones de copia individuales:</strong> Para cada campo
            específico
          </li>
          <li>
            • <strong>Botón &quot;Copiar Todo&quot;:</strong> Incluye datos
            bancarios + referencia si está disponible
          </li>
          <li>
            • <strong>Diseño responsive:</strong> Se adapta a diferentes tamaños
            de pantalla
          </li>
          <li>
            • <strong>Feedback visual:</strong> Confirmación cuando se copia
            algo
          </li>
        </ul>
      </div>
    </div>
  );
}
