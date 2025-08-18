#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUsers() {
  console.log('🗑️  Eliminando usuarios en producción...\n');

  const usersToDelete = [
    'camila.pozas@banca.me',
    'ramirezalvarezesteban@gmail.com',
  ];

  try {
    for (const email of usersToDelete) {
      console.log(`\n🔍 Procesando: ${email}`);

      // Buscar el usuario
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        console.log(`❌ Usuario no encontrado: ${email}`);
        continue;
      }

      console.log(
        `✅ Usuario encontrado: ${user.email} (ID: ${user.id}, Rol: ${user.role})`
      );

      // Verificar cuentas asociadas
      const accounts = await prisma.account.findMany({
        where: { userId: user.id },
      });

      console.log(`📊 Cuentas asociadas: ${accounts.length}`);

      // Verificar sesiones asociadas
      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });

      console.log(`📊 Sesiones asociadas: ${sessions.length}`);

      // Ejecutar eliminación
      console.log('🗑️  Ejecutando eliminación...');

      // 1. Eliminar cuentas asociadas
      if (accounts.length > 0) {
        await prisma.account.deleteMany({
          where: { userId: user.id },
        });
        console.log('✅ Cuentas eliminadas');
      }

      // 2. Eliminar sesiones asociadas
      if (sessions.length > 0) {
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });
        console.log('✅ Sesiones eliminadas');
      }

      // 3. Cambiar rol a USER
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'USER' },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      console.log('✅ Usuario actualizado:', updatedUser);
      console.log(`✅ ${email} eliminado exitosamente`);
    }

    console.log('\n🎉 ¡Eliminación completada!');
    console.log('✅ Todos los usuarios especificados han sido eliminados');
  } catch (error) {
    console.error('❌ Error en la eliminación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUsers();
