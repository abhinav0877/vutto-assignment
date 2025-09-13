/**
 * Configuration management for the Feature Toggle Platform
 * 
 * Centralizes all configuration settings with environment variable support
 * and sensible defaults for development and production environments.
 */

require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },


  // Feature flag configuration
  featureFlags: {
    maxRulesPerFlag: parseInt(process.env.MAX_RULES_PER_FLAG, 10) || 10,
    evaluationTimeout: parseInt(process.env.EVALUATION_TIMEOUT, 10) || 1000
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true' || false
  }
};

/**
 * Validate configuration
 */
function validateConfig() {
  const errors = [];

  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Invalid port number');
  }

  if (!['development', 'production', 'test'].includes(config.server.environment)) {
    errors.push('Invalid environment');
  }

  if (config.featureFlags.maxRulesPerFlag < 1) {
    errors.push('maxRulesPerFlag must be at least 1');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
}

// Validate configuration on load
validateConfig();

module.exports = config;
