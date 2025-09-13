/**
 * Core domain models for the Feature Toggle Platform
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Rule types supported by the feature toggle system
 */
const RULE_TYPES = {
  TENANT: 'tenant',
  USER: 'user',
  PERCENTAGE: 'percentage'
};

/**
 * Feature Flag domain model
 * Represents a feature toggle with its configuration and rules
 */
class FeatureFlag {
  constructor({
    id = uuidv4(),
    name,
    description = '',
    enabled = false,
    rules = [],
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.enabled = enabled;
    this.rules = rules.map(ruleData => {
      if (ruleData instanceof Rule) {
        return ruleData; // Already a Rule instance
      } else {
        // Convert plain object to Rule instance
        return Rule.fromJSON(ruleData);
      }
    });
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Add a rule to this feature flag
   * @param {Rule} rule - The rule to add
   */
  addRule(rule) {
    this.rules.push(rule);
    this.updatedAt = new Date();
  }

  /**
   * Remove a rule by ID
   * @param {string} ruleId - The ID of the rule to remove
   */
  removeRule(ruleId) {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    this.updatedAt = new Date();
  }

  /**
   * Update the global enabled state
   * @param {boolean} enabled - The new enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.updatedAt = new Date();
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      enabled: this.enabled,
      rules: this.rules.map(rule => {
        if (rule && typeof rule.toJSON === 'function') {
          return rule.toJSON();
        } else {
          return rule;
        }
      }),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create from plain object
   * @param {Object} data - Plain object data
   */
  static fromJSON(data) {
    switch (data.type) {
      case RULE_TYPES.TENANT:
        return new TenantRule({
          id: data.id || uuidv4(),
          tenantIds: data.tenantIds || [],
          enabled: data.enabled !== false
        });
      case RULE_TYPES.USER:
        return new UserRule({
          id: data.id || uuidv4(),
          userIds: data.userIds || [],
          enabled: data.enabled !== false
        });
      case RULE_TYPES.PERCENTAGE:
        return new PercentageRule({
          id: data.id || uuidv4(),
          percentage: data.percentage || 0,
          enabled: data.enabled !== false
        });
      default:
        throw new Error(`Unknown rule type: ${data.type}`);
    }
  }
}

/**
 * Base Rule class for feature flag evaluation rules
 */
class Rule {
  constructor({
    id = uuidv4(),
    type,
    enabled = true,
    createdAt = new Date()
  }) {
    this.id = id;
    this.type = type;
    this.enabled = enabled;
    this.createdAt = createdAt;
  }

  /**
   * Evaluate this rule against the given context
   * @param {EvaluationContext} context - The evaluation context
   * @returns {boolean} - Whether this rule matches
   */
  evaluate(context) {
    throw new Error('evaluate() must be implemented by subclasses');
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      enabled: this.enabled,
      createdAt: this.createdAt
    };
  }

  /**
   * Create from plain object
   * @param {Object} data - Plain object data
   */
// In src/models/index.js, fix the Rule.fromJSON method:
static fromJSON(data) {
  switch (data.type) {
    case RULE_TYPES.TENANT:
      return new TenantRule({
        id: data.id || uuidv4(),
        tenantIds: data.tenantIds || [],
        enabled: data.enabled !== false,
        createdAt: data.createdAt || new Date()
      });
    case RULE_TYPES.USER:
      return new UserRule({
        id: data.id || uuidv4(),
        userIds: data.userIds || [],
        enabled: data.enabled !== false,
        createdAt: data.createdAt || new Date()
      });
    case RULE_TYPES.PERCENTAGE:
      return new PercentageRule({
        id: data.id || uuidv4(),
        percentage: data.percentage || 0,
        enabled: data.enabled !== false,
        createdAt: data.createdAt || new Date()
      });
    default:
      throw new Error(`Unknown rule type: ${data.type}`);
  }
}
}

/**
 * Tenant-specific rule
 * Enables a feature for specific tenants
 */
class TenantRule extends Rule {
  constructor({
    id = uuidv4(),
    tenantIds = [],
    enabled = true,
    createdAt = new Date()
  }) {
    super({ id, type: RULE_TYPES.TENANT, enabled, createdAt });
    this.tenantIds = tenantIds;
  }

  evaluate(context) {
    if (!this.enabled) return false;
    return this.tenantIds.includes(context.tenantId);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      tenantIds: this.tenantIds
    };
  }

  static fromJSON(data) {
    return new TenantRule({
      id: data.id || uuidv4(),
      tenantIds: data.tenantIds || [],
      enabled: data.enabled !== false,
      createdAt: data.createdAt || new Date()
    });
  }
}

/**
 * User-specific rule
 * Enables a feature for specific users
 */
class UserRule extends Rule {
  constructor({
    id = uuidv4(),
    userIds = [],
    enabled = true,
    createdAt = new Date()
  }) {
    super({ id, type: RULE_TYPES.USER, enabled, createdAt });
    this.userIds = userIds;
  }

  evaluate(context) {
    if (!this.enabled) return false;
    return this.userIds.includes(context.userId);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userIds: this.userIds
    };
  }
  static fromJSON(data) {
    return new UserRule({
      id: data.id || uuidv4(),
      userIds: data.userIds || [],
      enabled: data.enabled !== false,
      createdAt: data.createdAt || new Date()
    });
  }
}

/**
 * Percentage-based rule
 * Enables a feature for a percentage of users using hash-based distribution
 */
class PercentageRule extends Rule {
  constructor({
    id = uuidv4(),
    percentage = 0,
    enabled = true,
    createdAt = new Date()
  }) {
    super({ id, type: RULE_TYPES.PERCENTAGE, enabled, createdAt });
    this.percentage = Math.max(0, Math.min(100, percentage));
  }

  evaluate(context) {
    if (!this.enabled || this.percentage === 0) return false;
    if (this.percentage === 100) return true;

    // Use consistent hashing based on user ID and tenant ID
    const hash = this._hash(`${context.userId}:${context.tenantId}`);
    const bucket = hash % 100;
    return bucket < this.percentage;
  }

  /**
   * Simple hash function for consistent distribution
   * @param {string} str - String to hash
   * @returns {number} - Hash value
   */
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      percentage: this.percentage
    };
  }

  static fromJSON(data) {
    return new PercentageRule({
      id: data.id || uuidv4(),
      percentage: data.percentage || 0,
      enabled: data.enabled !== false,
      createdAt: data.createdAt || new Date()
    });
  }
}

/**
 * Evaluation context containing user and tenant information
 */
class EvaluationContext {
  constructor({ userId, tenantId, additionalData = {} }) {
    this.userId = userId;
    this.tenantId = tenantId;
    this.additionalData = additionalData;
  }
}

/**
 * Result of feature flag evaluation
 */
class EvaluationResult {
  constructor({
    enabled,
    matchedRule = null,
    fallbackToDefault = false,
    evaluationTime = 0
  }) {
    this.enabled = enabled;
    this.matchedRule = matchedRule;
    this.fallbackToDefault = fallbackToDefault;
    this.evaluationTime = evaluationTime;
  }

  toJSON() {
    return {
      enabled: this.enabled,
      matchedRule: this.matchedRule ? this.matchedRule.toJSON() : null,
      fallbackToDefault: this.fallbackToDefault,
      evaluationTime: this.evaluationTime
    };
  }
}

module.exports = {
  FeatureFlag,
  Rule,
  TenantRule,
  UserRule,
  PercentageRule,
  EvaluationContext,
  EvaluationResult,
  RULE_TYPES
};
