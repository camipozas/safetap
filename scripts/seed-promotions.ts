import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPromotions() {
  console.log('🌱 Seeding promotions...');

  await prisma.promotion.deleteMany({});

  const promotions = [
    {
      name: 'Descuento por 2+ Stickers',
      description: '10% de descuento por 2 o más stickers',
      minQuantity: 2,
      discountType: 'PERCENTAGE' as const,
      discountValue: 10,
      active: true,
      priority: 1,
    },
    {
      name: 'Descuento por 5+ Stickers',
      description: '15% de descuento por 5 o más stickers',
      minQuantity: 5,
      discountType: 'PERCENTAGE' as const,
      discountValue: 15,
      active: true,
      priority: 2,
    },
    {
      name: 'Descuento por 10+ Stickers',
      description: '20% de descuento por 10 o más stickers',
      minQuantity: 10,
      discountType: 'PERCENTAGE' as const,
      discountValue: 20,
      active: true,
      priority: 3,
    },
    {
      name: 'Descuento Empresarial',
      description: '25% de descuento por 25 o más stickers',
      minQuantity: 25,
      discountType: 'PERCENTAGE' as const,
      discountValue: 25,
      active: true,
      priority: 4,
    },
  ];

  for (const promotion of promotions) {
    const created = await prisma.promotion.create({
      data: promotion,
    });
    console.log(
      `✅ Created promotion: ${created.name} (${created.discountValue}% off for ${created.minQuantity}+ items)`
    );
  }

  console.log('🎉 Promotions seeded successfully!');
}

async function main() {
  try {
    await seedPromotions();
  } catch (error) {
    console.error('❌ Error seeding promotions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
