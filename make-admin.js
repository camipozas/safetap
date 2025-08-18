// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeUserAdmin() {
  try {
    // Get email and role from command line arguments
    const email = process.argv[2] || 'cpozasg1103@gmail.com';
    const role = process.argv[3] || 'SUPER_ADMIN';

    // Validate role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      console.error('❌ Rol debe ser ADMIN o SUPER_ADMIN');
      process.exit(1);
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // If the user exists, update it
      user = await prisma.user.update({
        where: { email },
        data: {
          role,
          name: user.name || `${role} SafeTap`,
        },
      });
      console.log(`✅ Usuario ${email} actualizado a ${role}`);
    } else {
      // If no exist, create it
      user = await prisma.user.create({
        data: {
          email,
          role,
          name: `${role} SafeTap`,
        },
      });
      console.log(`✅ Usuario ${email} creado como ${role}`);
    }

    console.log(`🎯 Detalles del usuario:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   ID: ${user.id}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🚀 Configurando usuario administrador...');
console.log(`📧 Email: ${process.argv[2]}`);
console.log(`👤 Rol: ${process.argv[3]}`);
console.log('');

makeUserAdmin().catch((e) => {
  console.error('💥 Error fatal:', e);
  process.exit(1);
});
