import {
  AccessVia,
  PaymentStatus,
  PrismaClient,
  StickerStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Generando datos de prueba...');

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@safetap.cl' },
      update: {},
      create: {
        email: 'admin@safetap.cl',
        name: 'Admin SafeTap',
        role: 'ADMIN',
        country: 'CL',
      },
    }),
    prisma.user.upsert({
      where: { email: 'user1@test.com' },
      update: {},
      create: {
        email: 'user1@test.com',
        name: 'Usuario Test 1',
        role: 'USER',
        country: 'CL',
      },
    }),
    prisma.user.upsert({
      where: { email: 'user2@test.com' },
      update: {},
      create: {
        email: 'user2@test.com',
        name: 'Usuario Test 2',
        role: 'USER',
        country: 'AR',
      },
    }),
    prisma.user.upsert({
      where: { email: 'user3@test.com' },
      update: {},
      create: {
        email: 'user3@test.com',
        name: 'Usuario Test 3',
        role: 'USER',
        country: 'PE',
      },
    }),
  ]);

  console.log(`✅ Creados ${users.length} usuarios`);

  // Create test stickers
  const stickers = [];
  for (let i = 1; i <= 10; i++) {
    const sticker = await prisma.sticker.create({
      data: {
        slug: `test-sticker-${i}`,
        serial: `ST${String(i).padStart(6, '0')}`,
        ownerId: users[Math.floor(Math.random() * (users.length - 1)) + 1].id, // Exclude admin
        nameOnSticker: `Test User ${i}`,
        flagCode: ['CL', 'AR', 'PE', 'MX', 'CO'][Math.floor(Math.random() * 5)],
        status: (
          [
            'ORDERED',
            'PAID',
            'PRINTING',
            'SHIPPED',
            'ACTIVE',
          ] as StickerStatus[]
        )[Math.floor(Math.random() * 5)],
      },
    });
    stickers.push(sticker);
  }

  console.log(`✅ Creados ${stickers.length} stickers`);

  // Create test payments
  const payments = [];
  for (let i = 1; i <= 15; i++) {
    const userId = users[Math.floor(Math.random() * (users.length - 1)) + 1].id; // Exclude admin
    const stickerId =
      Math.random() > 0.3
        ? stickers[Math.floor(Math.random() * stickers.length)].id
        : null;

    const payment = await prisma.payment.create({
      data: {
        userId,
        stickerId,
        amount: [2990, 3990, 4990][Math.floor(Math.random() * 3)], // Random amounts
        currency: 'EUR',
        method: ['BANK_TRANSFER', 'STRIPE', 'PAYPAL'][
          Math.floor(Math.random() * 3)
        ],
        reference: `REF${String(i).padStart(6, '0')}`,
        status: (['PENDING', 'VERIFIED', 'REJECTED'] as PaymentStatus[])[
          Math.floor(Math.random() * 3)
        ],
        receivedAt: Math.random() > 0.5 ? new Date() : null,
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Last 30 days
      },
    });
    payments.push(payment);
  }

  console.log(`✅ Creados ${payments.length} pagos`);

  // Create emergency profiles and access logs
  for (let i = 0; i < 5; i++) {
    const profile = await prisma.emergencyProfile.create({
      data: {
        userId: users[i + 1].id, // Skip admin
        stickerId: stickers[i].id,
        bloodType: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'][
          Math.floor(Math.random() * 8)
        ],
        allergies: ['Penicilina', 'Nueces', 'Lactosa'],
        conditions: ['Diabetes', 'Hipertensión'],
        medications: ['Metformina', 'Lisinopril'],
        notes: `Notas médicas del usuario ${i + 1}`,
        language: 'es',
        organDonor: Math.random() > 0.5,
        insurance:
          i % 3 === 0
            ? {
                type: 'fonasa',
                hasComplementary: false,
              }
            : i % 3 === 1
              ? {
                  type: 'isapre',
                  isapre: [
                    'Cruz Blanca S.A.',
                    'Banmédica S.A.',
                    'Colmena Golden Cross S.A.',
                  ][Math.floor(Math.random() * 3)],
                  hasComplementary: Math.random() > 0.5,
                  complementaryInsurance:
                    Math.random() > 0.5 ? 'Vida Tres' : 'Colmena Golden Cross',
                }
              : i % 3 === 2
                ? {
                    type: 'isapre',
                    isapre: 'Otro',
                    isapreCustom: 'Isapre Regional Personalizada',
                    hasComplementary: false,
                  }
                : undefined,
      },
    });

    // Create emergency contacts
    await prisma.emergencyContact.createMany({
      data: [
        {
          profileId: profile.id,
          name: 'Contacto Principal',
          relation: 'Esposo/a',
          phone: '+56912345678',
          country: 'CL',
          preferred: true,
        },
        {
          profileId: profile.id,
          name: 'Contacto Secundario',
          relation: 'Hijo/a',
          phone: '+56987654321',
          country: 'CL',
          preferred: false,
        },
      ],
    });

    // Create access logs
    for (let j = 0; j < Math.floor(Math.random() * 10); j++) {
      await prisma.profileAccessLog.create({
        data: {
          profileId: profile.id,
          via: (['QR', 'NFC', 'DIRECT'] as AccessVia[])[
            Math.floor(Math.random() * 3)
          ],
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          country: 'CL',
          createdAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ), // Last 7 days
        },
      });
    }
  }

  console.log('✅ Creados perfiles de emergencia y logs de acceso');

  console.log('🎉 ¡Datos de prueba generados exitosamente!');
  console.log('📊 Ahora puedes probar el backoffice con datos reales');
  console.log('🔐 Usuario admin: admin@safetap.cl');
}

seedTestData()
  .catch((e) => {
    console.error('❌ Error generando datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
