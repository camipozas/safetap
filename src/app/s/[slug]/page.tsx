import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const profile = await prisma.emergencyProfile.findFirst({
    where: { sticker: { slug: params.slug }, consentPublic: true },
    include: {
      user: true,
    },
  });

  if (!profile) {
    return {
      title: 'Perfil no encontrado | SafeTap',
      description: 'El perfil de emergencia solicitado no está disponible.',
    };
  }

  const userName =
    profile.user.name ?? profile.user.email?.split('@')[0] ?? 'Usuario';
  const title = `${userName} - Perfil de Emergencia | SafeTap`;
  const description = `Información de emergencia de ${userName}. Acceso rápido a datos médicos vitales y contactos de emergencia a través de SafeTap.`;
  const url = `https://safetap.cl/s/${params.slug}`;
  // TODO: Crear una imagen PNG optimizada (1200x630) para Open Graph en /public/og-image.png
  // Por ahora usamos el favicon, pero se recomienda una imagen específica para redes sociales
  const imageUrl = 'https://safetap.cl/favicon.svg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'SafeTap',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'SafeTap - Información de Emergencia',
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PublicProfile(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
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
