import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';

export default async function PublicProfile({
  params,
}: {
  params: { slug: string };
}) {
  const profile = await prisma.emergencyProfile.findFirst({
    where: { sticker: { slug: params.slug }, consentPublic: true },
    include: {
      contacts: { orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }] },
      user: true,
    },
  });

  if (!profile) {
    notFound();
  }

  await prisma.profileAccessLog.create({
    data: { profileId: profile.id, via: 'DIRECT' },
  });

  return (
    <article className="max-w-2xl mx-auto">
      <header className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {profile.user.name ?? profile.user.email?.split('@')[0]}{' '}
          <span className="text-sm rounded bg-slate-200 px-2 py-1">
            {profile.language ?? 'es'}
          </span>
        </h1>
        <p className="text-slate-600">Sticker: /s/{params.slug}</p>
      </header>
      <section className="grid gap-2">
        {profile.bloodType && (
          <p>
            <strong>Sangre:</strong> {profile.bloodType}
          </p>
        )}
        {profile.allergies.length > 0 && (
          <p>
            <strong>Alergias:</strong> {profile.allergies.join(', ')}
          </p>
        )}
        {profile.conditions.length > 0 && (
          <p>
            <strong>Condiciones:</strong> {profile.conditions.join(', ')}
          </p>
        )}
        {profile.medications.length > 0 && (
          <p>
            <strong>Medicaciones:</strong> {profile.medications.join(', ')}
          </p>
        )}
        {profile.notes && (
          <p>
            <strong>Notas:</strong> {profile.notes}
          </p>
        )}
      </section>
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Contactos</h2>
        <ul className="grid gap-2">
          {profile.contacts.map((c) => (
            <li
              key={c.id}
              className="rounded border bg-white p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">
                  {c.name} — {c.relation}
                </p>
                <p className="text-sm text-slate-600">{c.country ?? ''}</p>
              </div>
              <a
                className="btn"
                href={`tel:${c.phone}`}
                aria-label={`Llamar a ${c.name}`}
              >
                Llamar
              </a>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-slate-500 mt-6">
        La información es provista por el usuario. No sustituye atención médica.
      </p>
    </article>
  );
}
