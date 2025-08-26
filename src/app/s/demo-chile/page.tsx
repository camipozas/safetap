import Link from 'next/link';

import { EmergencyProfileDisplay } from '@/components/EmergencyProfileDisplay';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

// Create demo profile if it doesn't exist
async function ensureDemoProfile() {
  const existingProfile = await prisma.emergencyProfile.findFirst({
    where: { Sticker: { slug: 'demo-chile' } },
    include: {
      EmergencyContact: {
        orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
      },
      User: true,
      Sticker: true,
    },
  });

  if (existingProfile) {
    return existingProfile;
  }

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@safetap.cl' },
    update: {},
    create: {
      id: `demo-user-${Date.now()}`,
      email: 'demo@safetap.cl',
      name: 'María González',
      country: 'CL',
      updatedAt: new Date(),
    },
  });

  // Create demo sticker
  const demoSticker = await prisma.sticker.upsert({
    where: { slug: 'demo-chile' },
    update: {},
    create: {
      id: `demo-sticker-${Date.now()}`,
      slug: 'demo-chile',
      serial: 'DEMO001',
      ownerId: demoUser.id,
      nameOnSticker: 'María González',
      flagCode: 'CL',
      colorPresetId: 'light-gray',
      stickerColor: '#f1f5f9',
      textColor: '#000000',
      status: 'ACTIVE',
      updatedAt: new Date(),
    },
  });

  // Create demo profile
  const demoProfile = await prisma.emergencyProfile.create({
    data: {
      id: `demo-profile-${Date.now()}`,
      userId: demoUser.id,
      stickerId: demoSticker.id,
      bloodType: 'O+',
      allergies: ['Penicilina', 'Mariscos', 'Frutos secos'],
      conditions: ['Diabetes Tipo 1', 'Asma'],
      medications: ['Insulina Lantus', 'Inhalador Salbutamol'],
      notes:
        'Diabética tipo 1 desde los 12 años. Requiere glucagón en caso de hipoglucemia severa. Siempre lleva inhalador para asma. Alérgica severa a mariscos.',
      language: 'es',
      organDonor: true,
      consentPublic: true,
      updatedAt: new Date(),
    },
    include: {
      EmergencyContact: {
        orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
      },
      User: true,
      Sticker: true,
    },
  });

  // Create demo contacts separately
  await prisma.emergencyContact.createMany({
    data: [
      {
        id: `demo-contact-1-${Date.now()}`,
        profileId: demoProfile.id,
        name: 'Carlos González',
        relation: 'Esposo',
        phone: '+56912345678',
        country: 'Chile',
        preferred: true,
        updatedAt: new Date(),
      },
      {
        id: `demo-contact-2-${Date.now()}`,
        profileId: demoProfile.id,
        name: 'Ana González',
        relation: 'Hija',
        phone: '+56987654321',
        country: 'Chile',
        preferred: false,
        updatedAt: new Date(),
      },
      {
        id: `demo-contact-3-${Date.now()}`,
        profileId: demoProfile.id,
        name: 'Dr. Pedro Ramírez',
        relation: 'Endocrinólogo',
        phone: '+56222334455',
        country: 'Chile',
        preferred: false,
        updatedAt: new Date(),
      },
      {
        id: `demo-contact-4-${Date.now()}`,
        profileId: demoProfile.id,
        name: 'Dra. Carmen López',
        relation: 'Médico de cabecera',
        phone: '+56233445566',
        country: 'Chile',
        preferred: false,
        updatedAt: new Date(),
      },
    ],
  });

  // Fetch the complete profile with contacts
  const completeProfile = await prisma.emergencyProfile.findUnique({
    where: { id: demoProfile.id },
    include: {
      EmergencyContact: {
        orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
      },
      User: true,
      Sticker: true,
    },
  });

  return completeProfile!;
}

export default async function DemoChilePage() {
  const profile = await ensureDemoProfile();

  // Transform the data to match the expected interface
  const profileData = {
    ...profile,
    contacts: profile.EmergencyContact || [],
    user: profile.User || {},
    sticker: profile.Sticker,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Demo Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <p className="font-semibold text-blue-900">
              Ejemplo de perfil SafeTap
            </p>
          </div>
          <p className="text-blue-800 text-sm">
            Este es un ejemplo de cómo se ve la información de emergencia cuando
            alguien escanea tu código QR.
          </p>
          <div className="mt-3">
            <Link
              href="/buy"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              🛒 Conseguir mi SafeTap
            </Link>
          </div>
        </div>

        {/* Emergency Profile Display */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <EmergencyProfileDisplay
            profile={profileData}
            showSafeTapId={true}
            isDemoMode={true}
          />
        </div>

        {/* CTA Section */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              ¿Te gusta cómo se ve?
            </h3>
            <p className="text-slate-600 mb-4">
              Consigue tu propio SafeTap y ten tu información de emergencia
              siempre contigo
            </p>
            <Link
              href="/buy"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              🛒 Conseguir mi SafeTap
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const demoUrl = 'https://safetap.cl/s/demo-chile';
  const demoDescription =
    'Ejemplo interactivo de perfil de emergencia SafeTap. Descubre cómo funciona nuestro sistema de información médica vital con códigos QR inteligentes.';

  return {
    title: 'Demo SafeTap Chile - Información de Emergencia',
    description: demoDescription,
    robots: 'index, follow',
    alternates: {
      canonical: demoUrl,
    },
    openGraph: {
      title: 'Demo SafeTap Chile - Información de Emergencia',
      description: demoDescription,
      url: demoUrl,
      siteName: 'SafeTap',
      type: 'website',
      images: [
        {
          url: 'https://safetap.cl/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Demo SafeTap Chile - Sistema de emergencia personal',
        },
      ],
      locale: 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Demo SafeTap Chile - Información de Emergencia',
      description: demoDescription,
      images: ['https://safetap.cl/twitter-image.png'],
    },
  };
}
