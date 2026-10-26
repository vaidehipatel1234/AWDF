const NodeCache = require('node-cache');

/**
 * Shared In-Memory Cache Service (Practical 9)
 * Uses node-cache with 60-second default TTL.
 * Tracks cache hits, misses, invalidations, and response latencies
 * for empirical performance comparison and debug endpoints.
 */
const cache = new NodeCache({
  stdTTL: 60,         // Default time-to-live: 60 seconds
  checkperiod: 120,   // Periodic check for expired keys
  useClones: false    // Optimize memory performance
});

// Cache Metrics for Supplementary Problem 2
let metrics = {
  hits: 0,
  misses: 0,
  invalidations: 0,
  writes: 0,
  createdAt: new Date().toISOString()
};

/**
 * Wrapper to fetch from cache and track hit/miss metrics
 */
const getCached = (key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    metrics.hits++;
    return { hit: true, data: value };
  }
  metrics.misses++;
  return { hit: false, data: null };
};

/**
 * Wrapper to set cache entry
 */
const setCached = (key, data, ttl) => {
  metrics.writes++;
  if (ttl !== undefined) {
    return cache.set(key, data, ttl);
  }
  return cache.set(key, data);
};

/**
 * Invalidate cache key
 */
const deleteCached = (key) => {
  metrics.invalidations++;
  return cache.del(key);
};

/**
 * Invalidate all task-related cache entries on write (POST, PUT, DELETE)
 */
const invalidateTasksCache = (taskId = null, userId = null) => {
  metrics.invalidations++;
  const keysToDelete = ['all_tasks'];

  if (userId) {
    keysToDelete.push(`tasks_${userId}`);
  }

  if (taskId) {
    keysToDelete.push(`task_${taskId}`);
  }

  // Delete matching keys from cache
  cache.del(keysToDelete);
};

/**
 * Reset metrics counter
 */
const resetMetrics = () => {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.invalidations = 0;
  metrics.writes = 0;
};

/**
 * Expose cache statistics and debug metrics
 */
const getStats = () => {
  const total = metrics.hits + metrics.misses;
  const hitRatio = total > 0 ? ((metrics.hits / total) * 100).toFixed(2) + '%' : '0%';

  return {
    hits: metrics.hits,
    misses: metrics.misses,
    totalRequests: total,
    hitRatio,
    invalidations: metrics.invalidations,
    writes: metrics.writes,
    activeKeys: cache.keys(),
    keyCount: cache.keys().length,
    stats: cache.getStats(),
    defaultTTL: 60
  };
};

module.exports = {
  cache,
  getCached,
  setCached,
  deleteCached,
  invalidateTasksCache,
  getStats,
  resetMetrics
};
