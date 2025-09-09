#!/usr/bin/env node

/**
 * Script para limpiar la base de datos del backoffice manteniendo solo usuarios y admin
 * Este script elimina:
 * - Todos los stickers/orders
 * - Todos los pagos
 * - Todos los perfiles de emergencia
 * - Todas las promociones (excepto las default)
 * - Mantiene: usuarios y configuración de admin
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza de la base de datos del backoffice...');

  try {
    // Usar transacción para asegurar consistencia
    await prisma.$transaction(async (tx) => {
      console.log('🗑️  Eliminando pagos...');
      const deletedPayments = await tx.payment.deleteMany({});
      console.log(`   ✅ Eliminados ${deletedPayments.count} pagos`);

      console.log('🗑️  Eliminando contactos de emergencia...');
      const deletedContacts = await tx.emergencyContact.deleteMany({});
      console.log(`   ✅ Eliminados ${deletedContacts.count} contactos`);

      console.log('🗑️  Eliminando perfiles de emergencia...');
      const deletedProfiles = await tx.emergencyProfile.deleteMany({});
      console.log(`   ✅ Eliminados ${deletedProfiles.count} perfiles`);

      console.log('🗑️  Eliminando stickers/órdenes...');
      const deletedStickers = await tx.sticker.deleteMany({});
      console.log(`   ✅ Eliminados ${deletedStickers.count} stickers`);

      console.log('🗑️  Eliminando códigos de descuento (excepto defaults)...');
      const deletedDiscountCodes = await tx.discountCode.deleteMany({
        where: {
          NOT: {
            id: {
              in: ['test-10-percent', 'test-20-percent'], // Mantener códigos de prueba
            },
          },
        },
      });
      console.log(
        `   ✅ Eliminados ${deletedDiscountCodes.count} códigos de descuento`
      );

      console.log('🗑️  Eliminando promociones (excepto defaults)...');
      const deletedPromotions = await tx.promotion.deleteMany({
        where: {
          NOT: {
            id: {
              in: ['default-quantity-discount'], // Mantener promoción default
            },
          },
        },
      });
      console.log(`   ✅ Eliminadas ${deletedPromotions.count} promociones`);

      console.log('🗑️  Eliminando invitaciones de admin...');
      const deletedInvitations = await tx.adminInvitation.deleteMany({});
      console.log(`   ✅ Eliminadas ${deletedInvitations.count} invitaciones`);
    });

    console.log('🎉 ¡Limpieza completada exitosamente!');

    // Mostrar estadísticas finales
    const remainingUsers = await prisma.user.count();
    const remainingStickers = await prisma.sticker.count();
    const remainingPayments = await prisma.payment.count();
    const remainingProfiles = await prisma.emergencyProfile.count();

    console.log('\n📊 Estado final de la base de datos:');
    console.log(`   👥 Usuarios: ${remainingUsers}`);
    console.log(`   🏷️  Stickers: ${remainingStickers}`);
    console.log(`   💳 Pagos: ${remainingPayments}`);
    console.log(`   🆘 Perfiles: ${remainingProfiles}`);

    if (
      remainingStickers === 0 &&
      remainingPayments === 0 &&
      remainingProfiles === 0
    ) {
      console.log('✅ Base de datos limpia correctamente');
    } else {
      console.log('⚠️  Algo no se eliminó correctamente');
    }
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  console.log(
    '⚠️  ADVERTENCIA: Este script eliminará TODOS los datos excepto usuarios.'
  );
  console.log('   Presiona Ctrl+C en los próximos 5 segundos para cancelar...');

  setTimeout(() => {
    cleanDatabase()
      .then(() => {
        console.log('✨ Script de limpieza completado exitosamente');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
      });
  }, 5000);
}

module.exports = { cleanDatabase };
