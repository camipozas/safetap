#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Create Local Database Script
 *
 * This script creates and manages a local PostgreSQL database using Docker.
 * It's idempotent and can be run multiple times safely.
 *
 * Usage:
 *   node scripts/create-local-db.js
 *
 * Environment variables (optional):
 *   CONTAINER_NAME=my-postgres     # Default: pg-local
 *   DB_NAME=mydb                   # Default: safetap_dev
 *   DB_USER=myuser                 # Default: postgres
 *   DB_PASS=mypass                 # Default: password
 *   DB_PORT=5433                   # Default: 5432
 *   POSTGRES_IMAGE=postgres:14     # Default: postgres:15
 *   TIMEOUT_SECONDS=60             # Default: 30
 *
 * Example with custom settings:
 *   DB_NAME=bancame DB_PASS=secret node scripts/create-local-db.js
 *
 * After running this script, you can run migrations:
 *   npx prisma migrate deploy
 *   npx prisma db seed (if you have seeds configured)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration with defaults
const config = {
  containerName: process.env.CONTAINER_NAME || 'pg-local',
  dbName: process.env.DB_NAME || 'safetap_dev',
  dbUser: process.env.DB_USER || 'postgres',
  dbPass: process.env.DB_PASS || 'password',
  dbPort: process.env.DB_PORT || '5432',
  postgresImage: process.env.POSTGRES_IMAGE || 'postgres:15',
  timeoutSeconds: parseInt(process.env.TIMEOUT_SECONDS || '30'),
  volumeName: 'pgdata_local',
};

// Utility functions
function log(message) {
  console.log(`🐘 ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output: result };
  } catch (err) {
    return { success: false, error: err.message, output: err.stdout };
  }
}

function containerExists() {
  const result = execCommand(
    `docker ps -a --filter name=${config.containerName} --format "{{.Names}}"`,
    { silent: true }
  );
  return result.success && result.output.trim() === config.containerName;
}

function containerIsRunning() {
  const result = execCommand(
    `docker ps --filter name=${config.containerName} --format "{{.Names}}"`,
    { silent: true }
  );
  return result.success && result.output.trim() === config.containerName;
}

function createContainer() {
  log(`Creating PostgreSQL container: ${config.containerName}`);
  const command = `docker run -d \\
    --name ${config.containerName} \\
    -e POSTGRES_USER=${config.dbUser} \\
    -e POSTGRES_PASSWORD=${config.dbPass} \\
    -e POSTGRES_DB=postgres \\
    -p ${config.dbPort}:5432 \\
    -v ${config.volumeName}:/var/lib/postgresql/data \\
    ${config.postgresImage}`;

  const result = execCommand(command);
  if (!result.success) {
    error(`Failed to create container: ${result.error}`);
    process.exit(1);
  }
  success(`Container ${config.containerName} created successfully`);
}

function startContainer() {
  log(`Starting container: ${config.containerName}`);
  const result = execCommand(`docker start ${config.containerName}`);
  if (!result.success) {
    error(`Failed to start container: ${result.error}`);
    process.exit(1);
  }
  success(`Container ${config.containerName} started successfully`);
}

function waitForPostgres() {
  log(
    `Waiting for PostgreSQL to be ready (timeout: ${config.timeoutSeconds}s)...`
  );

  const startTime = Date.now();
  const timeoutMs = config.timeoutSeconds * 1000;

  while (Date.now() - startTime < timeoutMs) {
    const result = execCommand(
      `docker exec ${config.containerName} pg_isready -U ${config.dbUser}`,
      { silent: true }
    );

    if (result.success) {
      success('PostgreSQL is ready!');
      return;
    }

    process.stdout.write('.');
    // Sleep for 1 second
    execSync('sleep 1', { stdio: 'ignore' });
  }

  console.log('');
  error(
    `PostgreSQL did not become ready within ${config.timeoutSeconds} seconds`
  );
  process.exit(1);
}

function createDatabase() {
  log(`Creating database: ${config.dbName}`);

  // Check if database exists
  const checkDb = execCommand(
    `docker exec ${config.containerName} psql -U ${config.dbUser} -lqt | cut -d \\| -f 1 | grep -qw ${config.dbName}`,
    { silent: true }
  );

  if (checkDb.success) {
    success(`Database ${config.dbName} already exists`);
    return;
  }

  // Create database
  const result = execCommand(
    `docker exec ${config.containerName} psql -U ${config.dbUser} -c "CREATE DATABASE ${config.dbName};"`
  );

  if (!result.success) {
    error(`Failed to create database: ${result.error}`);
    process.exit(1);
  }

  success(`Database ${config.dbName} created successfully`);
}

function getDatabaseUrl() {
  return `postgresql://${config.dbUser}:${config.dbPass}@localhost:${config.dbPort}/${config.dbName}?schema=public`;
}

function updateEnvFile(filePath) {
  const databaseUrl = getDatabaseUrl();

  if (!fs.existsSync(filePath)) {
    log(`Creating ${filePath}`);
    fs.writeFileSync(filePath, `DATABASE_URL="${databaseUrl}"\\n`);
    return;
  }

  log(`Updating ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\\n');

  let updated = false;
  const newLines = lines.map((line) => {
    if (line.startsWith('DATABASE_URL=')) {
      updated = true;
      return `DATABASE_URL="${databaseUrl}"`;
    }
    return line;
  });

  if (!updated) {
    newLines.push(`DATABASE_URL="${databaseUrl}"`);
  }

  fs.writeFileSync(filePath, newLines.join('\\n'));
}

function updateEnvFiles() {
  const rootDir = path.join(__dirname, '..');
  const envFiles = ['.env', '.env.local'];

  for (const envFile of envFiles) {
    const filePath = path.join(rootDir, envFile);
    try {
      updateEnvFile(filePath);
      success(`Updated ${envFile}`);
    } catch (err) {
      error(`Failed to update ${envFile}: ${err.message}`);
    }
  }
}

// Main execution
function main() {
  log('Starting local PostgreSQL database setup...');
  log(`Configuration:
  - Container: ${config.containerName}
  - Image: ${config.postgresImage}
  - Database: ${config.dbName}
  - User: ${config.dbUser}
  - Port: ${config.dbPort}
  - Volume: ${config.volumeName}`);

  // Check if Docker is available
  const dockerCheck = execCommand('docker --version', { silent: true });
  if (!dockerCheck.success) {
    error('Docker is not available. Please install Docker first.');
    process.exit(1);
  }

  // Handle container creation/starting
  if (containerExists()) {
    if (containerIsRunning()) {
      success(`Container ${config.containerName} is already running`);
    } else {
      startContainer();
    }
  } else {
    createContainer();
  }

  // Wait for PostgreSQL to be ready
  waitForPostgres();

  // Create database
  createDatabase();

  // Update environment files
  updateEnvFiles();

  const databaseUrl = getDatabaseUrl();
  success('Local PostgreSQL setup completed!');
  log(`Database URL: ${databaseUrl}`);
  log('');
  log('Next steps:');
  log('1. Run migrations: npx prisma migrate deploy');
  log('2. Generate Prisma client: npx prisma generate');
  log('3. (Optional) Seed database: npx prisma db seed');
  log('');
  log('To connect directly to the database:');
  log(
    `docker exec -it ${config.containerName} psql -U ${config.dbUser} -d ${config.dbName}`
  );
}

// Run the script
if (require.main === module) {
  main();
}
