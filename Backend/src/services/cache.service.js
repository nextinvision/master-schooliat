import logger from "../config/logger.js";

/**
 * In-memory cache service
 * For production, consider using Redis
 * 
 * This is a simple implementation that can be replaced with Redis later
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time-to-live tracking
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    const ttl = this.ttl.get(key);
    if (ttl && Date.now() > ttl) {
      // Expired, remove from cache
      this.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlMs - Time to live in milliseconds (optional)
   */
  set(key, value, ttlMs = this.defaultTTL) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const ttl = this.ttl.get(key);
    if (ttl && Date.now() > ttl) {
      this.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    // Clean expired entries
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get or set pattern (common caching pattern)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch value if not in cache
   * @param {number} ttlMs - Time to live in milliseconds (optional)
   * @returns {Promise<any>} - Cached or fetched value
   */
  async getOrSet(key, fetchFn, ttlMs = this.defaultTTL) {
    const cached = this.get(key);
    if (cached !== null) {
      logger.debug({ key }, "Cache hit");
      return cached;
    }

    logger.debug({ key }, "Cache miss, fetching...");
    const value = await fetchFn();
    this.set(key, value, ttlMs);
    return value;
  }
}

// Singleton instance
const cacheService = new CacheService();

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of cacheService.ttl.entries()) {
    if (now > expiry) {
      cacheService.delete(key);
    }
  }
}, 60 * 1000);

export default cacheService;

