# Scripts de Administración

Esta carpeta contiene scripts importantes para la administración del backoffice de SafeTap.

## 🔧 Configuración

La configuración de ambiente se maneja a través de archivos en `src/environment/`:

- **`src/environment/config.ts`** - Configuración centralizada para variables de ambiente
- **`.env`** - Variables de ambiente para producción
- **`.env.local`** - Variables de ambiente para desarrollo/test (sobrescribe .env)

### Variables de Ambiente Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Base de datos (se maneja automáticamente según el archivo .env cargado)
DATABASE_URL="tu_url_de_base_de_datos"

# NextAuth
NEXTAUTH_SECRET="tu_secret"
GOOGLE_CLIENT_ID="tu_client_id"
GOOGLE_CLIENT_SECRET="tu_client_secret"

# Emails por defecto (opcionales)
SUPER_ADMIN_EMAIL="email@ejemplo.com"
USERS_TO_DELETE="email1@ejemplo.com,email2@ejemplo.com"
```

### Manejo Automático de Entornos

El sistema maneja automáticamente los entornos:

- **Producción**: Usa variables de `.env`
- **Desarrollo/Test**: Usa variables de `.env.local` (sobrescribe `.env`)

No necesitas configurar `PROD_DATABASE_URL` o `TEST_DATABASE_URL` por separado.

## 📋 Scripts Disponibles

### 🔍 Verificación

- **`show-config.js`** - Muestra la configuración actual

```bash
node scripts/show-config.js
```

- **`test-db-connection.js`** - Verifica la conexión a la base de datos

```bash
node scripts/test-db-connection.js
```

### 👑 Administración de Usuarios

- **`invite-super-admin.js`** - Invita un usuario como SUPER_ADMIN

```bash
# Usando argumento de línea de comandos
node scripts/invite-super-admin.js usuario@ejemplo.com

# Usando variable de ambiente SUPER_ADMIN_EMAIL
node scripts/invite-super-admin.js
```

- **`delete-users-production.js`** - Elimina usuarios específicos en producción

```bash
# Usando argumentos de línea de comandos
node scripts/delete-users-production.js usuario1@ejemplo.com usuario2@ejemplo.com

# Usando variable de ambiente USERS_TO_DELETE
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

### 1. Configurar Variables de Ambiente

Crea o edita los archivos de configuración:

```bash
# Para producción - edita .env
nano .env

# Para desarrollo/test - edita .env.local
nano .env.local
```

### 2. Verificar Configuración

```bash
# Mostrar configuración actual
node scripts/show-config.js

# Verificar conexión a base de datos
node scripts/test-db-connection.js
```

### 3. Operaciones de Administración

```bash
# Invitar SUPER_ADMIN
node scripts/invite-super-admin.js usuario@ejemplo.com

# Eliminar usuarios (con confirmación)
node scripts/delete-users-production.js usuario1@ejemplo.com usuario2@ejemplo.com
```

## ⚠️ Importante

- **Siempre verifica** la configuración antes de ejecutar scripts de administración
- **Haz backup** de la base de datos antes de operaciones críticas
- **Usa el entorno correcto** (producción vs test) según la operación
- **Reinicia el servidor** después de cambiar variables de entorno
- **Los scripts de eliminación requieren confirmación** para evitar errores

## 🔒 Seguridad

- Los scripts de producción requieren acceso directo a la base de datos
- Los emails hardcodeados han sido reemplazados por argumentos de línea de comandos
- Los scripts de eliminación incluyen confirmación interactiva
- Las credenciales de base de datos se manejan a través de variables de ambiente
- **Nunca ejecutes scripts de producción en desarrollo** sin verificar el entorno

## 📝 Variables de Ambiente

### Requeridas

- `DATABASE_URL` - URL de la base de datos (se maneja automáticamente según entorno)
- `NEXTAUTH_SECRET` - Secret para NextAuth
- `GOOGLE_CLIENT_ID` - Client ID de Google OAuth
- `GOOGLE_CLIENT_SECRET` - Client Secret de Google OAuth

### Opcionales

- `SUPER_ADMIN_EMAIL` - Email por defecto para invitaciones de SUPER_ADMIN
- `USERS_TO_DELETE` - Lista de emails separados por coma para eliminación

## 🛠️ Configuración de Archivos

- **`src/environment/config.ts`** - Configuración centralizada para todos los scripts
- **`scripts/show-config.js`** - Muestra la configuración actual
- **`scripts/test-db-connection.js`** - Verifica conectividad y estado de la base de datos

## 📝 Notas

- Los scripts están diseñados para ser ejecutados desde la raíz del proyecto
- Todos los scripts incluyen manejo de errores y logging detallado
- Los scripts de test están separados de los de producción para mayor seguridad
- Los scripts de eliminación incluyen confirmación para prevenir errores accidentales
- La configuración se centraliza en `src/environment/config.ts` para evitar duplicación
- Se usa la convención estándar: `.env` para producción, `.env.local` para desarrollo/test
- El sistema maneja automáticamente los entornos sin necesidad de variables separadas
