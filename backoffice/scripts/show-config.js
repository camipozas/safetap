#!/usr/bin/env node

// Importar configuración desde el archivo TypeScript
const {
  showCurrentConfig,
  validateEnvironment,
} = require('../src/environment/config.ts');

console.log('🔧 Verificando configuración de ambiente...\n');

// Mostrar configuración actual
showCurrentConfig();

console.log('\n' + '='.repeat(50));

// Validar configuración
console.log('\n🔍 Validando configuración...');
const isValid = validateEnvironment();

if (isValid) {
  console.log('\n✅ Configuración válida');
  console.log('🎉 Todos los scripts deberían funcionar correctamente');
} else {
  console.log('\n❌ Configuración incompleta');
  console.log('⚠️  Algunos scripts pueden no funcionar correctamente');
}

console.log('\n📝 Archivos de configuración:');
console.log('   - .env (producción)');
console.log('   - .env.local (desarrollo/test)');

console.log('\n💡 Para configurar variables de ambiente:');
console.log('   1. Crea o edita el archivo .env en la raíz del proyecto');
console.log('   2. Agrega las variables faltantes');
console.log('   3. Reinicia el servidor después de los cambios');
