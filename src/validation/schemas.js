/**
 * Input validation schemas using Joi
 * 
 * Provides comprehensive validation for all API endpoints
 * with clear error messages and type checking.
 */

const Joi = require('joi');

// Common validation patterns
const idSchema = Joi.object({
  id: Joi.string().uuid().required()
});
const nameSchema = Joi.string().min(1).max(100).pattern(/^[a-zA-Z0-9_-]+$/).required();
const descriptionSchema = Joi.string().max(500).allow('').optional();

// Rule validation schemas
const tenantRuleSchema = Joi.object({
  type: Joi.string().valid('tenant').required(),
  tenantIds: Joi.array().items(Joi.string().min(1)).min(1).required(),
  enabled: Joi.boolean().default(true)
});

const userRuleSchema = Joi.object({
  type: Joi.string().valid('user').required(),
  userIds: Joi.array().items(Joi.string().min(1)).min(1).required(),
  enabled: Joi.boolean().default(true)
});

const percentageRuleSchema = Joi.object({
  type: Joi.string().valid('percentage').required(),
  percentage: Joi.number().min(0).max(100).required(),
  enabled: Joi.boolean().default(true)
});

const ruleSchema = Joi.alternatives().try(
  tenantRuleSchema,
  userRuleSchema,
  percentageRuleSchema
);

// Feature flag validation schemas
const createFeatureFlagSchema = Joi.object({
  name: nameSchema,
  description: descriptionSchema,
  enabled: Joi.boolean().default(false),
  rules: Joi.array().items(ruleSchema).max(10).default([])
});

const updateFeatureFlagSchema = Joi.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
  enabled: Joi.boolean().optional(),
  rules: Joi.array().items(ruleSchema).max(10).optional()
}).min(1); // At least one field must be provided

// Evaluation validation schemas
const evaluationContextSchema = Joi.object({
  userId: Joi.string().min(1).required(),
  tenantId: Joi.string().min(1).required(),
  additionalData: Joi.object().default({})
});

const batchEvaluationSchema = Joi.object({
  contexts: Joi.array().items(evaluationContextSchema).min(1).max(100).required()
});

// Query parameter schemas
const listQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  search: Joi.string().max(100).allow('').optional()
});

// Error response schema
const errorResponseSchema = Joi.object({
  error: Joi.string().required(),
  message: Joi.string().required(),
  details: Joi.object().optional(),
  timestamp: Joi.date().iso().required(),
  path: Joi.string().required()
});

// Success response schemas
const successResponseSchema = Joi.object({
  success: Joi.boolean().valid(true).required(),
  data: Joi.any().required(),
  timestamp: Joi.date().iso().required()
});

const paginatedResponseSchema = Joi.object({
  success: Joi.boolean().valid(true).required(),
  data: Joi.array().required(),
  pagination: Joi.object({
    total: Joi.number().integer().min(0).required(),
    limit: Joi.number().integer().min(1).required(),
    offset: Joi.number().integer().min(0).required(),
    hasMore: Joi.boolean().required()
  }).required(),
  timestamp: Joi.date().iso().required()
});

module.exports = {
  // Feature flag schemas
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  
  // Evaluation schemas
  evaluationContextSchema,
  batchEvaluationSchema,
  
  // Query schemas
  listQuerySchema,
  
  // Response schemas
  successResponseSchema,
  paginatedResponseSchema,
  errorResponseSchema,
  
  // Common schemas
  idSchema,
  nameSchema,
  descriptionSchema,
  ruleSchema
};
