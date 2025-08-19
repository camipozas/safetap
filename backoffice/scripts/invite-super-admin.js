#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { config } = require('./config');

const prisma = new PrismaClient();

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
      }
    } else {
      console.log('✅ Usuario no existe, procediendo con invitación');
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
