import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getConnection } from './connection.js';
import { runMigrations } from './migrations/index.js';

export interface FetchRequest {
  source: string;
  request: string;
  url: string;
  ttlSeconds: number;
  headers?: Record<string, string>;
}

export interface FetchResponse {
  status: number;
  body: Buffer;
  contentType: string;
  cacheKey: string;
  hit: boolean;
}

export interface CacheEntry {
  cache_key: string;
  source: string;
  request: string;
  url: string;
  status: number;
  body: Buffer;
  content_type: string;
  headers: string | null;
  created_at: number;
  expires_at: number;
}

export type FetchFunction = (
  url: string,
  headers?: Record<string, string>
) => Promise<{ status: number; body: Buffer; contentType: string }>;

/**
 * Generates a deterministic cache key from request parameters.
 */
export function generateCacheKey(params: {
  source: string;
  request: string;
  url: string;
}): string {
  const data = `${params.source}:${params.request}:${params.url}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Cache class for managing cached upstream responses.
 */
export class Cache {
  private db: Database.Database;
  private fetchFn: FetchFunction;
  private initialized = false;

  constructor(fetchFn: FetchFunction, db?: Database.Database) {
    this.db = db ?? getConnection();
    this.fetchFn = fetchFn;
  }

  /**
   * Ensures database migrations have been run.
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      runMigrations(this.db);
      this.initialized = true;
    }
  }

  /**
   * Gets a cached entry or fetches from upstream.
   * Returns identical bytes on cache hit.
   */
  async getOrFetchRaw(params: FetchRequest): Promise<FetchResponse> {
    this.ensureInitialized();

    const cacheKey = generateCacheKey({
      source: params.source,
      request: params.request,
      url: params.url,
    });

    // Check for valid cache entry
    const cached = this.getCacheEntry(cacheKey);
    if (cached) {
      return {
        status: cached.status,
        body: cached.body,
        contentType: cached.content_type,
        cacheKey,
        hit: true,
      };
    }

    // Cache miss - fetch from upstream
    const response = await this.fetchFn(params.url, params.headers);

    // Store in cache
    this.setCacheEntry({
      cacheKey,
      source: params.source,
      request: params.request,
      url: params.url,
      status: response.status,
      body: response.body,
      contentType: response.contentType,
      headers: params.headers ? JSON.stringify(params.headers) : null,
      ttlSeconds: params.ttlSeconds,
    });

    return {
      status: response.status,
      body: response.body,
      contentType: response.contentType,
      cacheKey,
      hit: false,
    };
  }

  /**
   * Gets a cache entry if it exists and hasn't expired.
   */
  private getCacheEntry(cacheKey: string): CacheEntry | null {
    const now = Date.now();

    const stmt = this.db.prepare(`
      SELECT * FROM cache_entries
      WHERE cache_key = ? AND expires_at > ?
    `);

    const row = stmt.get(cacheKey, now) as CacheEntry | undefined;
    return row ?? null;
  }

  /**
   * Stores a cache entry with TTL.
   */
  private setCacheEntry(params: {
    cacheKey: string;
    source: string;
    request: string;
    url: string;
    status: number;
    body: Buffer;
    contentType: string;
    headers: string | null;
    ttlSeconds: number;
  }): void {
    const now = Date.now();
    const expiresAt = now + params.ttlSeconds * 1000;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache_entries
      (cache_key, source, request, url, status, body, content_type, headers, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      params.cacheKey,
      params.source,
      params.request,
      params.url,
      params.status,
      params.body,
      params.contentType,
      params.headers,
      now,
      expiresAt
    );
  }

  /**
   * Removes expired cache entries.
   */
  cleanExpired(): number {
    this.ensureInitialized();

    const now = Date.now();
    const stmt = this.db.prepare('DELETE FROM cache_entries WHERE expires_at <= ?');
    const result = stmt.run(now);
    return result.changes;
  }

  /**
   * Clears all cache entries.
   */
  clear(): void {
    this.ensureInitialized();

    this.db.exec('DELETE FROM cache_entries');
  }
}

/**
 * Creates a new Cache instance with the given fetch function.
 */
export function createCache(
  fetchFn: FetchFunction,
  db?: Database.Database
): Cache {
  return new Cache(fetchFn, db);
}
