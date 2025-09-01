const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'camila@safetap.cl' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (user) {
      console.log('✅ Usuario encontrado:', user);

      // Verificar permisos
      const canAccess = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      console.log(
        `🔐 ¿Puede acceder al backoffice? ${canAccess ? 'SÍ' : 'NO'}`
      );
      console.log(`👤 Rol actual: ${user.role}`);

      if (!canAccess) {
        console.log('⚠️  Para dar acceso, el rol debe ser ADMIN o SUPER_ADMIN');
      }
    } else {
      console.log('❌ Usuario no encontrado en la base de datos');
      console.log(
        '💡 El usuario debe existir en la base de datos antes de poder acceder'
      );
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
