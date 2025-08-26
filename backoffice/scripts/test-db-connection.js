#!/usr/bin/env node

// Force production environment
process.env.NODE_ENV = 'production';
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testConnection() {
  try {
    console.log('🔍 Verificando conexión a base de datos...');
    console.log(
      'DATABASE_URL:',
      process.env.DATABASE_URL?.substring(0, 80) + '...'
    );

    // Test connection
    const userCount = await prisma.user.count();
    console.log(`✅ Conexión exitosa - Usuarios en BD: ${userCount}`);

    // Check existing invitations
    const invitations = await prisma.adminInvitation.findMany({
      where: { email: 'camila@safetap.cl' },
      orderBy: { createdAt: 'desc' },
    });

    console.log(
      `📋 Invitaciones encontradas para camila@safetap.cl: ${invitations.length}`
    );

    if (invitations.length > 0) {
      console.log('🎯 Última invitación:');
      const latest = invitations[0];
      console.log({
        id: latest.id,
        email: latest.email,
        role: latest.role,
        createdAt: latest.createdAt,
        expiresAt: latest.expiresAt,
        usedAt: latest.usedAt,
      });
    }

    // Check all users to verify we're in the right DB
    const users = await prisma.user.findMany({
      select: { email: true, role: true },
      take: 5,
    });

    console.log('👥 Primeros 5 usuarios en la BD:');
    users.forEach((user) => console.log(`  - ${user.email} (${user.role})`));
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
