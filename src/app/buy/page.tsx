import { auth } from '@/lib/auth';
import CheckoutForm from './ui/CheckoutForm';

export default async function BuyPage() {
  const session = await auth();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Personaliza tu sticker
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Configura tu sticker de emergencia con tu información personal y bandera preferida.
        </p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Formulario */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Detalles del pedido
          </h2>
          <CheckoutForm userEmail={session?.user?.email ?? ''} />
        </div>
        
        {/* Vista previa */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-6 text-center">
            Vista previa
          </h3>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="aspect-square max-w-64 mx-auto bg-gradient-to-br from-brand to-blue-600 rounded-2xl p-6 flex flex-col items-center justify-center text-white">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="font-bold text-lg">safetap</p>
              <p className="text-sm opacity-90">Tu nombre aquí</p>
            </div>
            <div className="mt-6 text-center">
              <h4 className="font-semibold text-slate-900 mb-2">Características</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• QR y NFC integrados</li>
                <li>• Resistente al agua</li>
                <li>• Material duradero</li>
                <li>• Fácil de pegar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Información adicional */}
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Envío gratis</h3>
          <p className="text-slate-600 text-sm">Entrega a domicilio sin costo adicional</p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Garantía</h3>
          <p className="text-slate-600 text-sm">2 años de garantía contra defectos</p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Soporte 24/7</h3>
          <p className="text-slate-600 text-sm">Ayuda cuando la necesites</p>
        </div>
      </div>
    </div>
  );
}
