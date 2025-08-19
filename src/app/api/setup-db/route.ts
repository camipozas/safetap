import { NextResponse } from 'next/server';

import { environment } from '@/environment/config';
import { prisma } from '@/lib/prisma';

// ⚠️ SOLO PARA DESARROLLO - Las tablas ya fueron creadas
export async function POST() {
  if (environment.app.isProduction) {
    return NextResponse.json(
      { error: 'No disponible en producción' },
      { status: 403 }
    );
  }

  try {
    // Verificar que la conexión funciona
    const userCount = await prisma.user.count();

    return NextResponse.json({
      message: '✅ Base de datos configurada correctamente',
      note: 'Las tablas ya fueron creadas usando `prisma db push`',
      status: {
        connected: true,
        userCount,
      },
      instructions: [
        '1. Ve a /dev-login para probar el login de desarrollo',
        '2. Usa el sistema normalmente',
        '3. Las tablas ya están creadas y funcionando',
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        note: 'Error de conexión a la base de datos',
      },
      { status: 500 }
    );
  }
}
