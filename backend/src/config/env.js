const dotenv = require('dotenv');
const path = require('path');
const logger = require('../utils/logger');

// Resolve execution mode
const nodeEnv = process.env.NODE_ENV || 'development';

// Intelligently select and load the proper env file
const envPath = path.join(__dirname, `../../.env.${nodeEnv}`);
const defaultEnvPath = path.join(__dirname, '../../.env');

// First load environment-specific variables
const resultEnv = dotenv.config({ path: envPath });
if (resultEnv.error) {
  logger.warn(`[Configuration] Environment-specific file not loaded from ${envPath}: ${resultEnv.error.message}`);
} else {
  logger.info(`[Configuration] Loaded environment-specific variables from ${envPath}`);
}

// Then load the fallback/default standard .env variables
const resultDefault = dotenv.config({ path: defaultEnvPath });
if (resultDefault.error) {
  logger.warn(`[Configuration] Default standard .env file not loaded from ${defaultEnvPath}: ${resultDefault.error.message}`);
} else {
  logger.info(`[Configuration] Loaded default standard variables from ${defaultEnvPath}`);
}

// Define critical environment variables required for server startup
const requiredEnv = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SESSION_SECRET'
];

const missingEnv = requiredEnv.filter(envVar => {
  const val = process.env[envVar];
  return !val || val.trim() === '';
});

if (missingEnv.length > 0) {
  const errorMsg = `\n❌ [STARTUP FAILURE] Missing critical environment variables: \n   ${missingEnv.join(', ')}\n\nPlease check your .env file or environment settings to ensure these are set.\n`;
  logger.error(errorMsg);
  console.error(errorMsg);
  process.exit(1);
}

const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  sessionSecret: process.env.SESSION_SECRET,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL || 'debug',
  
  // Future notification system credentials (SMTP)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT, 10) || 2525,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@smartuzhavan.com'
  }
};

logger.info(`[Configuration] Loaded environment settings for: ${config.nodeEnv.toUpperCase()}`);

module.exports = config;
