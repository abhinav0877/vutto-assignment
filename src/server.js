/**
 * Server entry point
 * 
 * Initializes and starts the Feature Toggle Platform server
 * with proper error handling and graceful shutdown.
 */

const Application = require('./app');
const logger = require('./utils/logger');

async function startServer() {
  try {
    logger.info('Starting Feature Toggle Platform...');
    
    const app = new Application();
    await app.start();
    
    logger.info('Feature Toggle Platform started successfully');
    
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    promise: promise
  });
  process.exit(1);
});

// Start the server
startServer();
