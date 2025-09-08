'use strict';

// Only load New Relic in production and development environments
const nodeEnv = process.env.NODE_ENV;
const shouldLoadNewRelic =
  nodeEnv === 'production' || nodeEnv === 'development';

if (!shouldLoadNewRelic) {
  console.log(`🔍 New Relic disabled for environment: ${nodeEnv || 'unknown'}`);
  // Export empty config to prevent New Relic from loading but allow app to continue
  exports.config = {
    agent_enabled: false,
  };
} else {
  // Load environment variables if not already loaded
  if (!process.env.NODE_ENV) {
    require('dotenv').config();
  }

  // Configuration with proper defaults and validation
  const config = {
    app_name: [process.env.NEW_RELIC_APP_NAME || 'safetap'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY,
    agent_enabled: process.env.NEW_RELIC_AGENT_ENABLED !== 'false',
    logging: {
      level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    },
    transaction_tracer: {
      enabled: true,
    },
    distributed_tracing: {
      enabled: true,
    },
    application_logging: {
      enabled: true,
      forwarding: {
        enabled: true,
      },
      metrics: {
        enabled: true,
      },
    },
    error_collector: {
      enabled: true,
      capture_events: true,
    },
  };

  // Only enable New Relic if license key is provided
  if (!config.license_key) {
    console.warn(
      '⚠️  New Relic license key not found. New Relic monitoring will be disabled.'
    );
    config.agent_enabled = false;
  }

  exports.config = config;
}
