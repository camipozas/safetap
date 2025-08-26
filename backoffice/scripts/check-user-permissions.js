#!/usr/bin/env node

// Force production environment first
process.env.NODE_ENV = 'production';
require('dotenv').config({ path: '.env', override: true });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function checkUserPermissions() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Debes proporcionar un email como argumento:');
    console.error('   node scripts/check-user-permissions.js <email>');
    process.exit(1);
  }

  try {
    console.log('🔍 Verificando usuario:', email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (user) {
      console.log('✅ Usuario encontrado:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Role:', user.role);
      console.log('   Email Verified:', user.emailVerified ? 'Sí' : 'No');
      console.log('   Last Login:', user.lastLoginAt || 'Nunca');
      console.log('   Created:', user.createdAt);

      // Check permissions
      const hasBackofficeAccess =
        user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      console.log(
        '   Acceso Backoffice:',
        hasBackofficeAccess ? '✅ Sí' : '❌ No'
      );

      if (!hasBackofficeAccess) {
        console.log(
          '\n⚠️  Este usuario NO tiene permisos para acceder al backoffice'
        );
        console.log('   Roles permitidos: ADMIN, SUPER_ADMIN');
        console.log('   Rol actual:', user.role);
      }
    } else {
      console.log('❌ Usuario NO encontrado en la base de datos');
      console.log(
        '   El usuario debe existir en la base de datos antes de poder hacer login'
      );
    }

    // Check admin invitations
    const invitations = await prisma.adminInvitation.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (invitations.length > 0) {
      console.log('\n📧 Invitaciones encontradas:');
      invitations.forEach((inv, i) => {
        console.log(`   ${i + 1}. ID: ${inv.id}`);
        console.log(`      Role: ${inv.role}`);
        console.log(`      Created: ${inv.createdAt}`);
        console.log(`      Expires: ${inv.expiresAt}`);
        console.log(`      Used: ${inv.usedAt ? 'Sí' : 'No'}`);
        console.log(`      Token: ${inv.token.substring(0, 10)}...`);
        console.log('');
      });
    } else {
      console.log('\n📧 No hay invitaciones para este email');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions();
