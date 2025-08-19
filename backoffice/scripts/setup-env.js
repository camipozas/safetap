#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { config, validateEnvironment } = require('./config');

console.log('🔧 Configurando variables de entorno...\n');

// Función para actualizar archivo .env
function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo ${filePath} no existe`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${value}"`);
      console.log(`✅ Actualizado ${key} en ${path.basename(filePath)}`);
      updated = true;
    } else {
      content += `\n${key}="${value}"`;
      console.log(`➕ Agregado ${key} en ${path.basename(filePath)}`);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`💾 Guardado ${path.basename(filePath)}`);
  }

  return updated;
}

// Obtener argumento de línea de comandos
const environment = process.argv[2];

if (!environment || !['production', 'test'].includes(environment)) {
  console.log('❌ Uso: node scripts/setup-env.js <environment>');
  console.log('   Entornos disponibles: production, test');
  console.log('');
  console.log('   Ejemplos:');
  console.log(
    '   node scripts/setup-env.js production  # Configura .env para producción'
  );
  console.log(
    '   node scripts/setup-env.js test        # Configura .env.local para test'
  );
  process.exit(1);
}

console.log(`📋 Configurando entorno: ${environment}`);
console.log('=====================================');

// Validar variables de ambiente
if (!validateEnvironment()) {
  console.log('\n⚠️  Algunas variables de ambiente no están configuradas.');
  console.log(
    '   El script usará valores por defecto, pero es recomendable configurar las variables.'
  );
}

const envConfig = {
  NEXTAUTH_URL: config.nextauth[environment],
  DATABASE_URL: config.databases[environment],
};

const projectRoot = path.join(__dirname, '..');

if (environment === 'production') {
  updateEnvFile(path.join(projectRoot, '.env'), envConfig);
} else if (environment === 'test') {
  updateEnvFile(path.join(projectRoot, '.env.local'), envConfig);
}

console.log('\n📊 Resumen:');
console.log('==========');
console.log(`✅ Entorno ${environment} configurado`);
console.log(`✅ NEXTAUTH_URL: ${envConfig.NEXTAUTH_URL}`);
console.log(`✅ DATABASE_URL: ${envConfig.DATABASE_URL.substring(0, 50)}...`);

console.log('\n⚠️  IMPORTANTE:');
console.log('==============');
console.log('1. Reinicia el servidor después de los cambios');
console.log('2. Ejecuta "npx prisma generate" para regenerar el cliente');
console.log('3. Verifica la conexión con "node scripts/test-db-connection.js"');

console.log('\n🔧 Variables de ambiente recomendadas:');
console.log('====================================');
console.log('PROD_DATABASE_URL="tu_url_de_produccion"');
console.log('TEST_DATABASE_URL="tu_url_de_test"');
console.log('SUPER_ADMIN_EMAIL="email@ejemplo.com"');
console.log('USERS_TO_DELETE="email1@ejemplo.com,email2@ejemplo.com"');
