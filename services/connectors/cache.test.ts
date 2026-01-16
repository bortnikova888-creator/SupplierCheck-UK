import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Cache, COMPANIES_HOUSE_TTL } from './cache';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache({ defaultTTL: 1000 });
  });

  describe('get/set', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', { data: 'test' });
      expect(cache.get('key1')).toEqual({ data: 'test' });
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should store different types', () => {
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('array', [1, 2, 3]);
      cache.set('object', { nested: { value: true } });

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('array')).toEqual([1, 2, 3]);
      expect(cache.get('object')).toEqual({ nested: { value: true } });
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', () => {
      vi.useFakeTimers();

      cache.set('expiring', 'value', 500);
      expect(cache.get('expiring')).toBe('value');

      vi.advanceTimersByTime(600);
      expect(cache.get('expiring')).toBeUndefined();

      vi.useRealTimers();
    });

    it('should use default TTL when not specified', () => {
      vi.useFakeTimers();

      cache.set('default-ttl', 'value');
      expect(cache.get('default-ttl')).toBe('value');

      vi.advanceTimersByTime(900);
      expect(cache.get('default-ttl')).toBe('value');

      vi.advanceTimersByTime(200);
      expect(cache.get('default-ttl')).toBeUndefined();

      vi.useRealTimers();
    });

    it('should allow custom TTL per entry', () => {
      vi.useFakeTimers();

      cache.set('short', 'value1', 100);
      cache.set('long', 'value2', 5000);

      vi.advanceTimersByTime(150);
      expect(cache.get('short')).toBeUndefined();
      expect(cache.get('long')).toBe('value2');

      vi.useRealTimers();
    });
  });

  describe('has', () => {
    it('should return true for existing valid keys', () => {
      cache.set('exists', 'value');
      expect(cache.has('exists')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', () => {
      vi.useFakeTimers();

      cache.set('expired', 'value', 100);
      expect(cache.has('expired')).toBe(true);

      vi.advanceTimersByTime(150);
      expect(cache.has('expired')).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('delete', () => {
    it('should remove an entry', () => {
      cache.set('toDelete', 'value');
      expect(cache.delete('toDelete')).toBe(true);
      expect(cache.get('toDelete')).toBeUndefined();
    });

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
      expect(cache.size).toBe(0);
    });
  });

  describe('size', () => {
    it('should return the number of entries', () => {
      expect(cache.size).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      vi.useFakeTimers();

      cache.set('expired1', 'value1', 100);
      cache.set('expired2', 'value2', 200);
      cache.set('valid', 'value3', 5000);

      vi.advanceTimersByTime(250);

      const cleaned = cache.cleanup();
      expect(cleaned).toBe(2);
      expect(cache.get('valid')).toBe('value3');
      expect(cache.size).toBe(1);

      vi.useRealTimers();
    });

    it('should return 0 when nothing to clean', () => {
      cache.set('valid', 'value');
      expect(cache.cleanup()).toBe(0);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('existing', 'cached');
      const factory = vi.fn().mockResolvedValue('new');

      const result = await cache.getOrSet('existing', factory);

      expect(result).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = vi.fn().mockResolvedValue('new-value');

      const result = await cache.getOrSet('new', factory);

      expect(result).toBe('new-value');
      expect(factory).toHaveBeenCalledOnce();
      expect(cache.get('new')).toBe('new-value');
    });

    it('should respect custom TTL', async () => {
      vi.useFakeTimers();

      await cache.getOrSet('custom', async () => 'value', 500);

      vi.advanceTimersByTime(600);
      expect(cache.get('custom')).toBeUndefined();

      vi.useRealTimers();
    });
  });
});

describe('COMPANIES_HOUSE_TTL', () => {
  it('should have correct TTL values', () => {
    expect(COMPANIES_HOUSE_TTL.SEARCH).toBe(5 * 60 * 1000); // 5 minutes
    expect(COMPANIES_HOUSE_TTL.PROFILE).toBe(60 * 60 * 1000); // 1 hour
    expect(COMPANIES_HOUSE_TTL.OFFICERS).toBe(60 * 60 * 1000); // 1 hour
    expect(COMPANIES_HOUSE_TTL.PSCS).toBe(60 * 60 * 1000); // 1 hour
    expect(COMPANIES_HOUSE_TTL.PSC_STATEMENTS).toBe(60 * 60 * 1000); // 1 hour
  });
});
