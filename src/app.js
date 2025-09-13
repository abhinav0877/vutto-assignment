/**
 * Main Express application setup
 * 
 * Configures middleware, routes, error handling, and starts the server.
 * Implements production-ready practices with proper security headers,
 * logging, and monitoring.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./utils/logger');


// Import routes
const featureFlagsRouter = require('./routes/featureFlags');

class Application {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configure Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for API
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Request logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware for tracing
    this.app.use((req, res, next) => {
      req.requestId = require('uuid').v4();
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });

  }

  /**
   * Configure API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/v1/feature-flags', featureFlagsRouter);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Feature Toggle Platform',
        version: '1.0.0',
        description: 'A production-ready microservice for feature flag management',
        endpoints: {
          health: '/health',
          api: '/api/v1/feature-flags',
        },
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    });
  }

  /**
   * Configure error handling middleware
   */
  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        path: req.path,
        method: req.method
      });

      // Don't leak error details in production
      const isDevelopment = config.server.environment === 'development';
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: req.requestId
      });
    });
  }

  /**
   * Start the server
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(config.server.port, config.server.host, () => {
          logger.info('Server started', {
            port: config.server.port,
            host: config.server.host,
            environment: config.server.environment,
          });
          resolve();
        });

        this.server.on('error', (error) => {
          logger.error('Server error', { error: error.message });
          reject(error);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());

      } catch (error) {
        logger.error('Failed to start server', { error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down server...');
    
    if (this.server) {
      this.server.close(() => {
        logger.info('Server shut down successfully');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }

  /**
   * Get Express app instance (for testing)
   */
  getApp() {
    return this.app;
  }
}

module.exports = Application;
