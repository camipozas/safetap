import * as fs from 'fs';
import * as path from 'path';

import { config } from 'dotenv';

function loadEnvironmentVariables() {
  const projectRoot = path.join(__dirname, '../..');
  const isProduction = process.env.NODE_ENV === 'production';

  let envFile: string;

  if (isProduction) {
    envFile = '.env.production';
  } else {
    const localPath = path.join(projectRoot, '.env.local');
    const devPath = path.join(projectRoot, '.env.development');

    if (fs.existsSync(localPath)) {
      envFile = '.env.local';
    } else if (fs.existsSync(devPath)) {
      envFile = '.env.development';
    } else {
      envFile = '.env';
    }
  }

  const envPath = path.join(projectRoot, envFile);

  if (fs.existsSync(envPath)) {
    config({ path: envPath });
    console.log(`🔧 Loaded environment from: ${envFile}`);
  } else {
    console.warn(`⚠️ Environment file not found: ${envFile}`);
  }
}

loadEnvironmentVariables();

export const environment = {
  database: {
    url: process.env.DATABASE_URL,
  },

  nextauth: {
    url: process.env.NEXTAUTH_URL || 'https://safetap.cl',
  },

  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  email: {
    from: process.env.EMAIL_FROM || 'no-reply@safetap.cl',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
  },

  app: {
    name: 'SafeTap',
    url: process.env.NEXTAUTH_URL || 'https://safetap.cl',
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },

  posthog: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
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

  if (!environment.stripe.secretKey) {
    missingVars.push('STRIPE_SECRET_KEY');
  }

  if (!environment.stripe.publishableKey) {
    missingVars.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  }

  if (!environment.posthog.key) {
    missingVars.push('NEXT_PUBLIC_POSTHOG_KEY');
  }

  if (!environment.posthog.host) {
    missingVars.push('NEXT_PUBLIC_POSTHOG_HOST');
  }

  // New Relic is optional, only validate if license key is provided
  if (environment.newrelic.licenseKey && !environment.newrelic.appName) {
    missingVars.push('NEW_RELIC_APP_NAME');
  }

  if (missingVars.length > 0) {
    console.log('⚠️ Missing environment variables:');
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
    console.log('   STRIPE_SECRET_KEY="your_stripe_secret"');
    console.log(
      '   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable"'
    );
    console.log('   NEXT_PUBLIC_POSTHOG_KEY="your_posthog_key"');
    console.log('   NEXT_PUBLIC_POSTHOG_HOST="https://your_posthog_host"');
    console.log('\n🔍 Optional New Relic monitoring:');
    console.log('   NEW_RELIC_LICENSE_KEY="your_newrelic_license"');
    console.log('   NEW_RELIC_APP_NAME="SafeTap"');
    console.log('   NEW_RELIC_AGENT_ENABLED="true"');
    console.log('   NEW_RELIC_LOG_LEVEL="info"');
    console.log('\n🚨 Please fix these issues before running the application.');

    return false;
  }

  return true;
}

export function getConfig() {
  return {
    databaseUrl: environment.database.url,
    nextauthUrl: environment.nextauth.url,
    auth: environment.auth,
    stripe: environment.stripe,
    email: environment.email,
    app: environment.app,
    posthog: environment.posthog,
    newrelic: environment.newrelic,
  };
}

export function showCurrentConfig() {
  console.log('🔧 Current configuration of SafeTap:');
  console.log('===================================');
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
    `💳 Stripe Secret Key: ${environment.stripe.secretKey ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `💳 Stripe Publishable Key: ${environment.stripe.publishableKey ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `📧 Email SMTP: ${environment.email.smtpHost ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `📧 Email From: ${environment.email.from ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `📊 PostHog Key: ${environment.posthog.key ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `📊 PostHog Host: ${environment.posthog.host ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `📊 New Relic: ${environment.newrelic.licenseKey ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log('===================================');
  console.log(
    '🔍 Use `validateEnvironment()` to check if all required variables are set.'
  );
}
