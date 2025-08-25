import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carlos Herrera - Demo Perfil de Emergencia | SafeTap',
  description:
    'Ejemplo de perfil de emergencia de SafeTap. Muestra cómo se ve la información médica vital y contactos de emergencia.',
  openGraph: {
    title: 'Carlos Herrera - Demo Perfil de Emergencia | SafeTap',
    description:
      'Ejemplo de perfil de emergencia de SafeTap. Muestra cómo se ve la información médica vital y contactos de emergencia.',
    url: 'https://safetap.cl/s/demo-chile',
    siteName: 'SafeTap',
    images: [
      {
        url: 'https://safetap.cl/favicon.svg',
        width: 1200,
        height: 630,
        alt: 'SafeTap - Demo de Información de Emergencia',
      },
    ],
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carlos Herrera - Demo Perfil de Emergencia | SafeTap',
    description:
      'Ejemplo de perfil de emergencia de SafeTap. Muestra cómo se ve la información médica vital y contactos de emergencia.',
    images: ['https://safetap.cl/favicon.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DemoChilePage() {
  return (
    <article className="max-w-2xl mx-auto">
      <header className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🇨🇱 Carlos Herrera
        </h1>
      </header>

      <section className="grid gap-2">
        <p>
          <strong>Sangre:</strong> O+
        </p>
        <p>
          <strong>Alergias:</strong> Penicilina, Nueces
        </p>
        <p>
          <strong>Condiciones:</strong> Diabetes tipo 2
        </p>
        <p>
          <strong>Medicaciones:</strong> Metformina 850mg
        </p>
        <p>
          <strong>Notas:</strong> En caso de emergencia, verificar niveles de
          glucosa. Lleva siempre kit de emergencia para diabetes.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Contactos de emergencia</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">María Elena Herrera</div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Preferido
              </span>
            </div>
            <div className="text-sm text-gray-600">Esposa</div>
            <div className="text-sm text-gray-600">+56 9 1234 5678</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="font-medium">Dr. José Martinez</div>
            <div className="text-sm text-gray-600">Médico tratante</div>
            <div className="text-sm text-gray-600">+56 9 8765 4321</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="font-medium">Ana Herrera</div>
            <div className="text-sm text-gray-600">Hija</div>
            <div className="text-sm text-gray-600">+56 9 5555 6666</div>
          </div>
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t text-center text-sm text-slate-500">
        <p>Esta es una página de demostración de SafeTap</p>
        <p>En producción, esta información se generaría dinámicamente</p>
      </footer>
    </article>
  );
}
