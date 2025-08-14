export default function LandingPage() {
  return (
    <div className="grid gap-12">
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Tu información vital, en un tap.</h1>
          <p className="mt-3 text-lg text-slate-700">Un sticker con QR y NFC que da acceso inmediato a tus datos de emergencia.</p>
          <div className="mt-6 flex gap-3">
            <a className="btn" href="/buy">Comprar ahora</a>
            <a className="underline underline-offset-4" href="/s/demo">Ver ejemplo</a>
          </div>
        </div>
        <div aria-hidden="true" className="aspect-square rounded-xl bg-white shadow flex items-center justify-center">
          <div className="w-48 h-48 bg-slate-200 rounded" />
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold">Cómo funciona</h2>
        <ol className="mt-4 list-decimal ml-6 space-y-1">
          <li>Personaliza tu sticker</li>
          <li>Transfiere y confirma</li>
          <li>Activa tu perfil</li>
          <li>Usa QR o NFC</li>
        </ol>
      </section>
    </div>
  );
}
