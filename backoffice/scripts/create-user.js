#!/usr/bin/env node

// Force production environment first
process.env.NODE_ENV = 'production';
require('dotenv').config({ path: '.env', override: true });

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function createUser() {
  const email = process.argv[2];
  const role = process.argv[3] || 'SUPER_ADMIN';

  if (!email) {
    console.error('❌ Debes proporcionar un email como argumento:');
    console.error('   node scripts/create-user.js <email> [role]');
    console.error(
      '   Ejemplo: node scripts/create-user.js camila@safetap.cl SUPER_ADMIN'
    );
    process.exit(1);
  }

  try {
    console.log('🔍 Verificando si el usuario ya existe:', email);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  El usuario ya existe:');
      console.log('   ID:', existingUser.id);
      console.log('   Email:', existingUser.email);
      console.log('   Role:', existingUser.role);
      console.log('   Created:', existingUser.createdAt);

      if (existingUser.role !== role) {
        console.log(
          `\n🔄 Actualizando rol de ${existingUser.role} a ${role}...`
        );
        const updatedUser = await prisma.user.update({
          where: { email },
          data: { role },
        });
        console.log('✅ Rol actualizado exitosamente');
        return updatedUser;
      } else {
        console.log('✅ El usuario ya tiene el rol correcto');
        return existingUser;
      }
    }

    console.log(`\n👤 Creando nuevo usuario con rol ${role}...`);

    const newUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0], // Use email prefix as name
        role,
        emailVerified: new Date(), // Set as verified since it's an admin
        updatedAt: new Date(),
      },
    });

    console.log('✅ Usuario creado exitosamente:');
    console.log('   ID:', newUser.id);
    console.log('   Email:', newUser.email);
    console.log('   Name:', newUser.name);
    console.log('   Role:', newUser.role);
    console.log('   Email Verified:', newUser.emailVerified);
    console.log('   Created:', newUser.createdAt);

    console.log('\n🎉 ¡El usuario ahora puede hacer login en el backoffice!');

    return newUser;
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
