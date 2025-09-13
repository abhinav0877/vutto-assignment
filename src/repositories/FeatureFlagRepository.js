/**
 * Feature Flag Repository
 * 
 * Provides in-memory storage for feature flags with a clean interface
 * that can be easily extended to support different storage backends.
 */

const { FeatureFlag } = require('../models');
const logger = require('../utils/logger');

/**
 * In-memory feature flag repository
 * 
 * Implements the repository pattern for feature flag storage.
 * This design makes it easy to swap out for database-backed storage.
 */
class FeatureFlagRepository {
  constructor() {
    this.flags = new Map();
    this.logger = logger.child({ component: 'FeatureFlagRepository' });
  }

  /**
   * Create a new feature flag
   * @param {FeatureFlag} featureFlag - The feature flag to create
   * @returns {Promise<FeatureFlag>} - The created feature flag
   */
  async create(featureFlag) {
    this.logger.debug('Creating feature flag', { 
      id: featureFlag.id, 
      name: featureFlag.name 
    });

    if (this.flags.has(featureFlag.id)) {
      throw new Error(`Feature flag with ID ${featureFlag.id} already exists`);
    }

    if (this.flags.has(featureFlag.name)) {
      throw new Error(`Feature flag with name '${featureFlag.name}' already exists`);
    }

    this.flags.set(featureFlag.id, featureFlag);
    this.flags.set(featureFlag.name, featureFlag);

    this.logger.info('Feature flag created', { 
      id: featureFlag.id, 
      name: featureFlag.name 
    });

    return featureFlag;
  }

  /**
   * Find a feature flag by ID
   * @param {string} id - The feature flag ID
   * @returns {Promise<FeatureFlag|null>} - The feature flag or null
   */
  async findById(id) {
    this.logger.debug('Finding feature flag by ID', { id });
    return this.flags.get(id) || null;
  }

  /**
   * Find a feature flag by name
   * @param {string} name - The feature flag name
   * @returns {Promise<FeatureFlag|null>} - The feature flag or null
   */
  async findByName(name) {
    this.logger.debug('Finding feature flag by name', { name });
    return this.flags.get(name) || null;
  }

  /**
   * Update an existing feature flag
   * @param {string} id - The feature flag ID
   * @param {Object} updates - The updates to apply
   * @returns {Promise<FeatureFlag|null>} - The updated feature flag or null
   */
  async update(id, updates) {
    this.logger.debug('Updating feature flag', { id, updates });

    const existingFlag = this.flags.get(id);
    if (!existingFlag) {
      return null;
    }

    // Check for name conflicts if name is being updated
    if (updates.name && updates.name !== existingFlag.name) {
      if (this.flags.has(updates.name)) {
        throw new Error(`Feature flag with name '${updates.name}' already exists`);
      }
      // Remove old name mapping
      this.flags.delete(existingFlag.name);
      // Add new name mapping
      this.flags.set(updates.name, existingFlag);
    }

    // Apply updates
    Object.assign(existingFlag, updates);
    existingFlag.updatedAt = new Date();

    this.logger.info('Feature flag updated', { 
      id, 
      name: existingFlag.name 
    });

    return existingFlag;
  }

  /**
   * Delete a feature flag
   * @param {string} id - The feature flag ID
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async delete(id) {
    this.logger.debug('Deleting feature flag', { id });

    const flag = this.flags.get(id);
    if (!flag) {
      return false;
    }

    this.flags.delete(id);
    this.flags.delete(flag.name);

    this.logger.info('Feature flag deleted', { 
      id, 
      name: flag.name 
    });

    return true;
  }

  /**
   * List all feature flags
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of results
   * @param {number} options.offset - Number of results to skip
   * @param {string} options.search - Search term for name/description
   * @returns {Promise<Array<FeatureFlag>>} - Array of feature flags
   */
  async list(options = {}) {
    const { limit = 100, offset = 0, search } = options;
    
    this.logger.debug('Listing feature flags', { limit, offset, search });

    let flags = Array.from(this.flags.values()).filter(flag => 
      typeof flag === 'object' && flag.id && flag.name
    );

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      flags = flags.filter(flag => 
        flag.name.toLowerCase().includes(searchLower) ||
        flag.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedFlags = flags.slice(startIndex, endIndex);

    this.logger.debug('Feature flags listed', { 
      total: flags.length, 
      returned: paginatedFlags.length 
    });

    return paginatedFlags;
  }

  /**
   * Count total feature flags
   * @param {Object} options - Query options
   * @param {string} options.search - Search term for name/description
   * @returns {Promise<number>} - Total count
   */
  async count(options = {}) {
    const { search } = options;
    
    // Get all unique feature flags by filtering out name-based entries
    // We only want ID-based entries to avoid counting duplicates
    let flags = Array.from(this.flags.entries())
      .filter(([key, value]) => {
        // Only include entries where the key matches the feature flag's ID
        // This ensures we only count each flag once, not twice (ID + name)
        return typeof value === 'object' && 
               value.id && 
               value.name && 
               value.id === key;
      })
      .map(([key, value]) => value);

    if (search) {
      const searchLower = search.toLowerCase();
      flags = flags.filter(flag => 
        flag.name.toLowerCase().includes(searchLower) ||
        flag.description.toLowerCase().includes(searchLower)
      );
    }

    return flags.length;
  }

  /**
   * Check if a feature flag exists
   * @param {string} id - The feature flag ID
   * @returns {Promise<boolean>} - True if exists, false otherwise
   */
  async exists(id) {
    return this.flags.has(id);
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} - Repository statistics
   */
  async getStats() {
    const flags = Array.from(this.flags.values()).filter(flag => 
      typeof flag === 'object' && flag.id && flag.name
    );

    const stats = {
      totalFlags: flags.length,
      enabledFlags: flags.filter(flag => flag.enabled).length,
      disabledFlags: flags.filter(flag => !flag.enabled).length,
      flagsWithRules: flags.filter(flag => flag.rules.length > 0).length,
      totalRules: flags.reduce((sum, flag) => sum + flag.rules.length, 0)
    };

    return stats;
  }

  /**
   * Clear all feature flags (useful for testing)
   */
  clear() {
    this.flags.clear();
    this.logger.info('Repository cleared');
  }
}

module.exports = FeatureFlagRepository;
