/**
 * Express routes for Feature Flag API
 * 
 * Defines all REST API endpoints with proper validation,
 * error handling, and documentation.
 */

const express = require('express');
const {
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  evaluationContextSchema,
  listQuerySchema,
  idSchema
} = require('../validation/schemas');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const FeatureFlagController = require('../controllers/FeatureFlagController');

const router = express.Router();
const controller = new FeatureFlagController();

/**
 * @route POST /api/v1/feature-flags
 * @desc Create a new feature flag
 * @access Public
 */
router.post(
  '/',
  validateBody(createFeatureFlagSchema),
  controller.createFeatureFlag.bind(controller)
);

/**
 * @route GET /api/v1/feature-flags
 * @desc List all feature flags with pagination
 * @access Public
 */
router.get(
  '/',
  validateQuery(listQuerySchema),
  controller.listFeatureFlags.bind(controller)
);

/**
 * @route GET /api/v1/feature-flags/:id
 * @desc Get a specific feature flag by ID
 * @access Public
 */
router.get(
  '/:id',
  validateParams(idSchema),
  controller.getFeatureFlag.bind(controller)
);

/**
 * @route PUT /api/v1/feature-flags/:id
 * @desc Update a specific feature flag
 * @access Public
 */
router.put(
  '/:id',
  validateParams(idSchema),
  validateBody(updateFeatureFlagSchema),
  controller.updateFeatureFlag.bind(controller)
);

/**
 * @route DELETE /api/v1/feature-flags/:id
 * @desc Delete a specific feature flag
 * @access Public
 */
router.delete(
  '/:id',
  validateParams(idSchema),
  controller.deleteFeatureFlag.bind(controller)
);

/**
 * @route POST /api/v1/feature-flags/:id/evaluate
 * @desc Evaluate a feature flag for a user context
 * @access Public
 */
router.post(
  '/:id/evaluate',
  validateParams(idSchema),
  validateBody(evaluationContextSchema),
  controller.evaluateFeatureFlag.bind(controller)
);


module.exports = router;
