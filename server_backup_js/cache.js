import config from './config.js';

/**
 * Simple LRU Cache implementation for performance optimization
 */
class LRUCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return null;

        // Move to end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key, value, ttl = config.CACHE_TTL_SECONDS * 1000) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Remove least recently used
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    has(key) {
        if (!this.cache.has(key)) return false;

        const item = this.cache.get(key);
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        // Clean expired entries
        for (const [key, item] of this.cache.entries()) {
            if (Date.now() > item.expiry) {
                this.cache.delete(key);
            }
        }
        return this.cache.size;
    }
}

// Global cache instances
export const embeddingCache = new LRUCache(config.EMBEDDING_CACHE_SIZE);
export const queryCache = new LRUCache(config.QUERY_CACHE_SIZE);
export const contextCache = new LRUCache(100); // For structured contexts
export const patternCache = new LRUCache(50); // For system patterns

/**
 * Cache key generators for consistent caching
 */
export const cacheKeys = {
    embedding: (text) => `embed:${text.length}:${text.slice(0, 50)}`,
    query: (projectName, queryText, memoryType, topK) =>
        `query:${projectName}:${queryText.slice(0, 50)}:${memoryType || 'all'}:${topK}`,
    structuredContext: (projectName, contextType) =>
        `context:${projectName}:${contextType}`,
    systemPatterns: (projectName) =>
        `patterns:${projectName}`,
    decisions: (projectName, limit) =>
        `decisions:${projectName}:${limit}`
};

/**
 * Cache utilities
 */
export const cacheUtils = {
    /**
     * Get cached value with TTL check
     */
    getCached: (cache, key) => {
        if (!cache.has(key)) return null;
        return cache.get(key);
    },

    /**
     * Set cached value with TTL
     */
    setCached: (cache, key, value, ttl) => {
        cache.set(key, value, ttl);
    },

    /**
     * Invalidate cache patterns
     */
    invalidateProjectCache: (projectName) => {
        // Clear all caches related to this project
        const caches = [queryCache, contextCache, patternCache];

        caches.forEach(cache => {
            for (const key of cache.cache.keys()) {
                if (key.includes(`:${projectName}:`)) {
                    cache.cache.delete(key);
                }
            }
        });
    },

    /**
     * Get cache statistics
     */
    getStats: () => ({
        embeddingCache: {
            size: embeddingCache.size(),
            maxSize: embeddingCache.maxSize
        },
        queryCache: {
            size: queryCache.size(),
            maxSize: queryCache.maxSize
        },
        contextCache: {
            size: contextCache.size(),
            maxSize: contextCache.maxSize
        },
        patternCache: {
            size: patternCache.size(),
            maxSize: patternCache.maxSize
        }
    })
};

export default {
    LRUCache,
    embeddingCache,
    queryCache,
    contextCache,
    patternCache,
    cacheKeys,
    cacheUtils
};