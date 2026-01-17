import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import nock from 'nock';
import { CompaniesHouseConnector, createCompaniesHouseConnector } from './companies-house';
import { Cache } from './cache';
import { ConnectorErrorCode } from './companies-house.types';
import {
  searchFixture,
  emptySearchFixture,
  profileFixture,
  dissolvedProfileFixture,
  officersFixture,
  emptyOfficersFixture,
  pscsFixture,
  emptyPscsFixture,
  pscStatementsFixture,
  emptyPscStatementsFixture,
} from './__fixtures__';

const API_KEY = 'test-api-key-12345';
const API_BASE = 'https://api.company-information.service.gov.uk';
const WEB_BASE = 'https://find-and-update.company-information.service.gov.uk';

describe('CompaniesHouseConnector', () => {
  let connector: CompaniesHouseConnector;
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache({ defaultTTL: 60000 });
    connector = new CompaniesHouseConnector({
      apiKey: API_KEY,
      cache,
    });
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    cache.clear();
  });

  describe('constructor', () => {
    it('should throw if API key is not provided', () => {
      expect(() => new CompaniesHouseConnector({ apiKey: '' })).toThrow(
        'Companies House API key is required'
      );
    });

    it('should create connector with valid API key', () => {
      const connector = createCompaniesHouseConnector('valid-key');
      expect(connector).toBeInstanceOf(CompaniesHouseConnector);
    });
  });

  describe('searchCompanies', () => {
    it('should search companies and return results', async () => {
      nock(API_BASE)
        .get('/search/companies')
        .query({ q: 'marine' })
        .matchHeader('Authorization', /^Basic /)
        .reply(200, searchFixture);

      const result = await connector.searchCompanies('marine');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(3);
        expect(result.data.total_results).toBe(3);
        expect(result.evidence.apiUrl).toBe(`${API_BASE}/search/companies?q=marine`);
        expect(result.evidence.fromCache).toBe(false);
      }
    });

    it('should return empty results for no matches', async () => {
      nock(API_BASE)
        .get('/search/companies')
        .query({ q: 'xyznonexistent123' })
        .reply(200, emptySearchFixture);

      const result = await connector.searchCompanies('xyznonexistent123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(0);
        expect(result.data.total_results).toBe(0);
      }
    });

    it('should return error for empty query', async () => {
      const result = await connector.searchCompanies('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.INVALID_REQUEST);
        expect(result.error.message).toBe('Search query cannot be empty');
      }
    });

    it('should trim and normalize query', async () => {
      nock(API_BASE)
        .get('/search/companies')
        .query({ q: 'test company' })
        .reply(200, searchFixture);

      const result = await connector.searchCompanies('  test company  ');

      expect(result.success).toBe(true);
    });

    it('should cache search results', async () => {
      nock(API_BASE)
        .get('/search/companies')
        .query({ q: 'cached' })
        .once()
        .reply(200, searchFixture);

      // First call - should hit API
      const result1 = await connector.searchCompanies('cached');
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.evidence.fromCache).toBe(false);
      }

      // Second call - should return cached
      const result2 = await connector.searchCompanies('cached');
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.evidence.fromCache).toBe(true);
      }
    });

    it('should handle 401 unauthorized', async () => {
      nock(API_BASE)
        .get('/search/companies')
        .query({ q: 'test' })
        .reply(401, { errors: [{ error: 'Invalid API key' }] });

      const result = await connector.searchCompanies('test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.UNAUTHORIZED);
        expect(result.error.statusCode).toBe(401);
      }
    });

    it('should handle 429 rate limit', async () => {
      nock(API_BASE)
        .get('/search/companies')
        .query({ q: 'test' })
        .reply(429, { errors: [{ error: 'Rate limit exceeded' }] });

      const result = await connector.searchCompanies('test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.RATE_LIMITED);
        expect(result.error.statusCode).toBe(429);
      }
    });
  });

  describe('getCompanyProfile', () => {
    it('should get company profile by number', async () => {
      nock(API_BASE).get('/company/12345678').reply(200, profileFixture);

      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company_name).toBe('EXAMPLE TRADING LIMITED');
        expect(result.data.company_number).toBe('12345678');
        expect(result.data.company_status).toBe('active');
        expect(result.evidence.apiUrl).toBe(`${API_BASE}/company/12345678`);
        expect(result.evidence.publicUrl).toBe(`${WEB_BASE}/company/12345678`);
        expect(result.evidence.fromCache).toBe(false);
      }
    });

    it('should handle dissolved company profile', async () => {
      nock(API_BASE).get('/company/SC654321').reply(200, dissolvedProfileFixture);

      const result = await connector.getCompanyProfile('SC654321');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company_status).toBe('dissolved');
        expect(result.data.date_of_cessation).toBe('2023-06-15');
      }
    });

    it('should normalize company number to uppercase', async () => {
      nock(API_BASE).get('/company/SC123456').reply(200, profileFixture);

      const result = await connector.getCompanyProfile('sc123456');

      expect(result.success).toBe(true);
    });

    it('should return error for invalid company number', async () => {
      const result = await connector.getCompanyProfile('invalid!!');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.INVALID_REQUEST);
        expect(result.error.message).toBe('Invalid company number');
      }
    });

    it('should handle 404 not found', async () => {
      nock(API_BASE)
        .get('/company/99999999')
        .reply(404, { errors: [{ error: 'Company not found' }] });

      const result = await connector.getCompanyProfile('99999999');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.NOT_FOUND);
        expect(result.error.statusCode).toBe(404);
      }
    });

    it('should cache profile results', async () => {
      nock(API_BASE).get('/company/12345678').once().reply(200, profileFixture);

      await connector.getCompanyProfile('12345678');
      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.evidence.fromCache).toBe(true);
      }
    });
  });

  describe('getOfficers', () => {
    it('should get officers for a company', async () => {
      nock(API_BASE).get('/company/12345678/officers').reply(200, officersFixture);

      const result = await connector.getOfficers('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(3);
        expect(result.data.active_count).toBe(2);
        expect(result.data.resigned_count).toBe(1);
        expect(result.evidence.publicUrl).toBe(`${WEB_BASE}/company/12345678/officers`);
      }
    });

    it('should handle empty officers list', async () => {
      nock(API_BASE).get('/company/00000001/officers').reply(200, emptyOfficersFixture);

      const result = await connector.getOfficers('00000001');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(0);
        expect(result.data.total_results).toBe(0);
      }
    });

    it('should return error for invalid company number', async () => {
      const result = await connector.getOfficers('bad');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.INVALID_REQUEST);
      }
    });

    it('should cache officers results', async () => {
      nock(API_BASE).get('/company/12345678/officers').once().reply(200, officersFixture);

      await connector.getOfficers('12345678');
      const result = await connector.getOfficers('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.evidence.fromCache).toBe(true);
      }
    });
  });

  describe('getPscs', () => {
    it('should get PSCs for a company', async () => {
      nock(API_BASE)
        .get('/company/12345678/persons-with-significant-control')
        .reply(200, pscsFixture);

      const result = await connector.getPscs('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(3);
        expect(result.data.active_count).toBe(2);
        expect(result.data.ceased_count).toBe(1);
        expect(result.evidence.publicUrl).toBe(
          `${WEB_BASE}/company/12345678/persons-with-significant-control`
        );
      }
    });

    it('should handle empty PSCs list', async () => {
      nock(API_BASE)
        .get('/company/00000001/persons-with-significant-control')
        .reply(200, emptyPscsFixture);

      const result = await connector.getPscs('00000001');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(0);
        expect(result.data.total_results).toBe(0);
      }
    });

    it('should return error for invalid company number', async () => {
      const result = await connector.getPscs('x');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.INVALID_REQUEST);
      }
    });

    it('should cache PSCs results', async () => {
      nock(API_BASE)
        .get('/company/12345678/persons-with-significant-control')
        .once()
        .reply(200, pscsFixture);

      await connector.getPscs('12345678');
      const result = await connector.getPscs('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.evidence.fromCache).toBe(true);
      }
    });
  });

  describe('getPscStatements', () => {
    it('should get PSC statements for a company', async () => {
      nock(API_BASE)
        .get('/company/12345678/persons-with-significant-control-statements')
        .reply(200, pscStatementsFixture);

      const result = await connector.getPscStatements('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.active_count).toBe(1);
        expect(result.data.ceased_count).toBe(1);
        expect(result.evidence.publicUrl).toBe(
          `${WEB_BASE}/company/12345678/persons-with-significant-control`
        );
      }
    });

    it('should handle empty PSC statements list', async () => {
      nock(API_BASE)
        .get('/company/00000001/persons-with-significant-control-statements')
        .reply(200, emptyPscStatementsFixture);

      const result = await connector.getPscStatements('00000001');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(0);
        expect(result.data.total_results).toBe(0);
      }
    });

    it('should return error for invalid company number', async () => {
      const result = await connector.getPscStatements('!!!');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.INVALID_REQUEST);
      }
    });

    it('should cache PSC statements results', async () => {
      nock(API_BASE)
        .get('/company/12345678/persons-with-significant-control-statements')
        .once()
        .reply(200, pscStatementsFixture);

      await connector.getPscStatements('12345678');
      const result = await connector.getPscStatements('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.evidence.fromCache).toBe(true);
      }
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      nock(API_BASE).get('/company/12345678').replyWithError('Network connection failed');

      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.NETWORK_ERROR);
        expect(result.error.message).toContain('Network connection failed');
      }
    });

    it('should handle 500 server errors', async () => {
      nock(API_BASE)
        .get('/company/12345678')
        .reply(500, { errors: [{ error: 'Internal server error' }] });

      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.UPSTREAM_ERROR);
        expect(result.error.statusCode).toBe(500);
      }
    });

    it('should handle 400 bad request', async () => {
      nock(API_BASE)
        .get('/search/companies')
        .query({ q: 'test' })
        .reply(400, { errors: [{ error: 'Bad request' }] });

      const result = await connector.searchCompanies('test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ConnectorErrorCode.INVALID_REQUEST);
        expect(result.error.statusCode).toBe(400);
      }
    });

    it('should include evidence in error responses', async () => {
      nock(API_BASE).get('/company/12345678').reply(404, {});

      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(false);
      expect(result.evidence).toBeDefined();
      expect(result.evidence.apiUrl).toBe(`${API_BASE}/company/12345678`);
      expect(result.evidence.fetchedAt).toBeDefined();
      expect(result.evidence.fromCache).toBe(false);
    });
  });

  describe('authentication', () => {
    it('should send Basic Auth header', async () => {
      const expectedAuth = 'Basic ' + Buffer.from(`${API_KEY}:`).toString('base64');

      nock(API_BASE)
        .get('/company/12345678')
        .matchHeader('Authorization', expectedAuth)
        .reply(200, profileFixture);

      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      nock(API_BASE).get('/company/12345678').twice().reply(200, profileFixture);

      // First call
      await connector.getCompanyProfile('12345678');

      // Clear cache
      connector.clearCache();

      // Second call should hit API again
      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.evidence.fromCache).toBe(false);
      }
    });

    it('should cleanup expired cache entries', () => {
      vi.useFakeTimers();

      cache.set('expired', 'value', 100);
      vi.advanceTimersByTime(150);

      const cleaned = connector.cleanupCache();
      expect(cleaned).toBe(1);

      vi.useRealTimers();
    });
  });
});

describe('createCompaniesHouseConnector', () => {
  it('should create a configured connector', () => {
    const connector = createCompaniesHouseConnector('my-api-key');
    expect(connector).toBeInstanceOf(CompaniesHouseConnector);
  });
});
