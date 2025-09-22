import crypto from 'crypto';

import {
  AccessVia,
  PaymentStatus,
  PrismaClient,
  Role,
  StickerStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate unique IDs
function generateId(prefix: string, index?: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return index !== undefined
    ? `${prefix}-${index}-${random}`
    : `${prefix}-${timestamp}-${random}`;
}

async function seedTestData() {
  console.log('🌱 Generando datos de prueba...');

  // Clean existing data (optional)
  console.log('🧹 Limpiando datos existentes...');
  await prisma.profileAccessLog.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.emergencyProfile.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.sticker.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: generateId('admin'),
        email: 'admin@safetap.cl',
        name: 'Admin SafeTap',
        role: Role.ADMIN,
        country: 'CL',
        updatedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        id: generateId('user', 1),
        email: 'user1@test.com',
        name: 'Usuario Test 1',
        role: Role.USER,
        country: 'CL',
        updatedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        id: generateId('user', 2),
        email: 'user2@test.com',
        name: 'Usuario Test 2',
        role: Role.USER,
        country: 'AR',
        updatedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        id: generateId('user', 3),
        email: 'user3@test.com',
        name: 'Usuario Test 3',
        role: Role.USER,
        country: 'PE',
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`✅ Creados ${users.length} usuarios`);

  // Create test stickers
  const stickers = [];
  for (let i = 1; i <= 10; i++) {
    const sticker = await prisma.sticker.create({
      data: {
        id: generateId('sticker', i),
        slug: `test-sticker-${i}`,
        serial: `ST${String(i).padStart(6, '0')}`,
        ownerId: users[Math.floor(Math.random() * (users.length - 1)) + 1].id, // Exclude admin
        nameOnSticker: `Test User ${i}`,
        flagCode: ['CL', 'AR', 'PE', 'MX', 'CO'][Math.floor(Math.random() * 5)],
        status: [
          StickerStatus.ORDERED,
          StickerStatus.PAID,
          StickerStatus.PRINTING,
          StickerStatus.SHIPPED,
          StickerStatus.ACTIVE,
        ][Math.floor(Math.random() * 5)],
        groupId: crypto.randomUUID(), // Each test sticker gets its own group for simplicity
        updatedAt: new Date(),
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
        id: generateId('payment', i),
        userId,
        stickerId,
        quantity: Math.floor(Math.random() * 3) + 1, // 1-3 stickers
        amount: [2990, 3990, 4990][Math.floor(Math.random() * 3)], // 2990, 3990, 4990 CLP
        currency: 'CLP',
        method: ['BANK_TRANSFER', 'STRIPE', 'PAYPAL'][
          Math.floor(Math.random() * 3)
        ],
        reference: `REF${String(i).padStart(6, '0')}`,
        status: [
          PaymentStatus.PENDING,
          PaymentStatus.VERIFIED,
          PaymentStatus.REJECTED,
        ][Math.floor(Math.random() * 3)],
        receivedAt: Math.random() > 0.5 ? new Date() : null,
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Last 30 days
        updatedAt: new Date(),
      },
    });
    payments.push(payment);
  }

  console.log(`✅ Creados ${payments.length} pagos`);

  // Create test emergency profiles
  for (let i = 0; i < Math.min(5, users.length - 1, stickers.length); i++) {
    const profile = await prisma.emergencyProfile.create({
      data: {
        id: generateId('profile', i),
        userId: users[i + 1].id, // Exclude admin (index 0)
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
        updatedAt: new Date(),
      },
    });

    // Create emergency contacts
    await prisma.emergencyContact.createMany({
      data: [
        {
          id: generateId('contact', i * 2),
          profileId: profile.id,
          name: 'Contacto Principal',
          relation: 'Esposo/a',
          phone: '+56912345678',
          country: 'CL',
          preferred: true,
          updatedAt: new Date(),
        },
        {
          id: generateId('contact', i * 2 + 1),
          profileId: profile.id,
          name: 'Contacto Secundario',
          relation: 'Hijo/a',
          phone: '+56987654321',
          country: 'CL',
          preferred: false,
          updatedAt: new Date(),
        },
      ],
    });

    // Create access logs
    for (let j = 0; j < Math.floor(Math.random() * 10); j++) {
      await prisma.profileAccessLog.create({
        data: {
          id: generateId('log', i * 10 + j),
          profileId: profile.id,
          via: [AccessVia.QR, AccessVia.NFC, AccessVia.DIRECT][
            Math.floor(Math.random() * 3)
          ],
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          country: 'CL',
          createdAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ), // Last week
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
