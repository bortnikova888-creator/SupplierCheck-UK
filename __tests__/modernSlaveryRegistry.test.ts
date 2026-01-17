import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  lookupModernSlaveryRegistry,
  findCompanyInCSV,
  clearCSVCache,
  setCSVCacheEntry,
  getCSVUrl,
  type RegistryConfig,
} from '../services/modernSlaveryRegistry';
import { parseCSV, detectColumnMapping, getHeadersFromRows } from '../lib/csvParser';
import type { CSVColumnMapping, ModernSlaveryCSVRow } from '../types';

// Load test fixtures
const fixturesDir = join(__dirname, 'fixtures');
const csvWithCompanyNumber = readFileSync(join(fixturesDir, 'registry-with-company-number.csv'), 'utf-8');
const csvNameOnly = readFileSync(join(fixturesDir, 'registry-name-only.csv'), 'utf-8');

// Helper to create cache entries from fixture data
function createCacheEntry(csvText: string, year: number): {
  rows: ModernSlaveryCSVRow[];
  mapping: CSVColumnMapping;
  fetchedAt: number;
  csvUrl: string;
} {
  const rows = parseCSV(csvText);
  const headers = getHeadersFromRows(rows);
  const mapping = detectColumnMapping(headers);
  return {
    rows,
    mapping,
    fetchedAt: Date.now(),
    csvUrl: `https://example.com/registry/${year}.csv`,
  };
}

describe('Modern Slavery Registry Connector', () => {
  beforeEach(() => {
    clearCSVCache();
  });

  afterEach(() => {
    clearCSVCache();
  });

  describe('getCSVUrl', () => {
    it('should generate correct URL for a year', () => {
      const config: RegistryConfig = {
        baseUrl: 'https://example.com',
        years: [2023, 2022],
        urlPattern: 'https://example.com/statements/{year}.csv',
      };

      expect(getCSVUrl(2023, config)).toBe('https://example.com/statements/2023.csv');
      expect(getCSVUrl(2022, config)).toBe('https://example.com/statements/2022.csv');
    });
  });

  describe('findCompanyInCSV', () => {
    describe('with company number column', () => {
      it('should find company by exact company number', () => {
        const entry = createCacheEntry(csvWithCompanyNumber, 2023);

        const result = findCompanyInCSV(entry, '01234567', 'ACME Solutions Ltd');

        expect(result).not.toBeNull();
        expect(result?.matchMethod).toBe('company_number');
        expect(result?.rowIndex).toBe(0);
      });

      it('should find company by company number with different padding', () => {
        const entry = createCacheEntry(csvWithCompanyNumber, 2023);

        const result = findCompanyInCSV(entry, '1234567', 'ACME Solutions Ltd');

        expect(result).not.toBeNull();
        expect(result?.matchMethod).toBe('company_number');
      });

      it('should find Scottish company (SC prefix)', () => {
        const entry = createCacheEntry(csvWithCompanyNumber, 2023);

        const result = findCompanyInCSV(entry, 'SC123456', 'Scottish Enterprises Limited');

        expect(result).not.toBeNull();
        expect(result?.matchMethod).toBe('company_number');
      });

      it('should find LLP company (OC prefix)', () => {
        const entry = createCacheEntry(csvWithCompanyNumber, 2023);

        const result = findCompanyInCSV(entry, 'OC445566', 'Northern Services LLP');

        expect(result).not.toBeNull();
        expect(result?.matchMethod).toBe('company_number');
      });

      it('should return null for non-existent company', () => {
        const entry = createCacheEntry(csvWithCompanyNumber, 2023);

        const result = findCompanyInCSV(entry, '99999999', 'Non Existent Corp');

        expect(result).toBeNull();
      });
    });

    describe('without company number column (name matching)', () => {
      it('should find company by normalized name', () => {
        const entry = createCacheEntry(csvNameOnly, 2022);

        const result = findCompanyInCSV(entry, '01234567', 'ACME Solutions Limited');

        expect(result).not.toBeNull();
        expect(result?.matchMethod).toBe('normalized_name');
        expect(result?.rowIndex).toBe(0);
      });

      it('should find company with different suffix', () => {
        const entry = createCacheEntry(csvNameOnly, 2022);

        const result = findCompanyInCSV(entry, '05555555', 'Tech Innovations Limited');

        expect(result).not.toBeNull();
        expect(result?.matchMethod).toBe('normalized_name');
      });

      it('should find company with & vs and variation', () => {
        const entry = createCacheEntry(csvNameOnly, 2022);

        // CSV has "Smith and Jones Holdings Ltd", searching with "&"
        const result = findCompanyInCSV(entry, '', 'Smith & Jones Holdings');

        expect(result).not.toBeNull();
        expect(result?.matchMethod).toBe('normalized_name');
      });

      it('should find company with apostrophe variation', () => {
        const entry = createCacheEntry(csvNameOnly, 2022);

        // CSV has "Johnson's Foods & Beverages"
        const result = findCompanyInCSV(entry, '', "Johnson's Foods and Beverages");

        expect(result).not.toBeNull();
        expect(result?.matchMethod).toBe('normalized_name');
      });

      it('should return null for non-existent company', () => {
        const entry = createCacheEntry(csvNameOnly, 2022);

        const result = findCompanyInCSV(entry, '', 'Completely Different Company');

        expect(result).toBeNull();
      });
    });
  });

  describe('lookupModernSlaveryRegistry', () => {
    it('should find company in cached data with company number', async () => {
      // Pre-populate cache with fixture data
      setCSVCacheEntry(2023, createCacheEntry(csvWithCompanyNumber, 2023));

      const config: RegistryConfig = {
        baseUrl: 'https://example.com',
        years: [2023],
        urlPattern: 'https://example.com/statements/{year}.csv',
      };

      const result = await lookupModernSlaveryRegistry('01234567', 'ACME Solutions Ltd', config);

      expect(result.found).toBe(true);
      expect(result.latestYear).toBe(2023);
      expect(result.statementSummaryUrl).toBe('https://registry.example.com/statements/01234567/2023');
      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].matchMethod).toBe('company_number');
    });

    it('should find company in cached data with name matching', async () => {
      setCSVCacheEntry(2022, createCacheEntry(csvNameOnly, 2022));

      const config: RegistryConfig = {
        baseUrl: 'https://example.com',
        years: [2022],
        urlPattern: 'https://example.com/statements/{year}.csv',
      };

      const result = await lookupModernSlaveryRegistry('', 'ACME Solutions Limited', config);

      expect(result.found).toBe(true);
      expect(result.latestYear).toBe(2022);
      expect(result.statementSummaryUrl).toBe('https://registry.example.com/statements/acme-2022');
      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].matchMethod).toBe('normalized_name');
    });

    it('should find company across multiple years', async () => {
      // Company appears in both 2023 (with company number) and 2022 (name only)
      setCSVCacheEntry(2023, createCacheEntry(csvWithCompanyNumber, 2023));
      setCSVCacheEntry(2022, createCacheEntry(csvNameOnly, 2022));

      const config: RegistryConfig = {
        baseUrl: 'https://example.com',
        years: [2023, 2022],
        urlPattern: 'https://example.com/statements/{year}.csv',
      };

      const result = await lookupModernSlaveryRegistry('01234567', 'ACME Solutions Ltd', config);

      expect(result.found).toBe(true);
      expect(result.latestYear).toBe(2023);
      expect(result.evidence.length).toBe(2);
    });

    it('should return found:false for non-existent company', async () => {
      setCSVCacheEntry(2023, createCacheEntry(csvWithCompanyNumber, 2023));

      const config: RegistryConfig = {
        baseUrl: 'https://example.com',
        years: [2023],
        urlPattern: 'https://example.com/statements/{year}.csv',
      };

      const result = await lookupModernSlaveryRegistry('99999999', 'Non Existent Corp', config);

      expect(result.found).toBe(false);
      expect(result.latestYear).toBeUndefined();
      expect(result.statementSummaryUrl).toBeUndefined();
      expect(result.evidence).toEqual([]);
    });

    it('should return found:false when no cache data available', async () => {
      // No cache entries, no network (will fail to fetch)
      const config: RegistryConfig = {
        baseUrl: 'https://invalid-domain-that-does-not-exist.example',
        years: [2023],
        urlPattern: 'https://invalid-domain-that-does-not-exist.example/{year}.csv',
      };

      const result = await lookupModernSlaveryRegistry('01234567', 'ACME Solutions Ltd', config);

      expect(result.found).toBe(false);
      expect(result.evidence).toEqual([]);
    });

    it('should handle schema changes gracefully (return found:false)', async () => {
      // Create cache entry with unrecognized columns
      const malformedCSV = `Foo,Bar,Baz
value1,value2,value3
value4,value5,value6`;
      const rows = parseCSV(malformedCSV);
      const headers = getHeadersFromRows(rows);
      const mapping = detectColumnMapping(headers);

      setCSVCacheEntry(2023, {
        rows,
        mapping,
        fetchedAt: Date.now(),
        csvUrl: 'https://example.com/malformed.csv',
      });

      const config: RegistryConfig = {
        baseUrl: 'https://example.com',
        years: [2023],
        urlPattern: 'https://example.com/statements/{year}.csv',
      };

      const result = await lookupModernSlaveryRegistry('01234567', 'ACME Solutions Ltd', config);

      // Should not crash, just return not found
      expect(result.found).toBe(false);
      expect(result.evidence).toEqual([]);
    });

    it('should include evidence with CSV URL and match method', async () => {
      setCSVCacheEntry(2023, createCacheEntry(csvWithCompanyNumber, 2023));

      const config: RegistryConfig = {
        baseUrl: 'https://example.com',
        years: [2023],
        urlPattern: 'https://example.com/statements/{year}.csv',
      };

      const result = await lookupModernSlaveryRegistry('01234567', 'ACME Solutions Ltd', config);

      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].csvUrl).toBe('https://example.com/registry/2023.csv');
      expect(result.evidence[0].year).toBe(2023);
      expect(result.evidence[0].rowIndex).toBe(0);
      expect(result.evidence[0].matchMethod).toBe('company_number');
    });

    it('should prefer company number match over name match', async () => {
      setCSVCacheEntry(2023, createCacheEntry(csvWithCompanyNumber, 2023));

      const config: RegistryConfig = {
        baseUrl: 'https://example.com',
        years: [2023],
        urlPattern: 'https://example.com/statements/{year}.csv',
      };

      // Even though name also matches, should use company number
      const result = await lookupModernSlaveryRegistry('01234567', 'ACME Solutions Ltd', config);

      expect(result.evidence[0].matchMethod).toBe('company_number');
    });
  });
});
