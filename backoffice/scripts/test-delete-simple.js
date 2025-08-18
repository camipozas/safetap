#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDeleteUser() {
  console.log('🧪 Probando eliminación de usuario (sin autenticación)...\n');

  try {
    // Buscar un usuario admin para eliminar
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [{ role: 'ADMIN' }, { role: 'SUPER_ADMIN' }],
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!adminUser) {
      console.log('❌ No se encontraron usuarios admin para eliminar');
      return;
    }

    console.log(
      `✅ Usuario encontrado: ${adminUser.email} (ID: ${adminUser.id}, Rol: ${adminUser.role})`
    );

    // Verificar cuentas asociadas
    const accounts = await prisma.account.findMany({
      where: { userId: adminUser.id },
    });

    console.log(`📊 Cuentas asociadas: ${accounts.length}`);

    // Verificar sesiones asociadas
    const sessions = await prisma.session.findMany({
      where: { userId: adminUser.id },
    });

    console.log(`📊 Sesiones asociadas: ${sessions.length}`);

    // Ejecutar la eliminación (simulando el endpoint)
    console.log('\n🗑️  Ejecutando eliminación...');

    // 1. Eliminar cuentas asociadas
    if (accounts.length > 0) {
      await prisma.account.deleteMany({
        where: { userId: adminUser.id },
      });
      console.log('✅ Cuentas eliminadas');
    }

    // 2. Eliminar sesiones asociadas
    if (sessions.length > 0) {
      await prisma.session.deleteMany({
        where: { userId: adminUser.id },
      });
      console.log('✅ Sesiones eliminadas');
    }

    // 3. Cambiar rol a USER
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: 'USER' },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    console.log('✅ Usuario actualizado:', updatedUser);

    console.log('\n🎉 ¡Eliminación exitosa!');
    console.log(
      `✅ El usuario ${updatedUser.email} ahora tiene rol: ${updatedUser.role}`
    );
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteUser();
