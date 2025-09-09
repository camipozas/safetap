const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPromotions() {
  try {
    console.log('🔍 Checking promotions in database...');

    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Found ${promotions.length} promotions:`);

    if (promotions.length === 0) {
      console.log('❌ No promotions found in database');
    } else {
      promotions.forEach((promo, index) => {
        console.log(`\n${index + 1}. Promotion:`, {
          id: promo.id,
          name: promo.name,
          description: promo.description,
          minQuantity: promo.minQuantity,
          discountType: promo.discountType,
          discountValue: promo.discountValue.toString(),
          active: promo.active,
          priority: promo.priority,
          startDate: promo.startDate,
          endDate: promo.endDate,
          createdAt: promo.createdAt,
        });
      });
    }

    // Also check if there are any promotion redemptions
    const redemptions = await prisma.promotionRedemption.findMany();
    console.log(`\n🎫 Found ${redemptions.length} promotion redemptions`);
  } catch (error) {
    console.error('❌ Error checking promotions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPromotions();
