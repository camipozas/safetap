#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando variables de entorno...\n');

// Configuraciones para diferentes entornos
const envConfigs = {
  production: {
    NEXTAUTH_URL: 'https://www.backoffice.safetap.cl',
    DATABASE_URL:
      'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19TazA3bTA2RzJDSVd0M0dKNTR1TXUiLCJhcGlfa2V5IjoiMDFLMk1XSkYyVzNDREoxNkpCUkVQVDBTUVYiLCJ0ZW5hbnRfaWQiOiI2MDJhNzc0YzkxYzJmNzVlZjNlNGEyYWVhM2Y3YjZiMjI4MjhjYTk1YTVjMWYyNDZkNTJlYWJlZTAwMzEwZTVkIiwiaW50ZXJuYWxfc2VjcmV0IjoiNjM4ZmQzNjItOTNkNy00OWE4LWJiYTMtZTY0MDA1MjhmZTVjIn0.v6iohJLvZAWtLkS47riUcmi-if3rQ04wxnVcnCyrm6I',
  },
  test: {
    NEXTAUTH_URL: 'http://localhost:3001',
    DATABASE_URL:
      'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18tT0M1WTZ6UXU0YlRBRm1ET3F5dVkiLCJhcGlfa2V5IjoiMDFLMlpCVDY1VktENlE3UjQ3VjE2MUc5RVkiLCJ0ZW5hbnRfaWQiOiI2NzkzMzhlZmVkY2I3YTc3NjU0YjFhMmFjNzQwNTEzODVmODM4OGQwNjI4YWMyZjY0ZTBkYTNhM2JiMWJiNWUwIiwiaW50ZXJuYWxfc2VjcmV0IjoiZWYxZWRjZGEtNTBjNi00OWQ1LTg3MzktYTc0MGM3ZmEwZDBkIn0.VhjBBuUTpathLuNN1dIDNflluO5_F1LVbrvq9uPl3c0',
  },
};

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

if (!environment || !envConfigs[environment]) {
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

const config = envConfigs[environment];
const projectRoot = path.join(__dirname, '..');

if (environment === 'production') {
  updateEnvFile(path.join(projectRoot, '.env'), config);
} else if (environment === 'test') {
  updateEnvFile(path.join(projectRoot, '.env.local'), config);
}

console.log('\n📊 Resumen:');
console.log('==========');
console.log(`✅ Entorno ${environment} configurado`);
console.log(`✅ NEXTAUTH_URL: ${config.NEXTAUTH_URL}`);
console.log(`✅ DATABASE_URL: ${config.DATABASE_URL.substring(0, 50)}...`);

console.log('\n⚠️  IMPORTANTE:');
console.log('==============');
console.log('1. Reinicia el servidor después de los cambios');
console.log('2. Ejecuta "npx prisma generate" para regenerar el cliente');
console.log('3. Verifica la conexión con "node scripts/test-db-connection.js"');
