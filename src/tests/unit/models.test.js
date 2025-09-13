
const { FeatureFlag, TenantRule, UserRule, PercentageRule, EvaluationContext, RULE_TYPES } = require('../../models');

describe('Feature Flag Models', () => {
  describe('TenantRule', () => {
    test('should match when tenantId is in the list', () => {
      const rule = new TenantRule({ tenantIds: ['company1', 'company2'] });
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      
      expect(rule.evaluate(context)).toBe(true);
    });

    test('should not match when tenantId is not in the list', () => {
      const rule = new TenantRule({ tenantIds: ['company1', 'company2'] });
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company3' });
      
      expect(rule.evaluate(context)).toBe(false);
    });

    test('should not match when rule is disabled', () => {
      const rule = new TenantRule({ tenantIds: ['company1'], enabled: false });
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      
      expect(rule.evaluate(context)).toBe(false);
    });
  });

  describe('UserRule', () => {
    test('should match when userId is in the list', () => {
      const rule = new UserRule({ userIds: ['user1', 'user2'] });
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      
      expect(rule.evaluate(context)).toBe(true);
    });

    test('should not match when userId is not in the list', () => {
      const rule = new UserRule({ userIds: ['user1', 'user2'] });
      const context = new EvaluationContext({ userId: 'user3', tenantId: 'company1' });
      
      expect(rule.evaluate(context)).toBe(false);
    });
  });

  describe('PercentageRule', () => {
    test('should return false for 0%', () => {
      const rule = new PercentageRule({ percentage: 0 });
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      
      expect(rule.evaluate(context)).toBe(false);
    });

    test('should return true for 100%', () => {
      const rule = new PercentageRule({ percentage: 100 });
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      
      expect(rule.evaluate(context)).toBe(true);
    });

    test('should be consistent for same input', () => {
      const rule = new PercentageRule({ percentage: 50 });
      const context = new EvaluationContext({ userId: 'user1', tenantId: 'company1' });
      
      const result1 = rule.evaluate(context);
      const result2 = rule.evaluate(context);
      
      expect(result1).toBe(result2);
    });

    test('should clamp percentage to 0-100 range', () => {
      const rule1 = new PercentageRule({ percentage: -10 });
      const rule2 = new PercentageRule({ percentage: 150 });
      
      expect(rule1.percentage).toBe(0);
      expect(rule2.percentage).toBe(100);
    });
  });

  describe('FeatureFlag', () => {
    test('should create feature flag with rules', () => {
      const rules = [
        { type: 'tenant', tenantIds: ['company1'] },
        { type: 'user', userIds: ['user1'] }
      ];
      
      const flag = new FeatureFlag({
        name: 'test-feature',
        description: 'Test feature',
        enabled: false,
        rules
      });
      
      expect(flag.name).toBe('test-feature');
      expect(flag.rules).toHaveLength(2);
      expect(flag.rules[0]).toBeInstanceOf(TenantRule);
      expect(flag.rules[1]).toBeInstanceOf(UserRule);
    });

    test('should serialize to JSON correctly', () => {
      const flag = new FeatureFlag({
        name: 'test-feature',
        enabled: true
      });
      
      const json = flag.toJSON();
      
      expect(json.name).toBe('test-feature');
      expect(json.enabled).toBe(true);
      expect(json.id).toBeDefined();
    });
  });
});