#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Verificando conexión a la base de datos...\n');

  try {
    // Probar conexión básica
    console.log('1️⃣ Probando conexión básica...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa');

    // Contar usuarios
    console.log('\n2️⃣ Contando usuarios...');
    const userCount = await prisma.user.count();
    console.log(`✅ Total de usuarios: ${userCount}`);

    // Contar admins
    console.log('\n3️⃣ Contando administradores...');
    const adminCount = await prisma.user.count({
      where: {
        OR: [{ role: 'ADMIN' }, { role: 'SUPER_ADMIN' }],
      },
    });
    console.log(`✅ Total de administradores: ${adminCount}`);

    // Listar usuarios admin
    console.log('\n4️⃣ Listando usuarios administradores...');
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [{ role: 'ADMIN' }, { role: 'SUPER_ADMIN' }],
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (adminUsers.length > 0) {
      console.log('✅ Usuarios administradores:');
      adminUsers.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.email} (${user.role}) - ${user.createdAt.toLocaleDateString()}`
        );
      });
    } else {
      console.log('⚠️  No hay usuarios administradores');
    }

    // Verificar invitaciones pendientes
    console.log('\n5️⃣ Verificando invitaciones pendientes...');
    const pendingInvitations = await prisma.adminInvitation.count({
      where: {
        expiresAt: {
          gte: new Date(),
        },
        usedAt: null,
      },
    });
    console.log(`✅ Invitaciones pendientes: ${pendingInvitations}`);

    console.log('\n🎉 ¡Verificación completada exitosamente!');
    console.log('✅ La base de datos está funcionando correctamente');
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que las variables de entorno estén configuradas');
    console.log('2. Ejecuta "npx prisma generate" para regenerar el cliente');
    console.log('3. Verifica la conectividad de red');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
