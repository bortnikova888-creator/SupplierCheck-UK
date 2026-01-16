import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { Cache, createCache, generateCacheKey } from './cache.js';

describe('Cache', () => {
  let db: Database.Database;
  let cache: Cache;
  let fetchCallCount: number;

  const createFakeFetch = (response: {
    status: number;
    body: Buffer;
    contentType: string;
  }) => {
    return async () => {
      fetchCallCount++;
      return response;
    };
  };

  beforeEach(() => {
    db = new Database(':memory:');
    fetchCallCount = 0;
  });

  afterEach(() => {
    db.close();
  });

  describe('generateCacheKey', () => {
    it('should generate deterministic cache keys', () => {
      const params = {
        source: 'companies-house',
        request: 'get-company',
        url: 'https://api.example.com/company/12345',
      };

      const key1 = generateCacheKey(params);
      const key2 = generateCacheKey(params);

      expect(key1).toBe(key2);
      expect(key1).toHaveLength(64); // SHA-256 hex length
    });

    it('should generate different keys for different inputs', () => {
      const key1 = generateCacheKey({
        source: 'source1',
        request: 'request1',
        url: 'url1',
      });

      const key2 = generateCacheKey({
        source: 'source2',
        request: 'request1',
        url: 'url1',
      });

      expect(key1).not.toBe(key2);
    });
  });

  describe('getOrFetchRaw - cache hit/miss', () => {
    it('should return cache miss on first call and cache hit on second call', async () => {
      const responseBody = Buffer.from('{"company": "ACME"}');
      const fakeFetch = createFakeFetch({
        status: 200,
        body: responseBody,
        contentType: 'application/json',
      });

      cache = createCache(fakeFetch, db);

      const request = {
        source: 'companies-house',
        request: 'get-company',
        url: 'https://api.example.com/company/12345',
        ttlSeconds: 3600,
      };

      // First call - should be a cache miss
      const result1 = await cache.getOrFetchRaw(request);

      expect(result1.hit).toBe(false);
      expect(result1.status).toBe(200);
      expect(result1.body).toEqual(responseBody);
      expect(result1.contentType).toBe('application/json');
      expect(fetchCallCount).toBe(1);

      // Second call - should be a cache hit
      const result2 = await cache.getOrFetchRaw(request);

      expect(result2.hit).toBe(true);
      expect(result2.status).toBe(200);
      expect(result2.body).toEqual(responseBody);
      expect(result2.contentType).toBe('application/json');
      expect(fetchCallCount).toBe(1); // Fetch was NOT called again

      // Verify identical bytes
      expect(result1.body.equals(result2.body)).toBe(true);
      expect(result1.cacheKey).toBe(result2.cacheKey);
    });

    it('should cache different requests separately', async () => {
      const fakeFetch = vi.fn().mockImplementation(async (url: string) => {
        fetchCallCount++;
        return {
          status: 200,
          body: Buffer.from(`response for ${url}`),
          contentType: 'application/json',
        };
      });

      cache = createCache(fakeFetch, db);

      const request1 = {
        source: 'api',
        request: 'get',
        url: 'https://api.example.com/1',
        ttlSeconds: 3600,
      };

      const request2 = {
        source: 'api',
        request: 'get',
        url: 'https://api.example.com/2',
        ttlSeconds: 3600,
      };

      await cache.getOrFetchRaw(request1);
      await cache.getOrFetchRaw(request2);
      await cache.getOrFetchRaw(request1); // Should hit cache
      await cache.getOrFetchRaw(request2); // Should hit cache

      expect(fetchCallCount).toBe(2); // Only 2 unique fetches
    });
  });

  describe('getOrFetchRaw - TTL expiry', () => {
    it('should refetch when TTL expires', async () => {
      const responseBody = Buffer.from('{"data": "value"}');
      const fakeFetch = createFakeFetch({
        status: 200,
        body: responseBody,
        contentType: 'application/json',
      });

      cache = createCache(fakeFetch, db);

      const request = {
        source: 'test',
        request: 'test-request',
        url: 'https://api.example.com/data',
        ttlSeconds: 1, // 1 second TTL
      };

      // First call - cache miss
      const result1 = await cache.getOrFetchRaw(request);
      expect(result1.hit).toBe(false);
      expect(fetchCallCount).toBe(1);

      // Immediate second call - cache hit
      const result2 = await cache.getOrFetchRaw(request);
      expect(result2.hit).toBe(true);
      expect(fetchCallCount).toBe(1);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Third call after expiry - cache miss (refetch)
      const result3 = await cache.getOrFetchRaw(request);
      expect(result3.hit).toBe(false);
      expect(fetchCallCount).toBe(2);
    });

    it('should serve from cache until TTL expires', async () => {
      vi.useFakeTimers();

      const responseBody = Buffer.from('cached data');
      const fakeFetch = createFakeFetch({
        status: 200,
        body: responseBody,
        contentType: 'text/plain',
      });

      cache = createCache(fakeFetch, db);

      const request = {
        source: 'test',
        request: 'test',
        url: 'https://example.com',
        ttlSeconds: 60, // 60 seconds TTL
      };

      // First call
      const result1 = await cache.getOrFetchRaw(request);
      expect(result1.hit).toBe(false);

      // Advance time by 30 seconds (still within TTL)
      vi.advanceTimersByTime(30 * 1000);

      // Should still hit cache
      const result2 = await cache.getOrFetchRaw(request);
      expect(result2.hit).toBe(true);
      expect(fetchCallCount).toBe(1);

      // Advance time by another 31 seconds (past TTL)
      vi.advanceTimersByTime(31 * 1000);

      // Should refetch
      const result3 = await cache.getOrFetchRaw(request);
      expect(result3.hit).toBe(false);
      expect(fetchCallCount).toBe(2);

      vi.useRealTimers();
    });
  });

  describe('cleanExpired', () => {
    it('should remove expired entries', async () => {
      const fakeFetch = createFakeFetch({
        status: 200,
        body: Buffer.from('data'),
        contentType: 'text/plain',
      });

      cache = createCache(fakeFetch, db);

      // Create an entry with 1 second TTL
      await cache.getOrFetchRaw({
        source: 'test',
        request: 'test',
        url: 'https://example.com',
        ttlSeconds: 1,
      });

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Clean expired entries
      const removed = cache.cleanExpired();
      expect(removed).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all cache entries', async () => {
      const fakeFetch = createFakeFetch({
        status: 200,
        body: Buffer.from('data'),
        contentType: 'text/plain',
      });

      cache = createCache(fakeFetch, db);

      // Create multiple entries
      await cache.getOrFetchRaw({
        source: 'test',
        request: 'test1',
        url: 'https://example.com/1',
        ttlSeconds: 3600,
      });

      await cache.getOrFetchRaw({
        source: 'test',
        request: 'test2',
        url: 'https://example.com/2',
        ttlSeconds: 3600,
      });

      expect(fetchCallCount).toBe(2);

      // Clear cache
      cache.clear();

      // Should refetch after clear
      await cache.getOrFetchRaw({
        source: 'test',
        request: 'test1',
        url: 'https://example.com/1',
        ttlSeconds: 3600,
      });

      expect(fetchCallCount).toBe(3);
    });
  });

  describe('headers handling', () => {
    it('should pass headers to fetch function', async () => {
      const fakeFetch = vi.fn().mockResolvedValue({
        status: 200,
        body: Buffer.from('data'),
        contentType: 'application/json',
      });

      cache = createCache(fakeFetch, db);

      const headers = {
        Authorization: 'Bearer token123',
        'X-Custom-Header': 'custom-value',
      };

      await cache.getOrFetchRaw({
        source: 'test',
        request: 'test',
        url: 'https://api.example.com/data',
        ttlSeconds: 3600,
        headers,
      });

      expect(fakeFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        headers
      );
    });
  });
});
