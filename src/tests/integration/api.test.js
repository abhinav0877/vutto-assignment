// tests/integration/api.test.js
const request = require('supertest');
const Application = require('../../app');

describe('Feature Flag API', () => {
  let app;
  
  beforeAll(() => {
    const application = new Application();
    app = application.getApp();
  });

  describe('POST /api/v1/feature-flags', () => {
    test('should create a feature flag', async () => {
      const featureFlag = {
        name: 'test-feature',
        description: 'Test feature flag',
        enabled: false,
        rules: [
          {
            type: 'tenant',
            tenantIds: ['company1', 'company2'],
            enabled: true
          }
        ]
      };
      
      const response = await request(app)
        .post('/api/v1/feature-flags')
        .send(featureFlag)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('test-feature');
      expect(response.body.data.rules).toHaveLength(1);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/feature-flags')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/v1/feature-flags', () => {
    test('should list feature flags', async () => {
      const response = await request(app)
        .get('/api/v1/feature-flags')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/feature-flags/:id/evaluate', () => {
    let featureFlagId;
    
    beforeEach(async () => {
      // Clear any existing data first
      const clearResponse = await request(app)
        .get('/api/v1/feature-flags');
      
      // Create a unique feature flag for each test
      const featureFlag = {
        name: `evaluation-test-${Date.now()}`,
        enabled: false,
        rules: [
          {
            type: 'tenant',
            tenantIds: ['company1'],
            enabled: true
          }
        ]
      };
      
      const response = await request(app)
        .post('/api/v1/feature-flags')
        .send(featureFlag);
      
      featureFlagId = response.body.data.id;
    });

    test('should evaluate feature flag', async () => {
      const response = await request(app)
        .post(`/api/v1/feature-flags/${featureFlagId}/evaluate`)
        .send({
          userId: 'user1',
          tenantId: 'company1'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.enabled).toBe(true);
      expect(response.body.matchedRule).toBeDefined();
    });

    test('should validate evaluation context', async () => {
      const response = await request(app)
        .post(`/api/v1/feature-flags/${featureFlagId}/evaluate`)
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.version).toBeDefined();
    });
  });
});