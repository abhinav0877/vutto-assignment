// tests/unit/FeatureFlagRepository.test.js
const FeatureFlagRepository = require('../../repositories/FeatureFlagRepository');
const { FeatureFlag } = require('../../models');

describe('FeatureFlagRepository', () => {
  let repository;
  
  beforeEach(() => {
    repository = new FeatureFlagRepository();
  });

  afterEach(() => {
    repository.clear();
  });

  describe('create', () => {
    test('should create a feature flag', async () => {
      const flag = new FeatureFlag({
        name: 'test-feature',
        description: 'Test feature',
        enabled: true
      });
      
      const created = await repository.create(flag);
      
      expect(created).toBe(flag);
      expect(await repository.findById(flag.id)).toBe(flag);
      expect(await repository.findByName(flag.name)).toBe(flag);
    });

    test('should throw error for duplicate ID', async () => {
      const flag1 = new FeatureFlag({ name: 'feature1' });
      const flag2 = new FeatureFlag({ id: flag1.id, name: 'feature2' });
      
      await repository.create(flag1);
      
      await expect(repository.create(flag2)).rejects.toThrow('already exists');
    });

    test('should throw error for duplicate name', async () => {
      const flag1 = new FeatureFlag({ name: 'test-feature' });
      const flag2 = new FeatureFlag({ name: 'test-feature' });
      
      await repository.create(flag1);
      
      await expect(repository.create(flag2)).rejects.toThrow('already exists');
    });
  });

  describe('findById', () => {
    test('should return feature flag by ID', async () => {
      const flag = new FeatureFlag({ name: 'test-feature' });
      await repository.create(flag);
      
      const found = await repository.findById(flag.id);
      expect(found).toBe(flag);
    });

    test('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('count', () => {
    test('should return correct count', async () => {
      const flag1 = new FeatureFlag({ name: 'feature1' });
      const flag2 = new FeatureFlag({ name: 'feature2' });
      
      await repository.create(flag1);
      await repository.create(flag2);
      
      const count = await repository.count();
      expect(count).toBe(2);
    });

    test('should filter by search term', async () => {
      const flag1 = new FeatureFlag({ name: 'test-feature', description: 'Test' });
      const flag2 = new FeatureFlag({ name: 'other-feature', description: 'Other' });
      
      await repository.create(flag1);
      await repository.create(flag2);
      
      const count = await repository.count({ search: 'test' });
      expect(count).toBe(1);
    });
  });

  describe('list', () => {
    test('should return paginated results', async () => {
      const flags = [
        new FeatureFlag({ name: 'feature1' }),
        new FeatureFlag({ name: 'feature2' }),
        new FeatureFlag({ name: 'feature3' })
      ];
      
      for (const flag of flags) {
        await repository.create(flag);
      }
      
      const result = await repository.list({ limit: 2, offset: 0 });
      expect(result).toHaveLength(2);
    });
  });

  describe('delete', () => {
    test('should delete feature flag', async () => {
      const flag = new FeatureFlag({ name: 'test-feature' });
      await repository.create(flag);
      
      const deleted = await repository.delete(flag.id);
      expect(deleted).toBe(true);
      expect(await repository.findById(flag.id)).toBeNull();
    });

    test('should return false for non-existent ID', async () => {
      const deleted = await repository.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });
});