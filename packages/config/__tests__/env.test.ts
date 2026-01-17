import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { serverEnvSchema, webEnvSchema, parseWebEnv } from '../src/env';

describe('env parsing', () => {
  describe('serverEnvSchema', () => {
    it('should reject missing COMPANIES_HOUSE_API_KEY', () => {
      const result = serverEnvSchema.safeParse({
        NODE_ENV: 'development',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const apiKeyError = result.error.issues.find(
          (issue) => issue.path[0] === 'COMPANIES_HOUSE_API_KEY'
        );
        expect(apiKeyError).toBeDefined();
        expect(apiKeyError?.message).toContain('COMPANIES_HOUSE_API_KEY');
      }
    });

    it('should reject empty COMPANIES_HOUSE_API_KEY', () => {
      const result = serverEnvSchema.safeParse({
        COMPANIES_HOUSE_API_KEY: '',
        NODE_ENV: 'development',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const apiKeyError = result.error.issues.find(
          (issue) => issue.path[0] === 'COMPANIES_HOUSE_API_KEY'
        );
        expect(apiKeyError).toBeDefined();
        expect(apiKeyError?.message).toContain('cannot be empty');
      }
    });

    it('should accept valid server configuration', () => {
      const result = serverEnvSchema.safeParse({
        COMPANIES_HOUSE_API_KEY: 'test-api-key-12345',
        NODE_ENV: 'production',
        PORT: '8080',
        HOST: '127.0.0.1',
        LOG_LEVEL: 'debug',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.COMPANIES_HOUSE_API_KEY).toBe('test-api-key-12345');
        expect(result.data.NODE_ENV).toBe('production');
        expect(result.data.PORT).toBe(8080);
        expect(result.data.HOST).toBe('127.0.0.1');
        expect(result.data.LOG_LEVEL).toBe('debug');
      }
    });

    it('should use default values for optional server config', () => {
      const result = serverEnvSchema.safeParse({
        COMPANIES_HOUSE_API_KEY: 'test-key',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.PORT).toBe(3001);
        expect(result.data.HOST).toBe('0.0.0.0');
        expect(result.data.LOG_LEVEL).toBe('info');
        expect(result.data.RATE_LIMIT_MAX).toBe(100);
        expect(result.data.RATE_LIMIT_WINDOW_MS).toBe(60000);
      }
    });

    it('should coerce PORT from string to number', () => {
      const result = serverEnvSchema.safeParse({
        COMPANIES_HOUSE_API_KEY: 'test-key',
        PORT: '9000',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(9000);
        expect(typeof result.data.PORT).toBe('number');
      }
    });

    it('should reject invalid NODE_ENV value', () => {
      const result = serverEnvSchema.safeParse({
        COMPANIES_HOUSE_API_KEY: 'test-key',
        NODE_ENV: 'staging', // Not a valid option
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid LOG_LEVEL value', () => {
      const result = serverEnvSchema.safeParse({
        COMPANIES_HOUSE_API_KEY: 'test-key',
        LOG_LEVEL: 'verbose', // Not a valid option
      });

      expect(result.success).toBe(false);
    });
  });

  describe('webEnvSchema', () => {
    it('should NOT require any API key', () => {
      const result = webEnvSchema.safeParse({
        NODE_ENV: 'development',
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid web configuration', () => {
      const result = webEnvSchema.safeParse({
        NODE_ENV: 'production',
        VITE_API_URL: 'https://api.example.com',
        VITE_ENABLE_MOCK_MODE: 'true',
        LOG_LEVEL: 'warn',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('production');
        expect(result.data.VITE_API_URL).toBe('https://api.example.com');
        expect(result.data.VITE_ENABLE_MOCK_MODE).toBe(true);
        expect(result.data.LOG_LEVEL).toBe('warn');
      }
    });

    it('should use default values for optional web config', () => {
      const result = webEnvSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.VITE_API_URL).toBe('http://localhost:3001');
        expect(result.data.VITE_ENABLE_MOCK_MODE).toBe(false);
        expect(result.data.LOG_LEVEL).toBe('info');
      }
    });

    it('should transform VITE_ENABLE_MOCK_MODE string to boolean', () => {
      const trueResult = webEnvSchema.safeParse({
        VITE_ENABLE_MOCK_MODE: 'true',
      });
      const falseResult = webEnvSchema.safeParse({
        VITE_ENABLE_MOCK_MODE: 'false',
      });

      expect(trueResult.success).toBe(true);
      expect(falseResult.success).toBe(true);

      if (trueResult.success && falseResult.success) {
        expect(trueResult.data.VITE_ENABLE_MOCK_MODE).toBe(true);
        expect(falseResult.data.VITE_ENABLE_MOCK_MODE).toBe(false);
      }
    });

    it('should reject invalid VITE_API_URL (not a URL)', () => {
      const result = webEnvSchema.safeParse({
        VITE_API_URL: 'not-a-valid-url',
      });

      expect(result.success).toBe(false);
    });

    it('should NOT have COMPANIES_HOUSE_API_KEY field', () => {
      // Verify that web schema doesn't include server secrets
      const schemaShape = webEnvSchema.shape;
      expect('COMPANIES_HOUSE_API_KEY' in schemaShape).toBe(false);
    });
  });

  describe('parseWebEnv', () => {
    it('should throw on invalid configuration', () => {
      expect(() =>
        parseWebEnv({
          VITE_API_URL: 'invalid-url',
        })
      ).toThrow('Invalid web environment configuration');
    });

    it('should return valid config for valid environment', () => {
      const config = parseWebEnv({
        VITE_API_URL: 'https://api.test.com',
        VITE_ENABLE_MOCK_MODE: 'true',
      });

      expect(config.VITE_API_URL).toBe('https://api.test.com');
      expect(config.VITE_ENABLE_MOCK_MODE).toBe(true);
    });
  });

  describe('security constraints', () => {
    it('web schema should not expose any sensitive fields', () => {
      const webShape = webEnvSchema.shape;
      const sensitiveFields = [
        'COMPANIES_HOUSE_API_KEY',
        'API_KEY',
        'SECRET',
        'PASSWORD',
        'TOKEN',
        'PRIVATE_KEY',
      ];

      for (const field of sensitiveFields) {
        expect(field in webShape).toBe(false);
      }
    });

    it('server schema should include API key', () => {
      const serverShape = serverEnvSchema.shape;
      expect('COMPANIES_HOUSE_API_KEY' in serverShape).toBe(true);
    });
  });
});
