#!/usr/bin/env node

// Force production environment first
process.env.NODE_ENV = 'production';

// Load production .env file explicitly (try .env.production first)
require('dotenv').config({ path: '.env.production', override: true });

console.log('🔍 Verificando configuración de base de datos...');
console.log(
  'DATABASE_URL:',
  process.env.DATABASE_URL?.substring(0, 50) + '...'
);
console.log('DIRECT_URL:', process.env.DIRECT_URL?.substring(0, 50) + '...');
console.log('NODE_ENV:', process.env.NODE_ENV);

const { PrismaClient } = require('@prisma/client');
const { config } = require('./config');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function inviteSuperAdmin() {
  console.log('👑 Invitando como SUPER_ADMIN en producción...\n');

  try {
    // Get email from command-line argument or environment variable
    const email = process.argv[2] || config.defaultEmails.superAdmin;
    const role = config.roles.SUPER_ADMIN;

    if (!email) {
      console.error('❌ Debe proporcionar un email como argumento:');
      console.error('   node scripts/invite-super-admin.js <email>');
      console.error('   o establecer la variable de entorno SUPER_ADMIN_EMAIL');
      process.exit(1);
    }

    console.log(`📧 Email: ${email}`);
    console.log(`👑 Rol: ${role}`);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (existingUser) {
      console.log(
        `✅ Usuario encontrado: ${existingUser.email} (Rol actual: ${existingUser.role})`
      );

      if (existingUser.role === config.roles.SUPER_ADMIN) {
        console.log('⚠️  El usuario ya es SUPER_ADMIN');
        return;
      } else {
        // Update user role to SUPER_ADMIN
        console.log(`🔄 Actualizando rol de ${existingUser.role} a ${role}...`);
        await prisma.user.update({
          where: { email },
          data: { role },
        });
        console.log('✅ Rol actualizado a SUPER_ADMIN');
      }
    } else {
      console.log('❌ Usuario no existe, creándolo primero...');

      // Create the user first
      const newUser = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0], // Use email prefix as name
          role,
          emailVerified: new Date(), // Set as verified since it's an admin
        },
      });

      console.log('✅ Usuario creado exitosamente:');
      console.log('   ID:', newUser.id);
      console.log('   Email:', newUser.email);
      console.log('   Name:', newUser.name);
      console.log('   Role:', newUser.role);
    }

    // Limpiar invitaciones expiradas o usadas
    const cleanupResult = await prisma.adminInvitation.deleteMany({
      where: {
        email,
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

    const invitation = await prisma.adminInvitation.create({
      data: {
        email,
        role,
        token,
        expiresAt,
      },
    });

    console.log('✅ Invitación SUPER_ADMIN creada:', {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });

    // Generar URL de invitación
    const baseUrl = config.nextauth.production;
    const inviteUrl = `${baseUrl}/auth/accept-invitation?token=${token}`;

    console.log('\n🔗 URL de invitación:');
    console.log(inviteUrl);

    console.log('\n🎉 ¡Invitación SUPER_ADMIN creada exitosamente!');
    console.log(`✅ ${email} puede aceptar la invitación como SUPER_ADMIN`);
  } catch (error) {
    console.error('❌ Error creando invitación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inviteSuperAdmin();
