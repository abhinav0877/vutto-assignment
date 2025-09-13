const FeatureEvaluationEngine = require('../../services/FeatureEvaluationEngine');
const { FeatureFlag, TenantRule, UserRule, PercentageRule, EvaluationContext } = require('../../models');

describe('FeatureEvaluationEngine', () => {
  let engine;
  
  beforeEach(() => {
    engine = new FeatureEvaluationEngine();
  });

  describe('evaluate', () => {
    test('should return true when tenant rule matches', () => {
      const flag = new FeatureFlag({
        name: 'test-feature',
        enabled: false,
        rules: [new TenantRule({ tenantIds: ['company1'] })]
      });
      
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      const result = engine.evaluate(flag, context);
      
      expect(result.enabled).toBe(true);
      expect(result.matchedRule).toBeDefined();
      expect(result.fallbackToDefault).toBe(false);
    });

    test('should return false when no rules match and global default is false', () => {
      const flag = new FeatureFlag({
        name: 'test-feature',
        enabled: false,
        rules: [new TenantRule({ tenantIds: ['company2'] })]
      });
      
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      const result = engine.evaluate(flag, context);
      
      expect(result.enabled).toBe(false);
      expect(result.matchedRule).toBeNull();
      expect(result.fallbackToDefault).toBe(true);
    });

    test('should return true when no rules match but global default is true', () => {
      const flag = new FeatureFlag({
        name: 'test-feature',
        enabled: true,
        rules: [new TenantRule({ tenantIds: ['company2'] })]
      });
      
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      const result = engine.evaluate(flag, context);
      
      expect(result.enabled).toBe(true);
      expect(result.matchedRule).toBeNull();
      expect(result.fallbackToDefault).toBe(true);
    });

    test('should return first matching rule', () => {
      const flag = new FeatureFlag({
        name: 'test-feature',
        enabled: false,
        rules: [
          new TenantRule({ tenantIds: ['company2'] }), // Won't match
          new UserRule({ userIds: ['user1'] }),       // Will match
          new TenantRule({ tenantIds: ['company1'] })  // Would match but won't be reached
        ]
      });
      
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      const result = engine.evaluate(flag, context);
      
      expect(result.enabled).toBe(true);
      expect(result.matchedRule.type).toBe('user');
    });

    test('should handle empty rules array', () => {
      const flag = new FeatureFlag({
        name: 'test-feature',
        enabled: true,
        rules: []
      });
      
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      const result = engine.evaluate(flag, context);
      
      expect(result.enabled).toBe(true);
      expect(result.matchedRule).toBeNull();
      expect(result.fallbackToDefault).toBe(true);
    });
  });

  describe('evaluateBatch', () => {
    test('should evaluate multiple feature flags', () => {
      const flags = [
        new FeatureFlag({
          name: 'feature1',
          enabled: false,
          rules: [new TenantRule({ tenantIds: ['company1'] })]
        }),
        new FeatureFlag({
          name: 'feature2',
          enabled: true,
          rules: []
        })
      ];
      
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      const results = engine.evaluateBatch(flags, context);
      
      expect(results).toHaveLength(2);
      expect(results[0].enabled).toBe(true); // Matched tenant rule
      expect(results[1].enabled).toBe(true); // Global default
    });
  });
});