# safetap

Guía rápida (MVP Fase 1) con validaciones Zod y accesibilidad.

## Requisitos

- Node 18+ (recomendado 20+)
- Cuenta de correo para NextAuth (SMTP)
- Base de datos Postgres (Prisma Accelerate opcional)

## Instalación

1. Instalar dependencias

```bash
npm install
```

2. Opcional: actualizar Prisma y Accelerate según tu entorno

```bash
npm i prisma @prisma/client@latest @prisma/extension-accelerate@latest
```

3. Configurar variables de entorno (`.env`)

Ejemplo básico local:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="changeme"
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="Safetap <no-reply@safetap.app>"
PUBLIC_BASE_URL="http://localhost:3000"
```

Uso con Prisma Accelerate (sustituye con tu api_key real):

```bash
# Usa prisma+postgres y tu api_key de Accelerate
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
```

Nota: nunca publiques tu api_key real en repos públicos.

## Desarrollo

- Generar cliente Prisma y construir:

```bash
npm run build
```

- Servir en desarrollo:

```bash
npm run dev
```

- Pruebas unitarias (Vitest):

```bash
npm test
```

## Migraciones

Si trabajas contra Postgres tradicional usa:

```bash
npx prisma migrate dev --name init
```

Con Accelerate (shadow DB no disponible): usa migraciones generadas en local contra una base Postgres y luego despliega el esquema al origen principal según tu flujo (p. ej., Prisma Migrate en CI apuntando a una DB administrada).

## Stack

- Next.js 14 (App Router) + TypeScript
- NextAuth (Email Magic Link)
- Prisma ORM (PostgreSQL) + Accelerate opcional
- TailwindCSS
- Zod + React Hook Form
- Testing Library + Vitest + Playwright

## Scripts

- dev: arranca servidor
- build: prisma generate + next build
- start: next start
- test / test:ui: vitest
- e2e: playwright test
