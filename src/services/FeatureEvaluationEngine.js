/**
 * Feature Flag Evaluation Engine
 * 
 * This module implements the core business logic for evaluating feature flags
 * against user contexts. It follows the strategy pattern to make rule evaluation
 * extensible and maintainable.
 */

const { FeatureFlag, EvaluationContext, EvaluationResult, RULE_TYPES } = require('../models');
const logger = require('../utils/logger');

/**
 * Feature Flag Evaluation Engine
 * 
 * Handles the evaluation of feature flags against user contexts,
 * implementing the business rules for rule matching and fallback behavior.
 */
class FeatureEvaluationEngine {
  constructor() {
    this.logger = logger.child({ component: 'FeatureEvaluationEngine' });
  }

  /**
   * Evaluate a feature flag for a given context
   * @param {FeatureFlag} featureFlag - The feature flag to evaluate
   * @param {EvaluationContext} context - The evaluation context
   * @returns {EvaluationResult} - The evaluation result
   */
  evaluate(featureFlag, context) {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Starting feature flag evaluation', {
        featureFlagId: featureFlag.id,
        featureFlagName: featureFlag.name,
        userId: context.userId,
        tenantId: context.tenantId
      });

      // Validate inputs
      this._validateEvaluationInputs(featureFlag, context);

      // Evaluate rules in order
      const matchedRule = this._evaluateRules(featureFlag.rules, context);
      
      let enabled;
      let fallbackToDefault = false;

      if (matchedRule) {
        enabled = true;
        this.logger.info('Feature flag enabled by rule', {
          featureFlagId: featureFlag.id,
          featureFlagName: featureFlag.name,
          ruleId: matchedRule.id,
          ruleType: matchedRule.type,
          userId: context.userId,
          tenantId: context.tenantId
        });
      } else {
        enabled = featureFlag.enabled;
        fallbackToDefault = true;
        this.logger.info('Feature flag evaluated using global default', {
          featureFlagId: featureFlag.id,
          featureFlagName: featureFlag.name,
          enabled: enabled,
          userId: context.userId,
          tenantId: context.tenantId
        });
      }

      const evaluationTime = Date.now() - startTime;

      const result = new EvaluationResult({
        enabled,
        matchedRule,
        fallbackToDefault,
        evaluationTime
      });

      this.logger.debug('Feature flag evaluation completed', {
        featureFlagId: featureFlag.id,
        featureFlagName: featureFlag.name,
        result: result.toJSON(),
        evaluationTime
      });

      return result;

    } catch (error) {
      const evaluationTime = Date.now() - startTime;
      
      this.logger.error('Feature flag evaluation failed', {
        featureFlagId: featureFlag.id,
        featureFlagName: featureFlag.name,
        userId: context.userId,
        tenantId: context.tenantId,
        error: error.message,
        evaluationTime
      });

      // Return safe fallback result
      return new EvaluationResult({
        enabled: featureFlag.enabled,
        matchedRule: null,
        fallbackToDefault: true,
        evaluationTime
      });
    }
  }

  /**
   * Evaluate multiple feature flags in batch
   * @param {Array<FeatureFlag>} featureFlags - Array of feature flags
   * @param {EvaluationContext} context - The evaluation context
   * @returns {Array<EvaluationResult>} - Array of evaluation results
   */
  evaluateBatch(featureFlags, context) {
    const startTime = Date.now();
    
    this.logger.debug('Starting batch feature flag evaluation', {
      featureFlagCount: featureFlags.length,
      userId: context.userId,
      tenantId: context.tenantId
    });

    const results = featureFlags.map(flag => this.evaluate(flag, context));
    
    const totalTime = Date.now() - startTime;
    
    this.logger.info('Batch feature flag evaluation completed', {
      featureFlagCount: featureFlags.length,
      totalTime,
      averageTime: totalTime / featureFlags.length
    });

    return results;
  }

  /**
   * Evaluate rules against context
   * @param {Array<Rule>} rules - Array of rules to evaluate
   * @param {EvaluationContext} context - The evaluation context
   * @returns {Rule|null} - The first matching rule or null
   */
  _evaluateRules(rules, context) {
    for (const rule of rules) {
      try {
        if (rule.evaluate(context)) {
          return rule;
        }
      } catch (error) {
        this.logger.warn('Rule evaluation failed', {
          ruleId: rule.id,
          ruleType: rule.type,
          error: error.message,
          userId: context.userId,
          tenantId: context.tenantId
        });
        // Continue with next rule
      }
    }
    return null;
  }

  /**
   * Validate evaluation inputs
   * @param {FeatureFlag} featureFlag - The feature flag
   * @param {EvaluationContext} context - The evaluation context
   */
  _validateEvaluationInputs(featureFlag, context) {
    if (!featureFlag) {
      throw new Error('Feature flag is required');
    }

    if (!context) {
      throw new Error('Evaluation context is required');
    }

    if (!context.userId) {
      throw new Error('User ID is required in evaluation context');
    }

    if (!context.tenantId) {
      throw new Error('Tenant ID is required in evaluation context');
    }

    if (!Array.isArray(featureFlag.rules)) {
      throw new Error('Feature flag rules must be an array');
    }
  }
}

module.exports = FeatureEvaluationEngine;
