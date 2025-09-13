/**
 * Feature Flag Controller
 * 
 * Handles HTTP requests for feature flag management operations.
 * Implements clean separation of concerns with proper error handling
 * and response formatting.
 */

const { FeatureFlag, TenantRule, UserRule, PercentageRule } = require('../models');
const FeatureFlagRepository = require('../repositories/FeatureFlagRepository');
const FeatureEvaluationEngine = require('../services/FeatureEvaluationEngine');
const { EvaluationContext } = require('../models');
const logger = require('../utils/logger');

class FeatureFlagController {
  constructor() {
    this.repository = new FeatureFlagRepository();
    this.evaluationEngine = new FeatureEvaluationEngine();
    this.logger = logger.child({ component: 'FeatureFlagController' });
  }

  /**
   * Create a new feature flag
   */
  async createFeatureFlag(req, res) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Creating feature flag', { 
        name: req.body.name,
        enabled: req.body.enabled 
      });

      const featureFlag = new FeatureFlag(req.body);
      const createdFlag = await this.repository.create(featureFlag);

      const response = {
        success: true,
        data: createdFlag.toJSON(),
        timestamp: new Date().toISOString()
      };
      
      res.status(201).json(response);

    } catch (error) {
      this.logger.error('Failed to create feature flag', {
        error: error.message,
        body: req.body
      });

      res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }

  /**
   * Get a feature flag by ID
   */
  async getFeatureFlag(req, res) {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      
      this.logger.debug('Getting feature flag', { id });

      const featureFlag = await this.repository.findById(id);
      

      const response = {
        success: true,
        data: featureFlag.toJSON(),
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      this.logger.error('Failed to get feature flag', {
        error: error.message,
        id: req.params.id
      });

      

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }

  /**
   * Update a feature flag
   */
  async updateFeatureFlag(req, res) {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      
      this.logger.info('Updating feature flag', { 
        id,
        updates: req.body 
      });

      const updatedFlag = await this.repository.update(id, req.body);
      
      if (!updatedFlag) {
        
        return res.status(404).json({
          error: 'Not Found',
          message: `Feature flag with ID ${id} not found`,
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      const response = {
        success: true,
        data: updatedFlag.toJSON(),
        timestamp: new Date().toISOString()
      };

      
      res.json(response);

    } catch (error) {
      this.logger.error('Failed to update feature flag', {
        error: error.message,
        id: req.params.id,
        body: req.body
      });

      const statusCode = error.message.includes('already exists') ? 409 : 500;
      

      res.status(statusCode).json({
        error: statusCode === 409 ? 'Conflict' : 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }

  /**
   * Delete a feature flag
   */
  async deleteFeatureFlag(req, res) {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      
      this.logger.info('Deleting feature flag', { id });

      const deleted = await this.repository.delete(id);
      
      if (!deleted) {
        
        return res.status(404).json({
          error: 'Not Found',
          message: `Feature flag with ID ${id} not found`,
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      const response = {
        success: true,
        message: 'Feature flag deleted successfully',
        timestamp: new Date().toISOString()
      };

      
      res.json(response);

    } catch (error) {
      this.logger.error('Failed to delete feature flag', {
        error: error.message,
        id: req.params.id
      });

      

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }

  /**
   * List all feature flags with pagination
   */
  async listFeatureFlags(req, res) {
    const startTime = Date.now();
    
    try {
      const { limit, offset, search } = req.query;
      
      this.logger.debug('Listing feature flags', { 
        limit, 
        offset, 
        search 
      });

      const [flags, total] = await Promise.all([
        this.repository.list(req.query),
        this.repository.count(req.query)
      ]);

      const response = {
        success: true,
        data: flags.map(flag => flag.toJSON()),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        timestamp: new Date().toISOString()
      };

      
      res.json(response);

    } catch (error) {
      this.logger.error('Failed to list feature flags', {
        error: error.message,
        query: req.query
      });

      

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  }

  /**
   * Evaluate a feature flag for a user context
   */

async evaluateFeatureFlag(req, res) {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const { userId, tenantId, additionalData = {} } = req.body;
    
    this.logger.debug('Evaluating feature flag', { 
      id, 
      userId, 
      tenantId 
    });

    const featureFlag = await this.repository.findById(id);
    
    if (!featureFlag) {
      
      return res.status(404).json({
        error: 'Not Found',
        message: `Feature flag with ID ${id} not found`,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const context = new EvaluationContext({
      userId,
      tenantId,
      additionalData
    });

    const result = this.evaluationEngine.evaluate(featureFlag, context);



    // Simple, clean response
    const response = {
      success: true,
      name: featureFlag.name,
      matchedRule: result.matchedRule?.toJSON(),
      enabled: result.enabled
      
    };

    
    res.json(response);

  } catch (error) {
    this.logger.error('Failed to evaluate feature flag', {
      error: error.message,
      id: req.params.id,
      body: req.body
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
}
}

module.exports = FeatureFlagController;
