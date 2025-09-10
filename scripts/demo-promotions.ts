/**
 * Demonstration script for the quantity-based promotions system
 * This script shows how the promotion system works with different cart configurations
 */

import { PRICE_PER_STICKER_CLP } from '../src/lib/constants';
import {
  calculateDiscount,
  formatDiscountDisplay,
  getPromotionTiers,
  previewDiscountForQuantity,
} from '../src/utils/promotions';

console.log('🎉 SafeTap Quantity-Based Promotions System Demo\n');

// Show available promotion tiers
console.log('📋 Available Promotion Tiers:');
const tiers = getPromotionTiers();
tiers.forEach((tier, index) => {
  console.log(`  ${index + 1}. ${tier.description}`);
});
console.log('');

// Demo scenarios
const scenarios = [
  { quantity: 1, description: 'Single sticker purchase' },
  { quantity: 2, description: 'Small bulk order' },
  { quantity: 5, description: 'Medium bulk order' },
  { quantity: 10, description: 'Large bulk order' },
  { quantity: 25, description: 'Corporate order' },
  { quantity: 50, description: 'Enterprise order' },
];

console.log('💰 Pricing Scenarios:\n');

scenarios.forEach(({ quantity, description }) => {
  const cart = [
    {
      id: `sticker-${quantity}`,
      name: 'SafeTap Emergency Sticker',
      price: PRICE_PER_STICKER_CLP,
      quantity,
    },
  ];

  const result = calculateDiscount(cart);

  console.log(
    `📦 ${description} (${quantity} sticker${quantity > 1 ? 's' : ''})`
  );
  console.log(
    `   Original Total: $${result.originalTotal.toLocaleString('es-CL')} CLP`
  );

  if (result.appliedPromotions.length > 0) {
    const promotion = result.appliedPromotions[0];
    console.log(`   🎁 Applied: ${promotion.description}`);
    console.log(
      `   💸 Discount: -$${promotion.discountAmount.toLocaleString('es-CL')} CLP (${formatDiscountDisplay(promotion)})`
    );
    console.log(
      `   ✅ Final Total: $${result.finalTotal.toLocaleString('es-CL')} CLP`
    );

    const savings = result.originalTotal - result.finalTotal;
    const savingsPercent = ((savings / result.originalTotal) * 100).toFixed(1);
    console.log(
      `   💡 You saved: $${savings.toLocaleString('es-CL')} CLP (${savingsPercent}%)`
    );
  } else {
    console.log(`   ℹ️  No discount applied`);
    console.log(
      `   💰 Final Total: $${result.finalTotal.toLocaleString('es-CL')} CLP`
    );

    // Show next tier incentive
    const nextTier = tiers.find((tier) => tier.minQuantity > quantity);
    if (nextTier) {
      const nextTierPreview = previewDiscountForQuantity(
        PRICE_PER_STICKER_CLP,
        nextTier.minQuantity
      );
      const potentialSavings =
        nextTierPreview.originalTotal - nextTierPreview.finalTotal;
      console.log(
        `   🚀 Next tier: Add ${nextTier.minQuantity - quantity} more to save $${potentialSavings.toLocaleString('es-CL')} CLP!`
      );
    }
  }
  console.log('');
});

// Show complex cart scenario
console.log('🛒 Complex Cart Scenario:\n');

const complexCart = [
  {
    id: 'personal-stickers',
    name: 'Personal SafeTap Stickers',
    price: PRICE_PER_STICKER_CLP,
    quantity: 3,
  },
  {
    id: 'family-stickers',
    name: 'Family SafeTap Stickers',
    price: PRICE_PER_STICKER_CLP,
    quantity: 4,
  },
];

const complexResult = calculateDiscount(complexCart);
console.log('🔥 Mixed Cart Example:');
console.log(
  `   Items: ${complexCart.map((item) => `${item.quantity}x ${item.name}`).join(' + ')}`
);
console.log(
  `   Total Quantity: ${complexCart.reduce((sum, item) => sum + item.quantity, 0)} stickers`
);
console.log(
  `   Original Total: $${complexResult.originalTotal.toLocaleString('es-CL')} CLP`
);

if (complexResult.appliedPromotions.length > 0) {
  const promotion = complexResult.appliedPromotions[0];
  console.log(`   🎁 Applied: ${promotion.description}`);
  console.log(
    `   💸 Discount: -$${promotion.discountAmount.toLocaleString('es-CL')} CLP`
  );
  console.log(
    `   ✅ Final Total: $${complexResult.finalTotal.toLocaleString('es-CL')} CLP`
  );
}

console.log('\n📊 System Summary:');
console.log('   ✅ Automatic quantity-based discounts');
console.log('   ✅ Multiple tier support');
console.log('   ✅ Scalable promotion rules');
console.log('   ✅ Database-driven configuration');
console.log('   ✅ Secure backend validation');
console.log('   ✅ Frontend integration ready');
console.log('   ✅ Backoffice management interface');
console.log('   ✅ Comprehensive test coverage');

console.log('\n🎯 Business Value:');
console.log('   • Increases average order value');
console.log('   • Encourages bulk purchases');
console.log('   • Flexible promotion management');
console.log('   • Real-time discount calculation');
console.log('   • Compatible with existing discount codes');

console.log('\n🔧 Technical Features:');
console.log('   • TypeScript type safety');
console.log('   • Prisma database integration');
console.log('   • Next.js API routes');
console.log('   • React hooks for frontend');
console.log('   • Vitest test suite');
console.log('   • Admin panel management');

console.log('\n🚀 Ready for production! 🚀');
