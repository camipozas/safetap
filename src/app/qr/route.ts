import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const stickerId = searchParams.get('stickerId');
  const format = searchParams.get('format') || 'png';
  const size = searchParams.get('size') || '512';
  const dpi = searchParams.get('dpi') || '300';

  if (!stickerId) {
    return new Response('Sticker ID is required', { status: 400 });
  }

  // Verificar que el usuario es propietario del sticker
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const sticker = await prisma.sticker.findFirst({
    where: {
      id: stickerId,
      ownerId: user.id,
    },
  });

  if (!sticker) {
    return new Response('Sticker not found or access denied', { status: 404 });
  }

  // Solo permitir descarga si el sticker está activo
  if (sticker.status !== 'ACTIVE') {
    return new Response('Sticker must be active to download QR code', {
      status: 400,
    });
  }

  // Construir la URL del QR sin exponer información técnica
  const stickerUrl = `${process.env.NEXTAUTH_URL}/s/${sticker.slug}`;
  const qrApiUrl = `/api/qr/generate?url=${encodeURIComponent(stickerUrl)}&format=${format}&size=${size}&dpi=${dpi}`;

  // Redirigir al endpoint de generación de QR
  redirect(qrApiUrl);
}
