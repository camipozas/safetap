# SafeTap Admin Dashboard 🚀

Panel de administración (backoffice) para SafeTap, construido como una aplicación Next.js independiente.

Este proyecto es privado y confidencial.

## 📄 Licencia

5. Abre un Pull Request
6. Push a la rama (`git push origin feature/AmazingFeature`)
7. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
8. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
9. Fork el proyecto

## 🤝 Contribución

- `npm run test` - Tests unitarios
- `npm run type-check` - Verificación de tipos
- `npm run lint` - Linting
- `npm run start` - Servidor de producción
- `npm run build` - Build de producción
- `npm run dev` - Desarrollo (puerto 3001)

## 📝 Scripts Disponibles

````md
npx prisma db pull

# Verificar conexión a base de datos

DEBUG=\* npm run dev

# Ejecutar con logs detallados

```bash
Para debug en desarrollo:

## 🐛 Debugging

  - Uso por país
  - Accesos a perfiles de emergencia
  - Stickers activos vs inactivos
- **Stickers**:

  - Engagement metrics
  - Distribución geográfica
  - Usuarios activos
  - Registros por período
- **Usuarios**:

  - Conversión de pagos
  - Revenue por período
  - Estado de órdenes (pending, paid, shipped, etc.)
  - Total de órdenes por período
- **Órdenes**:

## 📊 Analytics Disponibles

- Protección CSRF incluida
- Sesiones seguras con JWT/database sessions
- Autenticación manejada por NextAuth.js
- Solo usuarios con rol `ADMIN` pueden acceder

## 🔐 Autenticación y Seguridad
```
````

````

└── tsconfig.json # Configuración de TypeScript
├── tailwind.config.js # Configuración de Tailwind
├── next.config.js # Configuración de Next.js
├── .env.example # Ejemplo de variables de entorno
├── public/ # Archivos estáticos
├── prisma/ # Schema de Prisma (link simbólico)
│ └── types/ # Tipos de TypeScript
│ │ └── utils.ts # Funciones utilitarias
│ │ ├── prisma.ts # Cliente de Prisma
│ │ ├── auth.ts # Configuración de NextAuth
│ ├── lib/ # Utilidades y configuración
│ │ └── ui/ # Componentes base de UI
│ │ ├── tables/ # Tablas de datos
│ │ ├── charts/ # Componentes de gráficos
│ ├── components/ # Componentes reutilizables
│ │ └── layout.tsx # Layout principal
│ │ ├── auth/ # Páginas de autenticación
│ │ ├── api/ # API routes
│ │ │ └── reports/ # Reportes
│ │ │ ├── users/ # Gestión de usuarios
│ │ │ ├── orders/ # Gestión de órdenes
│ │ │ ├── analytics/ # Página de analytics
│ │ ├── (dashboard)/ # Grupo de rutas del dashboard
│ ├── app/ # App Router de Next.js
├── src/
admin-dashboard/

```md
## 📁 Estructura del Proyecto

4. Configura el dominio como prefieras
5. Conecta el nuevo repo a Vercel
6. Copia el contenido de `admin-dashboard/` al nuevo repo
7. Crea un nuevo repositorio solo para el admin dashboard

Si prefieres un proyecto completamente independiente:

- Root Directory: `admin-dashboard`
- Install Command: `npm install`
- Output Directory: `.next`
- Build Command: `npm run build`

4. **Build Settings**:
````

GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_CLIENT_ID=tu-client-id
NEXTAUTH_SECRET=tu-production-secret
NEXTAUTH_URL=https://admin.tusitio.com
DATABASE_URL=tu-database-url

````env
3. **Variables de Entorno**:

- Configura DNS con un CNAME pointing a `cname.vercel-dns.com`
- Agrega tu subdominio: `admin.tusitio.com`
- En Project Settings > Domains
2. **Configura el dominio**:

- **Importante**: Configura el Root Directory como `admin-dashboard`
- Conecta tu repositorio
- Ve a [vercel.com](https://vercel.com)
1. **Crea un nuevo proyecto en Vercel**:


## 🚢 Deployment en Vercel

### Opción 1: Deployment via UI (Recomendado)

1. **Prepara el repositorio**:
   ```bash
   # Si no tienes un repo separado, crea uno
   git init
   git add .
   git commit -m "Initial backoffice commit"
   git remote add origin https://github.com/tu-usuario/safetap-admin.git
   git push -u origin main
````

2. **Crea proyecto en Vercel**:
   - Ve a [vercel.com](https://vercel.com) y haz login
   - Click en "New Project"
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio del backoffice

3. **Configura el proyecto**:
   - **Root Directory**: Déjalo en blanco si es repo separado, o `backoffice` si es monorepo
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. **Variables de Entorno**:

   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_URL="https://admin.tusitio.com"
   NEXTAUTH_SECRET="tu-production-secret-diferente"
   GOOGLE_CLIENT_ID="tu-client-id"
   GOOGLE_CLIENT_SECRET="tu-client-secret"
   SMTP_SERVER="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="tu-email@gmail.com"
   SMTP_PASS="tu-app-password"
   ```

5. **Configura el dominio**:
   - En Project Settings > Domains
   - Agrega tu subdominio: `admin.tusitio.com`
   - Configura DNS con un CNAME pointing a `cname.vercel-dns.com`

6. **Deploy**:
   - Click "Deploy"
   - Espera a que termine el build

### Opción 2: Deployment via CLI

1. **Instala Vercel CLI**:

   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Configura el proyecto**:

   ```bash
   cd backoffice
   vercel
   # Sigue las instrucciones del wizard
   ```

3. **Configuración del `vercel.json`**:

   ```json
   {
     "framework": "nextjs",
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install",
     "functions": {
       "src/app/api/**": {
         "maxDuration": 30
       }
     },
     "env": {
       "DATABASE_URL": "@database-url",
       "NEXTAUTH_URL": "@nextauth-url",
       "NEXTAUTH_SECRET": "@nextauth-secret"
     }
   }
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Configuración Post-Deployment

1. **Crear Super Admin**:

   ```bash
   # En tu máquina local, conectado a la DB de producción
   node make-admin.js tu-email@example.com SUPER_ADMIN
   ```

2. **Verificar configuración**:
   - Accede a `https://admin.tusitio.com`
   - Prueba el login con Google
   - Verifica que los dashboards cargan correctamente

### Troubleshooting

**Error de autenticación**:

- Verifica que `NEXTAUTH_URL` sea correcto
- Asegúrate que Google OAuth tiene la URL correcta en "Authorized redirect URIs"

**Error de base de datos**:

- Confirma que `DATABASE_URL` sea accesible desde Vercel
- Considera usar Prisma Accelerate para mejor performance

**Error de build**:

- Revisa los logs en Vercel Dashboard
- Asegúrate que todas las dependencias estén en `package.json`

### Monitoreo y Mantenimiento

1. **Logs**: Accesibles en Vercel Dashboard > Functions
2. **Analytics**: Habilitados automáticamente
3. **Alerts**: Configura notificaciones en Project Settings
4. **Database**: Monitorea conexiones y performance

````

npm run dev

```bash
5. Ejecuta en modo desarrollo:

````

npm run postinstall

```bash
4. Genera el cliente de Prisma:

```

GOOGLE_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."

# Auth providers (si usas Google, GitHub, etc.)

NEXTAUTH_SECRET="tu-secret-aqui"
NEXTAUTH_URL="http://localhost:3001"

# NextAuth

DATABASE_URL="postgresql://..."

# Base de datos (misma que la app principal)

```env
3. Edita `.env.local` con tus valores:

```

cp .env.example .env.local

```bash
2. Configura las variables de entorno:

```

npm install

```bash
1. Instala las dependencias:

## 🔧 Instalación

- Acceso a la base de datos PostgreSQL de SafeTap
- npm >= 10.0.0
- Node.js >= 20.0.0

## 📋 Requisitos Previos

- **TypeScript**: Para type safety
- **Charts**: Recharts & Chart.js
- **UI**: Tailwind CSS + Lucide Icons
- **Autenticación**: NextAuth.js
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Framework**: Next.js 14 (App Router)

## 🛠️ Tecnologías

- **Reportes**: Exportación de datos y reportes personalizados
- **Dashboard**: Vista general con KPIs y gráficos
- **Gestión de Usuarios**: Administra usuarios y sus perfiles
- **Analytics**: Métricas de engagement de usuarios y ventas
- **Gestión de Órdenes**: Visualiza y gestiona todos los pedidos de stickers

## 🚀 Características

Este es el panel de administración (backoffice) para SafeTap, construido como una aplicación Next.js independiente.
 SafeTap Admin Dashboard
```
