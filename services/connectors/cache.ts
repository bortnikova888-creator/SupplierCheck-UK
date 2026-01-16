/**
 * Simple in-memory cache with TTL (Time To Live) support.
 * Used for caching API responses from external services.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheOptions {
  /** Default TTL in milliseconds */
  defaultTTL: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private defaultTTL: number;

  constructor(options: CacheOptions = { defaultTTL: 5 * 60 * 1000 }) {
    this.defaultTTL = options.defaultTTL;
  }

  /**
   * Get a value from the cache.
   * Returns undefined if the key doesn't exist or has expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Set a value in the cache with optional TTL override.
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in milliseconds (defaults to defaultTTL)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Delete a specific key from the cache.
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get the number of entries in the cache (including expired ones).
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Clean up expired entries from the cache.
   * Call this periodically to prevent memory leaks.
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get or set a value using a factory function.
   * If the key exists and is not expired, returns the cached value.
   * Otherwise, calls the factory function, caches the result, and returns it.
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }
}

/** Default cache TTL values for Companies House endpoints (in milliseconds) */
export const COMPANIES_HOUSE_TTL = {
  /** Search results - 5 minutes */
  SEARCH: 5 * 60 * 1000,
  /** Company profile - 1 hour */
  PROFILE: 60 * 60 * 1000,
  /** Officers list - 1 hour */
  OFFICERS: 60 * 60 * 1000,
  /** PSCs list - 1 hour */
  PSCS: 60 * 60 * 1000,
  /** PSC statements - 1 hour */
  PSC_STATEMENTS: 60 * 60 * 1000,
} as const;
