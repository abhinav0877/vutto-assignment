/**
 * Validation middleware for Express routes
 */

const logger = require('../utils/logger');

/**
 * Create validation middleware for request body
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} - Express middleware function
 */
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      logger.warn('Request body validation failed', {
        path: req.path,
        method: req.method,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request body validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    req.body = value;
    next();
  };
}

/**
 * Create validation middleware for query parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} - Express middleware function
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      logger.warn('Query parameter validation failed', {
        path: req.path,
        method: req.method,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Query parameter validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    req.query = value;
    next();
  };
}

/**
 * Create validation middleware for URL parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} - Express middleware function
 */
function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    console.log({val: schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    })})

    if (error) {
      logger.warn('URL parameter validation failed', {
        path: req.path,
        method: req.method,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'URL parameter validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    req.params = value;
    next();
  };
}

module.exports = {
  validateBody,
  validateQuery,
  validateParams
};
