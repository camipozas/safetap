#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const { config } = require('./config');

const prisma = new PrismaClient();

function getEmailsFromArgs() {
  // process.argv[0] = node, [1] = script, [2...] = emails
  return process.argv.slice(2);
}

async function confirmAction(emails) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('\n⚠️  ATENCIÓN: Los siguientes usuarios serán eliminados:');
    emails.forEach((email) => console.log(`   - ${email}`));
    console.log('\n🔒 Esta acción:');
    console.log('   • Cambiará el rol del usuario a USER');
    console.log('   • Eliminará todas las cuentas asociadas (Google OAuth)');
    console.log('   • Eliminará todas las sesiones activas');
    console.log('   • NO se puede deshacer automáticamente');

    rl.question(
      '\n¿Estás seguro de que deseas continuar? Escribe "CONFIRMAR" para proceder: ',
      (answer) => {
        rl.close();
        resolve(answer.trim().toUpperCase() === 'CONFIRMAR');
      }
    );
  });
}

async function deleteUsers() {
  console.log('🗑️  Eliminando usuarios en producción...\n');

  const usersToDelete = getEmailsFromArgs();

  if (usersToDelete.length === 0) {
    console.log(
      '❌ Uso: node scripts/delete-users-production.js <email1> <email2> ...'
    );
    console.log('');
    console.log('📝 Ejemplos:');
    console.log(
      '   node scripts/delete-users-production.js usuario@ejemplo.com'
    );
    console.log(
      '   node scripts/delete-users-production.js usuario1@ejemplo.com usuario2@ejemplo.com'
    );
    console.log('');
    console.log(
      '💡 También puedes configurar la variable de entorno USERS_TO_DELETE:'
    );
    console.log(
      '   USERS_TO_DELETE="usuario1@ejemplo.com,usuario2@ejemplo.com"'
    );
    process.exit(1);
  }

  const confirmed = await confirmAction(usersToDelete);
  if (!confirmed) {
    console.log('❌ Operación cancelada por el usuario.');
    process.exit(0);
  }

  try {
    for (const email of usersToDelete) {
      console.log(`\n🔍 Procesando: ${email}`);

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

      // Verify associated accounts
      const accounts = await prisma.account.findMany({
        where: { userId: user.id },
      });

      console.log(`📊 Cuentas asociadas: ${accounts.length}`);

      // Verify associated sessions
      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });

      console.log(`📊 Sesiones asociadas: ${sessions.length}`);

      // Execute deletion
      console.log('🗑️  Ejecutando eliminación...');

      // 1. Delete associated accounts
      if (accounts.length > 0) {
        await prisma.account.deleteMany({
          where: { userId: user.id },
        });
        console.log('✅ Cuentas eliminadas');
      }

      // 2. Delete associated sessions
      if (sessions.length > 0) {
        await prisma.session.deleteMany({
          where: { userId: user.id },
        });
        console.log('✅ Sesiones eliminadas');
      }

      // 3. Change role to USER
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: config.roles.USER },
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
