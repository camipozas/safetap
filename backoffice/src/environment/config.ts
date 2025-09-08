// Next.js automatically loads .env, .env.local, etc. from the project root

export const environment = {
  database: {
    url: process.env.DATABASE_URL,
  },

  nextauth: {
    url:
      process.env.NEXTAUTH_BACKOFFICE_URL ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3001',
  },

  emails: {
    superAdmin: process.env.SUPER_ADMIN_EMAIL,
    usersToDelete: process.env.USERS_TO_DELETE
      ? process.env.USERS_TO_DELETE.split(',')
      : [],
  },

  roles: {
    USER: 'USER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
  } as const,

  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  email: {
    from: process.env.EMAIL_FROM || 'no-reply@safetap.cl',
    smtpHost: process.env.EMAIL_SERVER_HOST,
    smtpPort: process.env.EMAIL_SERVER_PORT,
    smtpUser: process.env.EMAIL_SERVER_USER,
    smtpPass: process.env.EMAIL_SERVER_PASSWORD,
  },

  app: {
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },

  newrelic: {
    appName: process.env.NEW_RELIC_APP_NAME,
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    agentEnabled: process.env.NEW_RELIC_AGENT_ENABLED !== 'false',
    logLevel: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },
};

export function validateEnvironment() {
  const missingVars = [];

  if (!environment.database.url) {
    missingVars.push('DATABASE_URL');
  }

  if (!environment.auth.secret) {
    missingVars.push('NEXTAUTH_SECRET');
  }

  if (!environment.auth.googleClientId) {
    missingVars.push('GOOGLE_CLIENT_ID');
  }

  if (!environment.auth.googleClientSecret) {
    missingVars.push('GOOGLE_CLIENT_SECRET');
  }

  // New Relic is optional, only validate if license key is provided
  if (environment.newrelic.licenseKey && !environment.newrelic.appName) {
    missingVars.push('NEW_RELIC_APP_NAME');
  }

  if (missingVars.length > 0) {
    console.log('⚠️  Missing environment variables:');
    missingVars.forEach((varName) => console.log(`   - ${varName}`));
    console.log('\n💡 To configure these variables:');
    console.log('   1. Create a .env file in the root of the project');
    console.log('   2. Add the missing variables');
    console.log('   3. Or configure them in your operating system');
    console.log('\n📝 Example of .env:');
    console.log('   DATABASE_URL="your_database_url"');
    console.log('   NEXTAUTH_SECRET="your_secret"');
    console.log('   GOOGLE_CLIENT_ID="your_client_id"');
    console.log('   GOOGLE_CLIENT_SECRET="your_client_secret"');
    console.log('   SUPER_ADMIN_EMAIL="email@example.com"');
    console.log('   USERS_TO_DELETE="email1@example.com,email2@example.com"');
    console.log('\n🔍 Optional New Relic monitoring:');
    console.log('   NEW_RELIC_LICENSE_KEY="your_newrelic_license"');
    console.log('   NEW_RELIC_APP_NAME="safetap-backoffice"');
    console.log('   NEW_RELIC_AGENT_ENABLED="true"');
    console.log('   NEW_RELIC_LOG_LEVEL="info"');

    return false;
  }

  return true;
}

export function getConfig() {
  return {
    databaseUrl: environment.database.url,
    nextauthUrl: environment.nextauth.url,
    roles: environment.roles,
    emails: environment.emails,
    auth: environment.auth,
    email: environment.email,
    app: environment.app,
    newrelic: environment.newrelic,
  };
}

export function showCurrentConfig() {
  console.log('🔧 Current configuration of Backoffice:');
  console.log('=====================================');
  console.log(
    `📊 Database: ${environment.database.url ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `🌐 Environment: ${environment.app.environment} (${environment.app.isProduction ? 'Production' : environment.app.isDevelopment ? 'Development' : 'Other'})`
  );
  console.log(
    `🔐 NextAuth Secret: ${environment.auth.secret ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `🔑 Google Client ID: ${environment.auth.googleClientId ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `🔑 Google Client Secret: ${environment.auth.googleClientSecret ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `📧 Super Admin Email: ${environment.emails.superAdmin || '❌ Not configured'}`
  );
  console.log(
    `🗑️  Users to Delete: ${environment.emails.usersToDelete.length > 0 ? environment.emails.usersToDelete.join(', ') : '❌ Not configured'}`
  );
  console.log(
    `📧 Email SMTP: ${environment.email.smtpHost ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `📊 New Relic: ${environment.newrelic.licenseKey ? '✅ Configured' : '❌ Not configured'}`
  );
}
