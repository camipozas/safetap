'use client';

import { useState } from 'react';
import StickerCustomizerNew, { StickerCustomization } from '@/components/StickerCustomizerNew';
import CheckoutFormNew from './ui/CheckoutFormNew';

export default function BuyPage() {
  const [customization, setCustomization] = useState<StickerCustomization>({
    name: '',
    flagCode: 'CL',
    stickerColor: '#f1f5f9',
    textColor: '#000000',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Personaliza tu SafeTap
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Configura tu sticker de emergencia con tu información personal, elige tu bandera y personaliza los colores.
        </p>
      </div>
      
      {/* Customization panel */}
      <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
        <StickerCustomizerNew onCustomizationChange={setCustomization} />
      </div>

      {/* Checkout form */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">
          Finalizar pedido
        </h2>
        <CheckoutFormNew 
          customization={customization}
        />
      </div>
      
      {/* Info section */}
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
