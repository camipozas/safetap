import Link from 'next/link';

import StickerPreview from '@/components/StickerPreview';

export default function LandingPage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-brand-600 to-blue-600 bg-clip-text text-transparent">
            Tu información vital, en un tap.
          </h1>
          <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
            Un sticker inteligente con QR y NFC que da acceso inmediato a tus
            datos de emergencia cuando más los necesitas.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              className="btn text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
              href="/buy"
            >
              Comprar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Diseño elegante y funcional
          </h2>
          <p className="text-lg text-slate-600 mb-6">
            Nuestros stickers combinan diseño minimalista con tecnología
            avanzada. Resistentes al agua y de larga duración.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center text-slate-700">
              <svg
                className="w-5 h-5 text-green-500 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Código QR y NFC integrados
            </li>
            <li className="flex items-center text-slate-700">
              <svg
                className="w-5 h-5 text-green-500 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Resistente al agua y UV
            </li>
            <li className="flex items-center text-slate-700">
              <svg
                className="w-5 h-5 text-green-500 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Personalizable con tu bandera
            </li>
          </ul>
        </div>
        <div className="order-1 md:order-2">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-center">
              <Link href="/s/demo-chile" className="block">
                <StickerPreview
                  name="Carlos Herrera"
                  flagCode="CL"
                  stickerColor="#dbeafe"
                  textColor="#1e40af"
                  showRealQR={true}
                  stickerId="demo-chile"
                  serial="demo-chile"
                  className="transform scale-125 hover:scale-130 transition-transform duration-200"
                />
              </Link>
            </div>
            <div className="text-center mt-6">
              <Link
                href="/s/demo-chile"
                className="inline-flex items-center text-sm text-brand hover:text-blue-700 font-medium"
              >
                Ver ejemplo información de contacto →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white rounded-3xl p-8 md:p-12 shadow-lg">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Cómo funciona
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Personaliza</h3>
            <p className="text-slate-600 text-sm">
              Elige tu bandera y nombre para el sticker
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Paga</h3>
            <p className="text-slate-600 text-sm">
              Realiza el pago por transferencia bancaria
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Activa</h3>
            <p className="text-slate-600 text-sm">
              Crea tu perfil de emergencia online
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">4</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">¡Listo!</h3>
            <p className="text-slate-600 text-sm">
              Usa QR o NFC para acceso instantáneo
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Características principales
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Acceso rápido</h3>
            <p className="text-slate-600">
              Información de emergencia disponible en segundos con QR o NFC.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Seguro y privado
            </h3>
            <p className="text-slate-600">
              Tú controlas qué información compartir y cuándo actualizarla.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Siempre actualizado
            </h3>
            <p className="text-slate-600">
              Modifica tu información cuando quieras desde tu cuenta personal.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
