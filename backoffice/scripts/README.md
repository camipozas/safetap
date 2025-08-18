# Scripts de Administración

Esta carpeta contiene scripts importantes para la administración del backoffice de SafeTap.

## 📋 Scripts Disponibles

### 🔧 Configuración

- **`setup-env.js`** - Configura variables de entorno para diferentes entornos
  ```bash
  node scripts/setup-env.js production  # Configura .env para producción
  node scripts/setup-env.js test        # Configura .env.local para test
  ```

### 🔍 Verificación

- **`test-db-connection.js`** - Verifica la conexión a la base de datos
  ```bash
  node scripts/test-db-connection.js
  ```

### 👑 Administración de Usuarios

- **`invite-super-admin.js`** - Invita un usuario como SUPER_ADMIN

  ```bash
  node scripts/invite-super-admin.js
  ```

- **`delete-users-production.js`** - Elimina usuarios específicos en producción
  ```bash
  node scripts/delete-users-production.js
  ```

### 🧪 Testing

- **`test-delete-simple.js`** - Prueba la eliminación de usuarios (sin autenticación)

  ```bash
  node scripts/test-delete-simple.js
  ```

- **`test-reinvitation-simple.js`** - Prueba la re-invitación después de eliminación
  ```bash
  node scripts/test-reinvitation-simple.js
  ```

## 🚀 Flujo de Trabajo Típico

### 1. Configurar Entorno

```bash
# Para producción
node scripts/setup-env.js production
npx prisma generate

# Para desarrollo/test
node scripts/setup-env.js test
npx prisma generate
```

### 2. Verificar Conexión

```bash
node scripts/test-db-connection.js
```

### 3. Operaciones de Administración

```bash
# Invitar SUPER_ADMIN
node scripts/invite-super-admin.js

# Eliminar usuarios
node scripts/delete-users-production.js
```

## ⚠️ Importante

- **Siempre verifica** la conexión antes de ejecutar scripts de administración
- **Haz backup** de la base de datos antes de operaciones críticas
- **Usa el entorno correcto** (producción vs test) según la operación
- **Reinicia el servidor** después de cambiar variables de entorno

## 🔒 Seguridad

- Los scripts de producción requieren acceso directo a la base de datos
- Algunos scripts omiten autenticación para facilitar el testing
- **Nunca ejecutes scripts de producción en desarrollo** sin verificar el entorno

## 📝 Notas

- Los scripts están diseñados para ser ejecutados desde la raíz del proyecto
- Todos los scripts incluyen manejo de errores y logging detallado
- Los scripts de test están separados de los de producción para mayor seguridad
