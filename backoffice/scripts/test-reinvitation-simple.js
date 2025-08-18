#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReinvitation() {
  console.log('🧪 Probando re-invitación después de eliminación...\n');

  try {
    const testEmail = 'cpozasg1103@gmail.com';

    // Verificar el estado actual del usuario
    const currentUser = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!currentUser) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log(
      `✅ Usuario actual: ${currentUser.email} (Rol: ${currentUser.role})`
    );

    // Verificar si hay invitaciones pendientes
    const pendingInvitations = await prisma.adminInvitation.findMany({
      where: {
        email: testEmail,
        expiresAt: {
          gte: new Date(),
        },
        usedAt: null,
      },
    });

    console.log(`📊 Invitaciones pendientes: ${pendingInvitations.length}`);

    // Limpiar invitaciones expiradas o usadas
    const cleanupResult = await prisma.adminInvitation.deleteMany({
      where: {
        email: testEmail,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });

    if (cleanupResult.count > 0) {
      console.log(
        `🧹 Limpiadas ${cleanupResult.count} invitaciones expiradas/usadas`
      );
    }

    // Crear nueva invitación
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newInvitation = await prisma.adminInvitation.create({
      data: {
        email: testEmail,
        role: 'ADMIN',
        token,
        expiresAt,
      },
    });

    console.log('✅ Nueva invitación creada:', {
      id: newInvitation.id,
      email: newInvitation.email,
      role: newInvitation.role,
      expiresAt: newInvitation.expiresAt,
    });

    console.log('\n🎉 ¡Re-invitación exitosa!');
    console.log(`✅ El usuario ${testEmail} puede ser re-invitado como ADMIN`);
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReinvitation();
